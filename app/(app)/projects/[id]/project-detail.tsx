'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getCostCodeLabel, STATUS_LABELS, STATUS_COLORS } from '@/lib/supabase'
import type { Project, Expense, Invoice, Task, QuoteItem, ProjectNote, LabourEntry } from '@/lib/supabase'
import { GanttChart } from './gantt-chart'
import { NotesSection } from './notes-section'
import { EditProjectForm } from './edit-project-form'
import { LabourSection } from './labour-section'
import { Receipt, ArrowLeft, Plus, ExternalLink, Pencil, Archive, Trash2 } from 'lucide-react'

type Props = {
  project: Project
  expenses: Expense[]
  invoices: Invoice[]
  tasks: Task[]
  quoteItems: QuoteItem[]
  notes: ProjectNote[]
  labourEntries: LabourEntry[]
}

const tabs = ['Overview', 'Expenses', 'Labour', 'Invoices', 'Gantt', 'Quote', 'Notes']

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

export function ProjectDetail({ project, expenses, invoices, tasks, quoteItems, notes, labourEntries }: Props) {
  const [tab, setTab] = useState('Overview')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [addingInvoice, setAddingInvoice] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function archiveProject() {
    await supabase.from('projects').update({ status: 'archived' }).eq('id', project.id)
    router.push('/projects')
  }

  async function deleteProject() {
    await supabase.from('projects').delete().eq('id', project.id)
    router.push('/projects')
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalLabour = labourEntries.reduce((s, e) => s + Number(e.amount), 0)
  const totalCosts = totalExpenses + totalLabour
  const totalInvoiced = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const profit = Number(project.quoted_price) - totalCosts
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
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link href="/projects" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="h-3 w-3" /> Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {project.project_id && (
                <span className="font-mono font-bold text-blue-700 text-lg">{project.project_id}</span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{project.client}</span>
              {project.job_type && <><span>·</span><span>{project.job_type}</span></>}
              {project.pm && <><span>·</span><span>PM: {project.pm}</span></>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {project.priority && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                project.priority === 'High' ? 'bg-red-100 text-red-700' :
                project.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>{project.priority}</span>
            )}
            <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
            <button
              onClick={() => setEditing(e => !e)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors bg-white"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            {project.status !== 'archived' && (
              <button
                onClick={archiveProject}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-amber-700 border border-gray-200 hover:border-amber-200 px-3 py-1.5 rounded-lg transition-colors bg-white"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(d => !d)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-700 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors bg-white"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <EditProjectForm project={project} onClose={() => setEditing(false)} />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-700">Permanently delete this project?</p>
            <p className="text-xs text-red-500 mt-0.5">This will also delete all expenses, invoices, tasks and notes. This cannot be undone.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={deleteProject}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
            {t === 'Notes' && notes.length > 0 ? ` (${notes.length})` : ''}
            {t === 'Labour' && labourEntries.length > 0 ? ` (${labourEntries.length})` : ''}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Contract Value', value: project.quoted_price > 0 ? `$${Number(project.quoted_price).toLocaleString()}` : '—', sub: project.quoted_price === 0 ? 'No contract yet' : '' },
              { label: 'Total Costs', value: `$${totalCosts.toLocaleString()}`, sub: `Materials $${totalExpenses.toLocaleString()} · Labour $${totalLabour.toLocaleString()}` },
              { label: 'Gross Profit', value: project.quoted_price > 0 ? `$${profit.toLocaleString()}` : '—', sub: project.quoted_price > 0 ? `${margin.toFixed(1)}% margin` : '', color: profit >= 0 ? 'text-green-600' : 'text-red-600' },
              { label: 'Revenue Collected', value: `$${totalInvoiced.toLocaleString()}`, sub: '' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color ?? 'text-gray-900'}`}>{stat.value}</p>
                {stat.sub && <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </div>

          {project.quoted_price > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Budget Usage</span>
                <span className="text-gray-500">${totalCosts.toLocaleString()} / ${Number(project.quoted_price).toLocaleString()}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 flex overflow-hidden">
                <div
                  className="h-3 bg-blue-500 transition-all"
                  style={{ width: `${Math.min((totalExpenses / Math.max(Number(project.quoted_price), 1)) * 100, 100)}%` }}
                  title={`Materials: $${totalExpenses.toLocaleString()}`}
                />
                <div
                  className="h-3 bg-violet-400 transition-all"
                  style={{ width: `${Math.min((totalLabour / Math.max(Number(project.quoted_price), 1)) * 100, 100)}%` }}
                  title={`Labour: $${totalLabour.toLocaleString()}`}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Materials ${totalExpenses.toLocaleString()}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />Labour ${totalLabour.toLocaleString()}</span>
              </div>
            </div>
          )}

          {project.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Details</p>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-gray-500">Start</dt><dd className="font-medium text-gray-900">{project.start_date || '—'}</dd></div>
              <div><dt className="text-gray-500">End</dt><dd className="font-medium text-gray-900">{project.end_date || '—'}</dd></div>
              {project.owner && <div><dt className="text-gray-500">Owner</dt><dd className="font-medium text-gray-900">{project.owner}</dd></div>}
              {project.next_action && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Next Action</dt>
                  <dd className="font-medium text-gray-900">{project.next_action}
                    {project.next_action_due && <span className={`ml-2 text-xs ${new Date(project.next_action_due) < new Date() ? 'text-red-600' : 'text-gray-400'}`}>due {project.next_action_due}</span>}
                  </dd>
                </div>
              )}
            </dl>
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
              Add Expense
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Code</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No expenses yet</td></tr>
                ) : expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{exp.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{exp.vendor}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{exp.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{exp.price_code}</span>
                      <span className="text-xs text-gray-400 ml-1.5 hidden lg:inline">{getCostCodeLabel(exp.price_code)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(exp.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {exp.receipt_url
                        ? <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">View <ExternalLink className="h-3 w-3" /></a>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">${totalExpenses.toLocaleString()}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Labour */}
      {tab === 'Labour' && (
        <LabourSection projectId={project.id} entries={labourEntries} />
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

      {/* Notes */}
      {tab === 'Notes' && (
        <NotesSection projectId={project.id} notes={notes} />
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
