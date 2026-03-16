# Department Performance & OKR Platform — Build Brief

## Project Overview
Build a Next.js 14 + Supabase + Vercel app for USDM Life Sciences department leaders to:
1. View their department's maturity scores across 8 dimensions (L1-L5)
2. Set and track quarterly OKRs tied to improvement priorities
3. Submit weekly check-ins on key results
4. See historical trends (quarterly cadence, backfilled for 2025)

Kevin Brown (CEO) gets a portfolio view of ALL departments. Department leaders see only their own.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui components
- **Database:** Existing Supabase project (bolt-on, NOT new project)
- **Auth:** Supabase Auth with magic link email login
- **Deployment:** Vercel
- **Brand colors (USDM):**
  - Primary: #10193C (navy), #64C4DD (teal), #F3CF4F (gold)
  - Secondary: #212E5E (dark blue), #2769B4 (medium blue), #B8E4EF (light teal), #E79E27 (orange), #F9E9AE (light yellow), #FFFFFF (white)

## Supabase Connection (EXISTING PROJECT — same as signal dashboard, campaign OS, etc.)
- URL: https://iwwskglpxjmkdnaxdqyl.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3d3NrZ2xweGpta2RuYXhkcXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTMzNzUsImV4cCI6MjA4ODU2OTM3NX0.3S5r0BhIzA0I2vQ81q03lSrV_71VHleZQ-fwfzkyNuk
- Service Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3d3NrZ2xweGpta2RuYXhkcXlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk5MzM3NSwiZXhwIjoyMDg4NTY5Mzc1fQ.QiDu8aIb_PLDcSnT6PPBC8JexzrWjAvL4W6EIO_u46w

## Database Schema (CREATE IN SUPABASE via service key)

### Tables to create:

```sql
-- 1. Departments
CREATE TABLE IF NOT EXISTS dept_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_type TEXT NOT NULL, -- Delivery, Sales/Growth, Marketing, IT, HR Admin, Finance, Staffing/TA, Quality, RMO
  leader_name TEXT,
  leader_email TEXT,
  leader_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assessment Cycles (quarters)
CREATE TABLE IF NOT EXISTS dept_assessment_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g. "Q1 2025", "Q4 2025", "Q1 2026"
  quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year INT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  starts_at DATE,
  ends_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dimension Scores (8 dimensions × department × cycle)
CREATE TABLE IF NOT EXISTS dept_dimension_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES dept_departments(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES dept_assessment_cycles(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL, -- One of the 8 maturity dimensions
  score NUMERIC(2,1) CHECK (score >= 1 AND score <= 5), -- 1.0 to 5.0
  evidence TEXT, -- What justifies this score
  assessor TEXT DEFAULT 'self', -- 'self' or 'executive'
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, cycle_id, dimension, assessor)
);

-- 4. OKRs
CREATE TABLE IF NOT EXISTS dept_okrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES dept_departments(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES dept_assessment_cycles(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  owner_name TEXT,
  priority INT DEFAULT 1, -- 1 = highest
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind', 'achieved', 'cancelled')),
  linked_dimension TEXT, -- Which maturity dimension this OKR improves
  revenue_impact TEXT CHECK (revenue_impact IN ('direct', 'indirect', 'operational')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Key Results
CREATE TABLE IF NOT EXISTS dept_key_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  okr_id UUID REFERENCES dept_okrs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  metric_type TEXT DEFAULT 'percentage' CHECK (metric_type IN ('percentage', 'number', 'currency', 'boolean', 'milestone')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- e.g. '%', '$', 'count'
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'on_track', 'at_risk', 'behind', 'achieved')),
  owner_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Check-ins (weekly KR updates)
CREATE TABLE IF NOT EXISTS dept_check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_result_id UUID REFERENCES dept_key_results(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  notes TEXT,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  blockers TEXT,
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE dept_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dept_assessment_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dept_dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE dept_okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dept_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE dept_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read cycles
CREATE POLICY "Anyone can read cycles" ON dept_assessment_cycles FOR SELECT USING (true);

-- Department leaders see only their department
CREATE POLICY "Leaders see own department" ON dept_departments FOR SELECT USING (
  leader_user_id = auth.uid() OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email IN ('kbrown@usdm.com'))
);

-- Scores: leaders see own, Kevin sees all
CREATE POLICY "Leaders see own scores" ON dept_dimension_scores FOR SELECT USING (
  department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid()) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
CREATE POLICY "Leaders can insert own scores" ON dept_dimension_scores FOR INSERT WITH CHECK (
  department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid()) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
CREATE POLICY "Leaders can update own scores" ON dept_dimension_scores FOR UPDATE USING (
  department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid()) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);

-- OKRs: same pattern
CREATE POLICY "Leaders see own OKRs" ON dept_okrs FOR SELECT USING (
  department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid()) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
CREATE POLICY "Leaders manage own OKRs" ON dept_okrs FOR INSERT WITH CHECK (
  department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid()) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
CREATE POLICY "Leaders update own OKRs" ON dept_okrs FOR UPDATE USING (
  department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid()) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);

-- Key Results: same pattern via OKR parent
CREATE POLICY "Leaders see own KRs" ON dept_key_results FOR SELECT USING (
  okr_id IN (SELECT id FROM dept_okrs WHERE department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid())) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
CREATE POLICY "Leaders manage own KRs" ON dept_key_results FOR INSERT WITH CHECK (
  okr_id IN (SELECT id FROM dept_okrs WHERE department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid())) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
CREATE POLICY "Leaders update own KRs" ON dept_key_results FOR UPDATE USING (
  okr_id IN (SELECT id FROM dept_okrs WHERE department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid())) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);

-- Check-ins: same via KR parent
CREATE POLICY "Leaders see own check-ins" ON dept_check_ins FOR SELECT USING (
  key_result_id IN (SELECT kr.id FROM dept_key_results kr JOIN dept_okrs o ON kr.okr_id = o.id WHERE o.department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid())) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
CREATE POLICY "Leaders submit check-ins" ON dept_check_ins FOR INSERT WITH CHECK (
  key_result_id IN (SELECT kr.id FROM dept_key_results kr JOIN dept_okrs o ON kr.okr_id = o.id WHERE o.department_id IN (SELECT id FROM dept_departments WHERE leader_user_id = auth.uid())) OR
  auth.uid() IN (SELECT leader_user_id FROM dept_departments WHERE leader_email = 'kbrown@usdm.com')
);
```

