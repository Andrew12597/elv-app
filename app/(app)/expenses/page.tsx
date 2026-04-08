import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ExpensesClient } from './expenses-client'

export default async function ExpensesPage() {
  const [{ data: expenses }, { data: projects }] = await Promise.all([
    supabase.from('expenses').select('*, projects(id, project_id, name)').order('date', { ascending: false }),
    supabase.from('projects').select('id, project_id, name').order('project_id'),
  ])

  const expenseRows = (expenses ?? []).map(e => {
    const proj = (e as any).projects
    const projectLabel = proj
      ? proj.project_id ? `${proj.project_id} – ${proj.name}` : proj.name
      : 'Unassigned'
    return {
      id: e.id,
      vendor: e.vendor,
      amount: Number(e.amount),
      date: e.date,
      price_code: e.price_code,
      description: e.description ?? '',
      receipt_url: e.receipt_url ?? null,
      project_id: e.project_id,
      project_label: projectLabel,
    }
  })

  const projectOptions = (projects ?? []).map(p => ({
    id: p.id,
    label: p.project_id ? `${p.project_id} – ${p.name}` : p.name,
  }))

  const total = expenseRows.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {expenseRows.length} expenses · ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </Link>
      </div>

      <ExpensesClient expenses={expenseRows} projects={projectOptions} />
    </div>
  )
}
