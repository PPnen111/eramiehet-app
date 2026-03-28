export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

export function formatEuros(cents: number) {
  return (cents / 100).toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })
}
