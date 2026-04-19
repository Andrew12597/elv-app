'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/lib/supabase'
import { Plus, Loader2, Trash2, Search, X, Download, Clock } from 'lucide-react'
import Link from 'next/link'

type ProjectOption = { id: string; label: string }

type TimesheetRow = {
  id: string
  employee_id: string
  employee_name: string
  hourly_rate: number
  project_id: string | null
  project_label: string | null
  location_other: string | null
  week_ending: string
  hours: number
  cost: number
  notes: string | null
  created_at: string
}

type Props = {
  timesheets: TimesheetRow[]
  employees: Employee[]
  projects: ProjectOption[]
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1.5'

export function TimesheetsClient({ timesheets, employees, projects }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Form
  const [empId, setEmpId] = useState('')
  const [weekEnding, setWeekEnding] = useState('')
  const [locationMode, setLocationMode] = useState<'project' | 'other'>('project')
  const [projectId, setProjectId] = useState('')
  const [locationOther, setLocationOther] = useState('')
  const [hours, setHours] = useState('')
  const [notes, setNotes] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [empFilter, setEmpFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const selectedEmp = employees.find(e => e.id === empId)
  const estimatedCost = selectedEmp && hours ? (selectedEmp.hourly_rate * parseFloat(hours)).toFixed(2) : null

  function resetForm() {
    setEmpId(''); setWeekEnding(''); setLocationMode('project')
    setProjectId(''); setLocationOther(''); setHours(''); setNotes('')
    setError(''); setAdding(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!empId) { setError('Select an employee'); return }
    if (!weekEnding) { setError('Enter week ending date'); return }
    if (locationMode === 'project' && !projectId) { setError('Select a project or choose Other'); return }
    if (locationMode === 'other' && !locationOther.trim()) { setError('Enter location'); return }
    if (!hours || Number(hours) <= 0) { setError('Enter valid hours'); return }
    if (!selectedEmp) { setError('Employee not found'); return }

    const cost = selectedEmp.hourly_rate * Number(hours)
    setSaving(true)
    const { error: err } = await supabase.from('timesheets').insert({
      employee_id: empId,
      project_id: locationMode === 'project' ? projectId : null,
      location_other: locationMode === 'other' ? locationOther.trim() : null,
      week_ending: weekEnding,
      hours: Number(hours),
      cost,
      notes: notes.trim() || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    resetForm()
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('timesheets').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  const activeEmployees = employees.filter(e => e.active)

  const filtered = useMemo(() => {
    return timesheets.filter(t => {
      if (empFilter && t.employee_id !== empFilter) return false
      if (projectFilter && t.project_id !== projectFilter) return false
      if (dateFrom && t.week_ending < dateFrom) return false
      if (dateTo && t.week_ending > dateTo) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.employee_name.toLowerCase().includes(q) &&
            !(t.project_label ?? '').toLowerCase().includes(q) &&
            !(t.location_other ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [timesheets, empFilter, projectFilter, dateFrom, dateTo, search])

  const totalHours = filtered.reduce((s, t) => s + t.hours, 0)
  const totalCost = filtered.reduce((s, t) => s + t.cost, 0)
  const hasFilters = search || empFilter || projectFilter || dateFrom || dateTo

  function clearFilters() { setSearch(''); setEmpFilter(''); setProjectFilter(''); setDateFrom(''); setDateTo('') }

  function exportCSV() {
    const headers = ['Week Ending', 'Employee', 'Location', 'Hours', 'Rate ($/hr)', 'Cost', 'Notes']
    const rows = filtered.map(t => [
      t.week_ending,
      t.employee_name,
      t.project_label ?? t.location_other ?? '',
      t.hours,
      t.hourly_rate,
      t.cost.toFixed(2),
      t.notes ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `timesheets-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      {adding ? (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">New Timesheet Entry</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Employee *</label>
              <select value={empId} onChange={e => setEmpId(e.target.value)} className={inp}>
                <option value="">Select employee…</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — ${emp.hourly_rate}/hr</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Week Ending *</label>
              <input type="date" value={weekEnding} onChange={e => setWeekEnding(e.target.value)} className={inp} />
            </div>

            {/* Location */}
            <div className="sm:col-span-2">
              <label className={lbl}>Location *</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setLocationMode('project')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${locationMode === 'project' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  Project
                </button>
                <button type="button" onClick={() => setLocationMode('other')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${locationMode === 'other' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  Other Location
                </button>
              </div>
              {locationMode === 'project' ? (
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inp}>
                  <option value="">Select project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              ) : (
                <input value={locationOther} onChange={e => setLocationOther(e.target.value)} className={inp} placeholder="e.g. Workshop, Office, Training" />
              )}
            </div>

            <div>
              <label className={lbl}>Hours *</label>
              <input type="number" step="0.5" min="0" max="168" value={hours} onChange={e => setHours(e.target.value)} className={inp} placeholder="e.g. 40" />
              {estimatedCost && (
                <p className="text-xs text-blue-600 mt-1 font-medium">Cost: ${Number(estimatedCost).toLocaleString()}</p>
              )}
            </div>

            <div>
              <label className={lbl}>Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className={inp} placeholder="Optional" />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Timesheet'}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Timesheet Entry
        </button>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or location…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters || hasFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            Filters {hasFilters ? `(${[empFilter,projectFilter,dateFrom,dateTo].filter(Boolean).length})` : ''}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All employees</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Week from" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Week to" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            <span className="text-sm text-gray-500">
              {filtered.length} entries · <span className="font-semibold text-gray-900">{totalHours}h</span> · <span className="font-semibold text-gray-900">${totalCost.toLocaleString()}</span>
            </span>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-12 text-center">
            <Clock className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No timesheet entries yet</p>
          </div>
        ) : filtered.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{t.employee_name}</p>
                {t.project_label ? (
                  <Link href={`/projects/${t.project_id}`} className="text-xs text-blue-600 hover:underline">{t.project_label}</Link>
                ) : (
                  <p className="text-xs text-gray-500">{t.location_other}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">${t.cost.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{t.hours}h @ ${t.hourly_rate}/hr</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>Week ending {t.week_ending}{t.notes ? ` · ${t.notes}` : ''}</span>
              <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                {deleting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Week Ending</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Employee</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Hours</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rate</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cost</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No timesheet entries yet
                </td>
              </tr>
            ) : filtered.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{t.week_ending}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{t.employee_name}</td>
                <td className="px-5 py-3">
                  {t.project_label ? (
                    <Link href={`/projects/${t.project_id!}`} className="text-blue-700 hover:underline">{t.project_label}</Link>
                  ) : (
                    <span className="text-gray-600">{t.location_other}</span>
                  )}
                  {t.notes && <span className="text-xs text-gray-400 ml-2">{t.notes}</span>}
                </td>
                <td className="px-5 py-3 text-right text-gray-700 font-medium">{t.hours}h</td>
                <td className="px-5 py-3 text-right text-gray-500">${t.hourly_rate}/hr</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">${t.cost.toLocaleString()}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    {deleting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-gray-100 bg-gray-50">
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{totalHours}h</td>
                <td />
                <td className="px-5 py-3 text-right font-bold text-gray-900">${totalCost.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
