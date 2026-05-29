import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function provision() {
  const email = 'parthharmalkar738@gmail.com'
  const password = 'Parth@1609'
  
  console.log(`Checking if ${email} already exists in auth.users...`)
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError
  
  let user = users.users.find(u => u.email === email)
  
  if (!user) {
    console.log('Creating auth account...')
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Parth Harmalkar', role: 'admin', employee_id: 'ADMIN-001' }
    })
    if (error) throw error
    user = data.user
    console.log(`Auth account created. ID: ${user.id}`)
  } else {
    console.log(`Auth account already exists. ID: ${user.id}`)
  }

  console.log(`Attempting to link profile for ID: ${user.id}...`)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      name: 'Parth Harmalkar',
      role: 'admin',
      employee_id: 'ADMIN-001'
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Profile linkage failed:', profileError.message)
  } else {
    console.log('Profile successfully linked/updated.')
  }
}

provision()
