import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh the session if it's expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const path = url.pathname

  // Public routes (login and home)
  if (path === '/login' || path === '/') {
    if (user) {
      // If logged in, redirect to dashboard based on role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'admin') {
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
      } else if (profile?.role === 'employee') {
        url.pathname = '/employee/dashboard'
        return NextResponse.redirect(url)
      } else {
        // Logged in but no profile row or role, allow page to load to prevent loops
        return response
      }
    }
    return response
  }

  // Protected routes
  if (!user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-based protection
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.role) {
    // If user exists but profile/role is missing, redirect to login
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/admin') && profile.role !== 'admin') {
    url.pathname = '/employee/dashboard'
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/employee') && profile.role !== 'employee') {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - handled separately or allowed)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
