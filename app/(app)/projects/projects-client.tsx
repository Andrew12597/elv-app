'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/supabase'

type ProjectRow = {
  id: string
  project_id: string | null
  name: string
  client: string
  pm: string | null
  job_type: string | null
  priority: string | null
  status: string
  quoted_price: number
  expenses: number
  gp: number
}

type Props = { rows: ProjectRow[] }

const STATUSES = ['active', 'quoting', 'waiting-approval', 'on-hold', 'completed', 'cancelled', 'archived']

const statusDotColor: Record<string, string> = {
  active: 'bg-green-400', quoting: 'bg-purple-400',
  'waiting-approval': 'bg-blue-400', 'on-hold': 'bg-amber-400',
  completed: 'bg-gray-400', cancelled: 'bg-red-400', archived: 'bg-slate-400',
}

export function ProjectsClient({ rows }: Props) {
  const [search, setSearch] = useState('')
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set())

  function toggleStatus(s: string) {
    setActiveStatuses(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  const filtered = useMemo(() => rows.filter(p => {
    if (activeStatuses.size > 0 && !activeStatuses.has(p.status)) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) ||
        (p.project_id ?? '').toLowerCase().includes(q) || (p.job_type ?? '').toLowerCase().includes(q)
    }
    return true
  }), [rows, search, activeStatuses])

  const clearAll = () => { setActiveStatuses(new Set()); setSearch('') }
  const hasFilters = search || activeStatuses.size > 0

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {hasFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-2 border border-gray-200 bg-white rounded-lg">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => {
            const on = activeStatuses.has(s)
            const count = rows.filter(p => p.status === s).length
            if (count === 0) return null
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  on ? `${STATUS_COLORS[s]} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${on ? '' : statusDotColor[s]}`} />
                {STATUS_LABELS[s]} ({count})
              </button>
            )
          })}
          <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} of {rows.length}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center text-gray-400 text-sm">
          No projects match your filters.{' '}
          <button onClick={clearAll} className="text-blue-600 hover:underline">Clear</button>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {filtered.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 active:bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {p.project_id && <span className="font-mono font-bold text-blue-600 text-xs shrink-0">{p.project_id}</span>}
                      <span className="font-semibold text-gray-900 text-sm truncate">{p.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{p.client}{p.job_type ? ` · ${p.job_type}` : ''}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  {p.quoted_price > 0 ? (
                    <>
                      <span className="text-gray-500">Contract <span className="font-semibold text-gray-900">${p.quoted_price.toLocaleString()}</span></span>
                      <span className="text-gray-500">GP <span className={`font-semibold ${p.gp >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>${p.gp.toLocaleString()}</span></span>
                    </>
                  ) : (
                    <span className="text-amber-500 font-medium">No contract</span>
                  )}
                  {p.expenses > 0 && <span className="text-gray-400">Costs ${p.expenses.toLocaleString()}</span>}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5"><Link href={`/projects/${p.id}`} className="block"><span className="font-mono font-bold text-blue-600 text-xs">{p.project_id ?? '—'}</span></Link></td>
                      <td className="px-5 py-3.5"><Link href={`/projects/${p.id}`} className="block"><span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{p.name}</span>{p.pm && <span className="text-xs text-gray-400 block mt-0.5">PM: {p.pm}</span>}</Link></td>
                      <td className="px-5 py-3.5 text-gray-500"><Link href={`/projects/${p.id}`} className="block">{p.client}</Link></td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs"><Link href={`/projects/${p.id}`} className="block">{p.job_type ?? '—'}</Link></td>
                      <td className="px-5 py-3.5 text-right"><Link href={`/projects/${p.id}`} className="block">{p.quoted_price > 0 ? <span className="font-semibold text-gray-900">${p.quoted_price.toLocaleString()}</span> : <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">No contract</span>}</Link></td>
                      <td className="px-5 py-3.5 text-right text-gray-500"><Link href={`/projects/${p.id}`} className="block">{p.expenses > 0 ? `$${p.expenses.toLocaleString()}` : <span className="text-gray-300">—</span>}</Link></td>
                      <td className="px-5 py-3.5 text-right"><Link href={`/projects/${p.id}`} className="block">{p.quoted_price > 0 ? <span className={`font-semibold ${p.gp >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>${p.gp.toLocaleString()}</span> : <span className="text-gray-300">—</span>}</Link></td>
                      <td className="px-5 py-3.5 text-center"><Link href={`/projects/${p.id}`} className="block"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[p.status] ?? p.status}</span></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
