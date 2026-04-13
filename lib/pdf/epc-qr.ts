import QRCode from 'qrcode'

export function buildEpcString(params: {
  recipientName: string
  iban: string
  bic: string
  amount: number
  reference: string
}): string {
  const cleanIban = params.iban.replace(/\s/g, '')
  const amountStr = `EUR${params.amount.toFixed(2)}`
  const name = params.recipientName.substring(0, 70)

  return [
    'BCD',
    '002',
    '1',
    'SCT',
    params.bic,
    name,
    cleanIban,
    amountStr,
    '',
    params.reference,
    '',
    '',
  ].join('\n')
}

export async function generateEpcQrDataUrl(params: {
  recipientName: string
  iban: string
  bic: string
  amount: number
  reference: string
}): Promise<string> {
  const epcString = buildEpcString(params)

  const dataUrl = await QRCode.toDataURL(epcString, {
    errorCorrectionLevel: 'M',
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })

  return dataUrl
}
