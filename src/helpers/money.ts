export type Currency = 'RUB' | 'EUR' | 'USD' | 'BTC'

export const currencies: Currency[] = ['RUB', 'EUR', 'USD', 'BTC']

const fractions: Record<Currency, number> = {
  RUB: 2,
  EUR: 2,
  USD: 2,
  BTC: 8,
}

export function currencyFraction(cur: Currency): number {
  if (!currencies.includes(cur)) {
    throw new Error('invalid currency: ' + cur)
  }

  const fraction = fractions[cur]
  if (fraction == null) {
    throw new Error('fraction value not defined for currency: ' + cur)
  }

  return fraction
}

export function fromMajorUnits(amountMajor: number, cur: Currency): number {
  const fraction = currencyFraction(cur)

  return Math.floor(amountMajor * 10 ** fraction)
}

export function toMajorUnits(amount: number, cur: Currency): number {
  if (amount === 0) {
    return 0
  }

  const fraction = currencyFraction(cur)

  return amount / 10 ** fraction
}

export function formatAmount(amount: number, cur: Currency): string {
  return String(toMajorUnits(amount, cur))  + ' ' + cur
}

export function totals(items: Array<{ amount: number; currency: Currency }>): string[] {
  const basket: Partial<Record<Currency, number>> = {}

  for (const {currency, amount} of items) {
    basket[currency] = (basket[currency] ?? 0) + amount
  }

  // 100 RUB, 12 EUR
  const res: string[] = []
  for (const cur of currencies) {
    const amount = basket[cur]
    if (!amount) {
      continue
    }

    res.push(formatAmount(amount, cur))
  }

  return res
}
