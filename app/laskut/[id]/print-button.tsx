'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-lg bg-[#1e3d1e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3d1e] transition-colors"
    >
      Tulosta lasku
    </button>
  )
}
