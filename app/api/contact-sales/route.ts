import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const body = await request.json() as unknown
  const { name, email, plan, message } = body as {
    name?: string
    email?: string
    plan?: string | null
    message?: string
  }

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Nimi ja sähköposti ovat pakollisia' }, { status: 400 })
  }

  const planLabel = plan ?? 'Ei valittu'

  const { error } = await resend.emails.send({
    from: 'JahtiPro <noreply@eramiehet.fi>',
    to: 'paunonen@gmail.com',
    subject: `Tilausyhteydenotto: ${name} — ${planLabel}`,
    text: [
      `Nimi: ${name}`,
      `Sähköposti: ${email}`,
      `Paketti: ${planLabel}`,
      '',
      message ? `Viesti:\n${message}` : 'Ei lisätietoja.',
    ].join('\n'),
  })

  if (error) {
    console.error('contact-sales email error:', error)
    return NextResponse.json({ error: 'Sähköpostin lähetys epäonnistui' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
