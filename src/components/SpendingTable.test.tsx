import {render, screen, cleanup} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpendingTable from './SpendingTable'
import {vi, describe, test, expect, beforeEach, afterEach} from 'vitest'
import {
  BudgetsContext,
  type spendingsStoreActions,
  SpendingsStoreActionsContext
} from "@src/models/contexts.ts";
import type {BudgetsWithSpentById, BudgetWithSpent} from "@src/stores/budgets.ts";
import type {Budget, SpendingRow} from "@src/models/models.ts";
import type {SpendingData} from "@src/models/facadewrapper.ts";
import * as random from "@src/helpers/helper"

const NOW_TIME = new Date('2026-06-12T10:30:00Z')

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

beforeEach(() => {
  vi.setSystemTime(NOW_TIME)
})

describe('SpendingTable', () => {
  test('empty-table/cancel', async () => {
    const user = userEvent.setup()

    const budgetsById: BudgetsWithSpentById = {
      1: {
        id: 1,
        alias: 'food',
        currency: 'RUB',
        amount: 100000,
        amountSpent: 0,
      } as BudgetWithSpent,
    }

    render(
      <BudgetsContext value={budgetsById}>
        <SpendingTable date={new Date('2026-06-10')} initSpendings={[]}/>
      </BudgetsContext>
    )

    // open
    await user.click(screen.getByRole('button', {name: '+'}))

    expect(
      screen.getByRole('spinbutton', {name: ''})
    ).toBeInTheDocument()

    expect(
      document.getElementById('overlay')
    ).toBeInTheDocument()

    // cancel
    await user.click(
      screen.getByTestId('cancel-pending')
    )

    expect(
      screen.queryByRole('spinbutton')
    ).not.toBeInTheDocument()

    expect(
      document.getElementById('overlay')
    ).not.toBeInTheDocument()
  })

  test('empty-table/create-new-spending', async () => {
    const user = userEvent.setup()

    vi.spyOn(random, 'genRandInt').mockReturnValue(777)

    const budgetsById: BudgetsWithSpentById = {
      1: {
        id: 1,
        description: 'еда',
        alias: 'food',
        currency: 'RUB',
        amount: 25000_00,
        amountSpent: 350_00,
      } as BudgetWithSpent,
    }

    const mockSaveStore = vi.fn()

    const spStoreActionsMock = {
      saveSpendingChanges: mockSaveStore,
    } as unknown as spendingsStoreActions

    render(
      <SpendingsStoreActionsContext value={spStoreActionsMock}>
        <BudgetsContext value={budgetsById}>
          <SpendingTable date={new Date('2026-06-10')} initSpendings={[]}/>
        </BudgetsContext>
      </SpendingsStoreActionsContext>
    )

    await user.click(screen.getByTestId('add-new-button'))

    const editForm = screen.getByTestId('edit-form')

    expect(editForm).toBeInTheDocument()
    expect(editForm).toBeInstanceOf(HTMLFormElement)

    const amountInput = editForm.querySelector<HTMLInputElement>('input[name="amount"]')
    expect(amountInput).toBeInTheDocument()

    amountInput!.focus()
    await user.keyboard('100')

    const descriptionInput = editForm.querySelector<HTMLInputElement>('input[name="description"]')
    expect(descriptionInput).toBeInTheDocument()

    descriptionInput!.focus()
    await user.keyboard('мороженое')

    const budgetSelect = editForm.querySelector<HTMLSelectElement>('select[name="budgetId"]')
    expect(budgetSelect).toBeInTheDocument()

    budgetSelect!.focus()
    await user.selectOptions(budgetSelect!, '1')

    await user.click(screen.getByTestId('submit-pending'))

    expect(mockSaveStore).toHaveBeenCalledOnce()
    expect(mockSaveStore).toHaveBeenCalledWith(
      expect.objectContaining({
        rowId: 777,
        id: expect.toSatisfy(id => !id),
        date: new Date('2026-06-10'),
        sort: NOW_TIME.getTime()
      } as SpendingRow),
      {
        budget: expect.objectContaining({id: 1, currency: 'RUB'} as Budget),
        date: new Date('2026-06-10'),
        amount: 100_00,
        description: "мороженое"
      } satisfies SpendingData,
      NOW_TIME,
    )
  })
})
