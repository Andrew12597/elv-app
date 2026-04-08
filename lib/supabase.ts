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
  status: 'active' | 'waiting-approval' | 'quoting' | 'on-hold' | 'completed' | 'cancelled'
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

export const COST_CODES = [
  // Labour
  '9-01.001 Cabling - Data',
  '9-01.002 Cabling - Security',
  '9-01.003 Cabling - Access Control',
  '9-01.004 Commissioning - CCTV',
  '9-01.005 Commissioning - Smart Automation',
  '9-01.007 Commissioning - Access Control',
  '9-01.008 Conduit / Tray Installation',
  // Materials - CCTV
  '9-02.001 Cameras (IP/Analogue)',
  '9-02.002 NVRs / Licensing',
  '9-02.004 CCTV Power Supplies',
  // Materials - Access Control
  '9-03.001 Door Controllers / Racks',
  '9-03.002 Access Control Readers / Keypads',
  '9-03.003 Maglocks',
  '9-03.004 Strikes / Gate Kits',
  // Materials - Intercom
  '9-04.001 Intercom Room Stations',
  '9-04.002 Intercom Door Stations',
  // Materials - Data
  '9-06.001 Cat6 / Cat6A Cable',
  '9-06.002 Fibre Trunk Cable',
  '9-06.004 Patch Panels / Outlets',
  '9-06.005 Accessories',
  // Equipment
  '9-07.004 Tools & Consumables',
  '9-07.006 Scissor Lift / Boom Lift Hire',
  '9-07.007 Equipment Hire (General)',
  // Subcontractors
  '9-08.001 Subcontract - Data',
  '9-08.002 Subcontract - CCTV',
  '9-08.003 Subcontract - Access Control',
  '9-08.006 Subcontract - Electricians',
  // Project Costs
  '9-09.001 Design & Drawings',
  '9-09.005 Testing & Certification',
  '9-09.006 Programming / Remote Works',
  // Operations
  '9-10.001 Office Supplies',
  '9-10.002 Subscriptions / Licences',
  '9-10.003 Insurances',
  '9-10.004 Travel / Accommodation',
  '9-10.005 Legal Fees',
  // Security Material
  '9-12.001 Alarms',
]

export const JOB_TYPES = ['New Build', 'Service', 'Upgrade', 'Maintenance', 'Consultation']

export const STATUS_LABELS: Record<string, string> = {
  'active': 'Active',
  'waiting-approval': 'Waiting Approval',
  'quoting': 'Quoting',
  'on-hold': 'On Hold',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
}

export function getProjectHealth(project: Project, totalExpenses: number): string {
  if (project.status !== 'active') return project.status
  if (!project.quoted_price || project.quoted_price === 0) return 'needs-contract'
  if (project.next_action_due && new Date(project.next_action_due) < new Date()) return 'action-overdue'
  return 'on-track'
}
