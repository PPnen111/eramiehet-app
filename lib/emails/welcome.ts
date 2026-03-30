export type WelcomeEmailData = {
  fullName: string
  clubName: string
  email: string
}

export function welcomeSubject(): string {
  return 'Tervetuloa JahtiPro-sovellukseen!'
}

export function welcomeHtml(data: WelcomeEmailData): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#14532d">Tervetuloa JahtiPro-sovellukseen!</h2>
      <p>Hei ${data.fullName}!</p>
      <p>Sinut on lisätty <strong>${data.clubName}</strong> JahtiPro-sovellukseen.</p>
      <p>
        Kirjaudu sisään osoitteessa:
        <a href="https://jahtipro.fi/login" style="color:#16a34a">jahtipro.fi/login</a>
      </p>
      <p>Käytä sähköpostiosoitettasi: <strong>${data.email}</strong></p>
      <p>Jos et muista salasanaa, klikkaa &ldquo;Unohdin salasanan&rdquo;.</p>
      <p style="margin-top:24px;color:#6b7280">
        Terveisin,<br>JahtiPro
      </p>
    </div>
  `.trim()
}
