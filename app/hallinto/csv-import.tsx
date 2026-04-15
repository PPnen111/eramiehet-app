'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Download, X, CheckCircle, AlertCircle, SkipForward } from 'lucide-react'
import { parseCSV, type MemberRow } from '@/lib/utils/csv-parser'

const VALID_ROLES = ['admin', 'board_member', 'member', '']
const CSV_TEMPLATE =
  'nimi,sahkoposti,puhelin,rooli,liittynyt\nMatti Meikäläinen,matti@example.com,0401234567,member,2024-01-01'
const ACCEPTED_FORMATS = '.csv,.xlsx'

type ValidationError = { row: number; field: string; message: string }

type ImportResult = {
  success: number
  skipped: number
  name_skipped?: number
  errors: number
  error_details: string[]
  debug?: { header_row: number; headers: string[] }
}

interface Props {
  onImportDone: () => void
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidDate(date: string): boolean {
  if (!date) return true
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime())
}

function validate(rows: MemberRow[]): ValidationError[] {
  const errors: ValidationError[] = []
  rows.forEach((row, i) => {
    if (!row.nimi) {
      errors.push({ row: i + 1, field: 'Nimi', message: 'Nimi on pakollinen' })
    }
    if (row.sahkoposti && !isValidEmail(row.sahkoposti)) {
      errors.push({ row: i + 1, field: 'Sähköposti', message: 'Virheellinen sähköpostiosoite' })
    }
    if (row.rooli && !VALID_ROLES.includes(row.rooli)) {
      errors.push({
        row: i + 1,
        field: 'Rooli',
        message: 'Roolin tulee olla: admin, board_member tai member',
      })
    }
    if (row.liittynyt && !isValidDate(row.liittynyt)) {
      errors.push({
        row: i + 1,
        field: 'Liittynyt',
        message: 'Päivämäärän tulee olla muodossa VVVV-KK-PP',
      })
    }
  })
  return errors
}

const roleFi: Record<string, string> = {
  admin: 'Ylläpitäjä',
  board_member: 'Johtokunta',
  member: 'Jäsen',
  '': 'Jäsen',
}

