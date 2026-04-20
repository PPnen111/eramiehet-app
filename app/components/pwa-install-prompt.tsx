'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('pwa-dismissed')) {
      setDismissed(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const install = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
    dismiss()
  }

  const dismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa-dismissed', '1')
  }

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 mx-auto max-w-sm rounded-xl border border-green-700 bg-green-950 px-4 py-3 shadow-2xl flex items-center gap-3">
      <p className="flex-1 text-sm text-white">Asenna JahtiPro kotinäytölle</p>
      <button
        onClick={() => void install()}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 transition-colors"
      >
        Asenna
      </button>
      <button onClick={dismiss} className="text-green-500 hover:text-green-300">
        <X size={16} />
      </button>
    </div>
  )
}
