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
  console.log('Fetching profiles...')
  const { data: profiles, error } = await supabase.from('profiles').select('*')
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Profiles currently in db:', profiles)
  }
}

list()
