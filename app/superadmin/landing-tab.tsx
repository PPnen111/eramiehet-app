'use client'

import { useState } from 'react'
import LandingV1 from './landing-v1'
import LandingV2 from './landing-v2'

export default function LandingTab() {
  const [version, setVersion] = useState<1 | 2>(1)

  return (
    <div>
      {/* Version switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">Landing page — versiovertailu</p>
          <p className="text-xs text-[#4a4a4a]">Esikatsele molemmat versiot ennen julkaisua</p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-[#e0d8cc]">
          <button
            onClick={() => setVersion(1)}
            className={`px-5 py-2 text-sm font-semibold transition-colors ${
              version === 1
                ? 'bg-[#1e3d1e] text-white'
                : 'text-[#2d6a2d] hover:bg-white hover:text-[#1e3d1e]'
            }`}
          >
            Versio 1 — Minimalistinen
          </button>
          <button
            onClick={() => setVersion(2)}
            className={`border-l border-[#e0d8cc] px-5 py-2 text-sm font-semibold transition-colors ${
              version === 2
                ? 'bg-[#1e3d1e] text-white'
                : 'text-[#2d6a2d] hover:bg-white hover:text-[#1e3d1e]'
            }`}
          >
            Versio 2 — Bold &amp; Visuaalinen
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 rounded-xl border border-[#e0d8cc] bg-white/[0.03] px-4 py-3 text-xs text-[#2d6a2d]">
        {version === 1 ? (
          <>
            <span className="font-semibold text-[#1e3d1e]">Versio 1 — Minimalistinen:</span>{' '}
            Puhdas vihreä teema, paljon ilmaa, typografia edellä. Sopii seuroille jotka arvostavat selkeyttä.
          </>
        ) : (
          <>
            <span className="font-semibold text-[#1e3d1e]">Versio 2 — Bold &amp; Visuaalinen:</span>{' '}
            Tummempi stone-teema, gradientit, glow-efektit, testimonials. Modernimpi SaaS-markkinointiasenne.
          </>
        )}
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-2xl border border-[#e0d8cc] shadow-2xl">
        {version === 1 ? <LandingV1 /> : <LandingV2 />}
      </div>
    </div>
  )
}
