'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Project } from '@/lib/supabase'

type Expense = { project_id: string; amount: number; price_code: string; date: string }
type Invoice = { project_id: string; amount: number; status: string }

type Props = {
  projects: Project[]
  expenses: Expense[]
  invoices: Invoice[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function ReportsClient({ projects, expenses, invoices }: Props) {
  // Expenses by price code
  const byPriceCode = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.price_code] = (acc[e.price_code] ?? 0) + Number(e.amount)
    return acc
  }, {})
  const priceCodeData = Object.entries(byPriceCode).map(([name, value]) => ({ name, value }))

  // Project P&L
  const expenseByProject = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.project_id] = (acc[e.project_id] ?? 0) + Number(e.amount)
    return acc
  }, {})
  const invoicedByProject = invoices.filter(i => i.status === 'paid').reduce<Record<string, number>>((acc, i) => {
    acc[i.project_id] = (acc[i.project_id] ?? 0) + Number(i.amount)
    return acc
  }, {})

  const plData = projects
    .filter(p => expenseByProject[p.id] || invoicedByProject[p.id])
    .slice(0, 8)
    .map(p => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
      quoted: Number(p.quoted_price),
      expenses: expenseByProject[p.id] ?? 0,
      collected: invoicedByProject[p.id] ?? 0,
    }))

  const totalQuoted = projects.reduce((s, p) => s + Number(p.quoted_price), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Financial overview across all projects</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Portfolio Value', value: `$${totalQuoted.toLocaleString()}` },
          { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}` },
          { label: 'Revenue Collected', value: `$${totalCollected.toLocaleString()}`, color: 'text-green-600' },
          { label: 'Outstanding Invoices', value: `$${totalOutstanding.toLocaleString()}`, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color ?? 'text-gray-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by price code */}
        {priceCodeData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Expenses by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priceCodeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {priceCodeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* P&L by project */}
        {plData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Project P&L</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={plData} barGap={2}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="quoted" name="Quoted" fill="#dbeafe" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Invoice status breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Invoice Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['draft', 'sent', 'paid', 'overdue'] as const).map(status => {
            const statusInvoices = invoices.filter(i => i.status === status)
            const total = statusInvoices.reduce((s, i) => s + Number(i.amount), 0)
            const colors = { draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700' }
            return (
              <div key={status} className={`rounded-lg p-4 ${colors[status]}`}>
                <p className="text-xs font-medium capitalize mb-1">{status}</p>
                <p className="text-lg font-bold">${total.toLocaleString()}</p>
                <p className="text-xs opacity-70">{statusInvoices.length} invoice{statusInvoices.length !== 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
