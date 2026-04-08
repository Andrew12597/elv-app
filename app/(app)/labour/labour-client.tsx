'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { LabourEntry } from '@/lib/supabase'
import { Plus, Loader2, Trash2, Search, X, Download } from 'lucide-react'
import Link from 'next/link'

type ProjectOption = { id: string; label: string }

type LabourRow = LabourEntry & { project_label: string }

type Props = {
  entries: LabourRow[]
  projects: ProjectOption[]
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

export function LabourClient({ entries, projects }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Form state
  const [projectId, setProjectId] = useState('')
  const [type, setType] = useState<'hourly' | 'flat'>('hourly')
  const [workerName, setWorkerName] = useState('')
  const [date, setDate] = useState('')
  const [hours, setHours] = useState('')
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Filter state
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [workerFilter, setWorkerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function handleHoursOrRate(h: string, r: string) {
    const computed = parseFloat(h) * parseFloat(r)
    if (!isNaN(computed)) setAmount(computed.toFixed(2))
  }

  function resetForm() {
    setProjectId('')
    setWorkerName('')
    setDate('')
    setHours('')
    setRate('')
    setAmount('')
    setNotes('')
    setError('')
    setAdding(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId) { setError('Select a project'); return }
    if (!workerName.trim()) { setError('Enter a worker name'); return }
    if (!date) { setError('Enter a date'); return }
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return }

    setSaving(true)
    const { error: err } = await supabase.from('labour_entries').insert({
      project_id: projectId,
      worker_name: workerName.trim(),
      date,
      type,
      hours: type === 'hourly' && hours ? Number(hours) : null,
      rate: type === 'hourly' && rate ? Number(rate) : null,
      amount: Number(amount),
      notes: notes.trim() || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    resetForm()
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('labour_entries').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  const workers = [...new Set(entries.map(e => e.worker_name))].sort()

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (search) {
        const q = search.toLowerCase()
        if (!e.worker_name.toLowerCase().includes(q) && !e.project_label.toLowerCase().includes(q) && !(e.notes ?? '').toLowerCase().includes(q)) return false
      }
      if (projectFilter && e.project_id !== projectFilter) return false
      if (workerFilter && e.worker_name !== workerFilter) return false
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo && e.date > dateTo) return false
      return true
    })
  }, [entries, search, projectFilter, workerFilter, dateFrom, dateTo])

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)
  const totalHours = filtered.filter(e => e.type === 'hourly' && e.hours).reduce((s, e) => s + Number(e.hours), 0)

  const hasFilters = search || projectFilter || workerFilter || dateFrom || dateTo
  function clearFilters() { setSearch(''); setProjectFilter(''); setWorkerFilter(''); setDateFrom(''); setDateTo('') }

  function exportCSV() {
    const headers = ['Date', 'Project', 'Worker', 'Type', 'Hours', 'Rate', 'Amount', 'Notes']
    const rows = filtered.map(e => [
      e.date,
      e.project_label,
      e.worker_name,
      e.type,
      e.hours ?? '',
      e.rate ? `$${e.rate}/hr` : '',
      Number(e.amount).toFixed(2),
      e.notes ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `labour-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      {!adding ? (
        <div className="flex justify-end">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Labour
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">New Labour Entry</h3>

          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setType('hourly'); setAmount('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${type === 'hourly' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              Hourly (hrs × rate)
            </button>
            <button
              type="button"
              onClick={() => { setType('flat'); setHours(''); setRate('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${type === 'flat' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              Flat Amount
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={lbl}>Project *</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inp}>
                <option value="">Select project…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className={lbl}>Worker Name *</label>
              <input
                value={workerName}
                onChange={e => setWorkerName(e.target.value)}
                className={inp}
                placeholder="e.g. Andrew"
                list="worker-suggestions"
              />
              <datalist id="worker-suggestions">
                {workers.map(w => <option key={w} value={w} />)}
              </datalist>
            </div>
            <div>
              <label className={lbl}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
            </div>

            {type === 'hourly' ? (
              <>
                <div>
                  <label className={lbl}>Hours</label>
                  <input
                    type="number" step="0.5" min="0" value={hours}
                    onChange={e => { setHours(e.target.value); handleHoursOrRate(e.target.value, rate) }}
                    className={inp} placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <label className={lbl}>Rate ($/hr)</label>
                  <input
                    type="number" step="0.01" min="0" value={rate}
                    onChange={e => { setRate(e.target.value); handleHoursOrRate(hours, e.target.value) }}
                    className={inp} placeholder="e.g. 85.00"
                  />
                </div>
                <div>
                  <label className={lbl}>Amount ($) {hours && rate ? <span className="font-normal text-gray-400">— auto-calculated</span> : '*'}</label>
                  <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={lbl}>Notes</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)} className={inp} placeholder="Optional" />
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-2">
                  <label className={lbl}>Description <span className="font-normal text-gray-400">(e.g. Week ending 7 Apr)</span></label>
                  <input value={notes} onChange={e => setNotes(e.target.value)} className={inp} placeholder="e.g. Week ending 7 Apr 2026" />
                </div>
                <div>
                  <label className={lbl}>Amount ($) *</label>
                  <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className={inp} placeholder="0.00" />
                </div>
              </>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Entry'}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search worker or project…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          >
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select
            value={workerFilter}
            onChange={e => setWorkerFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All workers</option>
            {workers.map(w => <option key={w} value={w}>{w}</option>)}
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

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {filtered.length} entries · <span className="font-semibold text-gray-900">${total.toLocaleString()}</span>
              {totalHours > 0 && <span className="text-gray-400"> · {totalHours}h</span>}
            </span>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-10 text-center text-gray-400 text-sm">
            No labour entries match your filters.
          </div>
        ) : filtered.map(e => (
          <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{e.worker_name}</p>
                <Link href={`/projects/${e.project_id}`} className="text-xs text-blue-600 hover:underline">{e.project_label}</Link>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">${Number(e.amount).toLocaleString()}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.type === 'hourly' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                  {e.type === 'hourly' ? 'Hourly' : 'Flat'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{e.date}{e.hours ? ` · ${e.hours}h` : ''}{e.rate ? ` @ $${e.rate}/hr` : ''}{e.notes ? ` · ${e.notes}` : ''}</span>
              <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id} className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Project</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Worker</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Hours</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rate</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">No labour entries match your filters</td>
                </tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{e.date}</td>
                  <td className="px-5 py-3">
                    <Link href={`/projects/${e.project_id}`} className="text-blue-700 font-medium hover:underline whitespace-nowrap">{e.project_label}</Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{e.worker_name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.type === 'hourly' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {e.type === 'hourly' ? 'Hourly' : 'Flat'}
                    </span>
                    {e.notes && <span className="text-xs text-gray-400 ml-2">{e.notes}</span>}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{e.hours != null ? `${e.hours}h` : '—'}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{e.rate != null ? `$${Number(e.rate).toFixed(0)}/hr` : '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">${Number(e.amount).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id} className="text-gray-300 hover:text-red-500 transition-colors">
                      {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{totalHours > 0 ? `${totalHours}h tracked` : ''}</td>
                  <td colSpan={2} />
                  <td className="px-5 py-3 text-right font-bold text-gray-900">${total.toLocaleString()}</td>
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
