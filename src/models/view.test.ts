import { describe, expect, test, vi } from 'vitest'
import { PendingSpendingRow, SpendingRow, type SaveData } from '@src/models/view'
import * as models from '@src/models/models'
import { type Budget } from '@src/models/models'
import { dateISO } from '@src/helpers/date'
import { Facade } from '@src/facade'

vi.mock('@src/facade', () => ({ Facade: { updateSpending: vi.fn() } }))

describe('PendingSpendingRow', () => {
  test('setBudget:new', () => {
    const spyGenSpendingID = vi.spyOn(models, 'genSpendingID').mockReturnValue('newID')

    const s = new PendingSpendingRow(
      4,
      'id1',
      null,
      null,
      new Date('2021-05-13'),
      null,
      '', // TODO: null ?
      '', // TODO: null ?
      0,
    )

    expect(s.spId).toEqual('id1')
    expect(s.budgetId).toEqual(null)
    expect(s.currency).toEqual(null)
    expect(dateISO(s.date)).toEqual('2021-05-13')
    expect(s.rowNum).toEqual(4)

    s.setBudget(
      makeBudget({
        id: 2,
        amount: 0,
        currency: 'RUB',
      }),
    )

    expect(s.budgetId).toEqual(2)
    expect(s.currency).toEqual('RUB')

    // ID генерируется новый, так как Spending помещается уже внутри другого бюджета
    expect(s.spId).eq('newID')

    spyGenSpendingID.mockRestore()
  })

  test('setBudget:update', () => {
    const spyGenSpendingID = vi.spyOn(models, 'genSpendingID').mockReturnValue('newID')

    const s = new PendingSpendingRow(2, 'id1', 'v1-23a1e', 1, new Date(), 'RUB', '<3', '14.07', 0)

    expect(s.spId).toEqual('id1')
    expect(s.budgetId).toEqual(1)
    expect(s.currency).toEqual('RUB')

    s.setBudget(
      makeBudget({
        id: 2,
        amount: 0,
        currency: 'EUR',
      }),
    )

    expect(s.budgetId).toEqual(2)
    expect(s.currency).toEqual('EUR')

    // ID генерируется новый, так как Spending помещается уже внутри другого бюджета
    expect(s.spId).eq('newID')

    spyGenSpendingID.mockRestore()

    // Восстанавливается изначальный бюджет
    s.setBudget(
      makeBudget({
        id: 1,
        amount: 0,
        currency: 'RUB',
      }),
    )

    expect(s.spId).toEqual('id1') // id остается изначальным
  })

  test('save', () => {
    vi.stubGlobal('alert', vi.fn())

    const spMock = {
      saveChanges: vi.fn(),
    } as unknown as SpendingRow

    const mockDestroy = vi.fn()

    const s = new PendingSpendingRow(
      1,
      'id1',
      null,
      null,
      new Date(),
      null,
      '', // TODO: null ?
      '', // TODO: null ?
      123456,
    )

    s.setOriginalSpending(spMock)

    s.setDestroyFn(mockDestroy)

    s.save(new Date())

    expect(alert).toHaveBeenCalledWith('пустая сумма')
    expect(spMock.saveChanges).toBeCalledTimes(0)

    vi.clearAllMocks()
    s.amountFull = '1'
    s.save(new Date())

    expect(alert).toHaveBeenCalledWith('пустое описание')
    expect(spMock.saveChanges).toBeCalledTimes(0)

    vi.clearAllMocks()
    s.amountFull = '1'
    s.description = 'чай'
    s.save(new Date())

    expect(alert).toHaveBeenCalledWith('не выбран бюджет')
    expect(spMock.saveChanges).toBeCalledTimes(0)

    vi.clearAllMocks()
    const spyGenSpendingID = vi.spyOn(models, 'genSpendingID').mockReturnValue('spending22')
    const spyGenVersionID = vi.spyOn(models, 'genVersion').mockReturnValue('v1-abef3')

    s.amountFull = '110.50'
    s.description = 'чай'
    s.setBudget(makeBudget({ id: 1, amount: 0, currency: 'RUB' }))
    const dt = new Date()
    s.save(dt)

    expect(alert).not.toBeCalled()
    expect(spMock.saveChanges).toBeCalledTimes(1)
    expect(spMock.saveChanges).toBeCalledWith({
      id: 'spending22',
      dt: dt,
      version: 'v1-abef3',
      budgetId: 1,
      currency: 'RUB',
      description: 'чай',
      amountFull: 110.5,
      receiptGroupId: 123456,
    } as SaveData)

    expect(mockDestroy).toBeCalled()

    expect(spyGenVersionID).toHaveBeenCalledWith(null) // budget changed

    spyGenVersionID.mockRestore()
    spyGenSpendingID.mockRestore()
    vi.unstubAllGlobals()
  })
})

function makeBudget(b: Partial<Budget>): Budget {
  return {
    id: b.id ?? 0,
    alias: b.alias ?? '',
    name: b.name ?? '',
    sort: b.sort ?? 0,
    amount: 0,
    currency: b.currency ?? 'RUB',
    dateFrom: b.dateFrom ?? new Date(0),
    dateTo: b.dateTo ?? new Date(0),
    params: b.params ?? {},
  }
}

describe('SpendingRow', () => {
  test('save', () => {
    const sp = new SpendingRow(
      'id1',
      2,
      'RUB',
      'ver1',
      new Date('2026-01-06'),
      12,
      550,
      'love',
      new Date('2026-01-06 12:30'),
      new Date('2026-01-06 12:30'),
      0,
    )

    expect(sp.isSelected()).toBe(false)
    sp.select()
    expect(sp.isSelected()).toBe(true)
    sp.unselect()
    expect(sp.isSelected()).toBe(false)

    const newVer = models.genVersion(sp.version)
    const newReceiptId = 17
    const updAt = new Date('2026-01-06 17:59:20')

    sp.saveReceiptId(newReceiptId, newVer, updAt)

    const expSp: models.Spending = {
      id: 'id1',
      prev: {
        version: 'ver1',
        amount: 55000,
        currency: 'RUB',
        description: 'love',
      },
      version: newVer,
      date: new Date('2026-01-06'),
      sort: 12,
      amount: 550_00,
      currency: 'RUB',
      description: 'love',
      createdAt: new Date('2026-01-06 12:30'),
      updatedAt: updAt,
      receiptGroupId: newReceiptId,
    }

    expect(Facade.updateSpending).toBeCalledWith(2, expSp)

    expect(sp.version).toBe(newVer)
    expect(sp.receiptGroupId).toBe(newReceiptId)
    expect(sp.updatedAt).toBe(updAt)
  })
})
