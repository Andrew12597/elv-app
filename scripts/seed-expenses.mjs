import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rjffcwhepnsmlafjdeff.supabase.co',
  'sb_publishable_XYQ5le5zaqSf2mjolumBkw_ZOLCyHOR'
)

// First get all projects so we can map project_id text -> uuid
const { data: projects } = await supabase.from('projects').select('id, project_id')
const projectMap = {}
for (const p of projects) {
  if (p.project_id) projectMap[p.project_id] = p.id
}

// Create Internal project (P1000) if it doesn't exist
let internalId = projectMap['P1000']
if (!internalId) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase.from('projects').insert({
    project_id: 'P1000',
    name: 'Internal',
    client: 'ELV Australia',
    status: 'active',
    quoted_price: 0,
    start_date: today,
    end_date: today,
  }).select('id').single()
  internalId = data?.id
  console.log('Created Internal project:', internalId)
}

// Also handle Rothschild Service
const rothschildId = projectMap['Rothschild Service'] ?? projectMap['ROTH-SVC']

const expenses = [
  { proj: 'P1000', vendor: 'Akubella', description: 'Akubella Devices', price_code: '9-10.001', amount: 1146.21, date: '2025-11-24' },
  { proj: 'P1000', vendor: 'SuperLoop', description: 'Internet for office', price_code: '9-10.001', amount: 74.00, date: '2025-11-24' },
  { proj: 'P1000', vendor: 'Bunnings', description: 'Misc Items for office', price_code: '9-10.001', amount: 153.21, date: '2025-11-24' },
  { proj: 'P1000', vendor: 'Bunnings', description: 'Misc Items for office', price_code: '9-10.001', amount: 85.44, date: '2025-11-28' },
  { proj: 'P1000', vendor: 'Bunnings', description: 'Misc Items for office', price_code: '9-10.001', amount: 36.58, date: '2025-12-01' },
  { proj: 'P1000', vendor: 'Bunnings', description: 'Misc Items for office', price_code: '9-10.001', amount: 64.13, date: '2025-12-01' },
  { proj: 'P2501', vendor: 'SavvyCo', description: 'Work for Melrose', price_code: '9-08.001', amount: 5320.00, date: '2025-12-08' },
  { proj: 'P1000', vendor: 'Theophilou Tax Accountants', description: 'Company Creation', price_code: '9-10.005', amount: 1100.00, date: '2025-12-23' },
  { proj: 'P1000', vendor: 'Superloop', description: 'Internet for office', price_code: '9-10.001', amount: 75.00, date: '2025-12-24' },
  { proj: 'P1000', vendor: 'TLE', description: 'Supplies', price_code: '9-10.001', amount: 112.37, date: '2026-01-13' },
  { proj: 'P2516', vendor: 'SavyCo', description: 'Hours for Adina', price_code: '9-08.001', amount: 10000.00, date: '2026-01-19' },
  { proj: 'P2502', vendor: 'SecuSafe', description: 'Items for Clovelly', price_code: '9-12.001', amount: 4892.67, date: '2026-01-19' },
  { proj: 'P2502', vendor: 'SpyMonkey', description: 'CCTV for Clovelly', price_code: '9-02.001', amount: 1881.76, date: '2026-01-19' },
  { proj: 'ROTH-SVC', vendor: 'CSM', description: '12 x Activor remotes', price_code: '9-03.002', amount: 325.60, date: '2026-01-21' },
  { proj: 'P1000', vendor: 'SuperLoop', description: 'Internet for office', price_code: '9-10.001', amount: 75.00, date: '2026-01-27' },
  { proj: 'P2516', vendor: 'SavyCo', description: 'Hours for Adina', price_code: '9-08.001', amount: 10000.00, date: '2026-02-06' },
  { proj: 'P2502', vendor: 'SecuSafe', description: 'Exchanges items for wireless - Clovelly', price_code: '9-12.001', amount: 172.90, date: '2026-02-16' },
  { proj: 'P1000', vendor: 'SuperLoop', description: 'Internet for office', price_code: '9-10.001', amount: 75.00, date: '2026-02-24' },
  { proj: null, vendor: 'TLE', description: 'Cabling supplies (unassigned)', price_code: '9-01.001', amount: 2217.18, date: '2026-02-26' },
  { proj: 'P2608', vendor: 'Dicker Data', description: 'For builder at Oran Park', price_code: '9-03.002', amount: 237.38, date: '2026-02-27' },
  { proj: null, vendor: 'Dicker Data', description: 'Access control items (unassigned)', price_code: '9-03.002', amount: 387.20, date: '2026-02-27' },
  { proj: 'P1000', vendor: 'AusPost', description: 'PO Box Subscription', price_code: '9-10.002', amount: 192.00, date: '2026-03-02' },
  { proj: null, vendor: 'Dicker Data', description: 'Access control items (unassigned)', price_code: '9-03.002', amount: 542.96, date: '2026-03-02' },
  { proj: null, vendor: 'SavyCo', description: 'Cabling (unassigned)', price_code: '9-01.001', amount: 4030.26, date: '2026-03-06' },
  { proj: null, vendor: 'SavyCo', description: 'Works (unassigned)', price_code: '9-08.001', amount: 3933.50, date: '2026-03-11' },
  { proj: null, vendor: 'AGM Electrical Suppliers', description: 'Access control items (unassigned)', price_code: '9-03.002', amount: 37.40, date: '2026-03-11' },
  { proj: 'P2609', vendor: '4 Cabling', description: 'Power supply and managed switch replacement', price_code: '9-03.001', amount: 468.13, date: '2026-03-13' },
]

// Map to DB rows - unassigned go to Internal project
const rows = expenses.map(e => ({
  project_id: e.proj ? (projectMap[e.proj] ?? internalId) : internalId,
  vendor: e.vendor,
  description: e.description,
  price_code: e.price_code,
  amount: e.amount,
  date: e.date,
  receipt_url: null,
}))

const { error } = await supabase.from('expenses').insert(rows)
if (error) {
  console.error('Error:', error.message)
} else {
  console.log(`✓ Successfully imported ${rows.length} expenses`)
  console.log(`  Total: $${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}`)
}
