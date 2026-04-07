import { supabase } from '@/lib/supabase'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const [{ data: projects }, { data: expenses }, { data: invoices }] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('expenses').select('project_id, amount'),
    supabase.from('invoices').select('project_id, amount, status'),
  ])

  return (
    <DashboardClient
      projects={projects ?? []}
      expenses={expenses ?? []}
      invoices={invoices ?? []}
    />
  )
}
