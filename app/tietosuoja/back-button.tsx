'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-green-400 hover:text-green-300"
    >
      ← Takaisin
    </button>
  )
}
