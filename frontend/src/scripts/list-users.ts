import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY']
)

async function list() {
  console.log('Fetching auth.users...')
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Error fetching users:', error)
  } else {
    console.log('Total users fetched:', users.users.length)
    users.users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata:`, u.user_metadata)
    })
  }
}

list()
