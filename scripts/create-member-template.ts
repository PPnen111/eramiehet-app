import * as XLSX from 'xlsx'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const headers = [
  'Jäsennumero', 'Sukunimi', 'Etunimet', 'Syntymäaika', 'Jäsenlaji',
  'Postitusosoite', 'Postinumero', 'Postitoimipaikka', 'Sähköposti',
  'Puhelinnumero', 'Kotikunta', 'Laskutustapa', 'Lisätiedot',
]

const exampleRow = [
  '001', 'Metsänen', 'Matti Juhani', '15.6.1975', 'Varsinainen jäsen',
  'Metsätie 3', '12345', 'Metsälä', 'matti.metsanen@email.fi',
  '0401234567', 'Äänekoski', 'Lasku sähköpostiin', 'Hallituksen jäsen',
]

// Sheet 1: Jäsenet
const jasenetSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow])

// Set column widths
jasenetSheet['!cols'] = [
  { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 13 }, { wch: 18 },
  { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 26 }, { wch: 14 },
  { wch: 14 }, { wch: 22 }, { wch: 25 },
]

// Bold headers (XLSX won't always respect this in readers, but set cellStyles)
for (let c = 0; c < headers.length; c++) {
  const addr = XLSX.utils.encode_cell({ r: 0, c })
  const cell = jasenetSheet[addr]
  if (cell) cell.s = { font: { bold: true } }
}

// Sheet 2: Ohjeet
const instructions = [
  ['JahtiPro — Jäsenten tuonti Excel-pohja'],
  [''],
  ['OHJEET:'],
  [''],
  ['PAKOLLISET KENTÄT: Sukunimi, Etunimet'],
  ['Syntymäaika: muodossa pp.kk.vvvv (esim. 15.6.1975)'],
  ['Jäsenlaji: esim. Varsinainen jäsen, Nuorisojäsen, Kunniajäsen'],
  ['Laskutustapa: esim. Lasku sähköpostiin, Verkkolasku, Käteinen'],
  ['Jäsennumero: voit jättää tyhjäksi, järjestelmä voi generoida automaattisesti'],
  ['Sähköposti: tarvitaan jos jäsen halutaan kutsua sovellukseen'],
  [''],
  ['Kysymyksiä? Ota yhteyttä: info@jahtipro.fi'],
]

const ohjeetSheet = XLSX.utils.aoa_to_sheet(instructions)
ohjeetSheet['!cols'] = [{ wch: 80 }]

// Build workbook
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, jasenetSheet, 'Jäsenet')
XLSX.utils.book_append_sheet(workbook, ohjeetSheet, 'Ohjeet')

const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer
const outputPath = resolve(__dirname, '..', 'public', 'jahtipro-jasenpohja.xlsx')
writeFileSync(outputPath, buffer)
console.log(`Excel template created: ${outputPath}`)