export default function CsvImport({ onImportDone }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [rows, setRows] = useState<MemberRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState('')

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jasenet-pohja.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const processFile = useCallback((file: File) => {
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx')
    const isCsv = file.name.toLowerCase().endsWith('.csv')
    if (!isXlsx && !isCsv) {
      setParseError('Vain .csv ja .xlsx -tiedostot ovat tuettuja.')
      return
    }
    setParseError('')
    setResult(null)
    setFileName(file.name)
    setOriginalFile(file)

    if (isXlsx) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const buffer = e.target?.result
        if (!(buffer instanceof ArrayBuffer)) return
        const { parseXlsxToMemberRows } = await import('@/lib/utils/xlsx-parser')
        const parsed = parseXlsxToMemberRows(buffer)
        if (parsed.length === 0) {
          setParseError('Tiedostossa ei ole dataa tai otsikkorivi puuttuu.')
          setRows([])
          setValidationErrors([])
          return
        }
        setRows(parsed)
        setValidationErrors(validate(parsed))
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text !== 'string') return
        const parsed = parseCSV(text)
        if (parsed.length === 0) {
          setParseError('Tiedostossa ei ole dataa tai otsikkorivi puuttuu.')
          setRows([])
          setValidationErrors([])
          return
        }
        setRows(parsed)
        setValidationErrors(validate(parsed))
      }
      reader.readAsText(file, 'UTF-8')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleImport = async () => {
    if (rows.length === 0 || validationErrors.length > 0 || !originalFile) return
    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', originalFile)
      const res = await fetch('/api/import-members', {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json()) as ImportResult & { error?: string }
      if (!res.ok) {
        setParseError(data.error ?? 'Tuonti epäonnistui')
      } else {
        setResult(data)
        setRows([])
        setFileName('')
        setOriginalFile(null)
        setValidationErrors([])
        onImportDone()
      }
    } catch {
      setParseError('Verkkovirhe. Yritä uudelleen.')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setRows([])
    setFileName('')
    setOriginalFile(null)
    setValidationErrors([])
    setParseError('')
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const preview = rows.slice(0, 5)
  const canImport = rows.length > 0 && validationErrors.length === 0 && !importing

  return (
    <div className="space-y-4">
      {/* Template download */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-green-500">
          Tuo jäseniä CSV tai Excel -tiedostosta (nimi, sähköposti, puhelin)
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 rounded-lg border border-green-800 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-white/5 transition-colors"
        >
          <Download size={12} />
          Lataa CSV-pohja
        </button>
      </div>

      {/* Drop zone */}
      {!fileName && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? 'border-green-500 bg-green-900/20'
              : 'border-green-800 hover:border-green-600 hover:bg-white/[0.03]'
          }`}
        >
          <Upload size={24} className="text-green-500" />
          <p className="text-sm text-green-300">
            Vedä tiedosto tähän tai <span className="underline">valitse tiedosto</span>
          </p>
          <p className="text-xs text-green-600">CSV tai Excel (.xlsx)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Selected file */}
      {fileName && (
        <div className="flex items-center justify-between rounded-lg border border-green-800 bg-white/5 px-3 py-2">
          <span className="text-sm text-green-300">{fileName}</span>
          <button onClick={reset} className="text-green-600 hover:text-green-400">
            <X size={15} />
          </button>
        </div>
      )}

      {parseError && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{parseError}</p>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-green-500">
            Esikatselu — näytetään {preview.length}/{rows.length} riviä
          </p>
          <div className="overflow-x-auto rounded-xl border border-green-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-green-800 bg-white/5">
                  <th className="px-3 py-2 text-left font-medium text-green-400">Nimi</th>
                  <th className="px-3 py-2 text-left font-medium text-green-400">Sähköposti</th>
                  <th className="px-3 py-2 text-left font-medium text-green-400">Puhelin</th>
                  <th className="px-3 py-2 text-left font-medium text-green-400">Rooli</th>
                  <th className="px-3 py-2 text-left font-medium text-green-400">Liittynyt</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-green-900/50 last:border-0">
                    <td className="px-3 py-2 text-white">{row.nimi || '—'}</td>
                    <td className="px-3 py-2 text-green-300">{row.sahkoposti || '—'}</td>
                    <td className="px-3 py-2 text-green-400">{row.puhelin || '—'}</td>
                    <td className="px-3 py-2 text-green-400">
                      {(roleFi[row.rooli] ?? row.rooli) || 'Jäsen'}
                    </td>
                    <td className="px-3 py-2 text-green-400">{row.liittynyt || 'tänään'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-900 bg-red-900/20 p-3 space-y-1">
          <p className="text-xs font-semibold text-red-300">
            Korjaa virheet ennen tuontia:
          </p>
          {validationErrors.map((e, i) => (
            <p key={i} className="text-xs text-red-400">
              Rivi {e.row} · {e.field}: {e.message}
            </p>
          ))}
        </div>
      )}

      {/* Import button */}
      {rows.length > 0 && (
        <button
          onClick={() => void handleImport()}
          disabled={!canImport}
          className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {importing
            ? 'Tuodaan jäseniä...'
            : `Tuo ${rows.length} jäsentä`}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-green-800 bg-white/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-white">Tuonti valmis</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-green-300">
                Tuotu onnistuneesti: <span className="font-semibold text-white">{result.success}</span> jäsentä
              </span>
            </div>
            {result.skipped > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <SkipForward size={14} className="text-yellow-400" />
                <span className="text-green-300">
                  Ohitettu (jo olemassa): <span className="font-semibold text-white">{result.skipped}</span> jäsentä
                </span>
              </div>
            )}
            {(result.name_skipped ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <SkipForward size={14} className="text-yellow-400" />
                <span className="text-green-300">
                  Ohitettu (nimi puuttui): <span className="font-semibold text-white">{result.name_skipped}</span> riviä
                </span>
              </div>
            )}
            {result.errors > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <span className="text-red-300">
                    Virheitä: <span className="font-semibold text-white">{result.errors}</span> jäsentä
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
          {result.debug && (
            <details className="mt-3 rounded-lg border border-green-900 bg-black/20 px-3 py-2 text-xs text-green-600">
              <summary className="cursor-pointer">Debug: havaitut sarakkeet (rivi {result.debug.header_row + 1})</summary>
              <p className="mt-1 break-all text-green-500">{result.debug.headers.join(' | ')}</p>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
