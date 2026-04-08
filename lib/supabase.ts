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
  'MATERIALS',
  'LABOUR',
  'SUBCONTRACT',
  'EQUIPMENT',
  'TRANSPORT',
  'OFFICE SUPPLIES',
  'OTHER',
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
