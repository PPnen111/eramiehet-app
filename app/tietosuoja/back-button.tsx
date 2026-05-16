'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-[#2d6a2d] hover:text-[#1e3d1e]"
    >
      ← Takaisin
    </button>
  )
}
