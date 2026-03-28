'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
    >
      Tulosta lasku
    </button>
  )
}
