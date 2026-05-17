export const PRICING = {
  base: 129,
  perMember: 2,
  max: 599,
} as const

export function calculatePrice(memberCount: number): number {
  const count = Math.max(0, memberCount)
  return Math.min(PRICING.base + count * PRICING.perMember, PRICING.max)
}

export function formatPrice(memberCount: number): string {
  return `${calculatePrice(memberCount)} €/vuosi`
}

export function calculatePriceCents(memberCount: number): number {
  return calculatePrice(memberCount) * 100
}

export function calculateMonthlyCents(memberCount: number): number {
  return Math.round(calculatePriceCents(memberCount) / 12)
}

export const KYYJARVI_CLUB_ID = 'd1cb1cdf-80a1-45d0-8c18-c5e5fa4eb5e4'
