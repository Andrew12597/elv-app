'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Download, Search, X } from 'lucide-react'
import { getCostCodeLabel, COST_CODES } from '@/lib/supabase'

type ExpenseRow = {
  id: string
  vendor: string
  amount: number
  date: string
  price_code: string
  description: string
  receipt_url: string | null
  project_id: string
  project_label: string // e.g. "P2516 – Adina Hotel"
}

type Props = {
  expenses: ExpenseRow[]
  projects: { id: string; label: string }[]
}

export function ExpensesClient({ expenses, projects }: Props) {
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [codeFilter, setCodeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (search && !e.vendor.toLowerCase().includes(search.toLowerCase()) && !e.description.toLowerCase().includes(search.toLowerCase())) return false
      if (projectFilter && e.project_id !== projectFilter) return false
      if (codeFilter && e.price_code !== codeFilter) return false
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo && e.date > dateTo) return false
      if (minAmount && Number(e.amount) < Number(minAmount)) return false
      if (maxAmount && Number(e.amount) > Number(maxAmount)) return false
      return true
    })
  }, [expenses, search, projectFilter, codeFilter, dateFrom, dateTo, minAmount, maxAmount])

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)

  function clearFilters() {
    setSearch('')
    setProjectFilter('')
    setCodeFilter('')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
  }

  const hasFilters = search || projectFilter || codeFilter || dateFrom || dateTo || minAmount || maxAmount

  function exportCSV() {
    const headers = ['Date', 'Project', 'Vendor', 'Description', 'Cost Code', 'Category', 'Amount']
    const rows = filtered.map(e => [
      e.date,
      e.project_label,
      e.vendor,
      e.description,
      e.price_code,
      getCostCodeLabel(e.price_code),
      Number(e.amount).toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Unique cost codes used in data
  const usedCodes = [...new Set(expenses.map(e => e.price_code))].sort()

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendor or description…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project */}
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          >
            <option value="">All projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          {/* Cost code */}
          <select
            value={codeFilter}
            onChange={e => setCodeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-52"
          >
            <option value="">All cost codes</option>
            {usedCodes.map(code => (
              <option key={code} value={code}>{code} — {getCostCodeLabel(code)}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Date:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>$</span>
            <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="Min"
              className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400">–</span>
            <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="Max"
              className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">{filtered.length} expenses · <span className="font-semibold text-gray-900">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Code</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No expenses match your filters</td>
                </tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${e.project_id}`} className="text-blue-700 font-medium hover:underline whitespace-nowrap">
                      {e.project_label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{e.vendor}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{e.description}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{e.price_code}</span>
                    <span className="text-xs text-gray-400 ml-1.5 hidden lg:inline">{getCostCodeLabel(e.price_code)}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-center">
                    {e.receipt_url
                      ? <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">View</a>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
