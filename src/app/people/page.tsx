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
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
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
  role_alignment_flags: string;
  active_status: string;
  raw_data: any;
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
const departmentMappingRules: Array<{ match: string; target: string }> = [
  { match: "Growth - Marketing", target: "Marketing" },
  { match: "Growth - Growth Leadership", target: "Growth Leadership" },
  { match: "Growth - Sales", target: "Sales & Growth" },
  { match: "Growth - Solutions", target: "Sales & Growth" },
  { match: "Growth - Partnership", target: "Sales & Growth" },
  { match: "Growth - Professional Services", target: "Sales & Growth" },
  { match: "Growth", target: "Sales & Growth" },
  { match: "Delivery - Technical Services", target: "Delivery Operations" },
  { match: "Delivery - Professional Services", target: "Delivery Operations" },
  { match: "Delivery", target: "Delivery Operations" },
  { match: "Administration - Finance", target: "Finance & Accounting" },
  { match: "Administration - IT", target: "IT / Infrastructure" },
  { match: "Administration - Human Resources", target: "HR Administration" },
  { match: "Administration - Operations", target: "Operations" },
  { match: "Administration - Contracts", target: "Operations" },
  { match: "Administration", target: "Operations" },
  { match: "Talent & Recruiting", target: "Staffing / Talent Acquisition" },
];

const getDepartmentDisplayName = (department: string): string => {
  const exactMatch = departmentMappingRules.find(r => department === r.match);
  if (exactMatch) return exactMatch.target;
  const prefixMatch = departmentMappingRules.find(r => department.startsWith(r.match));
  if (prefixMatch) return prefixMatch.target;
  return department;
};

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-[#10193C] border-[#64C4DD]';
  if (score >= 75) return 'text-[#64C4DD]';
  if (score >= 60) return 'text-[#22C55E]';
  if (score >= 45) return 'text-[#F3CF4F]';
  return 'text-[#DC2626]';
};

const getScoreBg = (score: number): string => {
  if (score >= 85) return 'bg-teal-500/20';
  if (score >= 75) return 'bg-teal-500/10';
  if (score >= 60) return 'bg-green-500/10';
  if (score >= 45) return 'bg-yellow-500/10';
  return 'bg-red-500/15';
};

const getPerformanceBand = (score: number): string => {
  if (score >= 85) return 'Exceptional';
  if (score >= 75) return 'Exceeds';
  if (score >= 60) return 'Meets';
  if (score >= 45) return 'Below';
  return 'Unsatisfactory';
};

const getHeatColor = (value: number, max: number = 100): string => {
  const pct = Math.min(value / max, 1);
  if (pct >= 0.85) return 'bg-teal-500';
  if (pct >= 0.75) return 'bg-teal-600';
  if (pct >= 0.60) return 'bg-green-600';
  if (pct >= 0.45) return 'bg-yellow-600';
  if (pct >= 0.25) return 'bg-orange-600';
  return 'bg-red-700';
};

const getEmploymentTypeBadgeColor = (type: string): string => {
  switch (type) {
    case 'Contractor': return 'bg-orange-500';
    case 'W2 Salaried': return 'bg-blue-500';
    case 'W2 Hourly': return 'bg-teal-500';
    default: return 'bg-gray-500';
  }
};

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

