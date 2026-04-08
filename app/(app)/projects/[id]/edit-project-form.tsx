'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, JOB_TYPES, STATUS_LABELS } from '@/lib/supabase'
import type { Project } from '@/lib/supabase'
import { X, Check, Loader2 } from 'lucide-react'

type Props = {
  project: Project
  onClose: () => void
}

const STATUSES = ['active', 'quoting', 'waiting-approval', 'on-hold', 'completed', 'cancelled', 'archived'] as const

export function EditProjectForm({ project, onClose }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [fields, setFields] = useState({
    status: project.status,
    client: project.client ?? '',
    job_type: project.job_type ?? '',
    quoted_price: project.quoted_price ? String(project.quoted_price) : '',
    budget_cost: project.budget_cost ? String(project.budget_cost) : '',
    description: project.description ?? '',
    start_date: project.start_date ?? '',
    end_date: project.end_date ?? '',
    pm: project.pm ?? '',
    owner: project.owner ?? '',
    priority: project.priority ?? 'Medium',
    next_action: project.next_action ?? '',
    next_action_due: project.next_action_due ?? '',
  })

  function set(key: keyof typeof fields, value: string) {
    setFields(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('projects').update({
      status: fields.status,
      client: fields.client,
      job_type: fields.job_type || null,
      quoted_price: fields.quoted_price ? Number(fields.quoted_price) : 0,
      budget_cost: fields.budget_cost ? Number(fields.budget_cost) : null,
      description: fields.description || null,
      start_date: fields.start_date || null,
      end_date: fields.end_date || null,
      pm: fields.pm || null,
      owner: fields.owner || null,
      priority: fields.priority || null,
      next_action: fields.next_action || null,
      next_action_due: fields.next_action_due || null,
    }).eq('id', project.id)

    if (err) { setError(err.message); setSaving(false); return }
    router.refresh()
    onClose()
  }

  const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
  const label = 'block text-xs font-semibold text-gray-500 mb-1'

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Edit Project</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Status */}
        <div>
          <label className={label}>Status</label>
          <select value={fields.status} onChange={e => set('status', e.target.value)} className={input}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className={label}>Priority</label>
          <select value={fields.priority} onChange={e => set('priority', e.target.value)} className={input}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Job type */}
        <div>
          <label className={label}>Job Type</label>
          <select value={fields.job_type} onChange={e => set('job_type', e.target.value)} className={input}>
            <option value="">— Select —</option>
            {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Client */}
        <div>
          <label className={label}>Client</label>
          <input value={fields.client} onChange={e => set('client', e.target.value)} className={input} placeholder="Client name" />
        </div>

        {/* PM */}
        <div>
          <label className={label}>Project Manager</label>
          <input value={fields.pm} onChange={e => set('pm', e.target.value)} className={input} placeholder="PM name" />
        </div>

        {/* Owner */}
        <div>
          <label className={label}>Owner</label>
          <input value={fields.owner} onChange={e => set('owner', e.target.value)} className={input} placeholder="Owner" />
        </div>

        {/* Contract value */}
        <div>
          <label className={label}>Contract Value ($)</label>
          <input type="number" step="0.01" min="0" value={fields.quoted_price} onChange={e => set('quoted_price', e.target.value)} className={input} placeholder="0.00" />
        </div>

        {/* Budget cost */}
        <div>
          <label className={label}>Budget Cost ($)</label>
          <input type="number" step="0.01" min="0" value={fields.budget_cost} onChange={e => set('budget_cost', e.target.value)} className={input} placeholder="0.00" />
        </div>

        {/* Start date */}
        <div>
          <label className={label}>Start Date</label>
          <input type="date" value={fields.start_date} onChange={e => set('start_date', e.target.value)} className={input} />
        </div>

        {/* End date */}
        <div>
          <label className={label}>End Date</label>
          <input type="date" value={fields.end_date} onChange={e => set('end_date', e.target.value)} className={input} />
        </div>

        {/* Next action due */}
        <div>
          <label className={label}>Next Action Due</label>
          <input type="date" value={fields.next_action_due} onChange={e => set('next_action_due', e.target.value)} className={input} />
        </div>
      </div>

      {/* Next action */}
      <div>
        <label className={label}>Next Action</label>
        <input value={fields.next_action} onChange={e => set('next_action', e.target.value)} className={input} placeholder="What needs to happen next?" />
      </div>

      {/* Description */}
      <div>
        <label className={label}>Description</label>
        <textarea value={fields.description} onChange={e => set('description', e.target.value)} rows={3} className={input + ' resize-none'} placeholder="Project description…" />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
