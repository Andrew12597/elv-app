'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/lib/supabase'
import { Plus, Loader2, Trash2, Pencil, Check, X, Phone, Mail, DollarSign } from 'lucide-react'

type Props = { employees: Employee[] }

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

type FormState = { name: string; rate: string; phone: string; email: string }
const empty: FormState = { name: '', rate: '', phone: '', email: '' }

export function SettingsClient({ employees }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(empty)
  const [editForm, setEditForm] = useState<FormState>(empty)

  function set(k: keyof FormState, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function setEdit(k: keyof FormState, v: string) { setEditForm(f => ({ ...f, [k]: v })) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Enter employee name'); return }
    setSaving(true)
    // Try with phone/email first; if columns don't exist yet, save without them
    let { error: err } = await supabase.from('employees').insert({
      name: form.name.trim(),
      hourly_rate: Number(form.rate) || 0,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      active: true,
    })
    if (err?.message?.includes('column') && err.message.includes('does not exist')) {
      const res = await supabase.from('employees').insert({
        name: form.name.trim(),
        hourly_rate: Number(form.rate) || 0,
        active: true,
      })
      err = res.error
    }
    if (err) { setError(err.message); setSaving(false); return }
    setForm(empty); setAdding(false); setError('')
    setSaving(false)
    router.refresh()
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id)
    setEditForm({ name: emp.name, rate: String(emp.hourly_rate), phone: emp.phone ?? '', email: emp.email ?? '' })
    setError('')
  }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim()) { setError('Enter employee name'); return }
    setSaving(true)
    let { error: err } = await supabase.from('employees').update({
      name: editForm.name.trim(),
      hourly_rate: Number(editForm.rate) || 0,
      phone: editForm.phone.trim() || null,
      email: editForm.email.trim() || null,
    }).eq('id', id)
    if (err?.message?.includes('column') && err.message.includes('does not exist')) {
      const res = await supabase.from('employees').update({
        name: editForm.name.trim(),
        hourly_rate: Number(editForm.rate) || 0,
      }).eq('id', id)
      err = res.error
    }
    if (err) { setError(err.message); setSaving(false); return }
    setEditingId(null); setSaving(false); setError('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this employee? This will also remove their timesheets.')) return
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Employees</h2>
            <p className="text-xs text-gray-400 mt-0.5">Staff details and hourly cost rates</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={lbl}>Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="e.g. James Smith" autoFocus />
              </div>
              <div>
                <label className={lbl}>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="04xx xxx xxx" type="tel" />
              </div>
              <div>
                <label className={lbl}>Email</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="james@example.com" type="email" />
              </div>
              <div>
                <label className={lbl}>Hourly Rate ($/hr)</label>
                <input type="number" step="0.01" min="0" value={form.rate} onChange={e => set('rate', e.target.value)} className={inp} placeholder="85.00" />
              </div>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save Employee
              </button>
              <button type="button" onClick={() => { setAdding(false); setError('') }} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {employees.length === 0 && !adding ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No employees yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {employees.map(emp => (
              <div key={emp.id} className="px-5 py-4">
                {editingId === emp.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className={lbl}>Full Name</label>
                        <input value={editForm.name} onChange={e => setEdit('name', e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Phone</label>
                        <input value={editForm.phone} onChange={e => setEdit('phone', e.target.value)} className={inp} type="tel" />
                      </div>
                      <div>
                        <label className={lbl}>Email</label>
                        <input value={editForm.email} onChange={e => setEdit('email', e.target.value)} className={inp} type="email" />
                      </div>
                      <div>
                        <label className={lbl}>Hourly Rate ($/hr)</label>
                        <input type="number" step="0.01" min="0" value={editForm.rate} onChange={e => setEdit('rate', e.target.value)} className={inp} />
                      </div>
                    </div>
                    {error && <p className="text-red-600 text-xs">{error}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(emp.id)} disabled={saving} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${emp.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                      {emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${emp.active ? 'text-gray-900' : 'text-gray-400'}`}>{emp.name}</p>
                        {!emp.active && <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <DollarSign className="h-3 w-3" />{Number(emp.hourly_rate).toFixed(0)}/hr
                        </span>
                        {emp.phone && (
                          <a href={`tel:${emp.phone}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600">
                            <Phone className="h-3 w-3" />{emp.phone}
                          </a>
                        )}
                        {emp.email && (
                          <a href={`mailto:${emp.email}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600">
                            <Mail className="h-3 w-3" />{emp.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleActive(emp)} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
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
