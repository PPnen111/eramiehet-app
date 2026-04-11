'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-green-800 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <h3 className="font-semibold text-white">{title}</h3>
        <ChevronDown
          size={16}
          className={`text-green-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-green-900/40 px-5 py-4">{children}</div>}
    </div>
  )
}

function FlowCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-lg border border-green-900/40 bg-white/[0.02] p-4">
      <h4 className="mb-3 font-semibold text-white">{title}</h4>
      <div className="space-y-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="shrink-0 text-green-600">{i < steps.length - 1 ? '→' : '✓'}</span>
            <span className="text-green-300">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PRIO: Record<string, string> = {
  MUST: 'bg-red-900/30 text-red-300 border-red-800/40',
  SHOULD: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/40',
}

export default function AutomationPlan() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5 text-center">
        <h2 className="text-xl font-bold text-white">JahtiPro:n automatisoitavat prosessit</h2>
        <p className="mt-1 text-sm text-green-500">Multi-tenant SaaS — Tekninen suunnitelma</p>
      </div>

      {/* 1. Executive Summary */}
      <Section title="1. Executive Summary" defaultOpen>
        <div className="space-y-3 text-sm text-green-200 leading-relaxed">
          <p>Korkeimman ROI:n automaatiot seuraavaksi 18kk:</p>
          <ul className="list-disc pl-5 space-y-1 text-green-300">
            <li>Onboarding-automaatio (tenant-provisionointi + jäsen-/roolituonti)</li>
            <li>Maksujen automaatio (PSP-webhookit, reskontra, muistutukset)</li>
            <li>DSAR/GDPR-prosessit (export, oikaisu, poisto/anonymisointi, SLA-seuranta)</li>
            <li>Retention & deletion (säilytysajat, lokien elinkaari, anonymisointi)</li>
            <li>Incident detection (cross-tenant, authz-fail trendit, superadmin-JIT)</li>
            <li>Signed URL -elinkaari (lyhyt TTL, revokointi, latausten auditointi)</li>
            <li>Support JIT access (aikarajoitettu tukipääsy, syy-koodi, automaattinen peruutus)</li>
            <li>Dokumenttien AV-skannaus + karanteeni</li>
          </ul>
        </div>
      </Section>

      {/* 2. Automaatiokartta */}
      <Section title="2. Automaatiokartta ominaisuuksittain">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-green-800 text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Ominaisuus</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Prosessit</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Prioriteetti</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Dashboard', 'Toimintatilanne, viikkokooste hallitukselle, turva/GDPR-näkymä', 'SHOULD'],
                ['Jäsenet', 'Kutsu+aktivointivirta, CSV-tuonti, roolien provisiointi, inaktiivisten hallinta', 'MUST'],
                ['Tapahtumat', 'Muistutukset, RSVP-keruu, ICS-kutsu, osallistumislista', 'SHOULD'],
                ['Saalis', 'Tilastojen aggregointi, kiintiötarkistukset, kausiraportit', 'SHOULD'],
                ['Dokumentit', 'AV-skannaus+karanteeni, Signed URL+TTL, näkyvyysluokat, poistopolitiikka', 'MUST'],
                ['Eräkartano', 'Varauskonfliktien esto, muistutukset, maksukytkentä', 'SHOULD'],
                ['Maksut', 'PSP-webhook, laskut+muistutukset, reskontra, dunning', 'MUST'],
                ['Karttakalusto', 'Token-elinkaari+rotaatio, käyttöauditointi, minimointi', 'MUST'],
                ['Hallinto', 'DSAR-jonot+SLA, retention-säännöt, support JIT, access review', 'MUST'],
              ].map(([feature, processes, prio], i) => (
                <tr key={i} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 font-medium text-white">{feature}</td>
                  <td className="px-3 py-2 text-green-300">{processes}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIO[prio] ?? ''}`}>
                      {prio}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 3. Top 8 automaatiota */}
      <Section title="3. Top 8 automaatiota — virtauskaaviot">
        <div className="space-y-4">
          <FlowCard
            title="1. Tenant-provisionointi"
            steps={[
              'TenantCreated',
              'Provision Worker',
              'Luo default-roolit/ryhmät',
              'Luo admin + lähetä kutsu',
              'CSV-tuonti (opt.)',
              'Onboarding-tarkistukset',
              'Merkitse ACTIVE / NEEDS_ATTENTION',
            ]}
          />
          <FlowCard
            title="2. Laskutus + dunning"
            steps={[
              'Cron (kuukausittain)',
              'Luo laskut per tenant',
              'Lähetä laskut (email/PSP)',
              'Odota webhook',
              'Maksu saapuu → Merkitse maksetuksi',
              'Cron: eräpäivätarkistus → Muistutus',
              'Jos yli grace-period → Read-only tila',
            ]}
          />
          <FlowCard
            title="3. DSAR/export"
            steps={[
              'Pyyntö saapuu',
              'Henkilöllisyyden vahvistus + tenant scope',
              'Luo DSAR-tapaus + SLA-kello',
              'Export worker',
              'Minimointi/redaktointi',
              'Toimita latauslinkki',
              'Sulje tapaus + säilytä todisteet',
            ]}
          />
          <FlowCard
            title="4. Retention & deletion"
            steps={[
              'Cron (öinen ajo)',
              'Valitse säilytysajan ylittäneet tietueet',
              'Legal hold? → Ohita',
              'Anonymisoi tai poista',
              'Päivitä audit trail',
            ]}
          />
          <FlowCard
            title="5. Incident detection"
            steps={[
              'Auth/audit-lokit',
              'Log pipeline → SIEM',
              'Cross-tenant havaittu → P1: jäädytä + incident',
              'Authz-fail piikki → P2: rate limit + tiketti',
            ]}
          />
          <FlowCard
            title="6. Signed URL -elinkaari"
            steps={[
              'Käyttäjä pyytää dokumenttia',
              'AuthZ + tenant scope',
              'Luo signed URL (TTL-rajoitus)',
              'Audit: latauslinkki myönnetty',
              'URL vanhenee automaattisesti',
              'ACL muuttuu → Invalidoi versioinnilla',
              'Audit: linkki peruutettu',
            ]}
          />
          <FlowCard
            title="7. Support JIT access"
            steps={[
              'Tukipyyntö',
              'Pakollinen syy-koodi + tiketti-ID',
              'Hyväksyntävaihe',
              'Aikarajoitettu pääsy (max 8h)',
              'Kaikki toiminnot auditoitu',
              'Automaattinen vanheneminen',
            ]}
          />
          <FlowCard
            title="8. AV-skannaus + karanteeni"
            steps={[
              'DocumentUploaded',
              'Tallenna QUARANTINED-tilaan',
              'AV-skannaus worker',
              'Puhdas? → Kyllä: merkitse CLEAN + salli lataukset',
              'Ei: pidä karanteenissa + hälytä admineille',
              'Audit: doc_clean / doc_quarantined',
            ]}
          />
        </div>
      </Section>

      {/* 4. Tietoturva & GDPR checklist */}
      <Section title="4. Tietoturva & GDPR checklist automaatioille">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-green-800 text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Teema</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Minimikysymys</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Kriittisyys</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Tenant-eristys', 'Onko tenant_id pakotettu jokaisessa jobissa?', '🔴 KRIITTINEN'],
                ['Oikeusperuste', 'Käsitteleekö automaatio vain tarpeellista dataa?', '🔴 KRIITTINEN'],
                ['Lokitus', 'Kirjataanko kuka/mitä/milloin/mistä/millä oikeudella?', '🔴 KRIITTINEN'],
                ['Lokien suojaus', 'Siirretäänkö lokit erilliseen järjestelmään?', '🔴 KRIITTINEN'],
                ['Salaisuudet', 'Voivatko tokenit/salasanat vuotaa lokiin tai UI:hin?', '🔴 KRIITTINEN'],
                ['Poikkeamat & 72h', 'Onko IR-runbook ja evidence pack olemassa?', '🟡 TÄRKEÄ'],
                ['Kansainväliset siirrot', 'Siirtyykö data EU/ETA:n ulkopuolelle?', '🟡 TÄRKEÄ'],
                ['PCI ja maksut', 'Tallennetaanko korttidataa? (EI pidä)', '🟡 TÄRKEÄ'],
                ['Tiedostot', 'Onko allowlist, AV, storage webrootin ulkopuolella?', '🟡 TÄRKEÄ'],
                ['DPIA triggerit', 'Muodostaako automaatio profilointia?', '🟢 HUOMIO'],
              ].map(([theme, question, crit], i) => (
                <tr key={i} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 font-medium text-white">{theme}</td>
                  <td className="px-3 py-2 text-green-300">{question}</td>
                  <td className="px-3 py-2 text-xs">{crit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 5. Vaiheistus */}
      <Section title="5. Vaiheistus">
        <div className="space-y-4">
          {[
            {
              phase: 'Perustaso (0-3kk)',
              badge: '🔴',
              items: [
                'Job queue + idempotenssi + DLQ',
                'Audit event malli + log pipeline',
                'Tenant provisioning + onboarding checks',
                'PSP webhook + laskujen generointi',
              ],
            },
            {
              phase: 'Turva & GDPR (3-6kk)',
              badge: '🟡',
              items: [
                'DSAR export + SLA workflow',
                'Retention + deletion/anonymisointi',
                'Support JIT access + auditointi',
              ],
            },
            {
              phase: 'Dokumentit & Operointi (6-12kk)',
              badge: '🟢',
              items: [
                'AV-skannaus + karanteeni + signed URL lifecycle',
                'Incident detection + automaattinen ensivaste',
                'Täsmäytys + raportointi',
              ],
            },
          ].map((p, i) => (
            <div key={i} className="rounded-lg border border-green-900/40 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{p.badge}</span>
                <h4 className="font-semibold text-white">{p.phase}</h4>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-sm text-green-300">
                {p.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Riskirekisteri */}
      <Section title="6. Riskirekisteri (Top 10)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-green-800 text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Riski</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Todennäköisyys</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Vaikutus</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Mitigointi</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Job suorittaa väärälle tenantille', 'Kohtalainen', 'Kriittinen', 'tenant_id pakotus + testit'],
                ['Webhook forgery/replay', 'Kohtalainen', 'Korkea', 'Signature verify + idempotency'],
                ['Retention poistaa liikaa', 'Kohtalainen', 'Kriittinen', 'Legal hold + dry-run + grace period'],
                ['DSAR export vuotaa muita käyttäjiä', 'Pieni-Kohtalainen', 'Kriittinen', 'Data map testit + per-taulu scope'],
                ['AV-skanneri alhaalla', 'Kohtalainen', 'Korkea', 'Default quarantine + retry/backoff'],
                ['Signed URL TTL liian pitkä', 'Kohtalainen', 'Korkea', 'TTL clamp + config policy'],
                ['Audit-loki muokattavissa', 'Pieni-Kohtalainen', 'Kriittinen', 'Erillinen lokijärjestelmä + WORM'],
                ['Lokit sisältävät salaisuuksia', 'Kohtalainen', 'Korkea', 'Log scrubbing + lint rules'],
                ['Maksuautomaatio väärä dunning', 'Kohtalainen', 'Keskitaso', 'Grace period + read-only ennen blokkia'],
                ['Kartta-token rotaatio katkaisee käytön', 'Kohtalainen', 'Keskitaso', 'Overlap window + ilmoitukset'],
              ].map(([risk, prob, impact, mitigation], i) => (
                <tr key={i} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 font-medium text-white">{risk}</td>
                  <td className="px-3 py-2 text-green-300">{prob}</td>
                  <td className="px-3 py-2 text-green-300">{impact}</td>
                  <td className="px-3 py-2 text-xs text-green-400">{mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Footer */}
      <div className="rounded-xl border border-green-900 bg-white/[0.03] px-4 py-3 text-center">
        <p className="text-xs text-green-700">
          Dokumentti päivitetty: huhtikuu 2026 | Versio 1.0 | Luottamuksellinen
        </p>
      </div>
    </div>
  )
}
