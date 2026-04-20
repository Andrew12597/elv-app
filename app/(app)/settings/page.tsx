export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { Settings } from 'lucide-react'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('name')

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-slate-100 rounded-xl p-2">
          <Settings className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage employees and app configuration</p>
        </div>
      </div>
      <SettingsClient employees={employees ?? []} />
    </div>
  )
}
