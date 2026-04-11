'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function CloseTabButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.opener !== null || (document.referrer && document.referrer.includes('jahtipro'))) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.close()}
      className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
    >
      <X size={14} />
      Sulje välilehti
    </button>
  )
}
