import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditEvent {
  actor_id: string
  actor_role?: string
  club_id?: string | null
  action: string
  resource_type?: string
  resource_id?: string
  outcome?: 'success' | 'denied'
  metadata?: Record<string, unknown>
}

export async function createAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_events').insert({
      actor_id: event.actor_id,
      actor_role: event.actor_role ?? null,
      club_id: event.club_id ?? null,
      action: event.action,
      resource_type: event.resource_type ?? null,
      resource_id: event.resource_id ?? null,
      outcome: event.outcome ?? 'success',
      metadata: event.metadata ?? null,
    })
    if (error) {
      console.error('[AUDIT] Insert failed:', error.message)
    }
  } catch (e) {
    console.error('[AUDIT] Error:', e)
    // Never let audit logging break the request
  }
}
