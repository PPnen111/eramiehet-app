export type InvoiceEmailData = {
  memberName: string
  clubName: string
  description: string
  amountCents: number
  dueDate: string | null
  paymentId: string
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

/** Short reference number derived from the payment UUID */
function shortRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 12).toUpperCase()
}

export function invoiceSubject(data: InvoiceEmailData): string {
  return `Lasku – ${data.clubName} – ${data.description}`
}

export function invoiceHtml(data: InvoiceEmailData): string {
  const due = data.dueDate ? formatDate(data.dueDate) : '—'

  return `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${invoiceSubject(data)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a3a1a;padding:28px 32px;">
              <p style="margin:0;font-size:13px;color:#6aaf6a;letter-spacing:1px;text-transform:uppercase;">Lasku</p>
              <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;">${data.clubName}</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:16px;color:#333333;">Hei ${data.memberName},</p>
              <p style="margin:12px 0 0;font-size:15px;color:#555555;line-height:1.6;">
                Oheisena lasku ${data.clubName} -jäsenyydestä. Tarkistethan tiedot alla.
              </p>
            </td>
          </tr>

          <!-- Invoice details box -->
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
                  <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Summa</p>
                          <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#1a3a1a;">${formatEuros(data.amountCents)}</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Eräpäivä</p>
                          <p style="margin:4px 0 0;font-size:18px;font-weight:bold;color:#1a1a1a;">${due}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Viitenumero</p>
                    <p style="margin:4px 0 0;font-size:14px;font-family:monospace;color:#333333;letter-spacing:1px;">${shortRef(data.paymentId)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment instructions -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:15px;color:#444444;line-height:1.7;">
                Maksattehan laskun eräpäivään mennessä. Mikäli teillä on kysyttävää
                laskusta, ottakaa yhteyttä: <a href="mailto:${data.adminEmail}"
                style="color:#1a3a1a;font-weight:bold;">${data.adminEmail}</a>
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
