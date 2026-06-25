import { test, describe, beforeEach, afterEach, expect, vi } from 'vitest'
import { Fetcher, Uploader } from '@/api'
import { BudgetSpendingsStore } from '@/stores/budgetSpendings'
import { useStatusStore } from '@/stores/status'
import { type ConflictSpendingVersion, useConflictVersionStore } from '@/stores/conflictVersions'
import type {
  ApiBudget,
  ApiSpending,
  ApiSpendingEvent,
  ApiUpdateSpendingsErrorsResponse,
  Budget,
  Spending,
} from '@/models/models'
import * as uuid from 'uuid'

vi.mock('uuid', () => ({ v4: vi.fn(() => 'mocked-uuid') }))

describe('fetcher', () => {
  beforeEach(() => {
    clearLocalStorageByPrefix(Fetcher._lsFetcherPrefix)
  })

  afterEach(() => {
    // 'fetch' restored back
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('fetch_and_store:initial', () => {
    expect(Fetcher.isInitialized()).toBe(false)
    expect(Fetcher.getUpdatedAt()).toBe(0)
  })

  test('fetch_and_store', async () => {
    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => jsonResponse,
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse)),
    )

    vi.useFakeTimers()
    vi.setSystemTime(777)

    await Fetcher.fetchAndStore()

    const status = useStatusStore.getState()
    expect(status.statusGetSpendings).toBe('ok')

    expect(Fetcher.isInitialized()).toBe(true)
    expect(Fetcher.getUpdatedAt()).toBe(777)

    expect(useConflictVersionStore.getState().conflictVersionsArr()).not.toEqual(
      expect.arrayContaining(['JZRm7','YX3lO','hIBHc'])
    )

    const exp: Budget[] = [
      {
        id: 23,
        alias: 'drinks',
        name: 'напитки',
        description: 'postmorten',
        sort: 1,
        amount: 8_000_00,
        currency: 'RUB',
        dateFrom: new Date('2025-05-01'),
        dateTo: new Date('2025-05-31'),
        params: { perDay: true },
      },
      {
        id: 25,
        alias: 'food',
        name: 'еда',
        description: 'postmorten',
        sort: 3,
        amount: 20_000_00,
        currency: 'RUB',
        dateFrom: new Date('2025-05-01'),
        dateTo: new Date('2025-05-31'),
        params: {},
      },
    ]
    expect(BudgetSpendingsStore.getBudgets()).toEqual(exp)

    expect(BudgetSpendingsStore.spendingsByBudgetId(1)).toEqual([])

    const expSpB23: Spending[] = [
      {
        id: 'nHSPMxURHX',
        version: 'JZRm7',
        date: new Date('2025-05-01'),
        sort: 101,
        amount: 85_00,
        currency: 'RUB',
        description: 'кофе',
        createdAt: new Date(1759154425085),
        updatedAt: new Date(1759154543304),
        receiptGroupId: 0,
      },
    ]

    expect(BudgetSpendingsStore.spendingsByBudgetId(23)).toEqual(expSpB23)
    expect(BudgetSpendingsStore.spendingsByBudgetId(25)).length(2)
  })

  test('fetch_and_store:conflict', async () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([makeBudget(23)])
    BudgetSpendingsStore.storeSpendingsFromRemote(23, [
      makeApiSpending({
        id: 'nHSPMxURHX',
        version: 'ver_server_1', // первая версия серверная
        date: '2025-05-01',
        description: 'кофе',
        money: { amount: 8500, currency: 'RUB', fraction: 2 },
        createdAt: '2025-09-29T14:00:25.085Z',
        updatedAt: '2025-09-29T14:02:23.304Z',
        sort: 101,
      }),
    ])

    BudgetSpendingsStore.updateSpending(23, {
      id: 'nHSPMxURHX',
      version: 'pending_2', // версия локальная
      prev: {version: 'ver_server_1', amount: 8500, currency: 'RUB', description: 'кофе'},
      date: new Date('2025-05-01'),
      description: 'кофе',
      createdAt: new Date('2025-09-29T14:00:25.085Z'),
      updatedAt: new Date('2025-09-29T15:02:23.304Z'),
      amount: 90_00, // изменил цену
      currency: 'RUB',
      sort: 101,
      receiptGroupId: 0,
    })

    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async (): Promise<string> => jsonResponse,
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse)),
    )

    vi.useFakeTimers()
    vi.setSystemTime(777)

    await Fetcher.fetchAndStore()

    const expConflicted: ConflictSpendingVersion = {
      version: 'pending_2',
      budgetId: 23,
      spendingId: 'nHSPMxURHX',
      versionDt: new Date('2025-09-29T15:02:23.304Z'),
      conflictedAt: new Date(777),
      from: '01.05: 85 ₽ кофе',
      to: '01.05: 90 ₽ кофе',
      reason: 'local and remote diff',
    }


    expect(useConflictVersionStore.getState().conflictVersionsArr())
      .toContainEqual(expConflicted)
  })
})

