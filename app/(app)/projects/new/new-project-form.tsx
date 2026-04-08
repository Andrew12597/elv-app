'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, JOB_TYPES, STATUS_LABELS } from '@/lib/supabase'

type Props = { nextProjectId: string }

const STATUSES = ['active', 'quoting', 'waiting-approval', 'on-hold', 'completed', 'cancelled'] as const

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-xs font-semibold text-gray-500 mb-1'

export function NewProjectForm({ nextProjectId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const { error: err } = await supabase.from('projects').insert({
      project_id: fd.get('project_id') || null,
      name: fd.get('name'),
      client: fd.get('client'),
      pm: fd.get('pm') || null,
      job_type: fd.get('job_type') || null,
      owner: fd.get('owner') || null,
      priority: fd.get('priority') || 'Medium',
      status: fd.get('status'),
      quoted_price: Number(fd.get('quoted_price')) || 0,
      budget_cost: fd.get('budget_cost') ? Number(fd.get('budget_cost')) : null,
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date'),
      description: fd.get('description') || null,
      next_action: fd.get('next_action') || null,
      next_action_due: fd.get('next_action_due') || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/projects')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ID + Name */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>Project ID</label>
          <input
            name="project_id"
            defaultValue={nextProjectId}
            className={`${input} font-mono font-bold text-blue-700`}
            placeholder="e.g. P2610"
          />
        </div>
        <div className="col-span-2">
          <label className={label}>Project / Location *</label>
          <input name="name" required className={input} placeholder="e.g. Melrose Park" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Client *</label>
          <input name="client" required className={input} placeholder="Client name" />
        </div>
        <div>
          <label className={label}>Owner</label>
          <input name="owner" className={input} placeholder="e.g. Rothschild" />
        </div>
        <div>
          <label className={label}>Project Manager</label>
          <input name="pm" className={input} placeholder="PM name" />
        </div>
        <div>
          <label className={label}>Job Type</label>
          <select name="job_type" className={input}>
            <option value="">— Select —</option>
            {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Status</label>
          <select name="status" className={input}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Priority</label>
          <select name="priority" className={input}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Contract Price ($)</label>
          <input name="quoted_price" type="number" step="0.01" min="0" className={input} placeholder="0.00" />
        </div>
        <div>
          <label className={label}>Budget Cost ($)</label>
          <input name="budget_cost" type="number" step="0.01" min="0" className={input} placeholder="0.00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Start Date *</label>
          <input name="start_date" type="date" required className={input} />
        </div>
        <div>
          <label className={label}>End Date *</label>
          <input name="end_date" type="date" required className={input} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Next Action</label>
          <input name="next_action" className={input} placeholder="e.g. Submit variation" />
        </div>
        <div>
          <label className={label}>Next Action Due</label>
          <input name="next_action_due" type="date" className={input} />
        </div>
      </div>

      <div>
        <label className={label}>Description / Scope</label>
        <textarea name="description" rows={3} className={`${input} resize-none`} placeholder="Scope of work…" />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Create Project'}
        </button>
        <a href="/projects" className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  )
}
