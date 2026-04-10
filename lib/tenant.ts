/**
 * TENANT ISOLATION GUARD
 *
 * This module ensures that users can only access data
 * belonging to their own club (tenant).
 *
 * Usage in every API route:
 *   const actor = await getActorContext(user.id)
 *   assertTenantScope(actor, requested_club_id)
 *
 * Test cases that MUST pass:
 * - Member of club A cannot access club B data → 403
 * - Superadmin can access any club → 200
 * - User with no club cannot access any club data → 403
 * - Cross-tenant attempt is logged to audit_events
 */

import { createAdminClient } from '@/lib/supabase/admin'

export class TenantViolationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TenantViolationError'
  }
}

export interface ActorContext {
  id: string
  role: string
  club_id: string | null
  active_club_id: string | null
}

export function assertTenantScope(
  actor: ActorContext,
  requested_club_id: string
): void {
  if (actor.role === 'superadmin') return

  const effective_club_id = actor.active_club_id ?? actor.club_id

  if (!effective_club_id) {
    throw new TenantViolationError(
      `Actor ${actor.id} has no club assigned`
    )
  }

  if (effective_club_id !== requested_club_id) {
    throw new TenantViolationError(
      `Actor ${actor.id} (club: ${effective_club_id}) attempted cross-tenant access to club: ${requested_club_id}`
    )
  }
}

export function getEffectiveClubId(actor: ActorContext): string {
  const id = actor.active_club_id ?? actor.club_id
  if (!id) throw new TenantViolationError(`Actor ${actor.id} has no club assigned`)
  return id
}

export async function getActorContext(user_id: string): Promise<ActorContext> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, club_id, active_club_id')
    .eq('id', user_id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const p = profile as { id: string; role: string | null; club_id: string | null; active_club_id: string | null }

  return {
    id: p.id,
    role: p.role ?? 'member',
    club_id: p.club_id,
    active_club_id: p.active_club_id,
  }
}

export async function logTenantViolation(
  actor: ActorContext,
  requested_club_id: string
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('audit_events').insert({
      actor_id: actor.id,
      actor_role: actor.role,
      club_id: requested_club_id,
      action: 'tenant_violation.attempted',
      resource_type: 'club',
      resource_id: requested_club_id,
      outcome: 'denied',
      metadata: {
        attempted_club_id: requested_club_id,
        actor_club_id: actor.active_club_id ?? actor.club_id,
      },
    })
  } catch {
    // Audit logging failure should never break the request
  }
}

/** Helper: run tenant check and return 403 Response on violation, or null if OK */
export async function guardTenant(
  actor: ActorContext,
  requested_club_id: string
): Promise<Response | null> {
  try {
    assertTenantScope(actor, requested_club_id)
    return null
  } catch (e) {
    if (e instanceof TenantViolationError) {
      console.error('[TENANT VIOLATION]', e.message)
      await logTenantViolation(actor, requested_club_id)
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw e
  }
}
