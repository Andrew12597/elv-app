'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/lib/supabase'
import { Plus, Loader2, Trash2, Pencil, Check, X } from 'lucide-react'

type Props = { employees: Employee[] }

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

export function SettingsClient({ employees }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Add form
  const [newName, setNewName] = useState('')
  const [newRate, setNewRate] = useState('')

  // Edit form
  const [editName, setEditName] = useState('')
  const [editRate, setEditRate] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) { setError('Enter employee name'); return }
    if (!newRate || Number(newRate) < 0) { setError('Enter a valid hourly rate'); return }
    setSaving(true)
    const { error: err } = await supabase.from('employees').insert({
      name: newName.trim(),
      hourly_rate: Number(newRate),
      active: true,
    })
    if (err) { setError(err.message); setSaving(false); return }
    setNewName(''); setNewRate(''); setAdding(false); setError('')
    setSaving(false)
    router.refresh()
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id)
    setEditName(emp.name)
    setEditRate(String(emp.hourly_rate))
    setError('')
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) { setError('Enter employee name'); return }
    setSaving(true)
    const { error: err } = await supabase.from('employees').update({
      name: editName.trim(),
      hourly_rate: Number(editRate),
    }).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    setEditingId(null); setSaving(false); setError('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('employees').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  async function toggleActive(emp: Employee) {
    await supabase.from('employees').update({ active: !emp.active }).eq('id', emp.id)
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Employees */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Employees</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage staff and their hourly cost rates</p>
          </div>
          {!adding && (
            <button
              onClick={() => { setAdding(true); setError('') }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Employee
            </button>
          )}
        </div>

        {/* Add form */}
        {adding && (
          <form onSubmit={handleAdd} className="px-5 py-4 bg-blue-50/40 border-b border-blue-100 space-y-3">
            <p className="text-xs font-semibold text-gray-600">New Employee</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lbl}>Full Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} className={inp} placeholder="e.g. James Smith" autoFocus />
              </div>
              <div className="w-32">
                <label className={lbl}>Hourly Rate ($/hr)</label>
                <input type="number" step="0.01" min="0" value={newRate} onChange={e => setNewRate(e.target.value)} className={inp} placeholder="85.00" />
              </div>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
              </button>
              <button type="button" onClick={() => { setAdding(false); setError('') }} className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Employee list */}
        {employees.length === 0 && !adding ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            No employees yet. Add one to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {employees.map(emp => (
              <div key={emp.id} className="px-5 py-3">
                {editingId === emp.id ? (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className={lbl}>Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} className={inp} />
                    </div>
                    <div className="w-32">
                      <label className={lbl}>Rate ($/hr)</label>
                      <input type="number" step="0.01" min="0" value={editRate} onChange={e => setEditRate(e.target.value)} className={inp} />
                    </div>
                    <div className="flex gap-1.5 mb-0.5">
                      <button onClick={() => handleUpdate(emp.id)} disabled={saving} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${emp.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${emp.active ? 'text-gray-900' : 'text-gray-400'}`}>{emp.name}</p>
                        <p className="text-xs text-gray-400">${Number(emp.hourly_rate).toFixed(2)}/hr</p>
                      </div>
                      {!emp.active && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleActive(emp)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                        {emp.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => startEdit(emp)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} disabled={deletingId === emp.id} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        {deletingId === emp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
