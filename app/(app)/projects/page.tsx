import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProjectsClient } from './projects-client'

export default async function ProjectsPage() {
  const [{ data: projects }, { data: expenses }] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('expenses').select('project_id, amount'),
  ])

  const expByProject = (expenses ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.project_id] = (acc[e.project_id] ?? 0) + Number(e.amount)
    return acc
  }, {})

  const rows = (projects ?? []).map(p => ({
    id: p.id,
    project_id: p.project_id,
    name: p.name,
    client: p.client,
    pm: p.pm,
    job_type: p.job_type,
    priority: p.priority,
    status: p.status,
    quoted_price: Number(p.quoted_price),
    expenses: expByProject[p.id] ?? 0,
    gp: Number(p.quoted_price) - (expByProject[p.id] ?? 0),
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} projects total</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      <ProjectsClient rows={rows} />
    </div>
  )
}
