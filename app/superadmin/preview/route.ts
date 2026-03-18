import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ROLES = ['admin', 'board_member', 'member']
const COOKIE_NAME = 'preview_role'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const exit = searchParams.get('exit')
  const role = searchParams.get('role')

  if (exit) {
    // Exit preview: clear cookie and return to superadmin panel
    const response = NextResponse.redirect(new URL('/superadmin', request.url))
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return response
  }

  // Set preview role and go to dashboard to test it
  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  if (role && ALLOWED_ROLES.includes(role)) {
    response.cookies.set(COOKIE_NAME, role, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
  }
  return response
}
