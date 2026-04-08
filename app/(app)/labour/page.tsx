import { supabase } from '@/lib/supabase'
import { LabourClient } from './labour-client'

export default async function LabourPage() {
  const [{ data: labourEntries }, { data: projects }] = await Promise.all([
    supabase
      .from('labour_entries')
      .select('*, projects(id, project_id, name)')
      .order('date', { ascending: false }),
    supabase.from('projects').select('id, project_id, name').order('project_id'),
  ])

  const rows = (labourEntries ?? []).map(e => {
    const proj = (e as any).projects
    const project_label = proj
      ? proj.project_id ? `${proj.project_id} – ${proj.name}` : proj.name
      : 'Unassigned'
    return {
      id: e.id,
      project_id: e.project_id,
      project_label,
      worker_name: e.worker_name,
      date: e.date,
      type: e.type as 'hourly' | 'flat',
      hours: e.hours,
      rate: e.rate,
      amount: Number(e.amount),
      notes: e.notes,
      created_at: e.created_at,
    }
  })

  const projectOptions = (projects ?? []).map(p => ({
    id: p.id,
    label: p.project_id ? `${p.project_id} – ${p.name}` : p.name,
  }))

  const total = rows.reduce((s, e) => s + e.amount, 0)
  const totalHours = rows.filter(e => e.type === 'hourly' && e.hours).reduce((s, e) => s + Number(e.hours), 0)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Labour</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rows.length} entries · ${total.toLocaleString()}
            {totalHours > 0 && ` · ${totalHours}h tracked`}
          </p>
        </div>
      </div>

      <LabourClient entries={rows} projects={projectOptions} />
    </div>
  )
}
