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

async function check() {
  console.log('Querying projects table...')
  const { data: projects, error: pError } = await supabase.from('projects').select('*').limit(1)
  if (pError) {
    console.error('Projects table error:', pError.message)
  } else {
    console.log('Projects table exists! Row count check:', projects?.length)
  }

  console.log('Querying documents table...')
  const { data: documents, error: dError } = await supabase.from('documents').select('*').limit(1)
  if (dError) {
    console.error('Documents table error:', dError.message)
  } else {
    console.log('Documents table exists! Row count check:', documents?.length)
  }
}

check()
