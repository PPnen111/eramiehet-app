import * as XLSX from 'xlsx'
import type { MemberRow } from './csv-parser'

function findIdx(headers: string[], aliases: string[]): number {
  const normalized = aliases.map((a) => a.toLowerCase().trim())
  for (let i = 0; i < headers.length; i++) {
    if (normalized.includes((headers[i] ?? '').toLowerCase().trim())) return i
  }
  return -1
}

/**
 * Parse an XLSX ArrayBuffer into MemberRow[].
 * Detects columns by Finnish/English header names. Handles Etunimet+Sukunimi combining.
 */
export function parseXlsxToMemberRows(buffer: ArrayBuffer): MemberRow[] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][]

  if (rawRows.length < 2) return []

  const headers = (rawRows[0] as unknown[]).map(String)

  const idxFirstName = findIdx(headers, ['Etunimet', 'Etunimi'])
  const idxLastName = findIdx(headers, ['Sukunimi'])
  const idxFullName = findIdx(headers, ['Nimi', 'Name', 'full_name'])
  const idxEmail = findIdx(headers, [
    'Sähköposti', 'Email', 'email', 'S-posti', 'Sähköpostiosoite', 'sahkoposti',
  ])
  const idxPhone = findIdx(headers, [
    'Puhelinnumero', 'Puhelin', 'Phone', 'phone', 'Matkapuhelin', 'GSM', 'gsm',
  ])
  const idxRole = findIdx(headers, ['Rooli', 'Role', 'rooli', 'role'])
  const idxDate = findIdx(headers, ['Liittynyt', 'Join_date', 'join_date', 'Liittymispäivä'])

  const idxMemberNumber = findIdx(headers, ['Jäsennumero', 'jasennumero', 'member_number'])
  const idxBirthDate = findIdx(headers, ['Syntymäaika', 'syntymaaika', 'birth_date', 'Syntymäpäivä'])
  const idxMemberType = findIdx(headers, ['Jäsenlaji', 'jasenlaji', 'member_type'])
  const idxStreetAddress = findIdx(headers, ['Postitusosoite', 'Katuosoite', 'katuosoite', 'street_address', 'Osoite'])
  const idxPostalCode = findIdx(headers, ['Postinumero', 'postinumero', 'postal_code'])
  const idxCity = findIdx(headers, ['Postitoimipaikka', 'postitoimipaikka', 'city', 'Kaupunki'])
  const idxMunicipality = findIdx(headers, ['Kotikunta', 'kotikunta', 'home_municipality', 'Kunta'])
  const idxBilling = findIdx(headers, ['Laskutustapa', 'laskutustapa', 'billing_method'])
  const idxAdditional = findIdx(headers, ['Lisätiedot', 'lisatiedot', 'additional_info'])

  const useNameCombine = idxFirstName >= 0 && idxLastName >= 0

  const rows: MemberRow[] = []
  for (let i = 1; i < rawRows.length; i++) {
    const cells = rawRows[i] as unknown[]
    const get = (idx: number) => (idx >= 0 ? String(cells[idx] ?? '').trim() : '')

    let nimi: string
    if (useNameCombine) {
      nimi = [get(idxFirstName), get(idxLastName)].filter(Boolean).join(' ')
    } else {
      nimi = get(idxFullName)
    }

    if (!nimi) continue

    rows.push({
      nimi,
      sahkoposti: get(idxEmail),
      puhelin: get(idxPhone),
      rooli: get(idxRole),
      liittynyt: get(idxDate),
      jasennumero: get(idxMemberNumber),
      syntymaaika: get(idxBirthDate),
      jasenlaji: get(idxMemberType),
      katuosoite: get(idxStreetAddress),
      postinumero: get(idxPostalCode),
      postitoimipaikka: get(idxCity),
      kotikunta: get(idxMunicipality),
      laskutustapa: get(idxBilling),
      lisatiedot: get(idxAdditional),
    })
  }

  return rows
}
