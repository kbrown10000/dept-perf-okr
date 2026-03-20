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

interface BonusCriterion {
  role_title: string;
  criterion_name: string;
  weight_pct: number;
  data_source: string;
  threshold_min: number;
  target_value: number;
  stretch_value: number;
  scoring_notes: string;
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
  const [bonusCriteria, setBonusCriteria] = useState<BonusCriterion[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof PersonData>('person_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('All');
  const supabase = createClient();

  const employmentTypeFilters = ['All', 'W2 Only', 'Contractors Only', 'W2 Salaried', 'W2 Hourly', 'Contractor'];

  const getRoleScorecardTemplate = (roleFunction: string, utilization_pct: number, employment_type: string): string => {
    const lowerRoleFunction = roleFunction.toLowerCase();

    if (lowerRoleFunction.includes('account manager') || lowerRoleFunction.includes('account executive') || lowerRoleFunction.includes('business development') || lowerRoleFunction.includes('sales leadership') || lowerRoleFunction.includes('staffing account manager')) {
      return 'Sales_AE_AM';
    }
    if (lowerRoleFunction.includes('pod leader')) {
      return 'Hybrid_PodLeader';
    }
    if (utilization_pct > 0 && employment_type === 'Contractor') {
      return 'Tier1_Contingent_Billable';
    }
    if (utilization_pct > 0 && employment_type === 'W2 Hourly') {
      return utilization_pct < 50 ? 'Tier2_W2Hourly_LightlyBillable' : 'Tier2_W2Hourly_Billable';
    }
    if (utilization_pct > 0 && employment_type === 'W2 Salaried') {
      return utilization_pct < 50 ? 'Tier3_W2Salaried_LightlyBillable' : 'Tier3_W2Salaried_Billable';
    }
    if (lowerRoleFunction.includes('leadership') || lowerRoleFunction.includes('manager')) { // non-sales leadership
      return 'Manager_Scorecard';
    }
    if (lowerRoleFunction.includes('finance') || lowerRoleFunction.includes('hr') || lowerRoleFunction.includes('it') || lowerRoleFunction.includes('operations') || lowerRoleFunction.includes('recruiting')) {
      // Check if 'Support_Corporate' exists in bonusCriteria, otherwise default
      const supportCorporateExists = bonusCriteria.some(c => c.role_title === 'Support_Corporate');
      return supportCorporateExists ? 'Support_Corporate' : 'Manager_Scorecard'; // Fallback as per instructions
    }

    return 'General_Scorecard'; // Default fallback if no match
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
      
      const { data: bonusCriteriaData, error: bonusCriteriaError } = await supabase
        .from('mosaic_bonus_criteria')
        .select('*');

      if (performanceError) {
        console.error('Error fetching performance scores:', performanceError);
      }
      if (costsError) {
        console.error('Error fetching person costs:', costsError);
      }
      if (bonusCriteriaError) {
        console.error('Error fetching bonus criteria:', bonusCriteriaError);
      }

      if (performanceScores && personCosts && bonusCriteriaData) {
        setBonusCriteria(bonusCriteriaData);

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
  }, [supabase, bonusCriteria]);

  const filteredPeople = useMemo(() => {
    let filtered = peopleData;
    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(p => p.active_status === 'active' || !p.active_status);
    }
    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(person => getDepartmentDisplayName(person.department) === selectedDepartment);
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
                const roleSpecificKPIs = bonusCriteria.filter(c => c.role_title === roleTemplate);
                
                const getWeightColor = (weight: number): string => {
                  if (weight >= 50) return 'bg-red-700';
                  if (weight >= 30) return 'bg-orange-600';
                  if (weight >= 15) return 'bg-yellow-500';
                  return 'bg-green-600';
                };

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
                        <TableCell colSpan={8} className="py-4 px-6 text-gray-200">
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

                            {/* Score Breakdown Radar Chart */}
                            <div>
                              <h4 className="font-semibold text-teal-300 mb-2">Score Breakdown</h4>
                              <ResponsiveContainer width="100%" height={300}>
                                <RadarChart outerRadius={90} width={730} height={250} data={[
                                  {  subject: 'Utilization', A: person.utilization_pct || 0, fullMark: 100 },
                                  {  subject: 'Efficiency', A: person.efficiency_score || 0, fullMark: 100 },
                                  {  subject: 'Collaboration', A: person.collaboration_score || 0, fullMark: 100 },
                                  {  subject: 'Compliance', A: person.compliance_score || 0, fullMark: 100 },
                                  {  subject: 'Revenue Impact', A: person.revenue_impact_score || 0, fullMark: 100 },
                                  {  subject: 'Non-Billable Quality', A: person.non_billable_quality_score || 0, fullMark: 100 },
                                ]}>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Qualitative Assessment</h4>
                                <p className="mb-1"><span className="font-medium text-green-400">Strengths:</span> {person.strengths || 'N/A'}</p>
                                <p className="mb-1"><span className="font-medium text-red-400">Concerns:</span> {person.concerns || 'N/A'}</p>
                                <p className="mb-1"><span className="font-medium text-amber-400">Specific Actions:</span> {person.specific_actions || 'N/A'}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Cost & Hours Data</h4>
                                <p>Annual Cost: <span className="font-medium text-white">${person.annual_cost?.toLocaleString() || 'N/A'}</span></p>
                                <p>Effective Bill Rate: <span className="font-medium text-white">${person.effective_bill_rate?.toFixed(2) || 'N/A'}</span></p>
                                <p>Margin Per Hour: <span className="font-medium text-white">${person.margin_per_hour?.toFixed(2) || 'N/A'}</span></p>
                                <p className="mt-2">Billable Hours: <span className="font-medium text-white">{person.billable_hours?.toFixed(1) || 'N/A'}</span></p>
                                <p>Total Hours: <span className="font-medium text-white">{person.total_hours?.toFixed(1) || 'N/A'}</span></p>
                                <p className="mb-1">Utilization: <span className="font-medium text-white">{(person.utilization_pct || 0).toFixed(1)}%</span></p>
                                <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                                  <div
                                    className="h-3 rounded-full bg-teal-500 absolute top-0 left-0"
                                    style={{ width: `${person.utilization_pct || 0}%` }}
                                  ></div>
                                </div>
                              </div>
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

                            {/* Role-Specific KPIs */}
                            {roleSpecificKPIs.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-teal-300 mt-6 mb-3">Role-Specific KPIs (<span className="text-white">{roleTemplate}</span>)</h4>
                                <div className="space-y-3">
                                  {roleSpecificKPIs.map(kpi => (
                                    <div key={kpi.criterion_name} className="bg-gray-700 p-3 rounded-md border border-gray-600">
                                      <p className="font-medium text-lg text-white mb-1">{kpi.criterion_name} <span className="text-sm text-gray-400">({kpi.data_source})</span></p>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-24 text-sm text-gray-300">Weight:</div>
                                        <div className="w-full bg-gray-600 rounded-full h-2 relative overflow-hidden">
                                          <div
                                            className={`h-2 rounded-full absolute top-0 left-0 ${getWeightColor(kpi.weight_pct)}`}
                                            style={{ width: `${kpi.weight_pct}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm text-white">{kpi.weight_pct}%</span>
                                      </div>
                                      <p className="text-sm text-gray-300 mb-1">Threshold: <span className="font-medium text-white">{kpi.threshold_min}</span> | Target: <span className="font-medium text-white">{kpi.target_value}</span> | Stretch: <span className="font-medium text-white">{kpi.stretch_value}</span></p>
                                      {kpi.scoring_notes && <p className="text-xs text-gray-400">Notes: {kpi.scoring_notes}</p>}
                                    </div>
                                  ))}
                                </div>

                                {/* Raw Data Metrics for Role */}
                                {(person.raw_data && Object.keys(person.raw_data).length > 0) && (
                                  <div className="mt-6">
                                    <h4 className="font-semibold text-teal-300 mb-3">Actual Role Metrics from Raw Data</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {renderRawDataMetric('deals_closed', 'Deals Closed')}
                                      {renderRawDataMetric('deals_won_value', 'Deals Won Value', true)}
                                      {renderRawDataMetric('pipeline_value', 'Pipeline Value', true)}
                                      {renderRawDataMetric('win_rate', 'Win Rate')}
                                      {/* Add other relevant raw_data metrics as needed based on role */}
                                      {Object.entries(person.raw_data)
                                        .filter(([key]) => !['deals_closed', 'deals_won_value', 'pipeline_value', 'win_rate'].includes(key)) // Avoid duplicating known sales metrics
                                        .map(([key, value]) => {
                                          if (typeof value === 'number') {
                                            return renderRawDataMetric(key, key.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
                                          }
                                          return null;
                                        })
                                      }
                                    </div>
                                  </div>
                                )}
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
