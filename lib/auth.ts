/**
 * Returns true for roles that have full administrative access (admin + superadmin).
 */
export function isAdminOrAbove(role: string | null): boolean {
  return role === 'superadmin' || role === 'admin'
}

/**
 * Returns true for roles that have board-level access or above
 * (board_member, admin, superadmin).
 */
export function isBoardOrAbove(role: string | null): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'board_member'
}
