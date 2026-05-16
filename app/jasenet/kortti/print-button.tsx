'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl border border-[#e0d8cc] px-4 py-2 text-sm font-medium text-[#1e3d1e] hover:bg-white print:hidden"
    >
      Tulosta
    </button>
  )
}
