import { test, expect, describe, beforeEach, vi } from 'vitest'

import type {ApiBudget, ApiMoney, ApiSpending, Budget, Spending} from '@src/models/models'
import { BudgetSpendingsStore, VersionStatus, _test, formatVersionPayload, type SpendingVersion } from '@src/stores/budgetSpendings'

describe('storage_test', () => {
  beforeEach(() => {
    clearLocalStorageByPrefix(_test.lsPrefix)
  })

  test('get_budgets:empty', () => {
    expect(BudgetSpendingsStore.getBudgets()).toEqual([])
  })

  test('get_budgets:invalid_store', () => {
    localStorage.setItem(_test.lsBudgetsKey(), 'invalid json')
    expect(() => BudgetSpendingsStore.getBudgets()).toThrow()
  })

  test('update_budgets_from_remote:init', () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: {},
      },
      {
        id: 1,
        alias: 'b1',
        name: 'на учебу',
        sort: 1,
        money: fromRUB(50_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-10-01',
        params: { key: 'val' },
      },
    ])

    // Так же тут проверяется сортировка:
    // при сохранении в стор все бюджеты сортируются по ID
    // @test get_budgets:not_empty
    expect(BudgetSpendingsStore.getBudgets()).toEqual([
      {
        id: 1,
        alias: 'b1',
        name: 'на учебу',
        sort: 1,
        amount: 50_000_00,
        currency: 'RUB',
        dateFrom: new Date('2025-09-01'),
        dateTo: new Date('2025-10-01'), // TODO: dateTo -> Date()
        params: { key: 'val' },
      },
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        amount: 5_000_00,
        currency: 'RUB',
        dateFrom: new Date('2025-09-01'),
        dateTo: new Date('2025-09-31'),
        params: {},
      },
    ] satisfies Budget[])
  })

  test('update_budgets_from_remote:delete_other_spendings', () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([
      {
        id: 3,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: {},
      },
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: {},
      },
    ])

    // Эмулируем траты по бюджетам
    localStorage.setItem(_test.lsSpendingsKey(2), 'some value2')
    localStorage.setItem(_test.lsSpendingsKey(3), 'some value3')

    BudgetSpendingsStore.storeBudgetsFromRemote([
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: {},
      },
      {
        id: 1,
        alias: 'b1',
        name: 'на учебу',
        sort: 1,
        money: fromRUB(50_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-10-01',
        params: {},
      },
    ])

    // удаляются траты по бюджетам, которых нет в списке
    expect(localStorage.getItem(_test.lsSpendingsKey(3))).toBeNull()

    // остаются все те, которые есть
    expect(localStorage.getItem(_test.lsSpendingsKey(2))).toEqual('some value2')
  })

  test('spendings_by_budget_id:empty,invalid_store', () => {
    expect(BudgetSpendingsStore.spendingsByBudgetId(555)).toEqual([])

    localStorage.setItem(_test.lsSpendingsKey(555), 'invalid value')
    expect(() => BudgetSpendingsStore.spendingsByBudgetId(555)).toThrow(SyntaxError)
  })

  test('spendings_by_budget_id', () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1), makeBudget(2)])

    BudgetSpendingsStore.storeSpendingsFromRemote(1, [makeApiSpending({ id: 'sp11' }), makeApiSpending({ id: 'sp12' })])

    BudgetSpendingsStore.storeSpendingsFromRemote(2, [makeApiSpending({ id: 'sp21' }), makeApiSpending({ id: 'sp22' })])

    const res1 = BudgetSpendingsStore.spendingsByBudgetId(1)
    const res2 = BudgetSpendingsStore.spendingsByBudgetId(2)

    expect(res1).length(2)
    expect(res2).length(2)

    expect(eq({ id: 'sp11' }, res1[0]!)).toBe(true)
    expect(eq({ id: 'sp12' }, res1[1]!)).toBe(true)
    expect(eq({ id: 'sp21' }, res2[0]!)).toBe(true)
    expect(eq({ id: 'sp22' }, res2[1]!)).toBe(true)
  })

  test(BudgetSpendingsStore.storeSpendingsFromRemote.name, () => {
    // Невозможно записать расходы в несуществующий бюджет
    expect(() => BudgetSpendingsStore.storeSpendingsFromRemote(1, [])).toThrow('not existing budget')

    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    {
      const revokedVersions = BudgetSpendingsStore.storeSpendingsFromRemote(1, [
        {
          id: 'sp1',
          date: '2025-09-03',
          sort: 34,
          money: fromRUB(134_00),
          description: 'круассан',
          createdAt: '2025-09-03T15:23:22Z',
          updatedAt: '2025-09-03T15:23:22Z',
          version: '32kl4j3',
          versions: ['32kl4j3'],
        },
      ])

      expect(revokedVersions).toEqual([])

      const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

      const expSps: Spending[] = [
        {
          id: 'sp1',
          date: new Date('2025-09-03'),
          sort: 34,
          amount: 13400_00,
          currency: 'RUB',
          description: 'круассан',
          createdAt: new Date('2025-09-03T15:23:22Z'),
          updatedAt: new Date('2025-09-03T15:23:22Z'),
          version: '32kl4j3',
          receiptGroupId: 0,
        },
      ]

      expect(sps).toEqual(expSps)
    }

    // Сохранение в правильном порядке (sp.id ASC)
    {
      const revokedVersions = BudgetSpendingsStore.storeSpendingsFromRemote(1, [
        {
          id: 'sp2',
          date: '2025-09-04',
          sort: 1,
          money: fromRUB(150_00),
          description: 'шоколадка',
          createdAt: '2025-09-04T10:00:00Z',
          updatedAt: '2025-09-04T10:00:00Z',
          version: 'ver1',
          versions: ['ver1'],
        },
        {
          id: 'sp1',
          date: '2025-09-03',
          sort: 35,
          money: fromRUB(134_00),
          description: 'круассан',
          createdAt: '2025-09-03T15:23:22Z',
          updatedAt: '2025-09-03T15:23:22Z',
          version: 'ver2',
          versions: ['ver1', 'ver2'],
        },
      ])

      expect(revokedVersions).toEqual([])
      const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

      // Проверяем так же сортировку
      const expSps: Spending[] = [
        {
          id: 'sp1',
          date: new Date('2025-09-03'),
          sort: 35,
          amount: 13400_00,
          currency: 'RUB',
          description: 'круассан',
          createdAt: new Date('2025-09-03T15:23:22Z'),
          updatedAt: new Date('2025-09-03T15:23:22Z'),
          version: 'ver2',
          receiptGroupId: 0,
        },
        {
          id: 'sp2',
          date: new Date('2025-09-04'),
          sort: 1,
          amount: 15000_00,
          currency: 'RUB',
          description: 'шоколадка',
          createdAt: new Date('2025-09-04T10:00:00Z'),
          updatedAt: new Date('2025-09-04T10:00:00Z'),
          version: 'ver1',
          receiptGroupId: 0,
        },
      ]

      expect(sps).toEqual(expSps)
    }
  })

  test(BudgetSpendingsStore.storeSpendingsFromRemote.name + ':new_remote_ver', () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    BudgetSpendingsStore.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
      makeApiSpending({ id: 'sp3', version: 'ver1' }),
    ])

    const revoked = BudgetSpendingsStore.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver2' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
      makeApiSpending({ id: 'sp3', version: 'ver1' }),
      makeApiSpending({ id: 'sp4', version: 'ver1' }),
    ])

    // Перетирание с remote без pending
    expect(revoked).length(0)

    const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

    expect(sps).length(4)

    expect(sps[0]!.id).toEqual('sp1')
    expect(sps[0]!.version).toEqual('ver2')
  })

  test(BudgetSpendingsStore.storeSpendingsFromRemote.name + ':local_only', () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    // Status pending
    BudgetSpendingsStore.createSpending(
      1,
      makeSpending({
        id: 'spX',
        version: 'ver1',
      }),
    )

    BudgetSpendingsStore.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
    ])

    const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

    expect(sps).toEqual([
      makeSpending({ id: 'sp1', version: 'ver1' }),
      makeSpending({ id: 'sp2', version: 'ver1' }),
      makeSpending({ id: 'spX', version: 'ver1' }),
    ])

    vi.useFakeTimers()

    // Время статуса Applied
    const dApplied = new Date('2025-09-25T12:00:00Z')

    vi.setSystemTime(dApplied)

    BudgetSpendingsStore.setStatusApplied(1, 'spX', 'ver1') // Applied

    // Прошло небольшое время
    vi.advanceTimersByTime(5 * 1000)

    BudgetSpendingsStore.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
    ])

    // Applied может быть еще не отдается для read, задерживаем статус
    expect(sps).toEqual([
      makeSpending({ id: 'sp1', version: 'ver1' }),
      makeSpending({ id: 'sp2', version: 'ver1' }),
      makeSpending({ id: 'spX', version: 'ver1' }),
    ])

    // Через какое-то продолжительное время после applied.
    vi.advanceTimersByTime(1 * 60 * 60 * 1000)

    // Опять 2 записи, что означает, что он уже точно удалился с сервера после применения
    const revoked = BudgetSpendingsStore.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
    ])
    expect(revoked).toEqual([])

    const sps2 = BudgetSpendingsStore.spendingsByBudgetId(1)

    expect(sps2).length(2)
    expect(eq({ id: 'sp1', version: 'ver1' }, sps2[0]!)).toBe(true)
    expect(eq({ id: 'sp2', version: 'ver1' }, sps2[1]!)).toBe(true)

    vi.useRealTimers()
  })

  // pending -> applied -> inDB
  test(BudgetSpendingsStore.storeSpendingsFromRemote.name + ':applied', () => {
    const getValue = () => localStorage.getItem(_test.lsSpendingsKey(1)) || ''

    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    BudgetSpendingsStore.createSpending(1, makeSpending({ id: 'spX', version: 'ver1' }))

    expect(getValue()).toContain(VersionStatus.Pending)

    BudgetSpendingsStore.setStatusApplied(1, 'spX', 'ver1')

    expect(getValue()).toContain(VersionStatus.Applied)

    const revoked = BudgetSpendingsStore.storeSpendingsFromRemote(1, [makeApiSpending({ id: 'spX', version: 'ver1' })])

    expect(revoked).toEqual([])

    expect(getValue()).toContain(VersionStatus.InDb)
  })

  test(BudgetSpendingsStore.storeSpendingsFromRemote.name + ':local_conflict', () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    BudgetSpendingsStore.storeSpendingsFromRemote(1, [makeApiSpending({ id: 'sp1', version: 'ver1' })])

    BudgetSpendingsStore.updateSpending(1, makeSpending({ id: 'sp1', version: 'ver2', prev: {version: 'ver1', amount: 0, currency: "RUB", description: ''}}))
    BudgetSpendingsStore.updateSpending(1, makeSpending({ id: 'sp1', version: 'ver3', prev: {version: 'ver2', amount: 0, currency: "RUB", description: ''}}))

    const revoked = BudgetSpendingsStore.storeSpendingsFromRemote(1, [makeApiSpending({ id: 'sp1', version: 'ver4' })])

    // Перетирание локальных изменений
    expect(revoked).length(2)

    expect(revoked[0]!.spendingId).toEqual('sp1')
    expect(revoked[0]!.version).toEqual('ver2')

    expect(revoked[1]!.spendingId).toEqual('sp1')
    expect(revoked[1]!.version).toEqual('ver3')

    const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

    expect(sps).length(1)

    expect(sps[0]!.id).toEqual('sp1')
    expect(sps[0]!.version).toEqual('ver4')
  })

  test(BudgetSpendingsStore.createSpending, () => {
    const sp1: Spending = {
      id: 'sp1',
      version: 'ver1',
      date: new Date('2025-09-12'),
      sort: 3,
      amount: 12312_00,
      currency: 'RUB',
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
      receiptGroupId: 0,
    }

    // Не можем создать в несуществующем бюджете
    expect(() => BudgetSpendingsStore.createSpending(1, sp1)).toThrow('not existing budget')

    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    BudgetSpendingsStore.createSpending(1, sp1)

    const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

    expect(sps).toEqual([sp1])

    expect(() => BudgetSpendingsStore.createSpending(1, makeSpending({ id: 'sp1' }))).toThrow('spending already exists')

    {
      const sp0 = makeSpending({ id: 'sp0' })

      BudgetSpendingsStore.createSpending(1, sp0)

      const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

      expect(sps).length(2)

      expect(sps[0]).toEqual(sp0)
      expect(sps[1]).toEqual(sp1)
    }
  })

  test(BudgetSpendingsStore.updateSpending, () => {
    expect(() => BudgetSpendingsStore.updateSpending(1, makeSpending({ id: 'xxxx' }))).toThrow('not existing budget')

    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    expect(() => BudgetSpendingsStore.updateSpending(1, makeSpending({ id: 'xxxx' }))).toThrow('spending not found')

    const sp: Spending = {
      id: 'wqerdop',
      version: 'ver1',
      date: new Date('2025-09-12'),
      sort: 3,
      amount: 12312_00,
      currency: 'RUB',
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
      receiptGroupId: 0,
    }

    const sp2: Spending = {
      id: 'wqerdop',
      version: 'ver2',
      date: new Date('2025-09-12'),
      sort: 3,
      amount: 12312_00,
      currency: 'RUB',
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
      receiptGroupId: 17,
    }

    BudgetSpendingsStore.createSpending(1, sp)

    expect(() => BudgetSpendingsStore.updateSpending(1, sp2)).toThrow('invalid parent version')

    sp2.prev = {version: sp.version, amount: 0, currency: 'RUB', description: ''}

    BudgetSpendingsStore.updateSpending(1, sp2)

    const sps = BudgetSpendingsStore.spendingsByBudgetId(1)

    const expSps: Spending[] = [
      {
        id: 'wqerdop',
        version: 'ver2',
        date: new Date('2025-09-12'),
        sort: 3,
        amount: 12312_00,
        currency: 'RUB',
        description: 'что-то',
        createdAt: new Date('2025-09-12T23:22:00Z'),
        updatedAt: new Date('2025-09-12T23:22:00Z'),
        receiptGroupId: 17,
      },
    ]

    expect(sps).toEqual(expSps)

    // TODO: check deleted throw error on update
  })

  test(BudgetSpendingsStore.deleteSpending, () => {
    expect(() => BudgetSpendingsStore.deleteSpending(1, makeSpending({ id: 'xxxx' }))).toThrow('not existing budget')

    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    expect(() => BudgetSpendingsStore.deleteSpending(1, makeSpending({ id: 'xxxx' }))).toThrow('spending not found')

    const sp: Spending = {
      id: 'id1',
      version: 'ver1',
      date: new Date('2025-09-12'),
      sort: 3,
      amount: 12312_00,
      currency: 'RUB',
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
      receiptGroupId: 0,
    }

    BudgetSpendingsStore.createSpending(1, sp)

    const spDel = makeSpending({
      id: 'id1',
      version: 'ver2',
      updatedAt: new Date('2025-09-12T23:22:00Z'),
    })

    expect(() => BudgetSpendingsStore.deleteSpending(1, spDel)).toThrow('parent version is invalid')

    spDel.prev = {version: 'ver1', amount: 0, currency: 'RUB', description: ''}

    BudgetSpendingsStore.deleteSpending(1, spDel)

    expect(() => BudgetSpendingsStore.deleteSpending(1, makeSpending({ id: 'id1' }))).toThrow('spending cannot be changed')
    expect(() => BudgetSpendingsStore.updateSpending(1, makeSpending({ id: 'id1' }))).toThrow('spending cannot be changed')

    expect(BudgetSpendingsStore.spendingsByBudgetId(1)).toEqual([])
  })

  test('set_spending_version_applied', () => {
    // Метод синхронизационный, поэтому не отправляем ошибок в случае, если в сторе этого значения уже нет
    expect(() => BudgetSpendingsStore.setStatusApplied(1, 'sp1', 'ver1')).not.toThrow()

    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    BudgetSpendingsStore.createSpending(1, makeSpending({ id: 'sp1', version: 'ver1' }))

    let storeValue = localStorage.getItem(_test.lsSpendingsKey(1)) || ''

    expect(storeValue.includes(VersionStatus.Pending)).toEqual(true)
    expect(storeValue.includes(VersionStatus.Applied)).toEqual(false)

    BudgetSpendingsStore.setStatusApplied(1, 'sp1', 'ver1')

    storeValue = localStorage.getItem(_test.lsSpendingsKey(1)) || ''

    expect(storeValue.includes(VersionStatus.Applied)).toEqual(true)
  })

  test('revoke_conflict_version', () => {
    expect(BudgetSpendingsStore.revokeConflictVersion(1, 'sp1', 'ver1')).toEqual([])

    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(1)])

    BudgetSpendingsStore.createSpending(1, makeSpending({ id: 'sp1', version: 'ver1' }))

    expect(BudgetSpendingsStore.spendingsByBudgetId(1)).length(1)

    const revoked = BudgetSpendingsStore.revokeConflictVersion(1, 'sp1', 'ver1')

    expect(BudgetSpendingsStore.spendingsByBudgetId(1)).length(0)

    expect(revoked).length(1)

    expect(eq({ spendingId: 'sp1', version: 'ver1' }, revoked[0]!)).toBe(true)

    expect(BudgetSpendingsStore.revokeConflictVersion(1, 'sp1', 'ver1')).toEqual([])
  })
})

