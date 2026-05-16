'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle, AlertCircle, SkipForward, UserPlus } from 'lucide-react'

type MemberFormRow = {
  id: string
  nimi: string
  sahkoposti: string
  puhelin: string
  rooli: string
  liittynyt: string
}

type ValidationError = { rowIndex: number; field: string; message: string }

type ImportResult = {
  success: number
  skipped: number
  errors: number
  error_details: string[]
}

interface Props {
  onImportDone: () => void
}

const VALID_ROLES = ['admin', 'board_member', 'member', '']

function createEmptyRow(): MemberFormRow {
  return {
    id: crypto.randomUUID(),
    nimi: '',
    sahkoposti: '',
    puhelin: '',
    rooli: 'member',
    liittynyt: '',
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validate(rows: MemberFormRow[]): ValidationError[] {
  const errors: ValidationError[] = []
  rows.forEach((row, i) => {
    if (!row.nimi.trim()) {
      errors.push({ rowIndex: i, field: 'nimi', message: 'Nimi on pakollinen' })
    }
    if (row.sahkoposti && !isValidEmail(row.sahkoposti)) {
      errors.push({ rowIndex: i, field: 'sahkoposti', message: 'Virheellinen sähköposti' })
    }
    if (row.rooli && !VALID_ROLES.includes(row.rooli)) {
      errors.push({ rowIndex: i, field: 'rooli', message: 'Virheellinen rooli' })
    }
    if (row.liittynyt && isNaN(new Date(row.liittynyt).getTime())) {
      errors.push({ rowIndex: i, field: 'liittynyt', message: 'Virheellinen päivämäärä' })
    }
  })
  return errors
}

const roleFi: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
}

export default function ExcelImportForm({ onImportDone }: Props) {
  const [rows, setRows] = useState<MemberFormRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()])
  }

  const addMultipleRows = (count: number) => {
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => createEmptyRow())])
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
    setValidationErrors((prev) => prev.filter((e) => e.rowIndex !== index))
  }

  const updateRow = (index: number, field: keyof MemberFormRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
    // Clear validation errors for this field
    setValidationErrors((prev) =>
      prev.filter((e) => !(e.rowIndex === index && e.field === field))
    )
  }

  const getFieldError = (rowIndex: number, field: string): string | null => {
    return validationErrors.find((e) => e.rowIndex === rowIndex && e.field === field)?.message ?? null
  }

  const filledRows = rows.filter((r) => r.nimi.trim() || r.sahkoposti.trim())

  const handleImport = async () => {
    if (filledRows.length === 0) {
      setError('Lisää vähintään yksi jäsen')
      return
    }

    const errors = validate(filledRows)
    setValidationErrors(errors)
    if (errors.length > 0) return

    setImporting(true)
    setResult(null)
    setError('')

    try {
      const payload = filledRows.map((r) => ({
        nimi: r.nimi.trim(),
        sahkoposti: r.sahkoposti.trim(),
        puhelin: r.puhelin.trim(),
        rooli: r.rooli || 'member',
        liittynyt: r.liittynyt || '',
      }))

      const res = await fetch('/api/import-members-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: payload }),
      })

      const data = (await res.json()) as ImportResult & { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Tuonti epäonnistui')
      } else {
        setResult(data)
        setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()])
        setValidationErrors([])
        onImportDone()
      }
    } catch {
      setError('Verkkovirhe. Yritä uudelleen.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#4a4a4a]">
        Täytä jäsenten tiedot alla olevaan lomakkeeseen. Nimi on pakollinen, sähköposti tarvitaan kutsun lähettämiseen.
      </p>

      {/* Spreadsheet-style table */}
      <div className="overflow-x-auto rounded-xl border border-[#e0d8cc]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e0d8cc] bg-white">
              <th className="w-8 px-2 py-2 text-center text-xs font-medium text-[#888888]">#</th>
              <th className="min-w-[160px] px-2 py-2 text-left text-xs font-medium text-[#2d6a2d]">
                Nimi <span className="text-red-400">*</span>
              </th>
              <th className="min-w-[180px] px-2 py-2 text-left text-xs font-medium text-[#2d6a2d]">Sähköposti</th>
              <th className="min-w-[130px] px-2 py-2 text-left text-xs font-medium text-[#2d6a2d]">Puhelin</th>
              <th className="min-w-[120px] px-2 py-2 text-left text-xs font-medium text-[#2d6a2d]">Rooli</th>
              <th className="min-w-[130px] px-2 py-2 text-left text-xs font-medium text-[#2d6a2d]">Liittynyt</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-b border-[#e0d8cc]/30 last:border-0">
                <td className="px-2 py-1.5 text-center text-xs text-[#2d6a2d]">{i + 1}</td>
                <td className="px-1 py-1">
                  <input
                    type="text"
                    value={row.nimi}
                    onChange={(e) => updateRow(i, 'nimi', e.target.value)}
                    placeholder="Matti Meikäläinen"
                    className={`w-full rounded-md border bg-transparent px-2 py-1.5 text-sm text-[#1a1a1a] placeholder:text-[#888888] focus:outline-none focus:ring-1 transition-colors ${
                      getFieldError(i, 'nimi')
                        ? 'border-red-600 focus:ring-red-500'
                        : 'border-[#e0d8cc] focus:ring-[#2d6a2d]'
                    }`}
                  />
                  {getFieldError(i, 'nimi') && (
                    <p className="mt-0.5 text-[10px] text-red-400">{getFieldError(i, 'nimi')}</p>
                  )}
                </td>
                <td className="px-1 py-1">
                  <input
                    type="email"
                    value={row.sahkoposti}
                    onChange={(e) => updateRow(i, 'sahkoposti', e.target.value)}
                    placeholder="matti@example.com"
                    className={`w-full rounded-md border bg-transparent px-2 py-1.5 text-sm text-[#1a1a1a] placeholder:text-[#888888] focus:outline-none focus:ring-1 transition-colors ${
                      getFieldError(i, 'sahkoposti')
                        ? 'border-red-600 focus:ring-red-500'
                        : 'border-[#e0d8cc] focus:ring-[#2d6a2d]'
                    }`}
                  />
                  {getFieldError(i, 'sahkoposti') && (
                    <p className="mt-0.5 text-[10px] text-red-400">{getFieldError(i, 'sahkoposti')}</p>
                  )}
                </td>
                <td className="px-1 py-1">
                  <input
                    type="tel"
                    value={row.puhelin}
                    onChange={(e) => updateRow(i, 'puhelin', e.target.value)}
                    placeholder="0401234567"
                    className="w-full rounded-md border border-[#e0d8cc] bg-transparent px-2 py-1.5 text-sm text-[#1a1a1a] placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-[#2d6a2d] transition-colors"
                  />
                </td>
                <td className="px-1 py-1">
                  <select
                    value={row.rooli}
                    onChange={(e) => updateRow(i, 'rooli', e.target.value)}
                    className="w-full rounded-md border border-[#e0d8cc] bg-transparent px-2 py-1.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#2d6a2d] transition-colors [&>option]:bg-[#f5f0e8] [&>option]:text-[#1a1a1a]"
                  >
                    {Object.entries(roleFi).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <input
                    type="date"
                    value={row.liittynyt}
                    onChange={(e) => updateRow(i, 'liittynyt', e.target.value)}
                    className={`w-full rounded-md border bg-transparent px-2 py-1.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-1 transition-colors ${
                      getFieldError(i, 'liittynyt')
                        ? 'border-red-600 focus:ring-red-500'
                        : 'border-[#e0d8cc] focus:ring-[#2d6a2d]'
                    }`}
                  />
                </td>
                <td className="px-1 py-1 text-center">
                  <button
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                    className="rounded-md p-1 text-[#888888] hover:bg-red-900/40 hover:text-red-400 disabled:opacity-20 transition-colors"
                    title="Poista rivi"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg border border-[#e0d8cc] px-3 py-1.5 text-xs font-medium text-[#1e3d1e] hover:bg-white transition-colors"
        >
          <Plus size={12} />
          Lisää rivi
        </button>
        <button
          onClick={() => addMultipleRows(5)}
          className="flex items-center gap-1.5 rounded-lg border border-[#e0d8cc] px-3 py-1.5 text-xs font-medium text-[#1e3d1e] hover:bg-white transition-colors"
        >
          <Plus size={12} />
          +5 riviä
        </button>
        <button
          onClick={() => addMultipleRows(10)}
          className="flex items-center gap-1.5 rounded-lg border border-[#e0d8cc] px-3 py-1.5 text-xs font-medium text-[#1e3d1e] hover:bg-white transition-colors"
        >
          <Plus size={12} />
          +10 riviä
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      {/* Validation errors summary */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-900 bg-red-900/20 p-3 space-y-1">
          <p className="text-xs font-semibold text-red-300">Korjaa virheet ennen tuontia:</p>
          {validationErrors.map((e, i) => (
            <p key={i} className="text-xs text-red-400">
              Rivi {e.rowIndex + 1} · {e.field}: {e.message}
            </p>
          ))}
        </div>
      )}

      {/* Import button */}
      <button
        onClick={() => void handleImport()}
        disabled={importing || filledRows.length === 0}
        className="w-full rounded-lg bg-[#1e3d1e] py-2.5 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        <UserPlus size={16} />
        {importing
          ? 'Tuodaan jäseniä...'
          : `Tuo ${filledRows.length} jäsentä`}
      </button>

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-[#e0d8cc] bg-white p-4 space-y-2">
          <p className="text-sm font-semibold text-[#1a1a1a]">Tuonti valmis</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-[#2d6a2d]" />
              <span className="text-[#1e3d1e]">
                Tuotu onnistuneesti: <span className="font-semibold text-[#1a1a1a]">{result.success}</span> jäsentä
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <SkipForward size={14} className="text-[#b45309]" />
              <span className="text-[#1e3d1e]">
                Ohitettu (jo olemassa): <span className="font-semibold text-[#1a1a1a]">{result.skipped}</span> jäsentä
              </span>
            </div>
            {result.errors > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <span className="text-red-300">
                    Virheitä: <span className="font-semibold text-[#1a1a1a]">{result.errors}</span> jäsentä
                  </span>
                  {result.error_details.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {result.error_details.map((d, i) => (
                        <li key={i} className="text-xs text-red-400">{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
