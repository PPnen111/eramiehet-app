import Link from 'next/link'
import { Check } from 'lucide-react'

export default function AppLightPage() {
  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-[#eaf3de] text-[#2d6a2d]">
          <Check size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">
          Vaalea teema on nyt käytössä koko sovelluksessa!
        </h1>
        <p className="mt-3 text-sm text-[#4a4a4a]">
          Tämä sivu oli aiemmin esikatselu vaaleasta teemasta. Nyt koko sovellus
          käyttää samaa vaaleaa väripalettia.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-xl bg-[#1e3d1e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#162d16] transition-colors"
        >
          → Siirry kojelautaan
        </Link>
      </div>
    </main>
  )
}
