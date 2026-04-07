'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Project, Expense, Invoice, Task, QuoteItem } from '@/lib/supabase'
import { GanttChart } from './gantt-chart'
import { Receipt, ArrowLeft, Plus } from 'lucide-react'

type Props = {
  project: Project
  expenses: Expense[]
  invoices: Invoice[]
  tasks: Task[]
  quoteItems: QuoteItem[]
}

const tabs = ['Overview', 'Expenses', 'Invoices', 'Gantt', 'Quote']

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

export function ProjectDetail({ project, expenses, invoices, tasks, quoteItems }: Props) {
  const [tab, setTab] = useState('Overview')
  const [addingTask, setAddingTask] = useState(false)
  const [addingInvoice, setAddingInvoice] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalInvoiced = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const profit = Number(project.quoted_price) - totalExpenses
  const margin = project.quoted_price > 0 ? (profit / Number(project.quoted_price)) * 100 : 0
  const totalQuote = quoteItems.reduce((s, q) => s + Number(q.quantity) * Number(q.unit_price), 0)

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    await supabase.from('tasks').insert({
      project_id: project.id,
      name: fd.get('name'),
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date'),
      assignee: fd.get('assignee'),
      status: 'not-started',
    })
    setSaving(false)
    setAddingTask(false)
    router.refresh()
  }

  async function addInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    await supabase.from('invoices').insert({
      project_id: project.id,
      invoice_number: fd.get('invoice_number'),
      amount: Number(fd.get('amount')),
      status: fd.get('status'),
      issued_date: fd.get('issued_date'),
      due_date: fd.get('due_date'),
    })
    setSaving(false)
    setAddingInvoice(false)
    router.refresh()
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/projects" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="h-3 w-3" /> Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-1">{project.client}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${statusColors[project.status]}`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Quoted Price', value: `$${Number(project.quoted_price).toLocaleString()}`, sub: '' },
              { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, sub: `${((totalExpenses / Number(project.quoted_price)) * 100).toFixed(0)}% of budget` },
              { label: 'Profit', value: `$${profit.toLocaleString()}`, sub: `${margin.toFixed(1)}% margin`, color: profit >= 0 ? 'text-green-600' : 'text-red-600' },
              { label: 'Revenue Collected', value: `$${totalInvoiced.toLocaleString()}`, sub: '' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color ?? 'text-gray-900'}`}>{stat.value}</p>
                {stat.sub && <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </div>

          {/* Budget bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Budget Usage</span>
              <span className="text-gray-500">${totalExpenses.toLocaleString()} / ${Number(project.quoted_price).toLocaleString()}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${totalExpenses > Number(project.quoted_price) ? 'bg-red-500' : totalExpenses / Number(project.quoted_price) > 0.85 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((totalExpenses / Math.max(Number(project.quoted_price), 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {project.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Timeline</p>
            <div className="flex gap-8 text-sm">
              <div><p className="text-gray-500">Start</p><p className="font-medium">{project.start_date}</p></div>
              <div><p className="text-gray-500">End</p><p className="font-medium">{project.end_date}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses */}
      {tab === 'Expenses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/expenses/new?project=${project.id}`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              Add Expense / Scan Receipt
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {expenses.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No expenses yet</div>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{exp.vendor}</p>
                    <p className="text-xs text-gray-500">{exp.description} · {exp.date}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{exp.price_code}</span>
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
          <div className="text-right text-sm font-semibold text-gray-900">
            Total: ${totalExpenses.toLocaleString()}
          </div>
        </div>
      )}

      {/* Invoices */}
      {tab === 'Invoices' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setAddingInvoice(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Invoice
            </button>
          </div>

          {addingInvoice && (
            <form onSubmit={addInvoice} className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Invoice #</label>
                  <input name="invoice_number" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="INV-001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select name="status" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Issued Date</label>
                  <input name="issued_date" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <input name="due_date" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setAddingInvoice(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No invoices yet</div>
            ) : (
              invoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-500">Issued: {inv.issued_date} · Due: {inv.due_date}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${invoiceStatusColors[inv.status]}`}>
                    {inv.status}
                  </span>
                  <p className="font-semibold text-gray-900">${Number(inv.amount).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Gantt */}
      {tab === 'Gantt' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setAddingTask(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          </div>

          {addingTask && (
            <form onSubmit={addTask} className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Task Name</label>
                <input name="name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Install cameras - Level 1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input name="start_date" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input name="end_date" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Assignee</label>
                <input name="assignee" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Team member name" />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Task'}
                </button>
                <button type="button" onClick={() => setAddingTask(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <GanttChart tasks={tasks} projectStart={project.start_date} projectEnd={project.end_date} />
        </div>
      )}

      {/* Quote */}
      {tab === 'Quote' && (
        <QuoteTab projectId={project.id} quoteItems={quoteItems} totalQuote={totalQuote} />
      )}
    </div>
  )
}

function QuoteTab({ projectId, quoteItems, totalQuote }: { projectId: string; quoteItems: QuoteItem[]; totalQuote: number }) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const materials = quoteItems.filter(q => q.type === 'material')
  const labour = quoteItems.filter(q => q.type === 'labour')

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    await supabase.from('quote_items').insert({
      project_id: projectId,
      name: fd.get('name'),
      quantity: Number(fd.get('quantity')),
      unit_price: Number(fd.get('unit_price')),
      type: fd.get('type'),
    })
    setSaving(false)
    setAdding(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Line Item
        </button>
      </div>

      {adding && (
        <form onSubmit={addItem} className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-4 gap-3">
          <div className="col-span-4 sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
            <input name="name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Hikvision 4MP Camera" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select name="type" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="material">Material</option>
              <option value="labour">Labour</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
            <input name="quantity" type="number" step="0.5" min="0" defaultValue="1" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
            <input name="unit_price" type="number" step="0.01" min="0" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="col-span-4 flex gap-3">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Add'}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {['material', 'labour'].map(type => {
        const items = type === 'material' ? materials : labour
        const subtotal = items.reduce((s, q) => s + Number(q.quantity) * Number(q.unit_price), 0)
        return (
          <div key={type} className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <p className="text-sm font-semibold text-gray-700 capitalize">{type}</p>
            </div>
            {items.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">No {type} items</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map(q => (
                  <div key={q.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <p className="flex-1 text-gray-900">{q.name}</p>
                    <p className="text-gray-500 w-16 text-right">{q.quantity} ×</p>
                    <p className="text-gray-700 w-24 text-right">${Number(q.unit_price).toLocaleString()}</p>
                    <p className="font-semibold text-gray-900 w-24 text-right">${(Number(q.quantity) * Number(q.unit_price)).toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex justify-between px-5 py-3 font-medium text-sm text-gray-700 bg-gray-50">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-xl px-6 py-4 text-right">
          <p className="text-sm opacity-80">Total Quote Value</p>
          <p className="text-2xl font-bold">${totalQuote.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
