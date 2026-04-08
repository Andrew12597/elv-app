import { supabase } from '@/lib/supabase'
import { NewProjectForm } from './new-project-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewProjectPage() {
  const { data } = await supabase.from('projects').select('project_id').not('project_id', 'is', null)

  // Find next sequential ID from pattern P\d+
  let nextProjectId = 'P2610'
  if (data && data.length > 0) {
    const nums = data
      .map(p => p.project_id)
      .filter((id): id is string => id !== null && /^P\d+$/.test(id))
      .map(id => parseInt(id.slice(1)))
      .filter(n => !isNaN(n))
    if (nums.length > 0) {
      nextProjectId = `P${Math.max(...nums) + 1}`
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/projects" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="h-3 w-3" /> Projects
      </Link>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">New Project</h1>
        <p className="text-sm text-gray-500 mt-0.5">Next ID: <span className="font-mono font-bold text-blue-600">{nextProjectId}</span></p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <NewProjectForm nextProjectId={nextProjectId} />
      </div>
    </div>
  )
}
