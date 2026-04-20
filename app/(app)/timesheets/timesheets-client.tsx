'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Employee } from '@/lib/supabase'
import { Plus, Loader2, Trash2, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react'
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
}

type Props = {
  timesheets: TimesheetRow[]
  employees: Employee[]
  projects: ProjectOption[]
}

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export function TimesheetsClient({ timesheets: initial, employees, projects }: Props) {
  const [list, setList] = useState<TimesheetRow[]>(initial)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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
  const [empFilter, setEmpFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const activeEmployees = employees.filter(e => e.active)
  const selectedEmp = activeEmployees.find(e => e.id === empId)
  const estimatedCost = selectedEmp && hours ? selectedEmp.hourly_rate * parseFloat(hours) : null

  function resetForm() {
    setEmpId(''); setWeekEnding(''); setLocationMode('project')
    setProjectId(''); setLocationOther(''); setHours(''); setNotes('')
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!empId) { setError('Select an employee'); return }
    if (!weekEnding) { setError('Enter week ending date'); return }
    if (locationMode === 'project' && !projectId) { setError('Select a project'); return }
    if (locationMode === 'other' && !locationOther.trim()) { setError('Enter a location'); return }
    if (!hours || Number(hours) <= 0) { setError('Enter valid hours'); return }
    if (!selectedEmp) return

    const cost = selectedEmp.hourly_rate * Number(hours)
    setSaving(true)
    const { data, error: err } = await createClient()
      .from('timesheets')
      .insert({
        employee_id: empId,
        project_id: locationMode === 'project' ? projectId : null,
        location_other: locationMode === 'other' ? locationOther.trim() : null,
        week_ending: weekEnding,
        hours: Number(hours),
        cost,
        notes: notes.trim() || null,
      })
      .select('*, employees(id, name, hourly_rate), projects(id, project_id, name)')
      .single()

    setSaving(false)
    if (err) { setError(err.message); return }

    const proj = (data as any).projects
    const newRow: TimesheetRow = {
      id: data.id,
      employee_id: empId,
      employee_name: selectedEmp.name,
      hourly_rate: selectedEmp.hourly_rate,
      project_id: data.project_id,
      project_label: proj ? (proj.project_id ? `${proj.project_id} – ${proj.name}` : proj.name) : null,
      location_other: data.location_other,
      week_ending: data.week_ending,
      hours: Number(data.hours),
      cost: Number(data.cost),
      notes: data.notes,
    }
    setList(l => [newRow, ...l])
    resetForm()
    setAdding(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await createClient().from('timesheets').delete().eq('id', id)
    setList(l => l.filter(t => t.id !== id))
    setDeletingId(null)
  }

  const filtered = useMemo(() => list.filter(t => {
    if (empFilter && t.employee_id !== empFilter) return false
    if (projectFilter && t.project_id !== projectFilter) return false
    if (dateFrom && t.week_ending < dateFrom) return false
    if (dateTo && t.week_ending > dateTo) return false
    return true
  }), [list, empFilter, projectFilter, dateFrom, dateTo])

  const totalHours = filtered.reduce((s, t) => s + t.hours, 0)
  const totalCost = filtered.reduce((s, t) => s + t.cost, 0)
  const hasFilters = empFilter || projectFilter || dateFrom || dateTo

  function exportCSV() {
    const headers = ['Week Ending', 'Employee', 'Location', 'Hours', 'Rate', 'Cost', 'Notes']
    const rows = filtered.map(t => [t.week_ending, t.employee_name, t.project_label ?? t.location_other ?? '', t.hours, `$${t.hourly_rate}/hr`, t.cost.toFixed(2), t.notes ?? ''])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `timesheets-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  return (
    <div className="space-y-4">

      {/* Add button / form */}
      {!adding ? (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto justify-center sm:justify-start">
          <Plus className="h-4 w-4" /> Add Timesheet Entry
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">New Timesheet Entry</h3>
          </div>
          <form onSubmit={handleSave} className="p-5 space-y-4">
            {/* Employee */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Employee *</label>
              <select value={empId} onChange={e => setEmpId(e.target.value)} className={inp}>
                <option value="">Select employee…</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — ${emp.hourly_rate}/hr</option>
                ))}
              </select>
            </div>

            {/* Week ending */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Week Ending *</label>
              <input type="date" value={weekEnding} onChange={e => setWeekEnding(e.target.value)} className={inp} />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location *</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(['project', 'other'] as const).map(mode => (
                  <button key={mode} type="button" onClick={() => setLocationMode(mode)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${locationMode === mode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                    {mode === 'project' ? 'Project' : 'Other'}
                  </button>
                ))}
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

            {/* Hours */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hours *</label>
              <input type="number" step="0.5" min="0.5" max="168" value={hours} onChange={e => setHours(e.target.value)} className={inp} placeholder="e.g. 40" />
              {estimatedCost != null && (
                <p className="text-xs text-blue-600 font-semibold mt-1.5">
                  Cost: ${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className={inp} placeholder="e.g. Public holiday, overtime…" />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Entry'}
              </button>
              <button type="button" onClick={() => { resetForm(); setAdding(false) }}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entries', value: filtered.length },
          { label: 'Hours', value: totalHours },
          { label: 'Total Cost', value: `$${totalCost.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter toggle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setShowFilters(f => !f)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <span className="flex items-center gap-2">
            Filters
            {hasFilters && <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Active</span>}
          </span>
          {showFilters ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {showFilters && (
          <div className="px-5 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-50">
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All employees</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <div>
              <p className="text-xs text-gray-400 mb-1">Week from</p>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Week to</p>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {hasFilters && (
              <button onClick={() => { setEmpFilter(''); setProjectFilter(''); setDateFrom(''); setDateTo('') }}
                className="text-xs text-gray-400 hover:text-gray-700 text-left">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Clock className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">No timesheet entries yet</p>
          <p className="text-xs text-gray-300 mt-1">Press "Add Timesheet Entry" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Export */}
          <div className="flex justify-end">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>

          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{t.employee_name}</p>
                    <span className="text-xs text-gray-400">·</span>
                    <p className="text-xs text-gray-500">Week ending {t.week_ending}</p>
                  </div>
                  <div className="mt-1">
                    {t.project_label ? (
                      <Link href={`/projects/${t.project_id}`} className="text-xs text-blue-600 hover:underline font-medium">{t.project_label}</Link>
                    ) : (
                      <p className="text-xs text-gray-500">{t.location_other}</p>
                    )}
                    {t.notes && <p className="text-xs text-gray-400 mt-0.5">{t.notes}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">${t.cost.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{t.hours}h @ ${t.hourly_rate}/hr</p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
                  className="text-xs text-gray-300 hover:text-red-500 transition-colors flex items-center gap-1">
                  {deletingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {deletingId === t.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
