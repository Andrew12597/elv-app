import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function ProjectsPage() {
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects?.length ?? 0} total projects</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {!projects?.length ? (
          <div className="py-16 text-center text-gray-400">
            <p className="font-medium">No projects yet</p>
            <Link href="/projects/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Create your first project
            </Link>
          </div>
        ) : (
          projects.map(p => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-500">{p.client}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">${Number(p.quoted_price).toLocaleString()}</p>
                <p className="text-xs text-gray-400">{p.start_date} → {p.end_date}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {p.status}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
