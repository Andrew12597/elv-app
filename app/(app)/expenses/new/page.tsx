import { supabase } from '@/lib/supabase'
import { ReceiptCapture } from './receipt-capture'

export default async function NewExpensePage(props: PageProps<'/expenses/new'>) {
  const { project: projectId } = (await props.searchParams) as { project?: string }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_id, name')
    .order('project_id')

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Expense</h1>
      <ReceiptCapture projects={projects ?? []} defaultProjectId={projectId} />
    </div>
  )
}
