'use client'

import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, FolderKanban } from 'lucide-react'
import type { Project, Expense, Invoice } from '@/lib/supabase'

type Props = {
  projects: Project[]
  expenses: { project_id: string; amount: number }[]
  invoices: { project_id: string; amount: number; status: string }[]
}

function getProjectHealth(project: Project, totalExpenses: number, invoicedAmount: number) {
  const budget = project.quoted_price
  const spendRatio = budget > 0 ? totalExpenses / budget : 0
  const today = new Date()
  const end = new Date(project.end_date)
  const isOverdue = end < today && project.status === 'active'

  if (isOverdue || spendRatio > 1) return 'critical'
  if (spendRatio > 0.85) return 'at-risk'
  return 'healthy'
}

const healthConfig = {
  healthy: { label: 'On Track', color: 'text-green-700 bg-green-50', dot: 'bg-green-500' },
  'at-risk': { label: 'At Risk', color: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  critical: { label: 'Critical', color: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
}

export function DashboardClient({ projects, expenses, invoices }: Props) {
  const expenseByProject = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.project_id] = (acc[e.project_id] ?? 0) + Number(e.amount)
    return acc
  }, {})

  const invoicedByProject = invoices.reduce<Record<string, number>>((acc, i) => {
    if (i.status === 'paid') acc[i.project_id] = (acc[i.project_id] ?? 0) + Number(i.amount)
    return acc
  }, {})

  const activeProjects = projects.filter(p => p.status === 'active')
  const totalValue = projects.reduce((sum, p) => sum + Number(p.quoted_price), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalInvoiced = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0)

  const projectsWithHealth = activeProjects.map(p => ({
    ...p,
    expenses: expenseByProject[p.id] ?? 0,
    invoiced: invoicedByProject[p.id] ?? 0,
    health: getProjectHealth(p, expenseByProject[p.id] ?? 0, invoicedByProject[p.id] ?? 0),
  }))

  const healthCounts = projectsWithHealth.reduce(
    (acc, p) => { acc[p.health as keyof typeof acc]++; return acc },
    { healthy: 0, 'at-risk': 0, critical: 0 }
  )

  const chartData = projectsWithHealth.slice(0, 8).map(p => ({
    name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
    quoted: Number(p.quoted_price),
    spent: p.expenses,
    health: p.health,
  }))

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toFixed(0)}`

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all active projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: activeProjects.length, icon: FolderKanban, color: 'text-blue-600' },
          { label: 'Total Portfolio Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, icon: TrendingUp, color: 'text-orange-600' },
          { label: 'Revenue Collected', value: `$${totalInvoiced.toLocaleString()}`, icon: CheckCircle, color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(healthCounts) as [keyof typeof healthConfig, number][]).map(([key, count]) => {
          const { label, color, dot } = healthConfig[key]
          return (
            <div key={key} className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
              <span className={`h-3 w-3 rounded-full ${dot} shrink-0`} />
              <div>
                <p className="font-semibold text-sm">{count} project{count !== 1 ? 's' : ''}</p>
                <p className="text-xs opacity-80">{label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Budget vs Spend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="quoted" name="Quoted" fill="#dbeafe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.health === 'critical' ? '#ef4444' : entry.health === 'at-risk' ? '#f59e0b' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Project list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Projects</h2>
          <Link href="/projects/new" className="text-sm text-blue-600 hover:underline font-medium">
            + New Project
          </Link>
        </div>
        {projectsWithHealth.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No active projects yet.</p>
            <Link href="/projects/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Create your first project</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projectsWithHealth.map(p => {
              const { label, color, dot } = healthConfig[p.health as keyof typeof healthConfig]
              const spendPct = p.quoted_price > 0 ? Math.min((p.expenses / Number(p.quoted_price)) * 100, 100) : 0
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500 truncate">{p.client}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-40">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${p.health === 'critical' ? 'bg-red-500' : p.health === 'at-risk' ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${spendPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{spendPct.toFixed(0)}%</span>
                  </div>
                  <div className="text-right w-28">
                    <p className="text-sm font-medium text-gray-900">${Number(p.quoted_price).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">${p.expenses.toLocaleString()} spent</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