describe('updater', () => {
  beforeEach(() => {
    clearLocalStorageByPrefix(Uploader._lsEventsKey)
  })

  afterEach(() => {
    // 'fetch' restored back
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('uploader:create', async () => {
    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async (): Promise<string> => JSON.stringify({
        success: ['mocked-uuid'],
        errors: [],
      } as ApiUpdateSpendingsErrorsResponse),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse)),
    )

    const promise = Uploader.createSpending(1, {
      id: 'sp1',
      version: 'ver1',
      date: new Date('2025-10-03'),
      sort: 100,
      amount: 1000_00,
      currency: 'RUB',
      description: 'любовь',
      createdAt: new Date('2025-10-03T10:54:44.020Z'),
      updatedAt: new Date('2025-10-03T10:54:44.020Z'),
      receiptGroupId: 0,
    })

    const events = Uploader.getEvents()
    expect(events).length(1)

    const ev = events[0]

    const exp: ApiSpendingEvent = {
      eventId: 'mocked-uuid',
      dateTime: '2025-10-03T10:54:44.020Z',
      type: 'create',
      budgetId: 1,
      spendingId: 'sp1',
      newVersion: 'ver1',
      createData: {
        date: '2025-10-03',
        sort: 100,
        money: { amount: 1000_00, fraction: 2, currency: 'RUB' },
        description: 'любовь',
      },
    }

    expect(ev).toEqual(exp)

    await promise

    // status
    const status = useStatusStore.getState()
    expect(status.statusUpdateSpendings).toEqual('ok')

    // удаляются из внутреннего стора
    expect(Uploader.getEvents()).length(0)
  })

  test('uploader:update', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spyUuid = vi.spyOn(uuid, 'v4' as any).mockReturnValue('event_id_uuid_v4')

    // Upper conflicted versions evicted from SpendingsStore
    const conflictedVersions: ConflictSpendingVersion[] = [
      {
        version: 'ver2',
        budgetId: 22,
        spendingId: 'sp1',
        versionDt: new Date('2025-10-03T12:22:22.023Z'),
        conflictedAt: new Date(),
        from: '<..>',
        to: '<..>',
        reason: 'db error',
      },
      {
        // третья версия была сверху, поэтому она тоже становится revoked
        version: 'ver3',
        budgetId: 22,
        spendingId: 'sp1',
        versionDt: new Date('2025-10-03T12:31:22.023Z'),
        conflictedAt: new Date(),
        from: '<..>',
        to: '<..>',
        reason: 'db error',
      },
    ]
    const mockSpendingsStore_revokeConflictVersion = vi
      .spyOn(BudgetSpendingsStore, 'revokeConflictVersion')
      .mockReturnValue(conflictedVersions)

    vi.stubGlobal(
      'fetch',
      vi.fn(() => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async (): Promise<string> => JSON.stringify({
          success: [],
          errors: [{ eventId: 'event_id_uuid_v4', number: 0, error: 'already version v4' }],
        } as ApiUpdateSpendingsErrorsResponse),
      })),
    )

    ////////////////

    const promise = Uploader.updateSpending(22, {
      id: 'sp1',
      version: 'ver2',
      prev: {version: 'ver1', amount: 0, currency: 'RUB', description: ''},
      date: new Date('2025-10-03'),
      sort: 777,
      amount: 20_000_00,
      currency: 'RUB',
      description: 'dyson',
      createdAt: new Date('2025-10-02T12:22:22.023Z'),
      updatedAt: new Date('2025-10-03T12:22:22.023Z'),
      receiptGroupId: 22,
    })

    const expEvents: ApiSpendingEvent[] = [
      {
        eventId: 'event_id_uuid_v4',
        dateTime: '2025-10-03T12:22:22.023Z',
        type: 'update',
        budgetId: 22,
        spendingId: 'sp1',
        newVersion: 'ver2',
        updateData: {
          prevVersion: 'ver1',
          date: '2025-10-03',
          sort: 777,
          money: { amount: 20_000_00, fraction: 2, currency: 'RUB' },
          description: 'dyson',
          receiptGroupId: 22,
        },
      },
    ]

    expect(Uploader.getEvents()).toEqual(expEvents)

    await promise

    // Все события удалились
    expect(Uploader.getEvents()).toEqual([])

    // Из storage забрались конфликтные версии
    expect(mockSpendingsStore_revokeConflictVersion).toHaveBeenCalledTimes(1)
    expect(mockSpendingsStore_revokeConflictVersion).toHaveBeenCalledWith(22, 'sp1', 'ver2')

    // Отправились в ConflictVersions
    expect(useConflictVersionStore.getState().conflictVersionsArr())
      .toEqual(expect.arrayContaining(conflictedVersions))

    ////////////////

    vi.unstubAllGlobals()
    mockSpendingsStore_revokeConflictVersion.mockRestore()
    spyUuid.mockRestore()
  })

  test('uploader:delete', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spyUuid = vi.spyOn(uuid, 'v4' as any).mockReturnValue('event_id_uuid_v4')
    const spyStorageNotifyApplied = vi.spyOn(BudgetSpendingsStore, 'setStatusApplied')

    vi.stubGlobal(
      'fetch',
      vi.fn(() => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async (): Promise<string> => JSON.stringify({
          success: ['event_id_uuid_v4'],
          errors: [],
        } as ApiUpdateSpendingsErrorsResponse),
      })),
    )

    ////////////////

    const promise = Uploader.deleteSpending(22, {
      id: 'sp1',
      version: 'ver2',
      prev: {version: 'ver1', amount: 0, currency: 'RUB', description: ''},
      updatedAt: new Date('2025-10-03T12:22:22.023Z'),
    })

    const expEvents: ApiSpendingEvent[] = [
      {
        eventId: 'event_id_uuid_v4',
        dateTime: '2025-10-03T12:22:22.023Z',
        type: 'delete',
        budgetId: 22,
        spendingId: 'sp1',
        newVersion: 'ver2',
        deleteData: {
          prevVersion: 'ver1',
        },
      },
    ]

    expect(Uploader.getEvents()).toEqual(expEvents)

    await promise

    // Все события удалились
    expect(Uploader.getEvents()).toEqual([])

    // В storage пришло уведомление о примененной версии
    expect(spyStorageNotifyApplied).toHaveBeenCalledTimes(1)
    expect(spyStorageNotifyApplied).toHaveBeenCalledWith(22, 'sp1', 'ver2')

    ////////////////

    vi.unstubAllGlobals()
    spyStorageNotifyApplied.mockRestore()
    spyUuid.mockRestore()
  })

  test('uploader:loadEvents', async () => {
    useStatusStore.getState().setPendingEvents(777)
    {
      const t = Uploader.init()
      clearInterval(t)
      expect(Uploader.getEvents()).length(0)
      expect(useStatusStore.getState().pendingEvents).toEqual(0)
    }

    {
      Uploader.addEvent(makeApiSpendingEvent({ eventId: 'ev1' }))
      Uploader.addEvent(makeApiSpendingEvent({ eventId: 'ev2' }))

      {
        // сразу после save они доступны
        const events = Uploader.getEvents()
        expect(events).length(2)
        expect(events[0]!.eventId).toEqual('ev1')
        expect(events[1]!.eventId).toEqual('ev2')
        expect(useStatusStore.getState().pendingEvents).toEqual(2)
      }

      Uploader._events = []
      useStatusStore.getState().setPendingEvents(777)

      const t = Uploader.init()
      clearInterval(t)

      {
        // после load (которая в init) загружаются все события в память из стора
        const events = Uploader.getEvents()
        expect(events).length(2)
        expect(events[0]!.eventId).toEqual('ev1')
        expect(events[1]!.eventId).toEqual('ev2')
        expect(useStatusStore.getState().pendingEvents).toEqual(2)
      }
    }
  })

  test('uploader:sendEvents', async () => {
    const ev1 = makeApiSpendingEvent({ eventId: 'ev1' })
    const ev2 = makeApiSpendingEvent({ eventId: 'ev2' })
    const ev3 = makeApiSpendingEvent({ eventId: 'ev3' })

    const events = [ev1, ev2, ev3]

    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async (): Promise<string> => JSON.stringify({
        success: ['ev1', 'ev2'],
        errors: [{ eventId: 'ev3', number: 0, error: '' }],
      } as ApiUpdateSpendingsErrorsResponse),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => mockResponse),
    )

    useStatusStore.getState().setUpdateSpendingStatus('')
    expect(useStatusStore.getState().statusUpdateSpendings).toEqual('')

    const { success, conflict } = await Uploader.sendEvents(events)

    expect(useStatusStore.getState().statusUpdateSpendings).toEqual('ok')

    expect(success).toEqual([ev1, ev2])
    expect(conflict).toEqual([ev3])
  })

  test('uploader:sendEvents:statusNot200', async () => {
    const mockResponse: Partial<Response> = {
      ok: false,
      status: 400,
      headers: new Headers(),
      text: async () => 'some error',
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => mockResponse),
    )

    useStatusStore.getState().setUpdateSpendingStatus('')

    const { success, conflict } = await Uploader.sendEvents([])

    expect(useStatusStore.getState().statusUpdateSpendings).toEqual('Error status: 400')

    expect(success).toEqual([])
    expect(conflict).toEqual([])
  })

  test('uploader:sendEvents:fetchError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('timeout'))),
    )

    useStatusStore.getState().setUpdateSpendingStatus('')

    const { success, conflict } = await Uploader.sendEvents([])

    expect(useStatusStore.getState().statusUpdateSpendings).toEqual('Error timeout')

    expect(success).toEqual([])
    expect(conflict).toEqual([])
  })

  test('updater:add-deleteEvents', () => {
    Uploader.loadEvents()
    expect(Uploader.getEvents()).length(0)

    Uploader.addEvent(makeEvent({ eventId: 'ev1' }))

    expect(Uploader.getEvents()).length(1)
    expect(Uploader.getEvents()[0]?.eventId).toEqual('ev1')
    expect(useStatusStore.getState().pendingEvents).toEqual(1)

    Uploader.addEvent(makeEvent({ eventId: 'ev2' }))
    Uploader.addEvent(makeEvent({ eventId: 'ev3' }))

    expect(Uploader.getEvents()).length(3)
    expect(Uploader.getEvents()[0]?.eventId).toEqual('ev1')
    expect(Uploader.getEvents()[1]?.eventId).toEqual('ev2')
    expect(Uploader.getEvents()[2]?.eventId).toEqual('ev3')
    expect(useStatusStore.getState().pendingEvents).toEqual(3)

    Uploader.deleteEvents([makeEvent({ eventId: 'ev1' }), makeEvent({ eventId: 'ev3' })])

    expect(Uploader.getEvents()).length(1)
    expect(Uploader.getEvents()[0]?.eventId).toEqual('ev2')
    expect(useStatusStore.getState().pendingEvents).toEqual(1)
  })
})

