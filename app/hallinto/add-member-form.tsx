'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const MEMBER_TYPES = [
  { value: '01/Jäsen / Varsinainen jäsen', label: '01 – Varsinainen jäsen' },
  { value: '02/Kunniajäsen', label: '02 – Kunniajäsen' },
  { value: '03/Nuorisojäsen', label: '03 – Nuorisojäsen' },
  { value: '06/Maanomistajajäsen', label: '06 – Maanomistajajäsen' },
]

const BILLING_METHODS = [
  { value: 'Sähköpostilasku', label: 'Sähköpostilasku' },
  { value: 'Paperilasku', label: 'Paperilasku' },
  { value: 'E-lasku / verkkolasku', label: 'E-lasku / verkkolasku' },
]

interface Props {
  onDone: (message: string) => void
  onCancel: () => void
}

export default function AddMemberForm({ onDone, onCancel }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [memberNumber, setMemberNumber] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [memberType, setMemberType] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [homeMunicipality, setHomeMunicipality] = useState('')
  const [billingMethod, setBillingMethod] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [sendInvite, setSendInvite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName) {
      setError('Nimi on pakollinen')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: email.trim() || null,
          phone: phone.trim() || null,
          member_number: memberNumber.trim() || null,
          birth_date: birthDate || null,
          member_type: memberType || null,
          street_address: streetAddress.trim() || null,
          postal_code: postalCode.trim() || null,
          city: city.trim() || null,
          home_municipality: homeMunicipality.trim() || null,
          billing_method: billingMethod || null,
          additional_info: additionalInfo.trim() || null,
          send_invite: sendInvite,
        }),
      })

      const data = (await res.json()) as { error?: string; invited?: boolean }
      if (!res.ok) {
        setError(data.error ?? 'Tallennus epäonnistui')
        setSaving(false)
        return
      }

      onDone(data.invited ? 'Jäsen lisätty ja kutsu lähetetty!' : 'Jäsen lisätty!')
    } catch {
      setError('Verkkovirhe. Yritä uudelleen.')
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-green-900 bg-transparent px-3 py-2 text-sm text-white placeholder:text-green-800 focus:outline-none focus:ring-1 focus:ring-green-600 transition-colors'
  const labelClass = 'mb-1 block text-xs font-medium text-green-400'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* Slide-in panel */}
      <div className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-gradient-to-b from-green-950 to-stone-950 border-l border-green-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-green-800 bg-green-950/90 backdrop-blur px-5 py-4">
          <h2 className="text-lg font-bold text-white">Uusi jäsen</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-green-500 hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {/* Nimi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Etunimi *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Matti"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sukunimi</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Meikäläinen"
                className={inputClass}
              />
            </div>
          </div>

          {/* Sähköposti + Puhelin */}
          <div>
            <label className={labelClass}>Sähköposti</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="matti@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Puhelinnumero</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0401234567"
              className={inputClass}
            />
          </div>

          {/* Jäsennumero + Syntymäaika */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Jäsennumero</label>
              <input
                type="text"
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                placeholder="001"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Syntymäaika</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Jäsenlaji */}
          <div>
            <label className={labelClass}>Jäsenlaji</label>
            <select
              value={memberType}
              onChange={(e) => setMemberType(e.target.value)}
              className={`${inputClass} [&>option]:bg-green-950 [&>option]:text-white`}
            >
              <option value="">Valitse...</option>
              {MEMBER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Osoite */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Osoitetiedot</p>
            <div>
              <label className={labelClass}>Postitusosoite</label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Metsätie 5"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Postinumero</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="00100"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Postitoimipaikka</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Helsinki"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Kotikunta</label>
              <input
                type="text"
                value={homeMunicipality}
                onChange={(e) => setHomeMunicipality(e.target.value)}
                placeholder="Helsinki"
                className={inputClass}
              />
            </div>
          </div>

          {/* Laskutustapa */}
          <div>
            <label className={labelClass}>Laskutustapa</label>
            <select
              value={billingMethod}
              onChange={(e) => setBillingMethod(e.target.value)}
              className={`${inputClass} [&>option]:bg-green-950 [&>option]:text-white`}
            >
              <option value="">Valitse...</option>
              {BILLING_METHODS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Lisätiedot */}
          <div>
            <label className={labelClass}>Lisätiedot</label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={2}
              placeholder="Vapaamuotoiset lisätiedot..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Kutsu-checkbox */}
          {email.trim() && (
            <label className="flex items-center gap-3 rounded-lg border border-green-800 bg-white/[0.03] px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="h-4 w-4 rounded border-green-700 bg-transparent text-green-500 focus:ring-green-600"
              />
              <span className="text-sm text-green-300">Lähetä kutsu sovellukseen sähköpostilla</span>
            </label>
          )}

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 rounded-lg border border-green-800 py-2.5 text-sm font-medium text-green-400 hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={saving || !fullName}
              className="flex-1 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
