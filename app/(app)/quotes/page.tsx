import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function QuotesPage() {
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client, quoted_price, status')
    .order('created_at', { ascending: false })

  const { data: quoteItems } = await supabase
    .from('quote_items')
    .select('project_id, quantity, unit_price')

  const totalByProject = (quoteItems ?? []).reduce<Record<string, number>>((acc, q) => {
    acc[q.project_id] = (acc[q.project_id] ?? 0) + Number(q.quantity) * Number(q.unit_price)
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage project quotes. Open a project to edit quote line items.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {!projects?.length ? (
          <div className="py-16 text-center text-gray-400">
            <p>No projects yet</p>
            <Link href="/projects/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Create a project to start quoting</Link>
          </div>
        ) : (
          projects.map(p => {
            const quoteTotal = totalByProject[p.id] ?? 0
            const hasItems = quoteTotal > 0
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.client}</p>
                </div>
                <div className="text-right">
                  {hasItems ? (
                    <>
                      <p className="font-semibold text-gray-900">${quoteTotal.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">detailed quote</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-900">${Number(p.quoted_price).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">header price only</p>
                    </>
                  )}
                </div>
                <span className="text-xs text-blue-600 font-medium">Edit →</span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
