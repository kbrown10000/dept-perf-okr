"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PerformanceScore {
  person_name: string;
  department: string;
  composite_score: number;
  performance_tier: string;
  utilization_pct: number;
  billable_hours: number;
  total_hours: number;
  non_billable_quality_score: number;
  efficiency_score: number;
  collaboration_score: number;
  compliance_score: number;
  revenue_impact_score: number;
  role_function: string;
  supervisor: string;
  strengths: string;
  concerns: string;
  specific_actions: string;
  role_alignment_flags: string; // JSON string
  active_status: string; // 'active', 'inactive', 'departed'
  raw_data: any; // JSONB field for role-specific metrics
}

interface PersonCost {
  person_name: string;
  employment_type: string;
  annual_cost: number;
  effective_bill_rate: number;
  margin_per_hour: number;
}

interface RoleKpi {
  person_name: string;
  role_category: string;
  role_title: string;
  kpi_number: number;
  kpi_name: string;
  kpi_description: string;
  measurement_source: string;
  target_value: string;
  weight_pct: number | null;
}

interface PersonData extends PerformanceScore, PersonCost {
  parsed_role_alignment_flags?: any;
}


// Department mapping — ordered from most specific to least specific.
// First match wins, so specific child departments must come before parent catch-alls.
const departmentMappingRules: Array<{ match: string; exact?: boolean; target: string }> = [
  // Marketing (must be before "Growth" catch-all)
  { match: "Growth - Marketing", target: "Marketing" },
  // Growth Leadership (must be before "Growth" catch-all)
  { match: "Growth - Growth Leadership", target: "Growth Leadership" },
  // Sales & Growth (specific children first)
  { match: "Growth - Sales", target: "Sales & Growth" },
  { match: "Growth - Solutions", target: "Sales & Growth" },
  { match: "Growth - Partnership", target: "Sales & Growth" },
  { match: "Growth - Professional Services", target: "Sales & Growth" },
  { match: "Growth", target: "Sales & Growth" }, // catch-all for "Growth" without child
  // Delivery
  { match: "Delivery - Technical Services", target: "Delivery Operations" },
  { match: "Delivery - Professional Services", target: "Delivery Operations" },
  { match: "Delivery", target: "Delivery Operations" },
  // Administration
  { match: "Administration - Finance", target: "Finance & Accounting" },
  { match: "Administration - IT", target: "IT / Infrastructure" },
  { match: "Administration - Human Resources", target: "HR Administration" },
  { match: "Administration - Operations", target: "Operations" },
  { match: "Administration - Contracts", target: "Operations" },
  { match: "Administration", target: "Operations" },
  // Talent & Recruiting
  { match: "Talent & Recruiting", target: "Staffing / Talent Acquisition" },
];

const getDepartmentDisplayName = (department: string): string => {
  // Try exact match first, then startsWith (longest prefix match)
  const exactMatch = departmentMappingRules.find(r => department === r.match);
  if (exactMatch) return exactMatch.target;
  const prefixMatch = departmentMappingRules.find(r => department.startsWith(r.match));
  if (prefixMatch) return prefixMatch.target;
  return department;
};

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-[#10193C] border-[#64C4DD]'; // Exceptional (navy with teal border)
  if (score >= 75) return 'text-[#64C4DD]'; // Exceeds (teal)
  if (score >= 60) return 'text-[#22C55E]'; // Meets (green)
  if (score >= 45) return 'text-[#F3CF4F]'; // Below (gold)
  return 'text-[#DC2626]'; // Unsatisfactory (red)
};

const getPerformanceBand = (score: number): string => {
  if (score >= 85) return 'Exceptional';
  if (score >= 75) return 'Exceeds';
  if (score >= 60) return 'Meets';
  if (score >= 45) return 'Below';
  return 'Unsatisfactory';
};

const getEmploymentTypeBadgeColor = (type: string): string => {
  switch (type) {
    case 'Contractor':
      return 'bg-orange-500';
    case 'W2 Salaried':
      return 'bg-blue-500';
    case 'W2 Hourly':
      return 'bg-teal-500';
    default:
      return 'bg-gray-500';
  }
};