### Seed Data — USDM Departments:
```sql
INSERT INTO dept_departments (name, department_type, leader_name, leader_email) VALUES
('Delivery Operations', 'Delivery', NULL, NULL),
('Sales & Growth', 'Sales/Growth', NULL, NULL),
('Marketing', 'Marketing', 'Monica Ruck', 'mruck@usdm.com'),
('IT / Infrastructure', 'IT', 'Jim Murray', 'jmurray@usdm.com'),
('HR Administration', 'HR Admin', NULL, NULL),
('Finance & Accounting', 'Finance', 'Adam', NULL),
('Staffing / Talent Acquisition', 'Staffing/TA', 'Joe Morgan', NULL),
('Quality & Compliance', 'Quality', NULL, NULL),
('Resource Management Office', 'RMO', NULL, NULL),
('Partnerships', 'Sales/Growth', 'Kim Guihen', 'kguihen@usdm.com');

-- Seed assessment cycles for 2025 and Q1 2026
INSERT INTO dept_assessment_cycles (name, quarter, year, status, starts_at, ends_at) VALUES
('Q1 2025', 1, 2025, 'closed', '2025-01-01', '2025-03-31'),
('Q2 2025', 2, 2025, 'closed', '2025-04-01', '2025-06-30'),
('Q3 2025', 3, 2025, 'closed', '2025-07-01', '2025-09-30'),
('Q4 2025', 4, 2025, 'closed', '2025-10-01', '2025-12-31'),
('Q1 2026', 1, 2026, 'active', '2026-01-01', '2026-03-31');
```

## The 8 Maturity Dimensions (from Confluence HRPERF model)
1. **HR & People Maturity** — talent management, retention, development, succession, engagement
2. **Process Maturity** — standardization, documentation, repeatability, quality controls
3. **Systems & Technology Maturity** — tool adoption, integration, data architecture
4. **AI & Intelligent Automation** — AI adoption, decision support, autonomous processes
5. **Scalability & Growth Readiness** — scale without proportional headcount growth
6. **Data & Analytics Maturity** — data quality, reporting, insights, decision support
7. **Innovation & Continuous Improvement** — experimentation culture, improvement velocity
8. **Governance & Compliance** — risk management, regulatory adherence, audit readiness

