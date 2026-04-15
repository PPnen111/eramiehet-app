import { createAdminClient } from '@/lib/supabase/admin'

export async function getNextInvoiceNumber(club_id: string): Promise<string> {
  const year = new Date().getFullYear()
  const admin = createAdminClient()

  const { count } = await admin
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club_id)
    .gte('created_at', `${year}-01-01`)

  const sequence = String((count ?? 0) + 1).padStart(3, '0')
  return `${year}-${sequence}`
}
