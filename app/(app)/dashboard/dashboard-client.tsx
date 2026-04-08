'use client'

import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DollarSign, AlertTriangle, CheckCircle, FolderKanban, Clock, TrendingUp } from 'lucide-react'
import type { Project, Expense, Invoice } from '@/lib/supabase'
import { STATUS_LABELS } from '@/lib/supabase'

type Props = {
  projects: Project[]
  expenses: { project_id: string; amount: number }[]
  invoices: { project_id: string; amount: number; status: string }[]
}

function getHealth(project: Project, expenses: number): 'on-track' | 'action-overdue' | 'needs-contract' {
  if (!project.quoted_price || Number(project.quoted_price) === 0) return 'needs-contract'
  if (project.next_action_due && new Date(project.next_action_due) < new Date()) return 'action-overdue'
  return 'on-track'
}

const healthConfig = {
  'on-track': { label: 'On Track', color: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' },
  'action-overdue': { label: 'Action Overdue', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  'needs-contract': { label: 'Needs Contract', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
}

const statusColors: Record<string, string> = {
  'active': 'bg-green-100 text-green-700',
  'waiting-approval': 'bg-blue-100 text-blue-700',
  'quoting': 'bg-purple-100 text-purple-700',
  'on-hold': 'bg-amber-100 text-amber-700',
  'completed': 'bg-gray-100 text-gray-600',
  'cancelled': 'bg-red-100 text-red-600',
}

export function DashboardClient({ projects, expenses, invoices }: Props) {
  const expenseByProject = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.project_id] = (acc[e.project_id] ?? 0) + Number(e.amount)
    return acc
  }, {})

  const invoicedByProject = invoices.reduce<Record<string, number>>((acc, i) => {
    acc[i.project_id] = (acc[i.project_id] ?? 0) + Number(i.amount)
    return acc
  }, {})

  const paidByProject = invoices.filter(i => i.status === 'paid').reduce<Record<string, number>>((acc, i) => {
    acc[i.project_id] = (acc[i.project_id] ?? 0) + Number(i.amount)
    return acc
  }, {})

  const activeProjects = projects.filter(p => p.status === 'active')
  const activeContractValue = activeProjects.reduce((s, p) => s + Number(p.quoted_price), 0)
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalCosts = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0

  const needsContractCount = activeProjects.filter(p => !p.quoted_price || Number(p.quoted_price) === 0).length
  const actionOverdueCount = activeProjects.filter(p =>
    p.next_action_due && new Date(p.next_action_due) < new Date()
  ).length

  const projectsWithHealth = activeProjects.map(p => ({
    ...p,
    expenses: expenseByProject[p.id] ?? 0,
    invoiced: invoicedByProject[p.id] ?? 0,
    paid: paidByProject[p.id] ?? 0,
    health: getHealth(p, expenseByProject[p.id] ?? 0),
  }))

  const chartData = projectsWithHealth.slice(0, 8).map(p => ({
    name: (p.project_id ?? p.name).length > 8 ? (p.project_id ?? p.name).slice(0, 8) : (p.project_id ?? p.name),
    contract: Number(p.quoted_price),
    costs: p.expenses,
    health: p.health,
  }))

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toFixed(0)}`

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">ELV Australia — Project Portfolio</p>
        </div>
        <Link href="/projects/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Project
        </Link>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: activeProjects.length, icon: FolderKanban, color: 'text-blue-600' },
          { label: 'Active Contract Value', value: `$${activeContractValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Invoiced to Date', value: `$${totalInvoiced.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600' },
          { label: 'Paid to Date', value: `$${totalPaid.toLocaleString()}`, icon: CheckCircle, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Costs to Date', value: `$${totalCosts.toLocaleString()}`, icon: TrendingUp, color: 'text-orange-500' },
          { label: 'Collection Rate', value: `${collectionRate.toFixed(0)}%`, icon: CheckCircle, color: 'text-blue-500' },
          { label: 'Needs Contract', value: needsContractCount, icon: AlertTriangle, color: 'text-amber-500' },
          { label: 'Action Overdue', value: actionOverdueCount, icon: Clock, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contract Value vs Costs</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="contract" name="Contract" fill="#dbeafe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" name="Costs" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.health === 'action-overdue' ? '#ef4444' :
                    entry.health === 'needs-contract' ? '#f59e0b' : '#3b82f6'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Project list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Active Projects</h2>
        </div>
        {projectsWithHealth.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No active projects yet.</p>
            <Link href="/projects/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Create your first project</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Header */}
            <div className="grid grid-cols-12 px-6 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Project</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-1 text-right">Contract</div>
              <div className="col-span-1 text-right">Costs</div>
              <div className="col-span-1 text-right">GP</div>
              <div className="col-span-2 text-center">Next Action</div>
              <div className="col-span-1 text-center">Health</div>
            </div>
            {projectsWithHealth.map(p => {
              const gp = Number(p.quoted_price) - p.expenses
              const { label, color, dot } = healthConfig[p.health]
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="grid grid-cols-12 items-center px-6 py-3 hover:bg-gray-50 transition-colors text-sm">
                  <div className="col-span-1 font-mono text-xs text-gray-400">{p.project_id ?? '—'}</div>
                  <div className="col-span-3 font-medium text-gray-900 truncate pr-2">{p.name}</div>
                  <div className="col-span-2 text-gray-500 truncate pr-2">{p.client}</div>
                  <div className="col-span-1 text-right text-gray-900">${Number(p.quoted_price).toLocaleString()}</div>
                  <div className="col-span-1 text-right text-gray-600">${p.expenses.toLocaleString()}</div>
                  <div className={`col-span-1 text-right font-medium ${gp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${gp.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-center text-xs text-gray-400 truncate px-1">
                    {p.next_action ? (
                      <span title={p.next_action}>{p.next_action_due ?? p.next_action}</span>
                    ) : '—'}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                      {label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
