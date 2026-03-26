"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Info, Save, Edit2, Star, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// ─── Interfaces ───
interface PerformanceScore {
  person_name: string; department: string; composite_score: number; performance_tier: string;
  utilization_pct: number; billable_hours: number; total_hours: number;
  non_billable_quality_score: number; efficiency_score: number; collaboration_score: number;
  compliance_score: number; revenue_impact_score: number; role_function: string; supervisor: string;
  strengths: string; concerns: string; specific_actions: string;
  role_alignment_flags: string; active_status: string; raw_data: any;
}
interface PersonCost {
  person_name: string; employment_type: string; annual_cost: number;
  effective_bill_rate: number; margin_per_hour: number;
}
interface RoleKpi {
  person_name: string; role_category: string; role_title: string; kpi_number: number;
  kpi_name: string; kpi_description: string; measurement_source: string;
  target_value: string; weight_pct: number | null;
}
interface ManagerReview {
  id: string; person_name: string; reviewer_email: string; reviewer_name: string;
  performance_period: string; manager_score: number; manager_score_label: string;
  justification: string; supporting_evidence: string; submitted_at: string; updated_at: string;
  is_current: boolean;
}
interface BonusRecommendation {
  person_name: string; composite_score: number; performance_band: string;
  bonus_target: number; individual_multiplier: number; company_modifier: number;
  adjusted_bonus: number; merit_bonus: number; employment_type: string; contract_tier: string;
  actions: string; justification: string; key_achievements: any; key_concerns: any;
  conditions: string; development_plan: string;
}
interface CompPlan {
  person_name: string; base_salary: number; ote: number; bonus_target_pct: number;
  bonus_target_amt: number; bonus_cap_pct: number; bonus_floor_pct: number; level: string;
}
interface PersonData extends PerformanceScore, PersonCost {
  parsed_role_alignment_flags?: any;
}

// ─── Helpers ───
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
const getDepartmentDisplayName = (d: string): string => {
  const e = departmentMappingRules.find(r => d === r.match);
  if (e) return e.target;
  const p = departmentMappingRules.find(r => d.startsWith(r.match));
  return p ? p.target : d;
};
const getScoreColor = (s: number) => s >= 85 ? 'text-[#64C4DD]' : s >= 75 ? 'text-[#64C4DD]' : s >= 60 ? 'text-[#22C55E]' : s >= 45 ? 'text-[#F3CF4F]' : 'text-[#DC2626]';
const getScoreBg = (s: number) => s >= 85 ? 'bg-teal-500/20' : s >= 75 ? 'bg-teal-500/10' : s >= 60 ? 'bg-green-500/10' : s >= 45 ? 'bg-yellow-500/10' : 'bg-red-500/15';
const getPerformanceBand = (s: number) => s >= 85 ? 'Exceptional' : s >= 75 ? 'Exceeds' : s >= 60 ? 'Meets' : s >= 45 ? 'Below' : 'Unsatisfactory';
const getHeatColor = (v: number) => { const p = Math.min(v / 100, 1); return p >= 0.85 ? 'bg-teal-500' : p >= 0.75 ? 'bg-teal-600' : p >= 0.60 ? 'bg-green-600' : p >= 0.45 ? 'bg-yellow-600' : p >= 0.25 ? 'bg-orange-600' : 'bg-red-700'; };
const getEmploymentTypeBadgeColor = (t: string) => t === 'Contractor' ? 'bg-orange-500' : t === 'W2 Salaried' ? 'bg-blue-500' : t === 'W2 Hourly' ? 'bg-teal-500' : 'bg-gray-500';

const managerScoreLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Unsatisfactory', color: 'bg-red-700 text-white' },
  2: { label: 'Below Expectations', color: 'bg-orange-600 text-white' },
  3: { label: 'Meets Expectations', color: 'bg-green-600 text-white' },
  4: { label: 'Exceeds Expectations', color: 'bg-teal-600 text-white' },
  5: { label: 'Exceptional', color: 'bg-teal-400 text-gray-900' },
};

