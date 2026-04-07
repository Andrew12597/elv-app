import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Project = {
  id: string
  name: string
  client: string
  status: 'active' | 'completed' | 'on-hold' | 'cancelled'
  quoted_price: number
  start_date: string
  end_date: string
  description: string
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
