'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

interface Props {
  clubId: string
  initialPricing: string
  initialInstructions: string
  initialNotificationEmail: string
  initialApproverName: string
  initialApproverEmail: string
}

export default function EditCabinInfoForm({ clubId, initialPricing, initialInstructions, initialNotificationEmail, initialApproverName, initialApproverEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [pricing, setPricing] = useState(initialPricing)
  const [instructions, setInstructions] = useState(initialInstructions)
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail)
  const [approverName, setApproverName] = useState(initialApproverName)
  const [approverEmail, setApproverEmail] = useState(initialApproverEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: upsertError } = await supabase.from('cabin_info').upsert(
      {
        club_id: clubId,
        pricing_text: pricing || null,
        instructions_text: instructions || null,
        booking_notification_email: notificationEmail.trim() || null,
        approver_name: approverName.trim() || null,
        approver_email: approverEmail.trim() || null,
      },
      { onConflict: 'club_id' }
    )

    if (upsertError) {
      setError('Tallentaminen epäonnistui: ' + upsertError.message)
      setLoading(false)
      return
    }

    router.push('/erakartano')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-green-800 bg-white/5 p-5"
    >
      <div>
        <label className="mb-1 block text-sm font-semibold text-green-300">Hinnasto</label>
        <textarea
          value={pricing}
          onChange={(e) => setPricing(e.target.value)}
          rows={6}
          placeholder="Kirjoita hinnasto tähän..."
          className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-green-300">Ohjeet</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          placeholder="Kirjoita käyttöohjeet tähän..."
          className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-green-300">
          Varauspyyntöjen vastaanottaja
        </label>
        <input
          type="email"
          value={notificationEmail}
          onChange={(e) => setNotificationEmail(e.target.value)}
          placeholder="esim. toiminnanjohtaja@seura.fi"
          className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
        />
        <p className="mt-1 text-xs text-green-600">
          Tähän osoitteeseen lähetetään ilmoitus uusista varauspyynnöistä. Jos tyhjä, menee seuran
          admineille.
        </p>
      </div>

      <div className="rounded-xl border border-green-800 bg-white/[0.03] p-4 space-y-3">
        <label className="block text-sm font-semibold text-green-300">
          Varausten hyväksyjä
        </label>
        <div>
          <input
            type="text"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            placeholder="Nimi (esim. Matti Metsästäjä)"
            className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
          />
        </div>
        <div>
          <input
            type="email"
            value={approverEmail}
            onChange={(e) => setApproverEmail(e.target.value)}
            placeholder="Sähköposti (esim. matti@seura.fi)"
            className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
          />
        </div>
        <p className="text-xs text-green-600">
          Hyväksyjä saa ilmoituksen uusista varauspyynnöistä ja voi hyväksyä/hylätä ne hallintosivulla.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Tallennetaan...' : 'Tallenna'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/erakartano')}
          className="rounded-lg border border-green-800 px-4 py-2.5 text-sm text-green-300 hover:border-green-600"
        >
          Peruuta
        </button>
      </div>
    </form>
  )
}
