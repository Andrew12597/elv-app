import { supabase } from '@/lib/supabase'
import { TimesheetsClient } from './timesheets-client'

export default async function TimesheetsPage() {
  const [{ data: timesheets }, { data: employees }, { data: projects }] = await Promise.all([
    supabase
      .from('timesheets')
      .select('*, employees(id, name, hourly_rate), projects(id, project_id, name)')
      .order('week_ending', { ascending: false }),
    supabase.from('employees').select('*').eq('active', true).order('name'),
    supabase.from('projects').select('id, project_id, name').order('project_id'),
  ])

  const rows = (timesheets ?? []).map(t => {
    const emp = (t as any).employees
    const proj = (t as any).projects
    return {
      id: t.id,
      employee_id: t.employee_id,
      employee_name: emp?.name ?? 'Unknown',
      hourly_rate: Number(emp?.hourly_rate ?? 0),
      project_id: t.project_id ?? null,
      project_label: proj ? (proj.project_id ? `${proj.project_id} – ${proj.name}` : proj.name) : null,
      location_other: t.location_other ?? null,
      week_ending: t.week_ending,
      hours: Number(t.hours),
      cost: Number(t.cost),
      notes: t.notes ?? null,
      created_at: t.created_at,
    }
  })

  const projectOptions = (projects ?? []).map(p => ({
    id: p.id,
    label: p.project_id ? `${p.project_id} – ${p.name}` : p.name,
  }))

  const { data: allEmployees } = await supabase.from('employees').select('*').order('name')

  const totalHours = rows.reduce((s, t) => s + t.hours, 0)
  const totalCost = rows.reduce((s, t) => s + t.cost, 0)

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Timesheets</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {rows.length} entries · {totalHours}h logged · ${totalCost.toLocaleString()} total
        </p>
      </div>
      <TimesheetsClient
        timesheets={rows}
        employees={allEmployees ?? []}
        projects={projectOptions}
      />
    </div>
  )
}
