import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/supabase'
import { Plus } from 'lucide-react'

export default async function ProjectsPage() {
  const [{ data: projects }, { data: expenses }] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('expenses').select('project_id, amount'),
  ])

  const expByProject = (expenses ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.project_id] = (acc[e.project_id] ?? 0) + Number(e.amount)
    return acc
  }, {})

  const rows = (projects ?? []).map(p => ({
    ...p,
    expenses: expByProject[p.id] ?? 0,
    gp: Number(p.quoted_price) - (expByProject[p.id] ?? 0),
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} projects total</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project / Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contract</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expenses</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">GP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No projects yet. <Link href="/projects/new" className="text-blue-600 hover:underline">Create one</Link>
                  </td>
                </tr>
              ) : rows.map(p => (
                <tr key={p.id} className="hover:bg-blue-50/40 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="block">
                      <span className="font-mono font-bold text-blue-700 text-sm">{p.project_id ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="block">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      {p.pm && <span className="text-xs text-gray-400 block">PM: {p.pm}</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <Link href={`/projects/${p.id}`} className="block">{p.client}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <Link href={`/projects/${p.id}`} className="block">{p.job_type ?? '—'}</Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/projects/${p.id}`} className="block">
                      {p.quoted_price > 0
                        ? <span className="font-semibold text-gray-900">${Number(p.quoted_price).toLocaleString()}</span>
                        : <span className="text-amber-500 text-xs font-medium">No contract</span>
                      }
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    <Link href={`/projects/${p.id}`} className="block">
                      {p.expenses > 0 ? `$${p.expenses.toLocaleString()}` : <span className="text-gray-300">—</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/projects/${p.id}`} className="block">
                      {p.quoted_price > 0
                        ? <span className={`font-semibold ${p.gp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${p.gp.toLocaleString()}
                          </span>
                        : <span className="text-gray-300">—</span>
                      }
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/projects/${p.id}`} className="block">
                      {p.priority ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.priority === 'High' ? 'bg-red-100 text-red-700' :
                          p.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{p.priority}</span>
                      ) : '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/projects/${p.id}`} className="block">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
