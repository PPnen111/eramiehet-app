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
    url.pathname.startsWith('/hallinto') ||
    url.pathname.startsWith('/superadmin') ||
    url.pathname.startsWith('/vaihda-seura')

  // Unauthenticated → login
  if (!user && isProtected) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated + protected (but not already on /vaihda-seura):
  // ensure active_club_id is set so all pages have a club context
  if (user && isProtected && !url.pathname.startsWith('/vaihda-seura')) {
    const { data } = await supabase
      .from('profiles')
      .select('active_club_id, role')
      .eq('id', user.id)
      .single()

    const profile = data as { active_club_id: string | null; role: string | null } | null

    // Superadmin works across all clubs — skip the check
    if (profile && profile.role !== 'superadmin' && !profile.active_club_id) {
      url.pathname = '/vaihda-seura'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