// ─── Main Component ───
const PeoplePage: React.FC = () => {
  const [peopleData, setPeopleData] = useState<PersonData[]>([]);
  const [roleKpis, setRoleKpis] = useState<RoleKpi[]>([]);
  const [managerReviews, setManagerReviews] = useState<ManagerReview[]>([]);
  const [bonusRecs, setBonusRecs] = useState<BonusRecommendation[]>([]);
  const [compPlans, setCompPlans] = useState<CompPlan[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof PersonData>('person_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('All');
  const [showDocInfo, setShowDocInfo] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  // Manager review form state — keyed by person_name
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [reviewFormData, setReviewFormData] = useState<Record<string, { score: number; justification: string; evidence: string }>>({});
  const [savingReview, setSavingReview] = useState<string | null>(null);

  const supabase = createClient();
  const employmentTypeFilters = ['All', 'W2 Only', 'Contractors Only', 'W2 Salaried', 'W2 Hourly', 'Contractor'];
  const isAdmin = currentUserEmail === 'kbrown@usdm.com' || currentUserEmail === 'jmorgan@usdm.com';

  // Build lookups
  const personRoleCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    roleKpis.forEach(k => { if (!map[k.person_name]) map[k.person_name] = k.role_category; });
    return map;
  }, [roleKpis]);
  const managerReviewMap = useMemo(() => {
    const map: Record<string, ManagerReview> = {};
    managerReviews.forEach(r => { if (r.is_current) map[r.person_name] = r; });
    return map;
  }, [managerReviews]);
  const bonusRecMap = useMemo(() => {
    const map: Record<string, BonusRecommendation> = {};
    bonusRecs.forEach(r => { map[r.person_name] = r; });
    return map;
  }, [bonusRecs]);
  const compPlanMap = useMemo(() => {
    const map: Record<string, CompPlan> = {};
    compPlans.forEach(r => { map[r.person_name] = r; });
    return map;
  }, [compPlans]);

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    peopleData.forEach(p => depts.add(getDepartmentDisplayName(p.department)));
    return ['All Departments', ...Array.from(depts).sort()];
  }, [peopleData]);

  // ─── Data Fetch ───
  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setCurrentUserEmail(user.email);

      const [scores, costs, kpis, reviews, bonuses, plans] = await Promise.all([
        supabase.from('mosaic_performance_scores_2025').select('*'),
        supabase.from('mosaic_person_costs_2025').select('*'),
        supabase.from('mosaic_role_kpis_2025').select('*'),
        supabase.from('mosaic_manager_reviews_2025').select('*').eq('is_current', true),
        supabase.from('mosaic_bonus_recommendations_2025').select('*'),
        supabase.from('mosaic_bonus_comp_plans').select('*'),
      ]);

      if (kpis.data) setRoleKpis(kpis.data);
      if (reviews.data) setManagerReviews(reviews.data);
      if (bonuses.data) setBonusRecs(bonuses.data);
      if (plans.data) setCompPlans(plans.data);

      if (scores.data && costs.data) {
        const mergedData: PersonData[] = scores.data.map((score: PerformanceScore) => {
          const cost = costs.data.find((c: PersonCost) => c.person_name === score.person_name) || { employment_type: 'N/A', annual_cost: 0, effective_bill_rate: 0, margin_per_hour: 0 };
          let parsed_role_alignment_flags;
          try { parsed_role_alignment_flags = score.role_alignment_flags ? JSON.parse(score.role_alignment_flags) : {}; }
          catch { parsed_role_alignment_flags = {}; }
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

  // ─── Manager Review Save ───
  const saveManagerReview = useCallback(async (personName: string) => {
    const form = reviewFormData[personName];
    if (!form || !form.justification.trim() || !currentUserEmail) return;
    setSavingReview(personName);
    try {
      // Mark any existing current review as not current
      await supabase.from('mosaic_manager_reviews_2025')
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .eq('person_name', personName)
        .eq('performance_period', 'FY2025')
        .eq('is_current', true);

      // Insert new review
      const { data, error } = await supabase.from('mosaic_manager_reviews_2025').insert({
        person_name: personName,
        reviewer_email: currentUserEmail,
        reviewer_name: currentUserEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        performance_period: 'FY2025',
        manager_score: form.score,
        justification: form.justification.trim(),
        supporting_evidence: form.evidence.trim() || null,
        is_current: true,
      }).select().single();

      if (error) {
        console.error('Error saving review:', error);
        alert('Error saving review: ' + error.message);
      } else if (data) {
        setManagerReviews(prev => [
          ...prev.filter(r => !(r.person_name === personName && r.performance_period === 'FY2025' && r.is_current)),
          data,
        ]);
        setEditingReview(null);
      }
    } finally {
      setSavingReview(null);
    }
  }, [reviewFormData, currentUserEmail, supabase]);

  // ─── Filter & Sort ───
  const filteredPeople = useMemo(() => {
    let filtered = peopleData;
    if (!showInactive) filtered = filtered.filter(p => p.active_status === 'active' || !p.active_status);
    if (selectedDepartment !== 'All Departments') filtered = filtered.filter(p => getDepartmentDisplayName(p.department) === selectedDepartment);
    if (selectedEmploymentType !== 'All') {
      if (selectedEmploymentType === 'W2 Only') filtered = filtered.filter(p => p.employment_type === 'W2 Salaried' || p.employment_type === 'W2 Hourly');
      else if (selectedEmploymentType === 'Contractors Only') filtered = filtered.filter(p => p.employment_type === 'Contractor');
      else filtered = filtered.filter(p => p.employment_type === selectedEmploymentType);
    }
    return [...filtered].sort((a, b) => {
      const aV = a[sortBy], bV = b[sortBy];
      if (typeof aV === 'string' && typeof bV === 'string') return sortOrder === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
      if (typeof aV === 'number' && typeof bV === 'number') return sortOrder === 'asc' ? aV - bV : bV - aV;
      return 0;
    });
  }, [peopleData, selectedDepartment, selectedEmploymentType, sortBy, sortOrder, showInactive]);

  const handleSort = (col: keyof PersonData) => { if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortOrder('asc'); } };
  const toggleRow = (name: string) => { setExpandedRows(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; }); };

  const totalPeople = filteredPeople.length;
  const avgCompositeScore = (filteredPeople.reduce((s, p) => s + p.composite_score, 0) / totalPeople) || 0;
  const meetingExpectations = filteredPeople.filter(p => p.composite_score >= 60).length;
  const percentMeetingExpectations = totalPeople > 0 ? (meetingExpectations / totalPeople) * 100 : 0;

  const employmentTypeComparisonCard = useMemo(() => {
    const w2 = filteredPeople.filter(p => p.employment_type === 'W2 Salaried' || p.employment_type === 'W2 Hourly');
    const con = filteredPeople.filter(p => p.employment_type === 'Contractor');
    return {
      w2Count: w2.length,
      w2AvgComposite: w2.length > 0 ? w2.reduce((s, p) => s + p.composite_score, 0) / w2.length : 0,
      contractorCount: con.length,
      contractorAvgComposite: con.length > 0 ? con.reduce((s, p) => s + p.composite_score, 0) / con.length : 0,
      compositeDelta: (w2.length > 0 ? w2.reduce((s, p) => s + p.composite_score, 0) / w2.length : 0) - (con.length > 0 ? con.reduce((s, p) => s + p.composite_score, 0) / con.length : 0),
    };
  }, [filteredPeople]);

  const performanceDistribution = useMemo(() => {
    const b: Record<string, number> = { 'Unsatisfactory': 0, 'Below': 0, 'Meets': 0, 'Exceeds': 0, 'Exceptional': 0 };
    filteredPeople.forEach(p => { b[getPerformanceBand(p.composite_score)]++; });
    return Object.entries(b).map(([name, count]) => ({ name, count }));
  }, [filteredPeople]);

  const scoreMetrics: Array<{ key: keyof PersonData; short: string }> = [
    { key: 'utilization_pct', short: 'Util' }, { key: 'efficiency_score', short: 'Eff' },
    { key: 'collaboration_score', short: 'Collab' }, { key: 'compliance_score', short: 'Compl' },
    { key: 'revenue_impact_score', short: 'Rev' }, { key: 'non_billable_quality_score', short: 'NBQ' },
  ];

  // ─── Render ───
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
            <p><strong className="text-teal-400">What it measures:</strong> Individual performance across system KPIs + manager assessment + bonus recommendation — the full performance-to-comp story.</p>
            <p><strong className="text-teal-400">Three score layers:</strong> (1) <span className="text-blue-400">System Score</span> — auto-generated from KPI data (0-100). (2) <span className="text-amber-400">Manager Score</span> — supervisor's 1-5 rating with justification. (3) <span className="text-green-400">Bonus Recommendation</span> — data-driven payout tied to both scores.</p>
            <p><strong className="text-teal-400">Manager input:</strong> Only the person&apos;s direct supervisor can submit a performance period review. Scale: 1 (Unsatisfactory) to 5 (Exceptional). Managers can revise; required at minimum once per performance period.</p>
            <p><strong className="text-teal-400">Bonus data:</strong> From mosaic_bonus_recommendations_2025 + mosaic_bonus_comp_plans. Shows base salary, target %, system bonus, company modifier, adjusted payout.</p>
            <p><strong className="text-teal-400">Data sources:</strong> mosaic_performance_scores_2025, mosaic_person_costs_2025, mosaic_role_kpis_2025, mosaic_manager_reviews_2025, mosaic_bonus_recommendations_2025, mosaic_bonus_comp_plans.</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Select onValueChange={(v: string | null) => { if (v) setSelectedDepartment(v) }} defaultValue={selectedDepartment}>
          <SelectTrigger className="w-[240px] bg-gray-800 text-white border-gray-700"><SelectValue>{selectedDepartment}</SelectValue></SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            {availableDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex rounded-md shadow-sm" role="group">
          {employmentTypeFilters.map(t => (
            <Button key={t} variant="outline" size="sm" onClick={() => setSelectedEmploymentType(t)}
              className={selectedEmploymentType === t ? "bg-teal-600 text-white border-teal-500 hover:bg-teal-700" : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"}
            >{t}</Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowInactive(!showInactive)}
          className={showInactive ? "bg-gray-700 text-white border-gray-500" : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"}>
          {showInactive ? '👁 Showing Inactive/Departed' : '👁 Hide Inactive/Departed'}
        </Button>
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

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader><CardTitle className="text-teal-400">Performance Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="name" stroke="#cbd5e0" /><YAxis stroke="#cbd5e0" />
                <Tooltip cursor={{ fill: '#3a4150' }} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4a5568', borderRadius: '0.25rem' }} labelStyle={{ color: '#ffffff' }} itemStyle={{ color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#64C4DD" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ═══ People Table ═══ */}
      <Card className="bg-gray-900 text-white border-gray-700">
        <CardHeader><CardTitle className="text-teal-400">People Details — Performance &amp; Compensation</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-700">
                <TableHead className="text-white w-[40px]"></TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('person_name')}>Name {sortBy === 'person_name' && (sortOrder === 'asc' ? '▲' : '▼')}</TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('role_function')}>Role {sortBy === 'role_function' && (sortOrder === 'asc' ? '▲' : '▼')}</TableHead>
                <TableHead className="text-white cursor-pointer text-center" onClick={() => handleSort('composite_score')}>System {sortBy === 'composite_score' && (sortOrder === 'asc' ? '▲' : '▼')}</TableHead>
                <TableHead className="text-white text-center">Mgr</TableHead>
                {scoreMetrics.map(m => (
                  <TableHead key={m.key} className="text-white text-center cursor-pointer text-xs px-2" onClick={() => handleSort(m.key)}>{m.short}</TableHead>
                ))}
                <TableHead className="text-white text-center">Bonus</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white cursor-pointer" onClick={() => handleSort('supervisor')}>Supervisor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map(person => {
                const personKpis = roleKpis.filter(k => k.person_name === person.person_name).sort((a, b) => a.kpi_number - b.kpi_number);
                const personRoleCategory = personKpis.length > 0 ? personKpis[0].role_category : null;
                const mgrReview = managerReviewMap[person.person_name];
                const bonusRec = bonusRecMap[person.person_name];
                const compPlan = compPlanMap[person.person_name];
                const isEditing = editingReview === person.person_name;
                const canEdit = isAdmin || (currentUserEmail && person.supervisor && currentUserEmail.toLowerCase().includes(person.supervisor.toLowerCase().split(' ')[0]));

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
                          {person.active_status === 'inactive' && <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-700 text-gray-400 border border-gray-600">Inactive</span>}
                          {person.active_status === 'departed' && <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-900/30 text-red-400 border border-red-800">Departed</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm max-w-[200px] truncate">{person.role_function || person.performance_tier}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-lg ${getScoreColor(person.composite_score)}`}>{person.composite_score.toFixed(1)}</span>
                        <p className="text-[10px] text-gray-500">{getPerformanceBand(person.composite_score)}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {mgrReview ? (
                          <div className={`rounded px-2 py-0.5 text-xs font-bold ${managerScoreLabels[mgrReview.manager_score]?.color || 'bg-gray-600'}`}>
                            {mgrReview.manager_score}/5
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </TableCell>
                      {scoreMetrics.map(m => {
                        const val = (person[m.key] as number) || 0;
                        return (
                          <TableCell key={m.key} className="text-center px-1">
                            {val > 0 ? <div className={`rounded px-1.5 py-0.5 text-xs font-mono text-white ${getHeatColor(val)}`}>{val.toFixed(0)}</div> : <span className="text-gray-600 text-xs">—</span>}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        {bonusRec ? (
                          <span className={`font-bold text-sm ${bonusRec.adjusted_bonus > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                            ${bonusRec.adjusted_bonus?.toLocaleString() || '0'}
                          </span>
                        ) : <span className="text-gray-600 text-xs">—</span>}
                      </TableCell>
                      <TableCell><Badge className={`${getEmploymentTypeBadgeColor(person.employment_type)} text-[10px]`}>{person.employment_type}</Badge></TableCell>
                      <TableCell className="text-gray-300 text-sm">{person.supervisor}</TableCell>
                    </TableRow>

                    {/* ═══ Expanded Row ═══ */}
                    {expandedRows.has(person.person_name) && (
                      <TableRow className="bg-gray-800 border-gray-700">
                        <TableCell colSpan={14} className="py-4 px-6 text-gray-200">
                          <div className="space-y-6">
                            {/* Score Gauge */}
                            <div>
                              <h4 className="font-semibold text-teal-300 mb-2">
                                System Score: <span className={getScoreColor(person.composite_score)}>{person.composite_score.toFixed(1)}</span> — {getPerformanceBand(person.composite_score)}
                                {personRoleCategory && <Badge className="bg-purple-600 text-white ml-3">{personRoleCategory}</Badge>}
                              </h4>
                              <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                <div className="h-4 rounded-full absolute top-0 left-0" style={{ width: `${person.composite_score}%`, backgroundColor: person.composite_score >= 85 ? '#64C4DD' : person.composite_score >= 75 ? '#22C55E' : person.composite_score >= 60 ? '#F3CF4F' : '#DC2626' }}></div>
                              </div>
                            </div>

                            {/* Radar Chart */}
                            {[person.utilization_pct, person.efficiency_score, person.collaboration_score, person.compliance_score, person.revenue_impact_score, person.non_billable_quality_score].filter(s => s !== 0).length > 1 && (
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Score Breakdown</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                  <RadarChart outerRadius={90} data={[
                                    { subject: 'Utilization', A: person.utilization_pct || 0 }, { subject: 'Efficiency', A: person.efficiency_score || 0 },
                                    { subject: 'Collaboration', A: person.collaboration_score || 0 }, { subject: 'Compliance', A: person.compliance_score || 0 },
                                    { subject: 'Revenue Impact', A: person.revenue_impact_score || 0 }, { subject: 'NB Quality', A: person.non_billable_quality_score || 0 },
                                  ].filter(i => i.A !== 0)}>
                                    <PolarGrid stroke="#4a5568" /><PolarAngleAxis dataKey="subject" stroke="#cbd5e0" /><PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e0" />
                                    <Radar name={person.person_name} dataKey="A" stroke="#64C4DD" fill="#64C4DD" fillOpacity={0.6} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* Three-column detail grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Qualitative Assessment</h4>
                                <p className="mb-1"><span className="text-green-400 font-medium">Strengths:</span> {person.strengths || 'N/A'}</p>
                                <p className="mb-1"><span className="text-red-400 font-medium">Concerns:</span> {person.concerns || 'N/A'}</p>
                                <p className="mb-1"><span className="text-amber-400 font-medium">Actions:</span> {person.specific_actions || 'N/A'}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Cost &amp; Hours</h4>
                                <p>Annual Cost: <span className="font-medium text-white">${person.annual_cost?.toLocaleString() || 'N/A'}</span></p>
                                <p>Bill Rate: <span className="font-medium text-white">${person.effective_bill_rate?.toFixed(2) || 'N/A'}</span></p>
                                <p>Margin/Hr: <span className="font-medium text-white">${person.margin_per_hour?.toFixed(2) || 'N/A'}</span></p>
                                <p className="mt-2">Hours: <span className="font-medium text-white">{person.billable_hours?.toFixed(1)} / {person.total_hours?.toFixed(1)}</span></p>
                                <p className="mb-1">Util: <span className="font-medium text-white">{(person.utilization_pct || 0).toFixed(1)}%</span></p>
                                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden"><div className="h-3 rounded-full bg-teal-500" style={{ width: `${person.utilization_pct || 0}%` }}></div></div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-2">Organization</h4>
                                <p><span className="font-medium">Supervisor:</span> {person.supervisor || 'N/A'}</p>
                                {personKpis.length > 0 && personKpis[0].role_title !== person.role_function && (
                                  <p className="text-sm mt-1"><span className="font-medium">KPI Title:</span> {personKpis[0].role_title}</p>
                                )}
                                {person.parsed_role_alignment_flags && Object.keys(person.parsed_role_alignment_flags).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {Object.entries(person.parsed_role_alignment_flags).map(([k, v]) => (
                                      <Badge key={k} variant="secondary" className="bg-blue-600 text-white text-xs">{k}: {String(v)}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ═══ COMPONENT 1: Manager Performance Period Review ═══ */}
                            <Card className="bg-gray-900 border-amber-700/50">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-amber-400 flex items-center gap-2">
                                  <Star size={18} /> Manager Performance Period Review
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {mgrReview && !isEditing ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-sm">Manager Score:</span>
                                        <div className={`rounded px-3 py-1 font-bold ${managerScoreLabels[mgrReview.manager_score]?.color}`}>
                                          {mgrReview.manager_score}/5 — {managerScoreLabels[mgrReview.manager_score]?.label}
                                        </div>
                                      </div>
                                      <span className="text-gray-500 text-xs">by {mgrReview.reviewer_name || mgrReview.reviewer_email} · {new Date(mgrReview.updated_at).toLocaleDateString()}</span>
                                      {(isAdmin || mgrReview.reviewer_email === currentUserEmail) && (
                                        <Button variant="ghost" size="sm" onClick={() => {
                                          setEditingReview(person.person_name);
                                          setReviewFormData(prev => ({ ...prev, [person.person_name]: { score: mgrReview.manager_score, justification: mgrReview.justification, evidence: mgrReview.supporting_evidence || '' } }));
                                        }} className="text-amber-400 hover:text-amber-300"><Edit2 size={14} className="mr-1" /> Revise</Button>
                                      )}
                                    </div>
                                    <div className="bg-gray-800 rounded p-3">
                                      <p className="text-sm text-gray-300"><span className="font-medium text-white">Justification:</span> {mgrReview.justification}</p>
                                      {mgrReview.supporting_evidence && (
                                        <p className="text-sm text-gray-400 mt-2"><span className="font-medium text-gray-300">Evidence:</span> {mgrReview.supporting_evidence}</p>
                                      )}
                                    </div>
                                  </div>
                                ) : isEditing ? (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm text-gray-400 mb-2 block">Score (1-5)</label>
                                      <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(n => (
                                          <button key={n} onClick={() => setReviewFormData(prev => ({ ...prev, [person.person_name]: { ...prev[person.person_name], score: n } }))}
                                            className={`px-4 py-2 rounded-lg border transition-colors ${
                                              reviewFormData[person.person_name]?.score === n
                                                ? managerScoreLabels[n].color + ' border-transparent'
                                                : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                                            }`}>
                                            <span className="font-bold">{n}</span>
                                            <span className="block text-[10px]">{managerScoreLabels[n].label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm text-gray-400 mb-1 block">Justification <span className="text-red-400">*</span></label>
                                      <textarea
                                        value={reviewFormData[person.person_name]?.justification || ''}
                                        onChange={e => setReviewFormData(prev => ({ ...prev, [person.person_name]: { ...prev[person.person_name], justification: e.target.value } }))}
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm min-h-[100px] focus:border-amber-500 focus:outline-none"
                                        placeholder="Explain why this score differs from the system-generated score. What contributions aren't captured by system KPIs?"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm text-gray-400 mb-1 block">Supporting Evidence (optional)</label>
                                      <textarea
                                        value={reviewFormData[person.person_name]?.evidence || ''}
                                        onChange={e => setReviewFormData(prev => ({ ...prev, [person.person_name]: { ...prev[person.person_name], evidence: e.target.value } }))}
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm min-h-[60px] focus:border-amber-500 focus:outline-none"
                                        placeholder="Links, documents, specific examples..."
                                      />
                                    </div>
                                    <div className="flex gap-3">
                                      <Button onClick={() => saveManagerReview(person.person_name)} disabled={!reviewFormData[person.person_name]?.justification?.trim() || !reviewFormData[person.person_name]?.score || savingReview === person.person_name}
                                        className="bg-amber-600 hover:bg-amber-700 text-white">
                                        <Save size={14} className="mr-2" /> {savingReview === person.person_name ? 'Saving...' : 'Save Review'}
                                      </Button>
                                      <Button variant="ghost" onClick={() => setEditingReview(null)} className="text-gray-400">Cancel</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <p className="text-gray-500 text-sm">No manager review submitted for this performance period.</p>
                                    {(isAdmin || canEdit) && (
                                      <Button variant="outline" size="sm" onClick={() => {
                                        setEditingReview(person.person_name);
                                        setReviewFormData(prev => ({ ...prev, [person.person_name]: { score: 3, justification: '', evidence: '' } }));
                                      }} className="text-amber-400 border-amber-600 hover:bg-amber-900/30">
                                        <Edit2 size={14} className="mr-2" /> Submit Review
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* ═══ COMPONENT 2: Bonus & Compensation Recommendation ═══ */}
                            {(bonusRec || compPlan) && (
                              <Card className="bg-gray-900 border-green-700/50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-green-400 flex items-center gap-2">
                                    <DollarSign size={18} /> Bonus &amp; Compensation Recommendation
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left: Compensation Details */}
                                    <div className="space-y-3">
                                      <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Compensation Plan</h5>
                                      {compPlan ? (
                                        <div className="bg-gray-800 rounded p-4 space-y-2">
                                          <div className="flex justify-between"><span className="text-gray-400">Base Salary</span><span className="text-white font-bold">${compPlan.base_salary?.toLocaleString()}</span></div>
                                          <div className="flex justify-between"><span className="text-gray-400">Level</span><span className="text-white">{compPlan.level}</span></div>
                                          <div className="flex justify-between"><span className="text-gray-400">Bonus Target %</span><span className="text-white">{compPlan.bonus_target_pct}%</span></div>
                                          <div className="flex justify-between"><span className="text-gray-400">Bonus Target $</span><span className="text-teal-400 font-bold">${compPlan.bonus_target_amt?.toLocaleString()}</span></div>
                                          <div className="flex justify-between"><span className="text-gray-400">OTE</span><span className="text-white">${compPlan.ote?.toLocaleString()}</span></div>
                                          <div className="flex justify-between text-xs"><span className="text-gray-500">Floor / Cap</span><span className="text-gray-400">{compPlan.bonus_floor_pct}% / {compPlan.bonus_cap_pct}%</span></div>
                                        </div>
                                      ) : <p className="text-gray-500 text-sm">No comp plan on file.</p>}
                                    </div>

                                    {/* Right: Bonus Recommendation */}
                                    <div className="space-y-3">
                                      <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">System Recommendation</h5>
                                      {bonusRec ? (
                                        <div className="bg-gray-800 rounded p-4 space-y-2">
                                          <div className="flex justify-between"><span className="text-gray-400">Performance Band</span><span className={`font-bold ${getScoreColor(bonusRec.composite_score)}`}>{bonusRec.performance_band}</span></div>
                                          <div className="flex justify-between"><span className="text-gray-400">Individual Multiplier</span><span className="text-white font-bold">{((bonusRec.individual_multiplier || 0) * 100).toFixed(0)}%</span></div>
                                          <div className="flex justify-between"><span className="text-gray-400">Company Modifier</span><span className="text-white">{((bonusRec.company_modifier || 0) * 100).toFixed(0)}%</span></div>
                                          <div className="border-t border-gray-700 my-2"></div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Adjusted Bonus</span>
                                            <span className={`text-2xl font-bold ${bonusRec.adjusted_bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                              ${bonusRec.adjusted_bonus?.toLocaleString() || '0'}
                                            </span>
                                          </div>
                                          {bonusRec.merit_bonus > 0 && (
                                            <div className="flex justify-between"><span className="text-gray-400">Merit Bonus</span><span className="text-teal-400">${bonusRec.merit_bonus?.toLocaleString()}</span></div>
                                          )}
                                          {/* Manager score impact indicator */}
                                          {mgrReview && (
                                            <div className="mt-3 p-2 rounded bg-amber-900/20 border border-amber-800/50">
                                              <div className="flex items-center gap-2 text-sm">
                                                <Star size={14} className="text-amber-400" />
                                                <span className="text-amber-400">Manager Assessment:</span>
                                                <span className="font-bold text-white">{mgrReview.manager_score}/5 ({managerScoreLabels[mgrReview.manager_score]?.label})</span>
                                              </div>
                                              {mgrReview.manager_score >= 4 && bonusRec.adjusted_bonus === 0 && (
                                                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Manager rates higher than system — review recommended</p>
                                              )}
                                              {mgrReview.manager_score <= 2 && bonusRec.adjusted_bonus > 0 && (
                                                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Manager rates lower than system — review recommended</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ) : <p className="text-gray-500 text-sm">Not bonus-eligible or no recommendation generated.</p>}

                                      {/* Actions & Development */}
                                      {bonusRec?.actions && (
                                        <div className="bg-gray-800 rounded p-3">
                                          <p className="text-xs text-gray-400 uppercase mb-1">Recommended Actions</p>
                                          <p className="text-sm text-gray-300">{bonusRec.actions}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Role-Specific KPIs */}
                            {personKpis.length > 0 ? (
                              <div>
                                <h4 className="font-semibold text-teal-300 mt-2 mb-3">Role-Specific KPIs — <span className="text-white">{personRoleCategory}</span></h4>
                                <div className="space-y-3">
                                  {personKpis.map(kpi => {
                                    const w = kpi.weight_pct || 0;
                                    const wc = (n: number) => n >= 50 ? 'bg-red-700' : n >= 30 ? 'bg-orange-600' : n >= 15 ? 'bg-yellow-500' : 'bg-green-600';
                                    return (
                                      <div key={`${kpi.person_name}-${kpi.kpi_number}`} className="bg-gray-700 p-3 rounded-md border border-gray-600">
                                        <p className="font-medium text-lg text-white mb-1">
                                          <span className="text-gray-400 text-sm font-mono mr-2">KPI {kpi.kpi_number}</span>{kpi.kpi_name}
                                          <span className="text-sm text-gray-400 ml-2">({kpi.measurement_source})</span>
                                        </p>
                                        <p className="text-sm text-gray-300 mb-2">{kpi.kpi_description}</p>
                                        {w > 0 && (
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className="w-20 text-sm text-gray-300">Weight:</div>
                                            <div className="w-full bg-gray-600 rounded-full h-2.5 overflow-hidden"><div className={`h-2.5 rounded-full ${wc(w)}`} style={{ width: `${w}%` }}></div></div>
                                            <span className="text-sm text-white font-mono w-10">{w}%</span>
                                          </div>
                                        )}
                                        {kpi.target_value && <p className="text-sm text-amber-400">Target: {kpi.target_value}</p>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (person.active_status === 'active' || !person.active_status) && (person.employment_type === 'W2 Salaried' || person.employment_type === 'W2 Hourly') ? (
                              <div className="p-3 rounded-lg bg-amber-900/30 border border-amber-700">
                                <p className="text-amber-400 text-sm font-medium">⚠️ No role-specific KPIs assigned yet</p>
                              </div>
                            ) : null}

                            {/* Raw Data */}
                            {person.raw_data && Object.keys(person.raw_data).length > 0 && (
                              <div>
                                <h4 className="font-semibold text-teal-300 mb-3">Raw Data Metrics</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  {Object.entries(person.raw_data).filter(([, v]) => typeof v === 'number' && v !== 0).map(([k, v]) => (
                                    <p key={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: <span className="font-medium text-white">{(v as number).toLocaleString()}</span></p>
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
