'use client'

import { useEffect } from 'react'

/**
 * Detects Supabase password recovery hash fragment on ANY page
 * and redirects to /reset-password before the app processes it.
 *
 * This handles the case where Supabase redirects to the site root
 * (e.g. jahtipro.fi#access_token=...&type=recovery) instead of
 * /reset-password, which happens when the redirect URL is not
 * whitelisted in Supabase dashboard.
 */
export default function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash
    if (
      hash.includes('type=recovery') &&
      window.location.pathname !== '/reset-password'
    ) {
      // Redirect to /reset-password and preserve the hash fragment
      window.location.href = '/reset-password' + hash
    }
  }, [])

  return null
}
