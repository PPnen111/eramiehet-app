import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface InvoiceData {
  issuer_name: string
  issuer_address?: string
  issuer_postal?: string
  issuer_email?: string
  issuer_phone?: string
  issuer_business_id?: string
  recipient_name: string
  recipient_address?: string
  recipient_postal?: string
  invoice_number: string
  invoice_date: string
  due_date: string
  reference_number: string
  bank_iban?: string
  bank_bic?: string
  rows: { description: string; quantity: number; unit_price: number; vat_percent: number; total: number }[]
  subtotal: number
  vat_total: number
  total: number
  notes?: string
}

const formatEur = (amount: number) => amount.toFixed(2).replace('.', ',') + ' €'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#166534', marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  text: { marginBottom: 2, lineHeight: 1.5 },
  bold: { fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#166534', padding: 6, marginTop: 20 },
  tableHeaderCell: { color: '#ffffff', fontWeight: 'bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  tableCell: { fontSize: 9 },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 6, paddingVertical: 2 },
  totalLabel: { width: 120, textAlign: 'right' as const, paddingRight: 10 },
  totalValue: { width: 80, textAlign: 'right' as const },
  totalFinal: { fontWeight: 'bold', fontSize: 11, color: '#166534' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#166534', marginVertical: 10 },
  footer: { marginTop: 20, padding: 10, backgroundColor: '#f0f7f0', borderRadius: 4 },
  footerText: { fontSize: 8, color: '#444444', lineHeight: 1.5 },
})

function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.col}>
            <Text style={s.title}>LASKU</Text>
            <Text style={[s.sectionTitle]}>Laskuttaja</Text>
            <Text style={[s.text, s.bold]}>{data.issuer_name}</Text>
            {data.issuer_business_id && <Text style={s.text}>Y-tunnus: {data.issuer_business_id}</Text>}
            {data.issuer_address && <Text style={s.text}>{data.issuer_address}</Text>}
            {data.issuer_postal && <Text style={s.text}>{data.issuer_postal}</Text>}
            {data.issuer_email && <Text style={s.text}>{data.issuer_email}</Text>}
            {data.issuer_phone && <Text style={s.text}>{data.issuer_phone}</Text>}
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Laskun tiedot</Text>
            <Text style={s.text}>Laskun nro: {data.invoice_number}</Text>
            <Text style={s.text}>Päiväys: {data.invoice_date}</Text>
            <Text style={s.text}>Eräpäivä: {data.due_date}</Text>
            <Text style={s.text}>Maksuehto: 14 pv</Text>
            <Text style={s.text}>Viitenumero: {data.reference_number}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Recipient + Bank */}
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Laskutettava</Text>
            <Text style={[s.text, s.bold]}>{data.recipient_name}</Text>
            {data.recipient_address && <Text style={s.text}>{data.recipient_address}</Text>}
            {data.recipient_postal && <Text style={s.text}>{data.recipient_postal}</Text>}
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Maksutiedot</Text>
            <Text style={s.text}>Saaja: {data.issuer_name}</Text>
            {data.bank_iban && <Text style={s.text}>IBAN: {data.bank_iban}</Text>}
            {data.bank_bic && <Text style={s.text}>BIC: {data.bank_bic}</Text>}
            <Text style={s.text}>Viitenumero: {data.reference_number}</Text>
            <Text style={[s.text, s.bold]}>Summa: {formatEur(data.total)}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { width: '45%' }]}>Kuvaus</Text>
          <Text style={[s.tableHeaderCell, { width: '10%', textAlign: 'center' as const }]}>Määrä</Text>
          <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' as const }]}>A-hinta</Text>
          <Text style={[s.tableHeaderCell, { width: '10%', textAlign: 'center' as const }]}>ALV%</Text>
          <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' as const }]}>Yhteensä</Text>
        </View>

        {/* Table rows */}
        {data.rows.map((row, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { width: '45%' }]}>{row.description}</Text>
            <Text style={[s.tableCell, { width: '10%', textAlign: 'center' as const }]}>{row.quantity}</Text>
            <Text style={[s.tableCell, { width: '15%', textAlign: 'right' as const }]}>{formatEur(row.unit_price)}</Text>
            <Text style={[s.tableCell, { width: '10%', textAlign: 'center' as const }]}>{row.vat_percent} %</Text>
            <Text style={[s.tableCell, { width: '20%', textAlign: 'right' as const }]}>{formatEur(row.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={{ marginTop: 10 }}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Veroton summa:</Text>
            <Text style={s.totalValue}>{formatEur(data.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>ALV yhteensä:</Text>
            <Text style={s.totalValue}>{formatEur(data.vat_total)}</Text>
          </View>
          <View style={[s.totalRow, { marginTop: 4 }]}>
            <Text style={[s.totalLabel, s.totalFinal]}>Maksettava:</Text>
            <Text style={[s.totalValue, s.totalFinal]}>{formatEur(data.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={s.footer}>
            <Text style={s.footerText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 30, left: 40, right: 40 }}>
          <Text style={{ fontSize: 7, color: '#999999', textAlign: 'center' as const }}>
            {data.issuer_name} — JahtiPro-palvelu — jahtipro.fi
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const { pdf } = await import('@react-pdf/renderer')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(InvoiceDocument, { data }) as any
  const blob = await pdf(doc).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
