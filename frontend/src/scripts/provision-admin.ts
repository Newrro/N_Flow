import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Manually parse .env.local because tsx doesn't load it by default
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

console.log('Loaded env keys:', Object.keys(env))
console.log('NEXT_PUBLIC_SUPABASE_URL:', env['NEXT_PUBLIC_SUPABASE_URL'])
console.log('SUPABASE_SERVICE_ROLE_KEY starts with:', env['SUPABASE_SERVICE_ROLE_KEY']?.substring(0, 15))

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

async function createFirstAdmin() {
  const name = 'Parth Harmalkar'
  const email = 'parthharmalkar738@gmail.com'
  const password = 'Parth@1609'
  const employeeId = 'ADMIN-001'

  console.log(`Provisioning Admin: ${email}...`)

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: 'admin', employee_id: employeeId }
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    return
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      name,
      role: 'admin',
      employee_id: employeeId
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Error creating profile:', profileError.message)
    // Cleanup
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return
  }

  console.log('Successfully created Global Administrator account!')
  console.log('You can now login at /login with these credentials.')
}

createFirstAdmin()
