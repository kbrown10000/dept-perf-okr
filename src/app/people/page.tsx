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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
}

interface PersonCost {
  person_name: string;
  employment_type: string;
  annual_cost: number;
  effective_bill_rate: number;
  margin_per_hour: number;
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
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof PersonData>('person_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const supabase = createClient();

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

      if (performanceError) {
        console.error('Error fetching performance scores:', performanceError);
      }
      if (costsError) {
        console.error('Error fetching person costs:', costsError);
      }

      if (performanceScores && personCosts) {
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
            ...cost,
            parsed_role_alignment_flags,
          };
        });
        setPeopleData(mergedData);
      }
    };

    fetchData();
  }, [supabase]);

  const filteredPeople = useMemo(() => {
    let filtered = peopleData;
    if (selectedDepartment !== 'All Departments') {
      filtered = peopleData.filter(person => getDepartmentDisplayName(person.department) === selectedDepartment);
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
  }, [peopleData, selectedDepartment, sortBy, sortOrder]);

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

  const employmentTypeComparison = useMemo(() => {
    const comparison: { [key: string]: { totalScore: number; count: number } } = {};
    filteredPeople.forEach(p => {
      if (!comparison[p.employment_type]) {
        comparison[p.employment_type] = { totalScore: 0, count: 0 };
      }
      comparison[p.employment_type].totalScore += p.composite_score;
      comparison[p.employment_type].count += 1;
    });
    return Object.entries(comparison).map(([type, data]) => ({
      type,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0,
    }));
  }, [filteredPeople]);

  return (
    <div className="container mx-auto p-8 bg-[#0a101e] text-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-white">People Performance</h1>

      <div className="mb-6">
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
            {Object.entries(workforceMix).map(([type, count]) => (
              <p key={type}>{type}: {count}</p>
            ))}
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
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="text-teal-400">Average Score by Employment Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employmentTypeComparison} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="type" stroke="#cbd5e0" />
                <YAxis stroke="#cbd5e0" />
                <Tooltip
                  cursor={{ fill: '#3a4150' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4a5568', borderRadius: '0.25rem' }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="avgScore" fill="#F3CF4F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
              {filteredPeople.map(person => (
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
                    <TableCell className="font-medium text-white">{person.person_name}</TableCell>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-semibold text-teal-300 mb-2">Score Breakdown</h4>
                            <p>Utilization Score: {person.utilization_pct?.toFixed(1) || 'N/A'}</p>
                            <p>Efficiency Score: {person.efficiency_score?.toFixed(1) || 'N/A'}</p>
                            <p>Collaboration Score: {person.collaboration_score?.toFixed(1) || 'N/A'}</p>
                            <p>Compliance Score: {person.compliance_score?.toFixed(1) || 'N/A'}</p>
                            <p>Revenue Impact Score: {person.revenue_impact_score?.toFixed(1) || 'N/A'}</p>
                            <p>Non-Billable Quality Score: {person.non_billable_quality_score?.toFixed(1) || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-teal-300 mb-2">Qualitative Assessment</h4>
                            <p><span className="font-medium">Strengths:</span> {person.strengths || 'N/A'}</p>
                            <p><span className="font-medium">Concerns:</span> {person.concerns || 'N/A'}</p>
                            <p><span className="font-medium">Specific Actions:</span> {person.specific_actions || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-teal-300 mb-2">Cost Data</h4>
                            <p>Annual Cost: ${person.annual_cost?.toLocaleString() || 'N/A'}</p>
                            <p>Effective Bill Rate: ${person.effective_bill_rate?.toFixed(2) || 'N/A'}</p>
                            <p>Margin Per Hour: ${person.margin_per_hour?.toFixed(2) || 'N/A'}</p>
                            <h4 className="font-semibold text-teal-300 mt-4 mb-2">Role Alignment Flags</h4>
                            {person.parsed_role_alignment_flags && Object.keys(person.parsed_role_alignment_flags).length > 0 ? (
                              <ul>
                                {Object.entries(person.parsed_role_alignment_flags).map(([key, value]) => (
                                  <li key={key}>{key}: {JSON.stringify(value)}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>No role alignment flags.</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeoplePage;
