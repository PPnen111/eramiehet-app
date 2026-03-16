'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl border border-green-700 px-4 py-2 text-sm font-medium text-green-300 hover:bg-green-900/30 print:hidden"
    >
      Tulosta
    </button>
  )
}
