'use client'

import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DollarSign, AlertTriangle, CheckCircle, FolderKanban, Clock, TrendingUp, ArrowUpRight, Plus } from 'lucide-react'
import type { Project } from '@/lib/supabase'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/supabase'

type Props = {
  projects: Project[]
  expenses: { project_id: string; amount: number }[]
  invoices: { project_id: string; amount: number; status: string }[]
}

function getHealth(project: Project): 'on-track' | 'action-overdue' | 'needs-contract' {
  if (!project.quoted_price || Number(project.quoted_price) === 0) return 'needs-contract'
  if (project.next_action_due && new Date(project.next_action_due) < new Date()) return 'action-overdue'
  return 'on-track'
}

const healthConfig = {
  'on-track': { label: 'On Track', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'action-overdue': { label: 'Overdue', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  'needs-contract': { label: 'No Contract', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
}

export function DashboardClient({ projects, expenses, invoices }: Props) {
  const expByProject = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.project_id] = (acc[e.project_id] ?? 0) + Number(e.amount)
    return acc
  }, {})

  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const invoicedTotal = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const costsTotal = expenses.reduce((s, e) => s + Number(e.amount), 0)

  const activeProjects = projects.filter(p => p.status === 'active')
  const activeContractValue = activeProjects.reduce((s, p) => s + Number(p.quoted_price), 0)
  const collectionRate = invoicedTotal > 0 ? (paidTotal / invoicedTotal) * 100 : 0
  const needsContract = activeProjects.filter(p => !p.quoted_price || Number(p.quoted_price) === 0).length
  const actionOverdue = activeProjects.filter(p => p.next_action_due && new Date(p.next_action_due) < new Date()).length

  const withHealth = activeProjects.map(p => ({
    ...p,
    costs: expByProject[p.id] ?? 0,
    gp: Number(p.quoted_price) - (expByProject[p.id] ?? 0),
    health: getHealth(p),
  }))

  const chartData = withHealth.slice(0, 10).map(p => ({
    name: p.project_id ?? p.name.slice(0, 6),
    contract: Number(p.quoted_price),
    costs: p.costs,
    health: p.health,
  }))

  const fmt = (n: number) => `$${n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n}`

  const kpis = [
    {
      label: 'Active Projects',
      value: activeProjects.length,
      sub: `${projects.length} total`,
      icon: FolderKanban,
      accent: 'bg-blue-500',
      light: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Contract Value',
      value: `$${activeContractValue.toLocaleString()}`,
      sub: 'active projects',
      icon: DollarSign,
      accent: 'bg-violet-500',
      light: 'bg-violet-50',
      text: 'text-violet-600',
    },
    {
      label: 'Costs to Date',
      value: `$${costsTotal.toLocaleString()}`,
      sub: `GP $${(activeContractValue - costsTotal).toLocaleString()}`,
      icon: TrendingUp,
      accent: 'bg-orange-500',
      light: 'bg-orange-50',
      text: 'text-orange-600',
    },
    {
      label: 'Collected',
      value: `$${paidTotal.toLocaleString()}`,
      sub: `${collectionRate.toFixed(0)}% collection rate`,
      icon: CheckCircle,
      accent: 'bg-emerald-500',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">ELV Australia</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Project</span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`${k.light} p-2 rounded-xl`}>
                <k.icon className={`h-4 w-4 ${k.text}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{k.value}</p>
            <p className="text-xs text-gray-400 font-medium">{k.label}</p>
            {k.sub && <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Alerts row */}
      {(needsContract > 0 || actionOverdue > 0) && (
        <div className="flex gap-3">
          {actionOverdue > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex-1">
              <div className="bg-red-100 rounded-lg p-1.5">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">{actionOverdue} action{actionOverdue > 1 ? 's' : ''} overdue</p>
                <p className="text-xs text-red-500">Next actions past due date</p>
              </div>
            </div>
          )}
          {needsContract > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex-1">
              <div className="bg-amber-100 rounded-lg p-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-700">{needsContract} project{needsContract > 1 ? 's' : ''} without contract</p>
                <p className="text-xs text-amber-500">No quoted price set</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        {/* Chart */}
        {chartData.length > 0 && (
          <div className="col-span-5 lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contract vs Costs</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barGap={2} barSize={14}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  formatter={(v) => `$${Number(v).toLocaleString()}`}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Bar dataKey="contract" name="Contract" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
                <Bar dataKey="costs" name="Costs" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.health === 'action-overdue' ? '#f87171' :
                      entry.health === 'needs-contract' ? '#fbbf24' : '#6366f1'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Active projects table */}
        <div className={`${chartData.length > 0 ? 'col-span-5 lg:col-span-3' : 'col-span-5'} bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Active Projects</h2>
            <Link href="/projects" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {withHealth.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active projects</p>
              <Link href="/projects/new" className="text-blue-600 text-xs mt-2 inline-block hover:underline">Create your first project</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {withHealth.map(p => {
                const hc = healthConfig[p.health]
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {p.project_id && (
                          <span className="text-xs font-mono font-bold text-blue-600">{p.project_id}</span>
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{p.client}</span>
                        {p.next_action_due && (
                          <>
                            <span>·</span>
                            <span className={new Date(p.next_action_due) < new Date() ? 'text-red-500 font-medium' : ''}>
                              due {p.next_action_due}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">${Number(p.quoted_price).toLocaleString()}</p>
                      <p className={`text-xs font-medium ${p.gp >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        GP ${p.gp.toLocaleString()}
                      </p>
                    </div>
                    <div className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${hc.bg} ${hc.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hc.dot}`} />
                      {hc.label}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
