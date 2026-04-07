'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/lib/supabase'

type Props = {
  tasks: Task[]
  projectStart: string
  projectEnd: string
}

const statusColors: Record<string, string> = {
  'not-started': 'bg-gray-300',
  'in-progress': 'bg-blue-500',
  'completed': 'bg-green-500',
}

const statusLabels: Record<string, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'completed': 'Completed',
}

function daysBetween(a: string, b: string) {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function GanttChart({ tasks, projectStart, projectEnd }: Props) {
  const router = useRouter()
  const totalDays = Math.max(daysBetween(projectStart, projectEnd), 1)

  async function updateStatus(id: string, status: string) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    router.refresh()
  }

  // Generate month markers
  const months: { label: string; left: number; width: number }[] = []
  const start = new Date(projectStart)
  const end = new Date(projectEnd)
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= end) {
    const monthStart = new Date(Math.max(cur.getTime(), start.getTime()))
    const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    const monthEnd = new Date(Math.min(nextMonth.getTime() - 86400000, end.getTime()))
    const left = (daysBetween(projectStart, monthStart.toISOString().slice(0, 10)) / totalDays) * 100
    const width = (daysBetween(monthStart.toISOString().slice(0, 10), monthEnd.toISOString().slice(0, 10)) / totalDays) * 100
    months.push({
      label: cur.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      left,
      width,
    })
    cur = nextMonth
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
        No tasks yet. Add tasks to see the Gantt chart.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex">
        {/* Left: task names */}
        <div className="w-52 shrink-0 border-r border-gray-200">
          <div className="h-8 border-b border-gray-200 bg-gray-50" />
          {tasks.map(task => (
            <div key={task.id} className="h-12 flex items-center px-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{task.name}</p>
                {task.assignee && <p className="text-xs text-gray-400 truncate">{task.assignee}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Right: timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Month headers */}
          <div className="relative h-8 border-b border-gray-200 bg-gray-50">
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex items-center justify-center border-r border-gray-200 last:border-r-0"
                style={{ left: `${m.left}%`, width: `${m.width}%` }}
              >
                <span className="text-xs text-gray-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Task bars */}
          {tasks.map(task => {
            const leftPct = (daysBetween(projectStart, task.start_date) / totalDays) * 100
            const widthPct = Math.max((daysBetween(task.start_date, task.end_date) / totalDays) * 100, 1)
            return (
              <div key={task.id} className="relative h-12 border-b border-gray-100 flex items-center">
                {/* Grid lines */}
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-r border-gray-100" style={{ left: `${m.left + m.width}%` }} />
                ))}
                <div
                  className={`absolute h-6 rounded ${statusColors[task.status]} opacity-90 cursor-pointer hover:opacity-100 transition-opacity flex items-center px-2`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 24 }}
                  title={`${task.name}: ${task.start_date} → ${task.end_date}`}
                  onClick={() => {
                    const next = task.status === 'not-started' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'not-started'
                    updateStatus(task.id, next)
                  }}
                >
                  {widthPct > 8 && <span className="text-white text-xs font-medium truncate">{statusLabels[task.status]}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
        <span>Click a bar to cycle status:</span>
        {Object.entries(statusLabels).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`h-2 w-4 rounded ${statusColors[k]}`} />
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}
