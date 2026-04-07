import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ExpensesPage() {
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, projects(name)')
    .order('date', { ascending: false })

  const total = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">{expenses?.length ?? 0} expenses · Total ${total.toLocaleString()}</p>
        </div>
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Scan Receipt
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {!expenses?.length ? (
          <div className="py-16 text-center text-gray-400">
            <p>No expenses yet</p>
            <Link href="/expenses/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Add your first expense</Link>
          </div>
        ) : (
          expenses.map(exp => (
            <div key={exp.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{exp.vendor}</p>
                <p className="text-xs text-gray-500 truncate">
                  {(exp as any).projects?.name} · {exp.description}
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono hidden sm:block">{exp.price_code}</span>
              <span className="text-xs text-gray-400 hidden sm:block">{exp.date}</span>
              <p className="font-semibold text-gray-900">${Number(exp.amount).toLocaleString()}</p>
              {exp.receipt_url && (
                <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  Receipt
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
