import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Project = {
  id: string
  project_id: string | null
  name: string
  client: string
  pm: string | null
  job_type: string | null
  owner: string | null
  priority: 'High' | 'Medium' | 'Low' | null
  status: 'active' | 'waiting-approval' | 'quoting' | 'on-hold' | 'completed' | 'cancelled' | 'archived'
  quoted_price: number
  budget_cost: number | null
  start_date: string
  end_date: string
  description: string | null
  next_action: string | null
  next_action_due: string | null
  created_at: string
}

export type Expense = {
  id: string
  project_id: string
  vendor: string
  amount: number
  date: string
  price_code: string
  description: string
  receipt_url: string | null
  created_at: string
}

export type Invoice = {
  id: string
  project_id: string
  invoice_number: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issued_date: string
  due_date: string
  created_at: string
}

export type Task = {
  id: string
  project_id: string
  name: string
  start_date: string
  end_date: string
  status: 'not-started' | 'in-progress' | 'completed'
  assignee: string
  created_at: string
}

export type QuoteItem = {
  id: string
  project_id: string
  name: string
  quantity: number
  unit_price: number
  type: 'material' | 'labour'
  created_at: string
}

export type LabourEntry = {
  id: string
  project_id: string
  worker_name: string
  date: string
  type: 'hourly' | 'flat'
  hours: number | null
  rate: number | null
  amount: number
  notes: string | null
  created_at: string
}

export type Employee = {
  id: string
  name: string
  hourly_rate: number
  phone: string | null
  email: string | null
  active: boolean
  created_at: string
}

export type Timesheet = {
  id: string
  employee_id: string
  project_id: string | null
  location_other: string | null
  week_ending: string
  hours: number
  cost: number
  notes: string | null
  created_at: string
}

export type ProjectNote = {
  id: string
  project_id: string
  content: string | null
  author: string
  photo_url: string | null
  created_at: string
}

export type CostCode = {
  code: string
  label: string
  category: string
}

export const COST_CODES: CostCode[] = [
  // Labour
  { code: '9-01.001', label: 'Cabling - Data', category: 'Labour' },
  { code: '9-01.002', label: 'Cabling - Security', category: 'Labour' },
  { code: '9-01.003', label: 'Cabling - Access Control', category: 'Labour' },
  { code: '9-01.004', label: 'Commissioning - CCTV', category: 'Labour' },
  { code: '9-01.005', label: 'Commissioning - Smart Automation', category: 'Labour' },
  { code: '9-01.007', label: 'Commissioning - Access Control', category: 'Labour' },
  { code: '9-01.008', label: 'Conduit / Tray Installation', category: 'Labour' },
  // Materials - CCTV
  { code: '9-02.001', label: 'Cameras (IP/Analogue)', category: 'Materials - CCTV' },
  { code: '9-02.002', label: 'NVRs / Licensing', category: 'Materials - CCTV' },
  { code: '9-02.004', label: 'CCTV Power Supplies', category: 'Materials - CCTV' },
  // Materials - Access Control
  { code: '9-03.001', label: 'Door Controllers / Racks', category: 'Materials - Access Control' },
  { code: '9-03.002', label: 'Access Control Readers / Keypads', category: 'Materials - Access Control' },
  { code: '9-03.003', label: 'Maglocks', category: 'Materials - Access Control' },
  { code: '9-03.004', label: 'Strikes / Gate Kits', category: 'Materials - Access Control' },
  // Materials - Intercom
  { code: '9-04.001', label: 'Intercom Room Stations', category: 'Materials - Intercom' },
  { code: '9-04.002', label: 'Intercom Door Stations', category: 'Materials - Intercom' },
  // Materials - Data
  { code: '9-06.001', label: 'Cat6 / Cat6A Cable', category: 'Materials - Data' },
  { code: '9-06.002', label: 'Fibre Trunk Cable', category: 'Materials - Data' },
  { code: '9-06.004', label: 'Patch Panels / Outlets', category: 'Materials - Data' },
  { code: '9-06.005', label: 'Accessories', category: 'Materials - Data' },
  // Equipment
  { code: '9-07.004', label: 'Tools & Consumables', category: 'Equipment' },
  { code: '9-07.006', label: 'Scissor Lift / Boom Lift Hire', category: 'Equipment' },
  { code: '9-07.007', label: 'Equipment Hire (General)', category: 'Equipment' },
  // Subcontractors
  { code: '9-08.001', label: 'Subcontract - Data', category: 'Subcontractors' },
  { code: '9-08.002', label: 'Subcontract - CCTV', category: 'Subcontractors' },
  { code: '9-08.003', label: 'Subcontract - Access Control', category: 'Subcontractors' },
  { code: '9-08.006', label: 'Subcontract - Electricians', category: 'Subcontractors' },
  // Project Costs
  { code: '9-09.001', label: 'Design & Drawings', category: 'Project Costs' },
  { code: '9-09.005', label: 'Testing & Certification', category: 'Project Costs' },
  { code: '9-09.006', label: 'Programming / Remote Works', category: 'Project Costs' },
  // Operations
  { code: '9-10.001', label: 'Office Supplies', category: 'Operations' },
  { code: '9-10.002', label: 'Subscriptions / Licences', category: 'Operations' },
  { code: '9-10.003', label: 'Insurances', category: 'Operations' },
  { code: '9-10.004', label: 'Travel / Accommodation', category: 'Operations' },
  { code: '9-10.005', label: 'Legal Fees', category: 'Operations' },
  // Security Material
  { code: '9-12.001', label: 'Alarms', category: 'Security Material' },
]

export function getCostCodeLabel(code: string): string {
  return COST_CODES.find(c => c.code === code)?.label ?? code
}

export const JOB_TYPES = ['New Build', 'Service', 'Upgrade', 'Maintenance', 'Consultation', 'Add-on', 'Automation', 'Gate / Intercom', 'Home Intercom', 'Smart Home', 'Retirement Village', 'Building Site CCTV', 'Fix']

export const STATUS_LABELS: Record<string, string> = {
  'active': 'Active',
  'waiting-approval': 'Waiting Approval',
  'quoting': 'Quoting',
  'on-hold': 'On Hold',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'archived': 'Archived',
}

export const STATUS_COLORS: Record<string, string> = {
  'active': 'bg-green-100 text-green-700',
  'waiting-approval': 'bg-blue-100 text-blue-700',
  'quoting': 'bg-purple-100 text-purple-700',
  'on-hold': 'bg-amber-100 text-amber-700',
  'completed': 'bg-gray-100 text-gray-600',
  'cancelled': 'bg-red-100 text-red-500',
  'archived': 'bg-slate-100 text-slate-500',
}

export function getProjectHealth(project: Project): 'on-track' | 'action-overdue' | 'needs-contract' {
  if (!project.quoted_price || Number(project.quoted_price) === 0) return 'needs-contract'
  if (project.next_action_due && new Date(project.next_action_due) < new Date()) return 'action-overdue'
  return 'on-track'
}

export function projectLabel(p: { project_id?: string | null; name: string }) {
  return p.project_id ? `${p.project_id} – ${p.name}` : p.name
}
