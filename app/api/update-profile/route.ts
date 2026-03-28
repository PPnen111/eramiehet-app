import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ei kirjautumista' }, { status: 401 })
  }

  const body = (await request.json()) as { full_name?: string; phone?: string }
  const { full_name, phone } = body

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