function clearLocalStorageByPrefix(prefix: string) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key)
    }
  }
}

// type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

function makeApiSpendingEvent(e: Partial<ApiSpendingEvent>): ApiSpendingEvent {
  return {
    eventId: e.eventId ?? '',
    dateTime: e.dateTime ?? '',
    type: e.type ?? 'create',
    budgetId: e.budgetId ?? 0,
    spendingId: e.spendingId ?? '',
    newVersion: e.newVersion ?? '',
    createData: e.createData ?? undefined,
    updateData: e.updateData ?? undefined,
    deleteData: e.deleteData ?? undefined,
  }
}

const jsonResponse = `
{
  "budgets": [
    {
      "id": 23,
        "alias": "drinks",
        "dateFrom": "2025-05-01",
        "dateTo": "2025-05-31",
        "description": "postmorten",
        "money": {"amount": 800000, "currency": "RUB", "fraction": 2},
        "name": "напитки",
        "params": {"perDay": true},
        "sort": 1
    },
    {
      "id": 25,
        "alias": "food",
        "dateFrom": "2025-05-01",
        "dateTo": "2025-05-31",
        "description": "postmorten",
        "money": {"amount": 2000000, "currency": "RUB", "fraction": 2},
        "name": "еда",
        "params": {},
        "sort": 3
    }
  ],
  "spendings": [
    {
        "budgetId": 23,
        "spendings": [
          {
              "createdAt": "2025-09-29T14:00:25.085Z",
              "date": "2025-05-01",
              "description": "кофе",
              "id": "nHSPMxURHX",
              "money":{ "amount": 8500, "currency": "RUB", "fraction": 2 },
              "sort": 101,
              "updatedAt": "2025-09-29T14:02:23.304Z",
              "version": "JZRm7",
              "versions": ["some"]
          }
        ]
    },
    {
        "budgetId": 25,
        "spendings": [
        {
            "createdAt": "2025-09-29T14:00:25+00:00Z",
            "date": "2025-05-02",
            "description": "продукты",
            "id": "rLcmfSokY0",
            "money": {"amount": 17900, "currency": "RUB", "fraction": 2 },
            "sort": 102,
            "updatedAt": "1970-01-01T00:00:00.016Z",
            "version": "YX3lO"
        },
        {
            "createdAt": "1970-01-01T00:00:00.016Z",
            "date": "2025-05-02",
            "description": "еда",
            "id": "Rs4dRJOYD2",
            "money": { "amount": 3300, "currency": "RUB", "fraction": 2
            },
            "sort": 103,
            "updatedAt": "1970-01-01T00:00:00.016Z",
            "version": "hIBHc"
        }
        ]
    }
  ]
}
`

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

function makeApiSpending(sp: Partial<ApiSpending> = {}): ApiSpending {
  return {
    id: sp.id ?? '',
    date: sp.date ?? '',
    sort: sp.sort ?? 0,
    money: sp.money ?? {amount: 0, fraction: 0, currency: ''},
    description: sp.description ?? '',
    createdAt: sp.createdAt ?? '',
    updatedAt: sp.updatedAt ?? '',
    version: sp.version ?? '',
    versions: sp.versions ?? [],
  }
}

function makeEvent(e: Partial<ApiSpendingEvent>): ApiSpendingEvent {
  return {
    eventId: e.eventId ?? '',
    dateTime: e.dateTime ?? '',
    type: e.type ?? 'create',
    budgetId: e.budgetId ?? 0,
    spendingId: e.spendingId ?? '',
    newVersion: e.newVersion ?? '',
  }
}
