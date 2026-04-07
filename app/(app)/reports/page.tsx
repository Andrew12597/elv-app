import { supabase } from '@/lib/supabase'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const [{ data: projects }, { data: expenses }, { data: invoices }] = await Promise.all([
    supabase.from('projects').select('*'),
    supabase.from('expenses').select('project_id, amount, price_code, date'),
    supabase.from('invoices').select('project_id, amount, status'),
  ])

  return (
    <ReportsClient
      projects={projects ?? []}
      expenses={expenses ?? []}
      invoices={invoices ?? []}
    />
  )
}
