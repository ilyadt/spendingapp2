interface MoneyInterface {
  amount: number
  fraction: number
  currency: string | Currency
}

export class Money {
  constructor(
    public amount: number,
    public fraction: number,
    public currency: Currency,
  ) {}

  public toString(): string {
    return moneyToString(this)
  }

  public minus(m2: Money): Money {
    return minus(this, m2)
  }

  public full(): number {
    return moneyFormat(this)
  }
}

export function moneyToString(money: MoneyInterface): string {
  return String(moneyFormat(money))
}

export function moneyFormat(money: MoneyInterface): number {
  return money.amount / 10 ** money.fraction
}

export function moneyToStringWithCurrency(money: MoneyInterface): string {
  return moneyToString(money) + ' ' + money.currency
}

export function minus(m1: Money, m2: Money): Money {
  if (m1.currency !== m2.currency) {
    throw new Error('currencies do not match')
  }

  return new Money(m1.amount - m2.amount, m1.fraction, m1.currency)
}

export function fromRUB(amount: number): Money {
  return from(amount, 'RUB')
}

export type Currency = 'RUB' | 'EUR'

const currencies: Currency[] = ['RUB', 'EUR']

const fractions: Record<Currency, number> = {
  RUB: 2,
  EUR: 2,
}

export function from(amount: number, cur: Currency): Money {
  if (!currencies.includes(cur)) {
    throw new Error('invalid currency: ' + cur)
  }

  const fraction = fractions[cur]
  if (fraction == null) {
    throw new Error('fraction value not defined for currency: ' + cur)
  }

  const scaled = Math.floor(amount * 10 ** fraction)

  return new Money(scaled, fraction, cur)
}

export const getFormatter = (c: Currency): Intl.NumberFormat => {
  switch (c) {
    case 'RUB':
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
  }

  throw new Error('currency formatter not found')
}
