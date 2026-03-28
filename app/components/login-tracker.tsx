'use client'

import { useEffect } from 'react'

export default function LoginTracker() {
  useEffect(() => {
    fetch('/api/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'login', page: 'dashboard' }),
    }).catch(() => {})
  }, [])

  return null
}
