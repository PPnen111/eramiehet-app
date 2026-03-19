export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === 'superadmin'
}

export function isAdminOrAbove(role: string | null | undefined): boolean {
  return role === 'superadmin' || role === 'admin'
}

export function isBoardOrAbove(role: string | null | undefined): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'board_member'
}

export function isMemberOrAbove(role: string | null | undefined): boolean {
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    role === 'board_member' ||
    role === 'member'
  )
}
