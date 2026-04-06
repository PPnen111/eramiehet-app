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

function Badge({ color, children }: { color: 'red' | 'yellow'; children: React.ReactNode }) {
  const cls =
    color === 'red'
      ? 'border-red-800/60 bg-red-900/20 text-red-300'
      : 'border-yellow-800/60 bg-yellow-900/20 text-yellow-300'
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-sm ${cls}`}>{children}</div>
  )
}

export default function SecurityPlan() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-green-800 bg-white/5 p-5 text-center">
        <h2 className="text-xl font-bold text-white">JahtiPro Security & GDPR Control Plane</h2>
        <p className="mt-1 text-sm text-green-500">Tekninen suunnitelma v1.0</p>
      </div>

      {/* 1. Executive Summary */}
      <Section title="1. Executive Summary" defaultOpen>
        <div className="space-y-3 text-sm text-green-200 leading-relaxed">
          <p>
            JahtiPro on multi-tenant SaaS-palvelu, jossa jokainen metsästysseura on oman jäsendatansa
            rekisterinpitäjä ja JahtiPro toimii henkilötietojen käsittelijänä. Rakennettava Security &
            GDPR Control Plane ei ole erillinen raporttityökalu, vaan sovellukseen sisäänrakennettu
            valvontakerros joka:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-green-300">
            <li>Pakottaa oikeudet jokaisessa API-kutsussa</li>
            <li>Eristää tenant-datan arkkitehtuuritasolla</li>
            <li>Lokittaa kaikki kriittiset tapahtumat muuttumattomasti</li>
            <li>Havaitsee poikkeamat reaaliajassa sääntökoneella</li>
            <li>Tukee GDPR-oikeuspyyntöjä automaattisesti</li>
            <li>Tuottaa auditointivalmiin todistusaineiston</li>
          </ul>
        </div>
      </Section>

      {/* 2. Kriittisimmät riskit */}
      <Section title="2. Kriittisimmät riskit nyt">
        <div className="space-y-2">
          <Badge color="red">🔴 Tenant-datan vuoto — assertTenantScope() puuttuu API-reiteistä</Badge>
          <Badge color="red">🔴 Ei audit logeja — tietoturvaloukkauksia ei voida tutkia jälkikäteen</Badge>
          <Badge color="red">🔴 Superadminilla liian laaja pysyvä pääsy — JIT-prosessi puuttuu</Badge>
          <Badge color="yellow">🟡 GDPR-oikeuspyyntöjen workflow puuttuu</Badge>
          <Badge color="yellow">🟡 Karttasalaisuudet selväkielisinä — SecretAccessEvent puuttuu</Badge>
          <Badge color="yellow">🟡 Anomaliahavaitseminen puuttuu kokonaan</Badge>
        </div>
      </Section>

      {/* 3. MVP */}
      <Section title="3. Suositeltu ensimmäinen toteutus (MVP)">
        <div className="space-y-2 text-sm">
          {[
            ['AuditEvent-taulu + createAuditEvent() + sanitizeForAudit()', '1 pv'],
            ['assertTenantScope() jokaiseen API-reitiin', '2-3 pv'],
            ['RBAC-tarkistus palvelukerroksessa', '2-3 pv'],
            ['SupportAccessGrant + JIT-prosessi superadminille', '1-2 pv'],
            ['Yksinkertainen audit explorer kehityssivulle', '1 pv'],
          ].map(([task, est], i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-green-900/40 bg-white/[0.02] px-4 py-2.5">
              <span className="mt-0.5 text-green-700">☐</span>
              <span className="flex-1 text-green-200">{task}</span>
              <span className="shrink-0 text-xs text-green-600">{est}</span>
            </div>
          ))}
          <p className="mt-3 rounded-lg bg-green-900/20 px-4 py-2 text-sm font-medium text-green-300">
            Estimaatti: 2-3 viikkoa
          </p>
        </div>
      </Section>

      {/* 4. Roadmap */}
      <Section title="4. Roadmap">
        <div className="space-y-4">
          {[
            {
              phase: 'MVP (0-3 kk)',
              badge: '🔴',
              subtitle: 'Pakollinen ennen 50 seuraa',
              items: [
                'AuditEvent-taulu ja lokitushelper',
                'assertTenantScope() kaikkiin API-reitteihin',
                'RBAC palvelukerroksessa',
                'SupportAccessGrant JIT-prosessi',
                'PrivacyRequest-taulu',
              ],
            },
            {
              phase: 'Vaihe 2 (3-9 kk)',
              badge: '🟡',
              subtitle: 'Pakollinen ennen 100 seuraa',
              items: [
                'Anomaly detector',
                'SecurityIncident + BreachCase workflow',
                'Admin compliance dashboard',
                'DSAR-vienti automaattisesti',
                'Retention-ajo',
              ],
            },
            {
              phase: 'Vaihe 3 (9-18 kk)',
              badge: '🟢',
              subtitle: 'Pakollinen ennen 250 seuraa',
              items: [
                'Täysi GDPR-oikeustyökalu (6 oikeustyyppiä)',
                'Karttasalaisuuksien rotaatiotyökalu',
                'PSP-integraatio (korttitiedot pois JahtiProsta)',
                'Uudet aliroolit: rahastonhoitaja, dokumenttivastaava',
              ],
            },
            {
              phase: 'Vaihe 4 (18-36 kk)',
              badge: '🔵',
              subtitle: '500 seuraa',
              items: [
                'Ulkoinen tietoturva-auditointi (pentest)',
                'ISO 27001 -valmistelu',
                'Automaattinen DPA-sopimuksen hallinta',
                'SIEM-integraatio',
              ],
            },
          ].map((p, i) => (
            <div key={i} className="rounded-lg border border-green-900/40 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{p.badge}</span>
                <h4 className="font-semibold text-white">{p.phase}</h4>
                <span className="text-xs text-green-600">— {p.subtitle}</span>
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

      {/* 5. Top 10 backlog */}
      <Section title="5. Top 10 backlog">
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-green-200">
          <li>AuditEvent-taulu + createAuditEvent() + sanitizeForAudit()</li>
          <li>assertTenantScope() jokaiseen API-reitiin</li>
          <li>RBAC palvelukerroksessa (ei vain UI:ssa)</li>
          <li>SupportAccessGrant + JIT-prosessi superadminille</li>
          <li>SecurityIncident + BreachCase -workflow</li>
          <li>PrivacyRequest-taulu + admin-näkymä + deadline-laskuri</li>
          <li>Anomaly detector (massalataus, jäsenkatselu, cross-tenant)</li>
          <li>DataRetentionRule + retention-ajo</li>
          <li>Karttasalaisuuksien salaus levossa + SecretAccessEvent</li>
          <li>Superadmin security dashboard</li>
        </ol>
      </Section>

      {/* 6. Top 10 audit-lokitapahtumaa */}
      <Section title="6. Top 10 pakollista audit-lokitapahtumaa">
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-green-200">
          <li><code className="text-green-400">login.success</code> / <code className="text-green-400">login.failed</code></li>
          <li><code className="text-green-400">member.list</code> (kuka katsoi, montako jäsentä)</li>
          <li><code className="text-green-400">document.download</code> (kuka latasi, mikä dokumentti)</li>
          <li><code className="text-green-400">payment.list</code> (kuka katsoi, montako tietuetta)</li>
          <li><code className="text-green-400">role.changed</code> (kuka muutti, kenen rooli, vanha/uusi arvo)</li>
          <li><code className="text-green-400">member.deleted</code> (kuka poisti, kenen tiedot)</li>
          <li><code className="text-green-400">support_access.granted</code> / <code className="text-green-400">support_access.used</code></li>
          <li><code className="text-green-400">privacy_request.opened</code> / <code className="text-green-400">privacy_request.completed</code></li>
          <li><code className="text-green-400">secret.viewed</code> (karttakirjautuminen katsottu)</li>
          <li><code className="text-green-400">tenant_violation.attempted</code> (cross-tenant yritys)</li>
        </ol>
      </Section>

      {/* 7. Tietomallit */}
      <Section title="7. Tietomallit (yhteenveto)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-green-800 text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Taulu</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Tarkoitus</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Prioriteetti</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['AuditEvent', 'Kaikki kriittiset tapahtumat (append-only)', '🔴 MVP'],
                ['SecurityIncident', 'Tunnistettu tietoturvapoikkeama', '🔴 MVP'],
                ['PrivacyRequest', 'GDPR-oikeuspyyntöjen workflow', '🔴 MVP'],
                ['SupportAccessGrant', 'JIT tuki-pääsy asiakkaan dataan', '🔴 MVP'],
                ['RiskSignal', 'Yksittäinen anomaliahavainto', '🟡 Vaihe 2'],
                ['BreachCase', '72h ilmoitusvelvollisuuden dokumentointi', '🟡 Vaihe 2'],
                ['DataRetentionRule', 'Säilytysaikojen hallinta', '🟡 Vaihe 2'],
                ['DocumentAccessEvent', 'Dokumenttien latausten auditointi', '🟡 Vaihe 2'],
                ['SecretAccessEvent', 'Karttakirjautumisten käyttöloki', '🟡 Vaihe 2'],
                ['PaymentAccessEvent', 'Maksudatan käyttöloki', '🟡 Vaihe 2'],
                ['ComplianceIssue', 'Konfiguraatio-ongelmat', '🟢 Vaihe 3'],
                ['DataClassification', 'Tietoluokkien määrittely', '🟢 Vaihe 3'],
              ].map(([name, desc, prio], i) => (
                <tr key={i} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 font-mono text-xs text-green-300">{name}</td>
                  <td className="px-3 py-2 text-green-200">{desc}</td>
                  <td className="px-3 py-2 text-xs">{prio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 8. Kontrollimatriisi */}
      <Section title="8. Kontrollimatriisi">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-green-800 text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Riski</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Ehkäisevä kontrolli</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Havaitseva kontrolli</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-400">Audit evidence</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Tenant-datan vuoto', 'RLS + assertTenantScope()', 'cross_tenant_attempt RiskSignal', 'AuditEvent (denied)'],
                ['Broken access control', 'RBAC jokaisessa API-kutsussa', 'Failed access burst', 'AuditEvent (denied)'],
                ['Dokumenttien tietovuoto', 'Signed URL + DocumentAccessEvent', 'Massalataus-sääntö', 'DocumentAccessEvent'],
                ['Karttasalaisuuksien vuoto', 'Vain admin näkee, SecretAccessEvent', 'map_credential_abuse', 'SecretAccessEvent'],
                ['GDPR-oikeuksien laiminlyönti', 'Automaattinen deadline', 'PrivacyRequest monitorointi', 'PrivacyRequest-taulu'],
                ['72h breach-ilmoitus', 'Reaaliaikainen anomaliahavaitseminen', 'SecurityIncident → BreachCase', 'BreachCase-taulu'],
                ['Superadminin väärinkäyttö', 'JIT SupportAccessGrant vaaditaan', 'superadmin_anomaly', 'SupportAccessGrant + AuditEvent'],
              ].map(([risk, prevent, detect, evidence], i) => (
                <tr key={i} className="border-b border-green-900/30 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 font-medium text-white">{risk}</td>
                  <td className="px-3 py-2 text-green-300">{prevent}</td>
                  <td className="px-3 py-2 text-green-300">{detect}</td>
                  <td className="px-3 py-2 text-xs text-green-400">{evidence}</td>
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
