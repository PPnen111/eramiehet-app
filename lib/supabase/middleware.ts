import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users from protected routes to login
  const url = request.nextUrl.clone()
  const isProtected =
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/tapahtumat') ||
    url.pathname.startsWith('/jasenet') ||
    url.pathname.startsWith('/dokumentit') ||
    url.pathname.startsWith('/metsastajille') ||
    url.pathname.startsWith('/saalis') ||
    url.pathname.startsWith('/erakartano') ||
    url.pathname.startsWith('/maksut') ||
    url.pathname.startsWith('/hallinto')

  if (!user && isProtected) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
