export type ReminderEmailData = {
  memberName: string
  clubName: string
  description: string
  amountCents: number
  dueDate: string
  isOverdue: boolean
  adminEmail: string
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('fi-FI', {
    style: 'currency',
    currency: 'EUR',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fi-FI')
}

export function reminderSubject(data: ReminderEmailData): string {
  return `Maksumuistutus – ${data.description} erääntyi ${formatDate(data.dueDate)}`
}

export function reminderHtml(data: ReminderEmailData): string {
  const due = formatDate(data.dueDate)
  const headerBg = data.isOverdue ? '#3a1a1a' : '#1a3a1a'
  const badgeColor = data.isOverdue ? '#c0392b' : '#e67e22'
  const badgeText = data.isOverdue ? 'Erääntynyt' : 'Maksu erääntyy pian'
  const intro = data.isOverdue
    ? `Laskullanne on erääntynyt maksu. Pyydämme teitä ystävällisesti hoitamaan sen mahdollisimman pian.`
    : `Muistutamme, että teillä on maksu, jonka eräpäivä on ${due}. Maksu erääntyi 7 päivän kuluttua.`

  return `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${reminderSubject(data)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${headerBg};padding:28px 32px;">
              <span style="display:inline-block;background:${badgeColor};color:#ffffff;font-size:11px;font-weight:bold;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">${badgeText}</span>
              <h1 style="margin:0;font-size:22px;color:#ffffff;">${data.clubName}</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:16px;color:#333333;">Hei ${data.memberName},</p>
              <p style="margin:12px 0 0;font-size:15px;color:#555555;line-height:1.6;">
                ${intro}
              </p>
            </td>
          </tr>

          <!-- Payment details box -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;">
                    <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Kuvaus</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:#1a1a1a;">${data.description}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Summa</p>
                          <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:${headerBg};">${formatEuros(data.amountCents)}</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Eräpäivä</p>
                          <p style="margin:4px 0 0;font-size:18px;font-weight:bold;color:#1a1a1a;">${due}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:15px;color:#444444;line-height:1.7;">
                Lisätietoja laskusta: <a href="mailto:${data.adminEmail}"
                style="color:${headerBg};font-weight:bold;">${data.adminEmail}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0;padding:16px 32px;border-top:1px solid #e0e0e0;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;">
                Erämiesten App &mdash; automaattinen viesti, älä vastaa tähän sähköpostiin
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
