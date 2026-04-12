import { createAdminClient } from '@/lib/supabase/admin'

export interface LimitCheck {
  allowed: boolean
  current: number
  limit: number
  plan: string
  plan_label: string
  resource: string
}

export async function checkPlanLimit(
  club_id: string,
  resource: 'members' | 'rental_locations' | 'documents' | 'groups' | 'admins'
): Promise<LimitCheck> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .rpc('check_plan_limit', {
      p_club_id: club_id,
      p_resource: resource,
    })

  if (error || !data) {
    // If function fails, allow the action (fail-open)
    return { allowed: true, current: 0, limit: 9999, plan: 'unknown', plan_label: 'Unknown', resource }
  }

  return data as unknown as LimitCheck
}

export function limitExceededResponse(check: LimitCheck): Response {
  return Response.json(
    {
      error: `Pakettisi raja täynnä: ${check.current}/${check.limit} ${check.resource}. Päivitä paketti jatkaaksesi.`,
      limit_exceeded: true,
      current: check.current,
      limit: check.limit,
      plan: check.plan,
      plan_label: check.plan_label,
    },
    { status: 403 }
  )
}
