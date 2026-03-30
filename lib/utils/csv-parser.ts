export type MemberRow = {
  nimi: string
  sahkoposti: string
  puhelin: string
  rooli: string
  liittynyt: string
  // Extended fields
  jasennumero: string
  syntymaaika: string
  jasenlaji: string
  katuosoite: string
  postinumero: string
  postitoimipaikka: string
  kotikunta: string
  laskutustapa: string
  lisatiedot: string
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
  const normalized = options.map((o) => o.normalize('NFC').toLowerCase().trim())
  for (let i = 0; i < headers.length; i++) {
    if (normalized.includes(headers[i].normalize('NFC').toLowerCase().trim())) return i
  }
  return -1
}

/**
 * Parse CSV text into MemberRow array.
 * Supports comma and semicolon separators, quoted fields, UTF-8 (Finnish ä/ö).
 * Supports Finnish and English column names. Handles Etunimet+Sukunimi combining.
 */
export function parseCSV(text: string): MemberRow[] {
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.filter((l) => l.trim().length > 0)
  if (nonEmpty.length < 2) return []

  const firstLine = nonEmpty[0]
  const sep = firstLine.includes(';') ? ';' : ','

  const headers = parseRow(firstLine, sep).map((h) => h.trim().replace(/^"|"$/g, ''))

  // Separate first/last name columns (for Etunimet + Sukunimi pattern)
  const colFirstName = findCol(headers, ['Etunimet', 'Etunimi'])
  const colLastName = findCol(headers, ['Sukunimi'])
  const colFullName = findCol(headers, ['Nimi', 'Name', 'full_name', 'nimi'])

  const col = {
    sahkoposti: findCol(headers, ['Sähköposti', 'sahkoposti', 'Email', 'email', 'S-posti', 'Sähköpostiosoite', 'e-mail']),
    puhelin: findCol(headers, ['Puhelinnumero', 'Puhelin', 'Phone', 'phone', 'Matkapuhelin', 'GSM', 'gsm', 'puh']),
    rooli: findCol(headers, ['Rooli', 'rooli', 'Role', 'role']),
    liittynyt: findCol(headers, ['Liittynyt', 'liittynyt', 'Join_date', 'join_date', 'Liittymispäivä']),
    jasennumero: findCol(headers, ['Jäsennumero', 'jasennumero', 'member_number']),
    syntymaaika: findCol(headers, ['Syntymäaika', 'syntymaaika', 'birth_date', 'Syntymäpäivä']),
    jasenlaji: findCol(headers, ['Jäsenlaji', 'jasenlaji', 'member_type']),
    katuosoite: findCol(headers, ['Postitusosoite', 'Katuosoite', 'katuosoite', 'street_address', 'Osoite']),
    postinumero: findCol(headers, ['Postinumero', 'postinumero', 'postal_code']),
    postitoimipaikka: findCol(headers, ['Postitoimipaikka', 'postitoimipaikka', 'city', 'Kaupunki']),
    kotikunta: findCol(headers, ['Kotikunta', 'kotikunta', 'home_municipality', 'Kunta']),
    laskutustapa: findCol(headers, ['Laskutustapa', 'laskutustapa', 'billing_method']),
    lisatiedot: findCol(headers, ['Lisätiedot', 'lisatiedot', 'additional_info']),
  }

  const useNameCombine = colFirstName >= 0 && colLastName >= 0

  const rows: MemberRow[] = []
  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = parseRow(nonEmpty[i], sep)
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '')

    let nimi: string
    if (useNameCombine) {
      nimi = [get(colFirstName), get(colLastName)].filter(Boolean).join(' ')
    } else {
      nimi = get(colFullName)
    }

    if (!nimi && !get(col.sahkoposti)) continue // skip blank rows
    rows.push({
      nimi,
      sahkoposti: get(col.sahkoposti),
      puhelin: get(col.puhelin),
      rooli: get(col.rooli),
      liittynyt: get(col.liittynyt),
      jasennumero: get(col.jasennumero),
      syntymaaika: get(col.syntymaaika),
      jasenlaji: get(col.jasenlaji),
      katuosoite: get(col.katuosoite),
      postinumero: get(col.postinumero),
      postitoimipaikka: get(col.postitoimipaikka),
      kotikunta: get(col.kotikunta),
      laskutustapa: get(col.laskutustapa),
      lisatiedot: get(col.lisatiedot),
    })
  }

  return rows
}
