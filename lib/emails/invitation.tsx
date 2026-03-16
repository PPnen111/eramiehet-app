export type InvitationEmailData = {
  inviterName: string
  clubName: string
  token: string
}

export function invitationSubject(data: InvitationEmailData): string {
  return `Kutsu liittyä ${data.clubName} -sovellukseen`
}

export function invitationHtml(data: InvitationEmailData): string {
  const acceptUrl = `https://eramiehet-app.vercel.app/liity?token=${data.token}`

  return `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${invitationSubject(data)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a3a1a;padding:28px 32px;">
              <p style="margin:0;font-size:13px;color:#6aaf6a;letter-spacing:1px;text-transform:uppercase;">Jäsenkutsu</p>
              <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;">${data.clubName}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0;font-size:16px;color:#333333;">Hei,</p>
              <p style="margin:16px 0 0;font-size:15px;color:#555555;line-height:1.7;">
                <strong>${data.inviterName}</strong> kutsui sinut liittymään
                <strong>${data.clubName}</strong> -sovellukseen.
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#555555;line-height:1.7;">
                Hyväksy kutsu klikkaamalla alla olevaa linkkiä.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td style="padding:0 32px 32px;" align="center">
              <a href="${acceptUrl}"
                style="display:inline-block;background:#1a6b1a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:16px 36px;border-radius:8px;letter-spacing:0.3px;">
                Hyväksy kutsu
              </a>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:13px;color:#888888;text-align:center;">
                Kutsu vanhenee 7 päivän kuluttua.
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