Scoring guide:
- L1 (1.0) = Ad Hoc / Absent — Red
- L2 (2.0) = Developing / Reactive — Red
- L3 (3.0) = Defined / Standardized — Amber
- L4 (4.0) = Managed / Proactive — Green
- L5 (5.0) = Optimizing / Leading — Blue

## Pages to Build

### 1. Login Page (`/login`)
- Magic link email login via Supabase Auth
- USDM branded (navy background, teal accents)
- Simple: email input + "Send Magic Link" button

### 2. Dashboard Home (`/`)
- **For Kevin (admin):** Portfolio heatmap — ALL departments × 8 dimensions, color-coded L1-L5
  - Trend arrows (↑↓→) comparing to previous quarter
  - Priority ranker sidebar: top 5 improvement opportunities by P&L impact weight
  - Regression alerts: any dimension that dropped
- **For department leaders:** Their department's scorecard
  - 8 dimension radar/spider chart with current scores
  - Quarter-over-quarter trend line
  - Current OKRs with progress bars
  - "Submit Check-in" quick action

### 3. Assessment Page (`/assess`)
- Score entry form for current active cycle
- Each of the 8 dimensions:
  - Score slider/selector (1.0 to 5.0 in 0.5 increments)
  - Evidence text area (what justifies this score)
  - Comments
- Self-assessment first, then executive review layer
- Save draft / Submit final

### 4. OKRs Page (`/okrs`)
- Create/edit objectives for current quarter
- Each OKR links to a maturity dimension
- Tag as direct/indirect/operational revenue impact
- Add key results with measurable targets
- Priority ordering (drag or number)

### 5. Check-in Page (`/check-in`)
- Weekly update form for each active key result
- Current value entry
- Confidence level (high/medium/low traffic light)
- Blockers text
- Auto-calculates progress percentage

### 6. History Page (`/history`)
- Quarter selector dropdown
- Side-by-side comparison (any two quarters)
- Dimension score trends over time (line chart)
- OKR completion rates by quarter

### 7. Admin Page (`/admin`) — Kevin only
- Manage departments (add/edit/assign leaders)
- Manage assessment cycles (create new quarter, close old)
- Backfill 2025 scores
- User management

## Design Requirements
- **Executive views:** Bloomberg terminal energy — dark navy (#10193C) backgrounds, teal data, gold highlights
- **Department leader views:** Clean, light, professional. White backgrounds, navy text, teal accents
- **Mobile responsive** — leaders should be able to submit check-ins from their phone
- **Heatmap colors:** L1-2 = Red (#DC2626), L3 = Amber/Yellow (#F3CF4F), L4 = Green (#22C55E), L5 = Blue (#64C4DD)
- Use shadcn/ui components throughout (Card, Table, Dialog, Tabs, etc.)
- Charts: use recharts library (already common in our stack)

## Key Features
1. **Regression Detection** — Auto-flag any dimension that scored LOWER than previous quarter. Show as red warning badge on heatmap.
2. **Priority Ranker** — Weight dimensions by revenue impact:
   - Direct revenue dimensions (Process, Scalability for Delivery; full pipeline for Sales) = 3x weight
   - Indirect revenue (Systems, AI, Data) = 2x weight
   - Operational (HR, Governance, Innovation) = 1x weight
   Stack-rank all departments × dimensions by weighted gap-to-target
3. **OKR Health Score** — Each OKR gets auto-calculated health: % of KRs on track × confidence weighting
4. **Quarterly Comparison** — Side-by-side any two quarters with delta highlighting

## Deployment
- GitHub repo: create under kbrown10000 org
- Vercel project: dept-perf-okr
- Domain: dept-perf.vercel.app (or similar)

## IMPORTANT IMPLEMENTATION NOTES
1. Run the SQL schema against Supabase using the service key (curl to Supabase REST SQL endpoint or use supabase client)
2. Create .env.local with the Supabase credentials
3. Use `npx create-next-app@latest` with TypeScript + Tailwind
4. Install: @supabase/supabase-js @supabase/ssr recharts shadcn/ui
5. Implement Supabase Auth with magic links
6. Build all pages with proper RLS-aware queries
7. Make it production-ready, not a prototype — real error handling, loading states, responsive design
8. Use USDM brand colors throughout

When completely finished, run this command to notify me:
openclaw system event --text "Done: Department Performance & OKR Platform built — schema deployed, all pages working, ready for Vercel deploy" --mode now
