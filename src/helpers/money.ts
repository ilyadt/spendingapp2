export type Currency = 'RUB' | 'EUR' | 'BTC'

const currencies: Currency[] = ['RUB', 'EUR', 'BTC']

const fractions: Record<Currency, number> = {
  RUB: 2,
  EUR: 2,
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

