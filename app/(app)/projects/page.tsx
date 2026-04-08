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
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} projects total</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-20">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Project</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Contract</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Costs</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">GP</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-gray-400 text-sm">
                    No projects yet. <Link href="/projects/new" className="text-blue-600 hover:underline">Create one</Link>
                  </td>
                </tr>
              ) : rows.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/projects/${p.id}`} className="block">
                      <span className="font-mono font-bold text-blue-600 text-xs">{p.project_id ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/projects/${p.id}`} className="block">
                      <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{p.name}</span>
                      {p.pm && <span className="text-xs text-gray-400 block mt-0.5">PM: {p.pm}</span>}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    <Link href={`/projects/${p.id}`} className="block">{p.client}</Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    <Link href={`/projects/${p.id}`} className="block">{p.job_type ?? '—'}</Link>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/projects/${p.id}`} className="block">
                      {p.quoted_price > 0
                        ? <span className="font-semibold text-gray-900">${Number(p.quoted_price).toLocaleString()}</span>
                        : <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">No contract</span>
                      }
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-500">
                    <Link href={`/projects/${p.id}`} className="block">
                      {p.expenses > 0 ? `$${p.expenses.toLocaleString()}` : <span className="text-gray-300">—</span>}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/projects/${p.id}`} className="block">
                      {p.quoted_price > 0
                        ? <span className={`font-semibold ${p.gp >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            ${p.gp.toLocaleString()}
                          </span>
                        : <span className="text-gray-300">—</span>
                      }
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Link href={`/projects/${p.id}`} className="block">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
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
