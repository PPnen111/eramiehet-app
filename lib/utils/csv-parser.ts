export type MemberRow = {
  nimi: string
  sahkoposti: string
  puhelin: string
  rooli: string
  liittynyt: string
}

/** Parse a single CSV line, respecting quoted fields */
function parseRow(line: string, sep: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === sep && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

function findCol(headers: string[], options: string[]): number {
  for (const opt of options) {
    const idx = headers.indexOf(opt)
    if (idx >= 0) return idx
  }
  return -1
}

/**
 * Parse CSV text into MemberRow array.
 * Supports comma and semicolon separators, quoted fields, UTF-8 (Finnish ä/ö).
 * Skips empty rows. Expects header row: nimi,sahkoposti,puhelin,rooli,liittynyt
 */
export function parseCSV(text: string): MemberRow[] {
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.filter((l) => l.trim().length > 0)
  if (nonEmpty.length < 2) return []

  const firstLine = nonEmpty[0]
  const sep = firstLine.includes(';') ? ';' : ','

  const headers = parseRow(firstLine, sep).map((h) => h.toLowerCase().trim().replace(/^"|"$/g, ''))

  const col = {
    nimi: findCol(headers, ['nimi', 'name', 'full_name']),
    sahkoposti: findCol(headers, ['sahkoposti', 'sähköposti', 'email', 'e-mail']),
    puhelin: findCol(headers, ['puhelin', 'phone', 'puh']),
    rooli: findCol(headers, ['rooli', 'role']),
    liittynyt: findCol(headers, ['liittynyt', 'join_date', 'liittymispäivä']),
  }

  const rows: MemberRow[] = []
  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = parseRow(nonEmpty[i], sep)
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '')
    if (!get(col.nimi) && !get(col.sahkoposti)) continue // skip blank rows
    rows.push({
      nimi: get(col.nimi),
      sahkoposti: get(col.sahkoposti),
      puhelin: get(col.puhelin),
      rooli: get(col.rooli),
      liittynyt: get(col.liittynyt),
    })
  }

  return rows
}