const PeoplePage: React.FC = () => {
  const [peopleData, setPeopleData] = useState<PersonData[]>([]);
  const [roleKpis, setRoleKpis] = useState<RoleKpi[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('All Clusters');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof PersonData>('person_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('All');
  const [showDocInfo, setShowDocInfo] = useState<boolean>(false);
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

  const availableRoleCategories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(personRoleCategoryMap).forEach(c => cats.add(c));
    const activeNames = new Set(
      peopleData.filter(p => p.active_status === 'active' || !p.active_status).map(p => p.person_name)
    );
    const hasUnassigned = [...activeNames].some(name => !personRoleCategoryMap[name]);
    if (hasUnassigned) cats.add('Unassigned');
    const ordered = clusterDisplayOrder.filter(c => c === 'All Clusters' || cats.has(c));
    cats.forEach(c => { if (!ordered.includes(c)) ordered.push(c); });
    return ordered;
  }, [personRoleCategoryMap, peopleData]);

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

      if (performanceError) console.error('Error fetching performance scores:', performanceError);
      if (costsError) console.error('Error fetching person costs:', costsError);
      if (roleKpisError) console.error('Error fetching role KPIs:', roleKpisError);

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
            parsed_role_alignment_flags = {};
          }

          return {
            ...score,
            employment_type: cost.employment_type || 'N/A',
            annual_cost: cost.annual_cost || 0,
            effective_bill_rate: cost.effective_bill_rate || 0,
            margin_per_hour: cost.margin_per_hour || 0,
            parsed_role_alignment_flags,
            raw_data: score.raw_data || {},
          };
        });
        setPeopleData(mergedData);
      }
    };

    fetchData();
  }, [supabase]);

  const filteredPeople = useMemo(() => {
    let filtered = peopleData;
    if (!showInactive) {
      filtered = filtered.filter(p => p.active_status === 'active' || !p.active_status);
    }
    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(person => getDepartmentDisplayName(person.department) === selectedDepartment);
    }
    if (selectedRoleCategory !== 'All Clusters') {
      if (selectedRoleCategory === 'Unassigned') {
        filtered = filtered.filter(p => !personRoleCategoryMap[p.person_name]);
      } else {
        filtered = filtered.filter(p => personRoleCategoryMap[p.person_name] === selectedRoleCategory);
      }
    }
    if (selectedEmploymentType !== 'All') {
      if (selectedEmploymentType === 'W2 Only') {
        filtered = filtered.filter(p => p.employment_type === 'W2 Salaried' || p.employment_type === 'W2 Hourly');
      } else if (selectedEmploymentType === 'Contractors Only') {
        filtered = filtered.filter(p => p.employment_type === 'Contractor');
      } else {
        filtered = filtered.filter(p => p.employment_type === selectedEmploymentType);
      }
    }
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
  }, [peopleData, selectedDepartment, selectedRoleCategory, selectedEmploymentType, sortBy, sortOrder, showInactive, personRoleCategoryMap]);

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
      if (newSet.has(personName)) newSet.delete(personName);
      else newSet.add(personName);
      return newSet;
    });
  };

  const totalPeople = filteredPeople.length;
  const avgCompositeScore = (filteredPeople.reduce((sum, p) => sum + p.composite_score, 0) / totalPeople) || 0;
  const meetingExpectations = filteredPeople.filter(p => p.composite_score >= 60).length;
  const percentMeetingExpectations = totalPeople > 0 ? (meetingExpectations / totalPeople) * 100 : 0;

  const employmentTypeComparisonCard = useMemo(() => {
    const w2People = filteredPeople.filter(p => p.employment_type === 'W2 Salaried' || p.employment_type === 'W2 Hourly');
    const contractorPeople = filteredPeople.filter(p => p.employment_type === 'Contractor');
    const w2Count = w2People.length;
    const contractorCount = contractorPeople.length;
    const w2AvgComposite = w2Count > 0 ? (w2People.reduce((sum, p) => sum + p.composite_score, 0) / w2Count) : 0;
    const contractorAvgComposite = contractorCount > 0 ? (contractorPeople.reduce((sum, p) => sum + p.composite_score, 0) / contractorCount) : 0;
    const w2AvgUtilization = w2Count > 0 ? (w2People.reduce((sum, p) => sum + (p.utilization_pct || 0), 0) / w2Count) : 0;
    const contractorAvgUtilization = contractorCount > 0 ? (contractorPeople.reduce((sum, p) => sum + (p.utilization_pct || 0), 0) / contractorCount) : 0;
    return {
      w2Count, w2AvgComposite, w2AvgUtilization,
      contractorCount, contractorAvgComposite, contractorAvgUtilization,
      compositeDelta: w2AvgComposite - contractorAvgComposite,
      utilizationDelta: w2AvgUtilization - contractorAvgUtilization,
    };
  }, [filteredPeople]);

  const performanceDistribution = useMemo(() => {
    const bands: Record<string, number> = { 'Unsatisfactory': 0, 'Below': 0, 'Meets': 0, 'Exceeds': 0, 'Exceptional': 0 };
    filteredPeople.forEach(p => { bands[getPerformanceBand(p.composite_score)]++; });
    return Object.entries(bands).map(([name, count]) => ({ name, count }));
  }, [filteredPeople]);

  // Metric score dimensions for the table heat-map cells
  const scoreMetrics: Array<{ key: keyof PersonData; label: string; short: string }> = [
    { key: 'utilization_pct', label: 'Utilization', short: 'Util' },
    { key: 'efficiency_score', label: 'Efficiency', short: 'Eff' },
    { key: 'collaboration_score', label: 'Collaboration', short: 'Collab' },
    { key: 'compliance_score', label: 'Compliance', short: 'Compl' },
    { key: 'revenue_impact_score', label: 'Revenue Impact', short: 'Rev' },
    { key: 'non_billable_quality_score', label: 'NB Quality', short: 'NBQ' },
  ];

  return (
    <div className="container mx-auto p-8 bg-[#0a101e] text-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-white">People Performance</h1>

      {/* Documentation InfoBox */}
      <button onClick={() => setShowDocInfo(!showDocInfo)} className="flex items-center gap-2 text-gray-400 hover:text-teal-400 mb-6 text-sm">
        <Info size={16} /> {showDocInfo ? 'Hide' : 'Show'} Page Documentation
      </button>
      {showDocInfo && (
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardContent className="p-4 text-sm text-gray-300 space-y-2">
            <p><strong className="text-teal-400">What it measures:</strong> Individual employee performance across 6 score dimensions (utilization, efficiency, collaboration, compliance, revenue impact, NB quality) plus role-specific KPIs tailored to 14 clusters.</p>
            <p><strong className="text-teal-400">Why it matters:</strong> Drives bonus recommendations, identifies performance gaps, and enables role-appropriate evaluation — LTEs measured differently from executives, PMs differently from billable ICs.</p>
            <p><strong className="text-teal-400">Data sources:</strong> <code>mosaic_performance_scores_2025</code> (253 records), <code>mosaic_person_costs_2025</code> (217 records), <code>mosaic_role_kpis_2025</code> (292 KPIs across 106 W2 people).</p>
            <p><strong className="text-teal-400">Heat map colors:</strong> Teal ≥85 (Exceptional), Green ≥60 (Meets), Yellow ≥45 (Below), Red &lt;45 (Unsatisfactory). Scores are 0-100.</p>
            <p><strong className="text-teal-400">Clusters:</strong> 9 role clusters defined with Joe Morgan (Mar 24). Each person&apos;s KPIs are tailored to their cluster — not generic.</p>
            <p><strong className="text-teal-400">Limitations:</strong> 14 sales people + 2 ProcessX roles not yet assigned to clusters. Contractor KPIs not included (rate adjustments only). Weight percentages not yet set for all KPIs.</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Select onValueChange={(value: string | null) => { if (value) setSelectedDepartment(value) }} defaultValue={selectedDepartment}>
          <SelectTrigger className="w-[240px] bg-gray-800 text-white border-gray-700">
            <SelectValue>{selectedDepartment}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            {availableDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value: string | null) => { if (value) setSelectedRoleCategory(value) }} defaultValue={selectedRoleCategory}>
          <SelectTrigger className="w-[260px] bg-gray-800 text-white border-gray-700">
            <SelectValue>{selectedRoleCategory}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            {availableRoleCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-md shadow-sm" role="group">
          {employmentTypeFilters.map(type => (
            <Button key={type} variant="outline" size="sm"
              onClick={() => setSelectedEmploymentType(type)}
              className={selectedEmploymentType === type
                ? "bg-teal-600 text-white border-teal-500 hover:bg-teal-700"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
              }
            >{type}</Button>
          ))}
        </div>

        <Button variant="outline" size="sm"
          onClick={() => setShowInactive(!showInactive)}
          className={showInactive
            ? "bg-gray-700 text-white border-gray-500 hover:bg-gray-600"
            : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
          }
        >{showInactive ? '👁 Showing Inactive/Departed' : '👁 Hide Inactive/Departed'}</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader><CardTitle className="text-teal-400">Total People</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalPeople}</p></CardContent>
        </Card>
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader><CardTitle className="text-teal-400">Avg Composite Score</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{avgCompositeScore.toFixed(1)}</p></CardContent>
        </Card>
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader><CardTitle className="text-teal-400">% Meeting Expectations</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{percentMeetingExpectations.toFixed(1)}%</p></CardContent>
        </Card>
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader><CardTitle className="text-teal-400">Workforce Mix</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl">W2: {employmentTypeComparisonCard.w2Count} (Avg: {employmentTypeComparisonCard.w2AvgComposite.toFixed(1)})</p>
            <p className="text-xl">Contractor: {employmentTypeComparisonCard.contractorCount} (Avg: {employmentTypeComparisonCard.contractorAvgComposite.toFixed(1)})</p>
            <p className="text-xl mt-2">Score Δ: <span className={employmentTypeComparisonCard.compositeDelta >= 0 ? 'text-green-400' : 'text-red-400'}>{employmentTypeComparisonCard.compositeDelta.toFixed(1)}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Distribution — clickable tiles */}
      {(() => {
        const clusterCounts: Record<string, { count: number; totalScore: number }> = {};
        const activePeople = peopleData.filter(p => p.active_status === 'active' || !p.active_status);
        activePeople.forEach(p => {
          const cat = personRoleCategoryMap[p.person_name] || 'Unassigned';
          if (!clusterCounts[cat]) clusterCounts[cat] = { count: 0, totalScore: 0 };
          clusterCounts[cat].count++;
          clusterCounts[cat].totalScore += p.composite_score;
        });
        const clusterData = clusterDisplayOrder
          .filter(c => c !== 'All Clusters' && clusterCounts[c])
          .map(c => ({ name: c, count: clusterCounts[c].count, avgScore: clusterCounts[c].count > 0 ? clusterCounts[c].totalScore / clusterCounts[c].count : 0 }));
        Object.keys(clusterCounts).forEach(c => {
          if (!clusterData.find(d => d.name === c)) {
            clusterData.push({ name: c, count: clusterCounts[c].count, avgScore: clusterCounts[c].count > 0 ? clusterCounts[c].totalScore / clusterCounts[c].count : 0 });
          }
        });

        return (
          <Card className="bg-gray-900 text-white border-gray-700 mb-8">
            <CardHeader><CardTitle className="text-teal-400">Role Clusters</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {clusterData.map(c => (
                  <button key={c.name}
                    onClick={() => setSelectedRoleCategory(selectedRoleCategory === c.name ? 'All Clusters' : c.name)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedRoleCategory === c.name ? 'bg-teal-900/50 border-teal-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-xs text-gray-400 truncate">{c.name}</p>
                    <p className="text-2xl font-bold text-white">{c.count}</p>
                    <p className="text-sm">Avg: <span className={getScoreColor(c.avgScore)}>{c.avgScore.toFixed(1)}</span></p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Performance Distribution Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader><CardTitle className="text-teal-400">Performance Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="name" stroke="#cbd5e0" />
                <YAxis stroke="#cbd5e0" />
                <Tooltip cursor={{ fill: '#3a4150' }} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4a5568', borderRadius: '0.25rem' }} labelStyle={{ color: '#ffffff' }} itemStyle={{ color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#64C4DD" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* People Table with Heat Map Cells */}
      <Card className="bg-gray-900 text-white border-gray-700">
        <CardHeader><CardTitle className="text-teal-400">People Details — Heat Map View</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-700">
                <TableHead className="text-white w-[40px]"></TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('person_name')}>
                  Name {sortBy === 'person_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('role_function')}>
                  Role {sortBy === 'role_function' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="text-white">Cluster</TableHead>
                <TableHead className="text-white cursor-pointer text-center" onClick={() => handleSort('composite_score')}>
                  Score {sortBy === 'composite_score' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                {/* Heat map columns */}
                {scoreMetrics.map(m => (
                  <TableHead key={m.key} className="text-white text-center cursor-pointer text-xs px-2" onClick={() => handleSort(m.key)}>
                    {m.short} {sortBy === m.key && (sortOrder === 'asc' ? '▲' : '▼')}
                  </TableHead>
                ))}
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('supervisor')}>
                  Supervisor {sortBy === 'supervisor' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map(person => {
                const personKpis = roleKpis.filter(k => k.person_name === person.person_name).sort((a, b) => a.kpi_number - b.kpi_number);
                const personRoleCategory = personKpis.length > 0 ? personKpis[0].role_category : null;

                return (
                  <React.Fragment key={person.person_name}>
                    <TableRow className={`border-gray-700 hover:bg-gray-800 ${getScoreBg(person.composite_score)}`}>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toggleRow(person.person_name)} className="text-gray-400 hover:text-white p-1">
                          {expandedRows.has(person.person_name) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-white whitespace-nowrap">
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
                      <TableCell className="text-gray-300 text-sm max-w-[200px] truncate">{person.role_function || person.performance_tier}</TableCell>
                      <TableCell>
                        {personRoleCategory ? (
                          <Badge className="bg-purple-600/80 text-white text-[10px] whitespace-nowrap">{personRoleCategory}</Badge>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-lg ${getScoreColor(person.composite_score)}`}>
                          {person.composite_score.toFixed(1)}
                        </span>
                        <p className="text-[10px] text-gray-500">{getPerformanceBand(person.composite_score)}</p>
                      </TableCell>
                      {/* Heat map cells */}
                      {scoreMetrics.map(m => {
                        const val = (person[m.key] as number) || 0;
                        return (
                          <TableCell key={m.key} className="text-center px-1">
                            {val > 0 ? (
                              <div className={`rounded px-1.5 py-0.5 text-xs font-mono text-white ${getHeatColor(val)}`}>
                                {val.toFixed(0)}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Badge className={`${getEmploymentTypeBadgeColor(person.employment_type)} text-[10px]`}>
                          {person.employment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">{person.supervisor}</TableCell>
                    </TableRow>

                    {/* Expanded Row — Original Style */}
                    {expandedRows.has(person.person_name) && (
                      <TableRow className="bg-gray-800 border-gray-700">
                        <TableCell colSpan={13} className="py-4 px-6 text-gray-200">
                          <div className="space-y-6">
                            {/* Composite Score Gauge */}
                            <div>
                              <h4 className="font-semibold text-teal-300 mb-2">
                                Composite Score: <span className={getScoreColor(person.composite_score)}>{person.composite_score.toFixed(1)}</span> — {getPerformanceBand(person.composite_score)}
                                {personRoleCategory && <Badge className="bg-purple-600 text-white ml-3">{personRoleCategory}</Badge>}
                              </h4>
                              <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                <div className="h-4 rounded-full absolute top-0 left-0"
                                  style={{
                                    width: `${person.composite_score}%`,
                                    backgroundColor: person.composite_score >= 85 ? '#64C4DD' : person.composite_score >= 75 ? '#22C55E' : person.composite_score >= 60 ? '#F3CF4F' : '#DC2626',
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Score Breakdown Radar Chart */}
                            {[person.utilization_pct, person.efficiency_score, person.collaboration_score, person.compliance_score, person.revenue_impact_score, person.non_billable_quality_score].filter(s => s !== 0).length > 1 && (
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Score Breakdown</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                  <RadarChart outerRadius={90} width={730} height={250} data={[
                                    { subject: 'Utilization', A: person.utilization_pct || 0, fullMark: 100 },
                                    { subject: 'Efficiency', A: person.efficiency_score || 0, fullMark: 100 },
                                    { subject: 'Collaboration', A: person.collaboration_score || 0, fullMark: 100 },
                                    { subject: 'Compliance', A: person.compliance_score || 0, fullMark: 100 },
                                    { subject: 'Revenue Impact', A: person.revenue_impact_score || 0, fullMark: 100 },
                                    { subject: 'NB Quality', A: person.non_billable_quality_score || 0, fullMark: 100 },
                                  ].filter(item => item.A !== 0)}>
                                    <PolarGrid stroke="#4a5568" />
                                    <PolarAngleAxis dataKey="subject" stroke="#cbd5e0" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e0" />
                                    <Radar name={person.person_name} dataKey="A" stroke="#64C4DD" fill="#64C4DD" fillOpacity={0.6} />
                                    <Tooltip cursor={{ fill: '#3a4150' }} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4a5568', borderRadius: '0.25rem' }} labelStyle={{ color: '#ffffff' }} itemStyle={{ color: '#e2e8f0' }} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* Three-column detail grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Qualitative Assessment */}
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Qualitative Assessment</h4>
                                <p className="mb-1"><span className="font-medium text-green-400">Strengths:</span> {person.strengths || 'N/A'}</p>
                                <p className="mb-1"><span className="font-medium text-red-400">Concerns:</span> {person.concerns || 'N/A'}</p>
                                <p className="mb-1"><span className="font-medium text-amber-400">Specific Actions:</span> {person.specific_actions || 'N/A'}</p>
                              </div>

                              {/* Cost & Hours Data */}
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Cost &amp; Hours Data</h4>
                                <p>Annual Cost: <span className="font-medium text-white">${person.annual_cost?.toLocaleString() || 'N/A'}</span></p>
                                <p>Effective Bill Rate: <span className="font-medium text-white">${person.effective_bill_rate?.toFixed(2) || 'N/A'}</span></p>
                                <p>Margin Per Hour: <span className="font-medium text-white">${person.margin_per_hour?.toFixed(2) || 'N/A'}</span></p>
                                <p className="mt-2">Billable Hours: <span className="font-medium text-white">{person.billable_hours?.toFixed(1) || 'N/A'}</span></p>
                                <p>Total Hours: <span className="font-medium text-white">{person.total_hours?.toFixed(1) || 'N/A'}</span></p>
                                <p className="mb-1">Utilization: <span className="font-medium text-white">{(person.utilization_pct || 0).toFixed(1)}%</span></p>
                                <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                                  <div className="h-3 rounded-full bg-teal-500 absolute top-0 left-0" style={{ width: `${person.utilization_pct || 0}%` }}></div>
                                </div>
                              </div>

                              {/* Org & Role Alignment */}
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Organization &amp; Role Alignment</h4>
                                <p className="mb-2"><span className="font-medium">Supervisor:</span> {person.supervisor || 'N/A'}</p>
                                {personKpis.length > 0 && personKpis[0].role_title && personKpis[0].role_title !== person.role_function && (
                                  <p className="mb-2 text-sm"><span className="font-medium">KPI Title:</span> <span className="text-gray-300">{personKpis[0].role_title}</span></p>
                                )}
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
                                  <p className="text-gray-400">No role alignment flags.</p>
                                )}
                              </div>
                            </div>

                            {/* Role-Specific KPIs — Weight Bar Style */}
                            {personKpis.length > 0 ? (
                              <div>
                                <h4 className="font-semibold text-teal-300 mt-6 mb-3">
                                  Role-Specific KPIs — <span className="text-white">{personRoleCategory}</span>
                                </h4>
                                <div className="space-y-3">
                                  {personKpis.map(kpi => {
                                    const weightPct = kpi.weight_pct || 0;
                                    const getWeightColor = (w: number) => {
                                      if (w >= 50) return 'bg-red-700';
                                      if (w >= 30) return 'bg-orange-600';
                                      if (w >= 15) return 'bg-yellow-500';
                                      return 'bg-green-600';
                                    };

                                    return (
                                      <div key={`${kpi.person_name}-${kpi.kpi_number}`} className="bg-gray-700 p-3 rounded-md border border-gray-600">
                                        <p className="font-medium text-lg text-white mb-1">
                                          <span className="text-gray-400 text-sm font-mono mr-2">KPI {kpi.kpi_number}</span>
                                          {kpi.kpi_name}
                                          <span className="text-sm text-gray-400 ml-2">({kpi.measurement_source})</span>
                                        </p>
                                        <p className="text-sm text-gray-300 mb-2">{kpi.kpi_description}</p>
                                        {weightPct > 0 && (
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className="w-20 text-sm text-gray-300">Weight:</div>
                                            <div className="w-full bg-gray-600 rounded-full h-2.5 relative overflow-hidden">
                                              <div className={`h-2.5 rounded-full absolute top-0 left-0 ${getWeightColor(weightPct)}`} style={{ width: `${weightPct}%` }}></div>
                                            </div>
                                            <span className="text-sm text-white font-mono w-10">{weightPct}%</span>
                                          </div>
                                        )}
                                        {kpi.target_value && (
                                          <p className="text-sm text-amber-400">Target: {kpi.target_value}</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (person.active_status === 'active' || !person.active_status) && (person.employment_type === 'W2 Salaried' || person.employment_type === 'W2 Hourly') ? (
                              <div className="mt-4 p-3 rounded-lg bg-amber-900/30 border border-amber-700">
                                <p className="text-amber-400 text-sm font-medium">⚠️ No role-specific KPIs assigned yet</p>
                                <p className="text-gray-400 text-xs mt-1">This W2 employee needs cluster assignment and tailored KPIs.</p>
                              </div>
                            ) : null}

                            {/* Raw Data Metrics */}
                            {(person.raw_data && Object.keys(person.raw_data).length > 0) && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-teal-300 mb-3">Actual Metrics from Raw Data</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                  {Object.entries(person.raw_data)
                                    .filter(([, value]) => typeof value === 'number' && value !== 0)
                                    .map(([key, value]) => (
                                      <p key={key}>{key.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}: <span className="font-medium text-white">{(value as number).toLocaleString()}</span></p>
                                    ))}
                                </div>
                              </div>
                            )}
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
