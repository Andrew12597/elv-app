import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ProjectDetail } from './project-detail'

export default async function ProjectPage(props: PageProps<'/projects/[id]'>) {
  const { id } = await props.params

  const [{ data: project }, { data: expenses }, { data: invoices }, { data: tasks }, { data: quoteItems }, { data: notes }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
    supabase.from('invoices').select('*').eq('project_id', id).order('issued_date', { ascending: false }),
    supabase.from('tasks').select('*').eq('project_id', id).order('start_date'),
    supabase.from('quote_items').select('*').eq('project_id', id),
    supabase.from('project_notes').select('*').eq('project_id', id).order('created_at', { ascending: false }),
  ])

  if (!project) notFound()

  return (
    <ProjectDetail
      project={project}
      expenses={expenses ?? []}
      invoices={invoices ?? []}
      tasks={tasks ?? []}
      quoteItems={quoteItems ?? []}
      notes={notes ?? []}
    />
  )
}