const PeoplePage: React.FC = () => {
  const [peopleData, setPeopleData] = useState<PersonData[]>([]);
  const [roleKpis, setRoleKpis] = useState<RoleKpi[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('All Clusters');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showRawMetrics, setShowRawMetrics] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<keyof PersonData>('person_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('All');
  const supabase = createClient();

  const employmentTypeFilters = ['All', 'W2 Only', 'Contractors Only', 'W2 Salaried', 'W2 Hourly', 'Contractor'];

  // Build lookup: person_name → role_category from KPI data
  const personRoleCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    roleKpis.forEach(k => {
      if (!map[k.person_name]) map[k.person_name] = k.role_category;
    });
    return map;
  }, [roleKpis]);

  // Canonical cluster display order
  const clusterDisplayOrder = [
    'All Clusters',
    'Billable Delivery IC',
    'Project/Program Manager',
    'Solutions/Practice Leader',
    'LTE (Staff Augmentation)',
    'Delivery People Leader',
    'Executive',
    'Recruiting',
    'Client Engagement Manager',
    'Unique Role',
    'Support/Finance',
    'Support/HR',
    'Support/IT',
    'Support/Marketing',
    'Support/Operations',
    'Unassigned',
  ];

  const availableRoleCategories = useMemo(() => {
    const cats = new Set<string>();
    // Add categories for people with KPIs
    Object.values(personRoleCategoryMap).forEach(c => cats.add(c));
    // Add 'Unassigned' if any active people lack KPIs
    const activeNames = new Set(
      peopleData.filter(p => p.active_status === 'active' || !p.active_status).map(p => p.person_name)
    );
    const hasUnassigned = [...activeNames].some(name => !personRoleCategoryMap[name]);
    if (hasUnassigned) cats.add('Unassigned');
    // Sort by canonical order
    const ordered = clusterDisplayOrder.filter(c => c === 'All Clusters' || cats.has(c));
    // Add any categories not in canonical order
    cats.forEach(c => { if (!ordered.includes(c)) ordered.push(c); });
    return ordered;
  }, [personRoleCategoryMap, peopleData]);

  const getRoleScorecardTemplate = (roleFunction: string, utilization_pct: number, employment_type: string): string => {
    const lowerRole = roleFunction.toLowerCase();
    const isContractor = employment_type === 'Contractor';
    const isBillable = utilization_pct > 0;

    // 1. ROLE-SPECIFIC TEMPLATES (apply to ALL employment types)
    // Sales roles
    if (lowerRole.includes('account manager') || lowerRole.includes('account executive') || lowerRole.includes('business development') || lowerRole.includes('sales leadership') || lowerRole.includes('staffing account manager')) {
      return 'Sales_AE_AM';
    }
    // Pod leaders
    if (lowerRole.includes('pod leader')) {
      return 'Hybrid_PodLeader';
    }
    // SVP / Strategic roles
    if (lowerRole.includes('strategic customer') || lowerRole.includes('svp')) {
      return 'Strategic_Customer_Engagement';
    }
    // Partner roles
    if (lowerRole.includes('partner')) {
      return 'Sales_AE_AM'; // Partners evaluated like sales
    }

    // 2. NON-BILLABLE CONTRACTOR ROLE-SPECIFIC TEMPLATES
    if (isContractor && !isBillable) {
      // Content Marketing contractors
      if (lowerRole.includes('content marketing') || lowerRole.includes('content')) {
        return 'ContentMarketing_NonBillable';
      }
      // Engagement & Communications contractors
      if (lowerRole.includes('engagement') || lowerRole.includes('communications')) {
        return 'EngagementComms_NonBillable';
      }
      // IT Administration contractors
      if (lowerRole.includes('it admin') || lowerRole.includes('it ')) {
        return 'ITAdmin_NonBillable';
      }
      // DevOps contractors
      if (lowerRole.includes('devops') || lowerRole.includes('automation')) {
        return 'DevOps_NonBillable';
      }
      // Catch-all for other non-billable contractors
      return 'Tier1_Contingent_NonBillable';
    }

    // 3. BILLABLE CONTRACTORS
    if (isContractor && isBillable) {
      return 'Tier1_Contingent_Billable';
    }

    // 4. W2 EMPLOYEES — tier + billable status based
    if (employment_type === 'W2 Hourly') {
      if (!isBillable) return 'Tier2_W2Hourly_NonBillable';
      return utilization_pct < 50 ? 'Tier2_W2Hourly_LightlyBillable' : 'Tier2_W2Hourly_Billable';
    }
    if (employment_type === 'W2 Salaried') {
      if (!isBillable) return 'Tier3_W2Salaried_NonBillable';
      return utilization_pct < 50 ? 'Tier3_W2Salaried_LightlyBillable' : 'Tier3_W2Salaried_Billable';
    }

    // 5. LEADERSHIP / MANAGEMENT (non-sales)
    if (lowerRole.includes('leadership') || lowerRole.includes('manager') || lowerRole.includes('director')) {
      return 'Manager_Scorecard';
    }

    // 6. SUPPORT / CORPORATE FUNCTIONS
    if (lowerRole.includes('finance') || lowerRole.includes('hr') || lowerRole.includes('it') || lowerRole.includes('operations') || lowerRole.includes('recruiting') || lowerRole.includes('compensation') || lowerRole.includes('contracts') || lowerRole.includes('legal')) {
      return 'Support_Corporate';
    }

    // 7. DEFAULT — use tier if we can determine it, otherwise generic
    if (isContractor) return 'Tier1_Contingent_Billable';
    if (employment_type === 'W2 Hourly') return 'Tier2_W2Hourly_Billable';
    if (employment_type === 'W2 Salaried') return 'Tier3_W2Salaried_Billable';
    return 'General_Scorecard';
  };

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    peopleData.forEach(p => depts.add(getDepartmentDisplayName(p.department)));
    return ['All Departments', ...Array.from(depts).sort()];
  }, [peopleData]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: performanceScores, error: performanceError } = await supabase
        .from('mosaic_performance_scores_2025')
        .select('*');

      const { data: personCosts, error: costsError } = await supabase
        .from('mosaic_person_costs_2025')
        .select('*');
      
      const { data: roleKpisData, error: roleKpisError } = await supabase
        .from('mosaic_role_kpis_2025')
        .select('*');

      if (performanceError) {
        console.error('Error fetching performance scores:', performanceError);
      }
      if (costsError) {
        console.error('Error fetching person costs:', costsError);
      }
      if (roleKpisError) {
        console.error('Error fetching role KPIs:', roleKpisError);
      }

      if (performanceScores && personCosts) {
        if (roleKpisData) setRoleKpis(roleKpisData);

        const mergedData: PersonData[] = performanceScores.map((score: PerformanceScore) => {
          const cost = personCosts.find(
            (c: PersonCost) => c.person_name === score.person_name
          ) || { employment_type: 'N/A', annual_cost: 0, effective_bill_rate: 0, margin_per_hour: 0 };

          let parsed_role_alignment_flags;
          try {
            parsed_role_alignment_flags = score.role_alignment_flags ? JSON.parse(score.role_alignment_flags) : {};
          } catch (e) {
            console.error('Error parsing role_alignment_flags for', score.person_name, e);
            parsed_role_alignment_flags = {};
          }

          return {
            ...score,
            // Only take cost fields — never overwrite score's department or person_name
            employment_type: cost.employment_type || 'N/A',
            annual_cost: cost.annual_cost || 0,
            effective_bill_rate: cost.effective_bill_rate || 0,
            margin_per_hour: cost.margin_per_hour || 0,
            parsed_role_alignment_flags,
            raw_data: score.raw_data || {}, // Ensure raw_data is always an object
          };
        });
        setPeopleData(mergedData);
      }
    };

    fetchData();
  }, [supabase]);

  const filteredPeople = useMemo(() => {
    let filtered = peopleData;
    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(p => p.active_status === 'active' || !p.active_status);
    }
    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(person => getDepartmentDisplayName(person.department) === selectedDepartment);
    }

    // Filter by role category/cluster
    if (selectedRoleCategory !== 'All Clusters') {
      if (selectedRoleCategory === 'Unassigned') {
        filtered = filtered.filter(p => !personRoleCategoryMap[p.person_name]);
      } else {
        filtered = filtered.filter(p => personRoleCategoryMap[p.person_name] === selectedRoleCategory);
      }
    }

    // Filter by employment type
    if (selectedEmploymentType !== 'All') {
      if (selectedEmploymentType === 'W2 Only') {
        filtered = filtered.filter(p => p.employment_type === 'W2 Salaried' || p.employment_type === 'W2 Hourly');
      } else if (selectedEmploymentType === 'Contractors Only') {
        filtered = filtered.filter(p => p.employment_type === 'Contractor');
      } else {
        filtered = filtered.filter(p => p.employment_type === selectedEmploymentType);
      }
    }

    // Sorting logic
    return [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [peopleData, selectedDepartment, sortBy, sortOrder, showInactive]);

  const handleSort = (column: keyof PersonData) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleRow = (personName: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personName)) {
        newSet.delete(personName);
      } else {
        newSet.add(personName);
      }
      return newSet;
    });
  };

  const totalPeople = filteredPeople.length;
  const avgCompositeScore = (filteredPeople.reduce((sum, p) => sum + p.composite_score, 0) / totalPeople) || 0;
  const meetingExpectations = filteredPeople.filter(p => p.composite_score >= 60).length;
  const percentMeetingExpectations = totalPeople > 0 ? (meetingExpectations / totalPeople) * 100 : 0;

  const workforceMix = useMemo(() => {
    const mix = { 'W2 Salaried': 0, 'W2 Hourly': 0, 'Contractor': 0, 'N/A': 0 };
    filteredPeople.forEach(p => {
      if (p.employment_type) {
        mix[p.employment_type as keyof typeof mix] = (mix[p.employment_type as keyof typeof mix] || 0) + 1;
      } else {
        mix['N/A'] += 1;
      }
    });
    return mix;
  }, [filteredPeople]);

  const performanceDistribution = useMemo(() => {
    const bands = {
      'Unsatisfactory': 0,
      'Below': 0,
      'Meets': 0,
      'Exceeds': 0,
      'Exceptional': 0,
    };
    filteredPeople.forEach(p => {
      const band = getPerformanceBand(p.composite_score);
      bands[band as keyof typeof bands]++;
    });
    return Object.entries(bands).map(([name, count]) => ({ name, count }));
  }, [filteredPeople]);

  const employmentTypeComparisonCard = useMemo(() => {
    const w2People = filteredPeople.filter(p => p.employment_type === 'W2 Salaried' || p.employment_type === 'W2 Hourly');
    const contractorPeople = filteredPeople.filter(p => p.employment_type === 'Contractor');

    const w2Count = w2People.length;
    const contractorCount = contractorPeople.length;

    const w2AvgComposite = w2Count > 0 ? (w2People.reduce((sum, p) => sum + p.composite_score, 0) / w2Count) : 0;
    const contractorAvgComposite = contractorCount > 0 ? (contractorPeople.reduce((sum, p) => sum + p.composite_score, 0) / contractorCount) : 0;

    const w2AvgUtilization = w2Count > 0 ? (w2People.reduce((sum, p) => sum + (p.utilization_pct || 0), 0) / w2Count) : 0;
    const contractorAvgUtilization = contractorCount > 0 ? (contractorPeople.reduce((sum, p) => sum + (p.utilization_pct || 0), 0) / contractorCount) : 0;

    const compositeDelta = w2AvgComposite - contractorAvgComposite;
    const utilizationDelta = w2AvgUtilization - contractorAvgUtilization;

    return {
      w2Count, w2AvgComposite, w2AvgUtilization,
      contractorCount, contractorAvgComposite, contractorAvgUtilization,
      compositeDelta, utilizationDelta
    };
  }, [filteredPeople]);

  return (
    <div className="container mx-auto p-8 bg-[#0a101e] text-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-white">People Performance</h1>

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Select onValueChange={(value: string | null) => { if (value) setSelectedDepartment(value) }} defaultValue={selectedDepartment}>
          <SelectTrigger className="w-[280px] bg-gray-800 text-white border-gray-700">
            <SelectValue>{selectedDepartment}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            {availableDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value: string | null) => { if (value) setSelectedRoleCategory(value) }} defaultValue={selectedRoleCategory}>
          <SelectTrigger className="w-[280px] bg-gray-800 text-white border-gray-700">
            <SelectValue>{selectedRoleCategory}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            {availableRoleCategories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-md shadow-sm" role="group">
          {employmentTypeFilters.map(type => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => setSelectedEmploymentType(type)}
              className={selectedEmploymentType === type
                ? "bg-teal-600 text-white border-teal-500 hover:bg-teal-700"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
              }
            >
              {type}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
          className={showInactive
            ? "bg-gray-700 text-white border-gray-500 hover:bg-gray-600"
            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
          }
        >
          {showInactive ? '👁 Showing Inactive/Departed' : '👁 Hide Inactive/Departed'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-teal-400">Total People</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPeople}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-teal-400">Avg Composite Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgCompositeScore.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-teal-400">% Meeting Expectations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{percentMeetingExpectations.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-teal-400">Workforce Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl">W2: {employmentTypeComparisonCard.w2Count} (Avg Score: {employmentTypeComparisonCard.w2AvgComposite.toFixed(1)}, Avg Util: {employmentTypeComparisonCard.w2AvgUtilization.toFixed(1)}%)</p>
            <p className="text-xl">Contractor: {employmentTypeComparisonCard.contractorCount} (Avg Score: {employmentTypeComparisonCard.contractorAvgComposite.toFixed(1)}, Avg Util: {employmentTypeComparisonCard.contractorAvgUtilization.toFixed(1)}%)</p>
            <p className="text-xl mt-2">Score Delta: <span className={employmentTypeComparisonCard.compositeDelta >= 0 ? 'text-green-400' : 'text-red-400'}>{employmentTypeComparisonCard.compositeDelta.toFixed(1)}</span></p>
            <p className="text-xl">Util Delta: <span className={employmentTypeComparisonCard.utilizationDelta >= 0 ? 'text-green-400' : 'text-red-400'}>{employmentTypeComparisonCard.utilizationDelta.toFixed(1)}%</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Distribution */}
      {(() => {
        const clusterCounts: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
        const activePeople = peopleData.filter(p => p.active_status === 'active' || !p.active_status);
        activePeople.forEach(p => {
          const cat = personRoleCategoryMap[p.person_name] || 'Unassigned';
          if (!clusterCounts[cat]) clusterCounts[cat] = { count: 0, avgScore: 0, totalScore: 0 };
          clusterCounts[cat].count++;
          clusterCounts[cat].totalScore += p.composite_score;
        });
        Object.values(clusterCounts).forEach(v => { v.avgScore = v.count > 0 ? v.totalScore / v.count : 0; });
        const clusterData = clusterDisplayOrder
          .filter(c => c !== 'All Clusters' && clusterCounts[c])
          .map(c => ({ name: c, count: clusterCounts[c].count, avgScore: clusterCounts[c].avgScore }));
        // Add any not in canonical order
        Object.keys(clusterCounts).forEach(c => {
          if (!clusterData.find(d => d.name === c)) {
            clusterData.push({ name: c, count: clusterCounts[c].count, avgScore: clusterCounts[c].avgScore });
          }
        });

        return (
          <Card className="bg-gray-900 text-white border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-teal-400">Role Cluster Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {clusterData.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedRoleCategory(selectedRoleCategory === c.name ? 'All Clusters' : c.name)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedRoleCategory === c.name
                        ? 'bg-teal-900/50 border-teal-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-sm text-gray-400 truncate">{c.name}</p>
                    <p className="text-2xl font-bold text-white">{c.count}</p>
                    <p className="text-sm">
                      Avg: <span className={getScoreColor(c.avgScore)}>{c.avgScore.toFixed(1)}</span>
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-teal-400">Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="name" stroke="#cbd5e0" />
                <YAxis stroke="#cbd5e0" />
                <Tooltip
                  cursor={{ fill: '#3a4150' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4a5568', borderRadius: '0.25rem' }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#64C4DD" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Removed Average Score by Employment Type chart as it's now in the comparison card */}
      </div>

      <Card className="bg-gray-900 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="text-teal-400">People Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-700">
                <TableHead className="text-white w-[50px]"></TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('person_name')}>
                  Person Name {sortBy === 'person_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('role_function')}>
                  Role {sortBy === 'role_function' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="text-white">Cluster</TableHead>
                <TableHead className="text-white">Employment Type</TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('composite_score')}>
                  Composite Score {sortBy === 'composite_score' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="text-white">Performance Band</TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('utilization_pct')}>
                  Utilization % {sortBy === 'utilization_pct' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('supervisor')}>
                  Supervisor {sortBy === 'supervisor' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map(person => {
                const roleTemplate = getRoleScorecardTemplate(person.role_function, person.utilization_pct || 0, person.employment_type);
                const personKpis = roleKpis.filter(k => k.person_name === person.person_name).sort((a, b) => a.kpi_number - b.kpi_number);
                const personRoleCategory = personKpis.length > 0 ? personKpis[0].role_category : null;

                const renderRawDataMetric = (key: string, label: string, isCurrency: boolean = false) => {
                  if (person.raw_data && person.raw_data[key] !== undefined) {
                    const value = person.raw_data[key];
                    return <p>{label}: <span className="font-medium text-white">{isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}</span></p>;
                  }
                  return null;
                };

                return (
                  <React.Fragment key={person.person_name}>
                    <TableRow className="border-gray-700 hover:bg-gray-800">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(person.person_name)}
                          className="text-gray-400 hover:text-white"
                        >
                          {expandedRows.has(person.person_name) ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        <span className="flex items-center gap-2">
                          {person.person_name}
                          {person.active_status === 'inactive' && (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-700 text-gray-400 border border-gray-600">Inactive</span>
                          )}
                          {person.active_status === 'departed' && (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-900/30 text-red-400 border border-red-800">Departed</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">{person.role_function || person.performance_tier}</TableCell>
                      <TableCell>
                        {personRoleCategory ? (
                          <Badge className="bg-purple-600/80 text-white text-xs">
                            {personRoleCategory}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getEmploymentTypeBadgeColor(person.employment_type)}>
                          {person.employment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold text-lg ${getScoreColor(person.composite_score)}`}>
                          {person.composite_score.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">{getPerformanceBand(person.composite_score)}</TableCell>
                      <TableCell className="text-gray-300">
                        {person.billable_hours > 0 ? `${(person.utilization_pct || 0).toFixed(1)}%` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-300">{person.supervisor}</TableCell>
                    </TableRow>
                    {expandedRows.has(person.person_name) && (
                      <TableRow className="bg-gray-800 border-gray-700">
                        <TableCell colSpan={9} className="py-4 px-6 text-gray-200">
                          <div className="space-y-6">
                            {/* Composite Score Gauge */}
                            <div>
                              <h4 className="font-semibold text-teal-300 mb-2">Composite Score: <span className={getScoreColor(person.composite_score)}>{person.composite_score.toFixed(1)}</span> - {getPerformanceBand(person.composite_score)}</h4>
                              <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                <div
                                  className={`h-4 rounded-full absolute top-0 left-0`}
                                  style={{
                                    width: `${person.composite_score}%`,
                                    backgroundColor: person.composite_score >= 85 ? '#64C4DD' : person.composite_score >= 75 ? '#22C55E' : person.composite_score >= 60 ? '#F3CF4F' : '#DC2626',
                                  }}
                                ></div>
                              </div>
                            </div>

                                                        {/* Section 1: Role & Category Header */}
                            <div className="flex items-center gap-3 mb-6">
                              {personRoleCategory && (
                                <Badge className="bg-purple-600 text-white text-base py-1 px-3">
                                  {personRoleCategory}
                                </Badge>
                              )}
                              <div>
                                <h3 className="text-2xl font-bold text-white">{person.role_function}</h3>
                                {personKpis.length > 0 && personKpis[0].role_title && personKpis[0].role_title !== person.role_function && (
                                  <p className="text-sm text-gray-400 mt-1">KPI Title: {personKpis[0].role_title}</p>
                                )}
                              </div>
                            </div>

                            {/* Section 2: Role-Specific KPIs (from mosaic_role_kpis_2025) */}
                            {personKpis.length === 0 && (person.active_status === 'active' || !person.active_status) && (person.employment_type === 'W2 Salaried' || person.employment_type === 'W2 Hourly') && (
                              <div className="mt-4 p-3 rounded-lg bg-amber-900/30 border border-amber-700">
                                <p className="text-amber-400 text-sm font-medium">⚠️ No role-specific KPIs assigned yet</p>
                                <p className="text-gray-400 text-xs mt-1">This W2 employee needs cluster assignment and tailored KPIs.</p>
                              </div>
                            )}
                            {personKpis.length > 0 && (
                              <div className="mt-6">
                                <h4 className="font-semibold text-teal-300 mb-3">Role-Specific KPIs</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {personKpis.map(kpi => (
                                    <Card key={kpi.kpi_number} className="bg-gray-700 border-gray-600 text-white">
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-mono text-gray-400">KPI {kpi.kpi_number}</span>
                                          {kpi.weight_pct != null && (
                                            <Badge className="bg-teal-600 text-white text-xs">{kpi.weight_pct}%</Badge>
                                          )}
                                        </div>
                                        <p className="font-bold text-lg mb-1 text-white">{kpi.kpi_name}</p>
                                        <p className="text-sm text-gray-300 mb-3">{kpi.kpi_description}</p>
                                        <div className="space-y-1 text-sm">
                                          <p className="text-amber-400">Target: {kpi.target_value}</p>
                                          <p className="text-gray-400">Source: {kpi.measurement_source}</p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Section 3: Raw Metrics (collapsed by default) */}
                            <div className="mt-6">
                              <Button
                                variant="ghost"
                                onClick={() => setShowRawMetrics(!showRawMetrics)}
                                className="text-teal-300 hover:text-white px-0"
                              >
                                {showRawMetrics ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
                                Raw Scores
                              </Button>
                              {showRawMetrics && (
                                <Card className="bg-gray-800 border-gray-700 text-white mt-2">
                                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {person.utilization_pct > 0 && (
                                      <p>Utilization %: <span className="font-medium text-white">{person.utilization_pct.toFixed(1)}%</span></p>
                                    )}
                                    {(person.billable_hours > 0 || person.total_hours > 0) && (
                                      <p>Billable/Total Hours: <span className="font-medium text-white">{person.billable_hours.toFixed(1)} / {person.total_hours.toFixed(1)}</span></p>
                                    )}
                                    {person.non_billable_quality_score !== 0 && (
                                      <p>Non-Billable Quality: <span className="font-medium text-white">{person.non_billable_quality_score.toFixed(1)}</span></p>
                                    )}
                                    {person.efficiency_score !== 0 && (
                                      <p>Efficiency Score: <span className="font-medium text-white">{person.efficiency_score.toFixed(1)}</span></p>
                                    )}
                                    {person.collaboration_score !== 0 && (
                                      <p>Collaboration Score: <span className="font-medium text-white">{person.collaboration_score.toFixed(1)}</span></p>
                                    )}
                                    {person.compliance_score !== 0 && (
                                      <p>Compliance Score: <span className="font-medium text-white">{person.compliance_score.toFixed(1)}</span></p>
                                    )}
                                    {person.revenue_impact_score !== 0 && (
                                      <p>Revenue Impact Score: <span className="font-medium text-white">{person.revenue_impact_score.toFixed(1)}</span></p>
                                    )}
                                    {person.annual_cost !== 0 && (
                                      <p>Annual Cost: <span className="font-medium text-white">${person.annual_cost?.toLocaleString() || 'N/A'}</span></p>
                                    )}
                                    {person.effective_bill_rate !== 0 && (
                                      <p>Effective Bill Rate: <span className="font-medium text-white">${person.effective_bill_rate?.toFixed(2) || 'N/A'}</span></p>
                                    )}
                                    {person.margin_per_hour !== 0 && (
                                      <p>Margin Per Hour: <span className="font-medium text-white">${person.margin_per_hour?.toFixed(2) || 'N/A'}</span></p>
                                    )}
                                    {/* Additional raw_data metrics that are numbers and non-zero */}
                                    {Object.entries(person.raw_data || {})
                                      .filter(([, value]) => typeof value === 'number' && value !== 0)
                                      .map(([key, value]) => (
                                        <p key={key}>{key.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}: <span className="font-medium text-white">{(value as number).toLocaleString()}</span></p>
                                      ))}
                                  </CardContent>
                                </Card>
                              )}
                            </div>

                            {/* Conditional Radar Chart */}
                            {person.utilization_pct > 0 && [
                              person.utilization_pct,
                              person.efficiency_score,
                              person.collaboration_score,
                              person.compliance_score,
                              person.revenue_impact_score,
                              person.non_billable_quality_score,
                            ].filter(s => s !== 0).length > 1 && ( // Only show if billable AND multiple non-zero scores
                              <div className="mt-6">
                                <h4 className="font-semibold text-teal-300 mb-2">Performance Snapshot</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                  <RadarChart outerRadius={90} width={730} height={250} data={[
                                    {  subject: 'Utilization', A: person.utilization_pct || 0, fullMark: 100 },
                                    {  subject: 'Efficiency', A: person.efficiency_score || 0, fullMark: 100 },
                                    {  subject: 'Collaboration', A: person.collaboration_score || 0, fullMark: 100 },
                                    {  subject: 'Compliance', A: person.compliance_score || 0, fullMark: 100 },
                                    {  subject: 'Revenue Impact', A: person.revenue_impact_score || 0, fullMark: 100 },
                                    {  subject: 'Non-Billable Quality', A: person.non_billable_quality_score || 0, fullMark: 100 },
                                  ].filter(item => item.A !== 0)}>
                                    <PolarGrid stroke="#4a5568" />
                                    <PolarAngleAxis dataKey="subject" stroke="#cbd5e0" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e0" />
                                    <Radar name={person.person_name} dataKey="A" stroke="#64C4DD" fill="#64C4DD" fillOpacity={0.6} />
                                    <Tooltip
                                      cursor={{ fill: '#3a4150' }}
                                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4a5568', borderRadius: '0.25rem' }}
                                      labelStyle={{ color: '#ffffff' }}
                                      itemStyle={{ color: '#e2e8f0' }}
                                    />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* Section 4 & 5: Qualitative Assessment and Role Alignment Flags (Existing) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Qualitative Assessment</h4>
                                <p className="mb-1"><span className="font-medium text-green-400">Strengths:</span> {person.strengths || 'N/A'}</p>
                                <p className="mb-1"><span className="font-medium text-red-400">Concerns:</span> {person.concerns || 'N/A'}</p>
                                <p className="mb-1"><span className="font-medium text-amber-400">Specific Actions:</span> {person.specific_actions || 'N/A'}</p>
                              </div>
                              {/* Empty div for layout, if needed, or remove lg:grid-cols-3 */}
                              <div></div>
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Organization & Role Alignment</h4>
                                <p className="mb-2"><span className="font-medium">Supervisor:</span> {person.supervisor || 'N/A'}</p>
                                <h4 className="font-semibold text-teal-300 mt-4 mb-2">Role Alignment Flags</h4>
                                {person.parsed_role_alignment_flags && Object.keys(person.parsed_role_alignment_flags).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(person.parsed_role_alignment_flags).map(([key, value]) => (
                                      <Badge key={key} variant="secondary" className="bg-blue-600 text-white">
                                        {key}: {String(value)}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p>No role alignment flags.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeoplePage;
