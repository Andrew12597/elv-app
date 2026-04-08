'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { LabourEntry } from '@/lib/supabase'
import { Plus, Loader2, Trash2 } from 'lucide-react'

type Props = {
  projectId: string
  entries: LabourEntry[]
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const label = 'block text-xs font-semibold text-gray-500 mb-1'

export function LabourSection({ projectId, entries }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [type, setType] = useState<'hourly' | 'flat'>('hourly')
  const [workerName, setWorkerName] = useState('')
  const [date, setDate] = useState('')
  const [hours, setHours] = useState('')
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Auto-calculate amount when hours or rate changes
  function handleHoursOrRate(h: string, r: string) {
    const computed = parseFloat(h) * parseFloat(r)
    if (!isNaN(computed)) setAmount(computed.toFixed(2))
  }

  function resetForm() {
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
    resetForm()
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('labour_entries').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  const total = entries.reduce((s, e) => s + Number(e.amount), 0)

  // Group by worker for summary
  const byWorker = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.worker_name] = (acc[e.worker_name] ?? 0) + Number(e.amount)
    return acc
  }, {})

  const totalHours = entries
    .filter(e => e.type === 'hourly' && e.hours)
    .reduce((s, e) => s + Number(e.hours), 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Labour
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Worker Name *</label>
              <input value={workerName} onChange={e => setWorkerName(e.target.value)} className={input} placeholder="e.g. Andrew" />
            </div>
            <div>
              <label className={label}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={input} />
            </div>

            {type === 'hourly' ? (
              <>
                <div>
                  <label className={label}>Hours</label>
                  <input
                    type="number" step="0.5" min="0" value={hours}
                    onChange={e => { setHours(e.target.value); handleHoursOrRate(e.target.value, rate) }}
                    className={input} placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <label className={label}>Rate ($/hr)</label>
                  <input
                    type="number" step="0.01" min="0" value={rate}
                    onChange={e => { setRate(e.target.value); handleHoursOrRate(hours, e.target.value) }}
                    className={input} placeholder="e.g. 85.00"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className={label}>Description <span className="font-normal text-gray-400">(e.g. Week ending 7 Apr)</span></label>
                <input value={notes} onChange={e => setNotes(e.target.value)} className={input} placeholder="e.g. Week ending 7 Apr 2026" />
              </div>
            )}

            <div>
              <label className={label}>Amount ($) {type === 'hourly' && hours && rate ? <span className="font-normal text-gray-400">— auto-calculated</span> : '*'}</label>
              <input
                type="number" step="0.01" min="0" value={amount}
                onChange={e => setAmount(e.target.value)}
                className={input} placeholder="0.00"
              />
            </div>

            {type === 'hourly' && (
              <div>
                <label className={label}>Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} className={input} placeholder="Optional notes" />
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save'}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 && !adding ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10 text-center text-gray-400 text-sm">
          No labour entries yet.
        </div>
      ) : entries.length > 0 && (
        <>
          {/* Summary by worker */}
          {Object.keys(byWorker).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(byWorker).map(([name, total]) => {
                const workerHours = entries.filter(e => e.worker_name === name && e.type === 'hourly').reduce((s, e) => s + Number(e.hours ?? 0), 0)
                return (
                  <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-1">{name}</p>
                    <p className="text-lg font-bold text-gray-900">${total.toLocaleString()}</p>
                    {workerHours > 0 && <p className="text-xs text-gray-400 mt-0.5">{workerHours}h logged</p>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Entries table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Worker</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Hours</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rate</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{e.date}</td>
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
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deleting === e.id}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td colSpan={2} className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{totalHours > 0 ? `${totalHours}h tracked` : ''}</td>
                  <td colSpan={2} />
                  <td className="px-5 py-3 text-right font-bold text-gray-900">${total.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