function makeApiSpending(sp: Partial<ApiSpending> = {}): ApiSpending {
  return {
    id: sp.id ?? '',
    date: sp.date ?? '',
    sort: sp.sort ?? 0,
    money: sp.money ?? {amount: 0, fraction: 0, currency: 'RUB'},
    description: sp.description ?? '',
    createdAt: sp.createdAt ?? '',
    updatedAt: sp.updatedAt ?? '',
    version: sp.version ?? '',
    versions: sp.versions ?? [],
  }
}

function clearLocalStorageByPrefix(prefix: string) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key)
    }
  }
}

function eq<T extends object>(partial: Partial<T>, full: T): boolean {
  return (Object.keys(partial) as Array<keyof T>).every(key => {
    return full[key] === partial[key]
  })
}

test('formatVersionPayload', () => {
  expect(formatVersionPayload(undefined)).toBeNull()

  const version1: SpendingVersion = {
    version: '3239db',
    status: VersionStatus.Pending,
    updatedAt: '',
    deleted: true,
  }
  expect(formatVersionPayload(version1)).toBeNull()

  const version2: SpendingVersion = {
    version: '3239d8',
    status: VersionStatus.Pending,
    updatedAt: '',
    date: new Date('2024-03-23T00:00:00Z'),
    amount: 12_00,
    currency: 'EUR',
    description: 'бигмак',
  }

  expect(formatVersionPayload(version2)).toEqual('23.03: 12 € бигмак')
})

function makeBudget(id: number): ApiBudget {
  return {
    id: id,
    alias: '',
    name: '',
    sort: 0,
    money: {
      amount: 0,
      fraction: 0,
      currency: '',
    },
    dateFrom: '',
    dateTo: '',
    params: {},
  }
}

function makeSpending(sp: Partial<Spending> = {}): Spending {
  return {
    id: sp.id ?? '',
    version: sp.version ?? '',
    prev: sp.prev ?? undefined,
    date: sp.date ?? new Date(0),
    sort: sp.sort ?? 0,
    amount: sp.amount ?? 0,
    currency: sp.currency ?? 'RUB',
    description: sp.description ?? '',
    createdAt: sp.createdAt ?? new Date(0),
    updatedAt: sp.updatedAt ?? new Date(0),
    receiptGroupId: sp.receiptGroupId ?? 0,
  }
}

function fromRUB(rubs: number): ApiMoney {
  return {
    amount: rubs * 100,
    currency: 'RUB',
    fraction: 2
  }
}
