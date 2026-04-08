import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rjffcwhepnsmlafjdeff.supabase.co',
  'sb_publishable_XYQ5le5zaqSf2mjolumBkw_ZOLCyHOR'
)

const projects = [
  { project_id: 'P2501', name: 'Melrose Park', client: 'SV', pm: null, job_type: 'New Build', owner: 'SV', priority: 'High', status: 'active', quoted_price: 0, budget_cost: null, start_date: '2025-08-13', end_date: '2026-10-05', next_action: 'Alex & Ash cabling ongoing / Chris & Noah racks/network ongoing / TP Link coming soon', next_action_due: null },
  { project_id: 'P2502', name: 'Clovelly', client: 'AM', pm: null, job_type: 'New Build', owner: 'AM', priority: 'High', status: 'active', quoted_price: 0, budget_cost: null, start_date: '2025-05-23', end_date: '2026-04-10', next_action: 'Waiting for builder to confirm time to install', next_action_due: null },
  { project_id: 'P2503', name: 'Corrimal', client: 'Utech', pm: 'Steve - Utech', job_type: 'New Build', owner: null, priority: 'Low', status: 'active', quoted_price: 217287.20, budget_cost: 150000, start_date: '2026-04-01', end_date: '2026-08-01', next_action: 'Waiting for approval', next_action_due: null },
  { project_id: 'P2504', name: 'Rosebery', client: 'SV', pm: null, job_type: 'Add-on', owner: 'SV', priority: 'Medium', status: 'waiting-approval', quoted_price: 27024.36, budget_cost: 18000, start_date: '2025-10-13', end_date: '2025-10-13', next_action: 'Follow up with new building manager', next_action_due: null },
  { project_id: 'P2505', name: 'Double Bay', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'active', quoted_price: 70689.01, budget_cost: 50000, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Mid year start date approx', next_action_due: null },
  { project_id: 'P2506', name: 'Rhodes', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Waiting for plans from JIM (mid year)', next_action_due: null },
  { project_id: 'P2507', name: 'Liverpool', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Ask Jim for update (end of year)', next_action_due: null },
  { project_id: 'P2508', name: 'Castlereigh Street', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Ask Jim for update', next_action_due: null },
  { project_id: 'P2509', name: 'Crows Nest', client: null, pm: null, job_type: null, owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Ask Jim for update (end of year)', next_action_due: null },
  { project_id: 'P2510', name: 'Five Dock', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Ask Jim for update (delayed)', next_action_due: null },
  { project_id: 'P2511', name: '499 Kent Street', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Follow up', next_action_due: null },
  { project_id: 'P2512', name: 'Moree Hospital', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Sam assisting in investigating current active services', next_action_due: null },
  { project_id: 'P2513', name: 'Oran', client: null, pm: null, job_type: null, owner: null, priority: 'Low', status: 'cancelled', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Follow Up / Sam meeting Steve onsite', next_action_due: null },
  { project_id: 'P2514', name: 'Mcquinn Park', client: null, pm: null, job_type: null, owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: null, next_action_due: null },
  { project_id: 'P2515', name: 'Vaucluse', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Low', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2025-10-14', end_date: '2025-10-14', next_action: 'Current delays with services investigation', next_action_due: null },
  { project_id: 'P2516', name: 'Adina Hotel Darling Harbour', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Medium', status: 'active', quoted_price: 105811.19, budget_cost: 70000, start_date: '2025-10-14', end_date: '2026-04-01', next_action: 'Starting stage 2 - active', next_action_due: null },
  { project_id: 'P2601', name: 'Olympic Park', client: null, pm: null, job_type: null, owner: null, priority: 'Medium', status: 'cancelled', quoted_price: 0, budget_cost: null, start_date: '2026-02-04', end_date: '2026-02-04', next_action: 'Completion date 9/03/2026', next_action_due: null },
  { project_id: 'P2602', name: 'Paddington', client: null, pm: null, job_type: null, owner: null, priority: 'Low', status: 'active', quoted_price: 0, budget_cost: null, start_date: '2026-02-18', end_date: '2026-02-18', next_action: 'QTY of items and review cabling', next_action_due: null },
  { project_id: 'P2603', name: 'Ashfield', client: 'Utech', pm: 'George - Utech', job_type: 'Retirement Village', owner: null, priority: 'Low', status: 'active', quoted_price: 10508.00, budget_cost: 6500, start_date: '2026-06-01', end_date: '2026-09-01', next_action: 'Job not ready / scheduled start end of May/June, finish August', next_action_due: null },
  { project_id: 'P2604', name: 'Joyton Avenue', client: null, pm: null, job_type: 'New Build', owner: null, priority: 'Medium', status: 'quoting', quoted_price: 0, budget_cost: null, start_date: '2026-02-18', end_date: '2026-02-18', next_action: 'Waiting for drawings from Utech', next_action_due: null },
  { project_id: 'P2605', name: 'Ian Street, Rose Bay', client: null, pm: null, job_type: 'Automation', owner: null, priority: 'Medium', status: 'waiting-approval', quoted_price: 70000.00, budget_cost: 50000, start_date: '2026-02-25', end_date: '2026-02-25', next_action: null, next_action_due: null },
  { project_id: 'P2606', name: 'National Storage Hornsby', client: null, pm: 'Jake', job_type: null, owner: null, priority: 'High', status: 'waiting-approval', quoted_price: 231000.00, budget_cost: 140000, start_date: '2026-03-04', end_date: '2026-03-13', next_action: null, next_action_due: null },
  { project_id: 'P2607', name: 'RAS', client: null, pm: null, job_type: 'Fix', owner: null, priority: 'Low', status: 'on-hold', quoted_price: 0, budget_cost: null, start_date: '2026-03-07', end_date: '2026-03-07', next_action: 'ON HOLD', next_action_due: null },
  { project_id: 'P2608', name: 'Oran Park - Gate', client: null, pm: null, job_type: 'Gate / Intercom', owner: null, priority: 'Medium', status: 'completed', quoted_price: 1320.00, budget_cost: null, start_date: '2026-03-12', end_date: '2026-03-12', next_action: null, next_action_due: null },
  { project_id: 'P2609', name: 'ADA Dog Park', client: 'ADA', pm: null, job_type: 'Service', owner: null, priority: 'Medium', status: 'active', quoted_price: 1341.76, budget_cost: null, start_date: '2026-03-19', end_date: '2026-03-19', next_action: null, next_action_due: null },
  { project_id: 'P2610', name: 'Mount Annan (18 Banksia Road)', client: null, pm: null, job_type: 'Home Intercom', owner: null, priority: 'Medium', status: 'active', quoted_price: 12737.33, budget_cost: null, start_date: '2026-03-19', end_date: '2026-03-19', next_action: null, next_action_due: null },
  { project_id: 'P2611', name: 'Kent St CCTV', client: null, pm: null, job_type: 'Building Site CCTV', owner: null, priority: 'High', status: 'waiting-approval', quoted_price: 0, budget_cost: null, start_date: '2026-03-27', end_date: '2026-03-27', next_action: null, next_action_due: null },
  { project_id: 'P2612', name: 'Fred McNeil', client: null, pm: null, job_type: 'Smart Home', owner: null, priority: 'Medium', status: 'quoting', quoted_price: 3319.36, budget_cost: null, start_date: '2026-03-27', end_date: '2026-03-27', next_action: null, next_action_due: null },
  { project_id: 'ADA-SVC', name: 'ADA Dog Park (Service)', client: 'ADA', pm: null, job_type: 'Service', owner: null, priority: 'Low', status: 'completed', quoted_price: 0, budget_cost: null, start_date: '2025-01-01', end_date: '2025-01-01', next_action: null, next_action_due: null },
  { project_id: 'MOREE-SVC', name: 'Moree Service', client: 'Utech', pm: null, job_type: 'Service', owner: null, priority: 'Low', status: 'completed', quoted_price: 0, budget_cost: null, start_date: '2025-01-01', end_date: '2025-01-01', next_action: null, next_action_due: null },
  { project_id: 'ROTH-SVC', name: 'Rothschild Service', client: 'Rothschild', pm: null, job_type: 'Service', owner: null, priority: 'Low', status: 'completed', quoted_price: 0, budget_cost: null, start_date: '2025-01-01', end_date: '2025-01-01', next_action: null, next_action_due: null },
]

// Fix null clients
const cleaned = projects.map(p => ({
  ...p,
  client: p.client ?? p.name,
}))

const { data, error } = await supabase.from('projects').insert(cleaned)
if (error) {
  console.error('Error:', error.message)
  console.error('Details:', error.details)
} else {
  console.log('✓ Successfully imported', cleaned.length, 'projects')
}
