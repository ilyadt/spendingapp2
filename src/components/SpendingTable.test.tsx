import {render, screen, cleanup, within, } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpendingTable, {type SpendingTableHandle} from './SpendingTable'
import {vi, describe, test, expect, beforeEach, afterEach} from 'vitest'
import {
  BudgetsContext,
  type spendingsStoreActions,
  SpendingsStoreActionsContext
} from "@src/models/contexts.ts";
import type {BudgetsWithSpentById, BudgetWithSpent} from "@src/stores/budgets.ts";
import type {Budget, Spending, SpendingRow} from "@src/models/models.ts";
import type {saveSpendingChanges, SpendingData, updateSpending} from "@src/models/facadewrapper.ts";
import * as helper from "@src/helpers/helper"
import {createRef} from "react";

const NOW_TIME = new Date('2026-06-12T10:30:00Z')

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.useRealTimers()
})

beforeEach(() => {
  vi.setSystemTime(NOW_TIME)
})

describe('SpendingTable', async () => {
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

    const saveSpendingChangesMock = vi.fn()
    const storeActions = {
      saveSpendingChanges: saveSpendingChangesMock as typeof saveSpendingChanges
    }

    vi.spyOn(helper, 'genRandInt').mockReturnValue(777)

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

    render(
      <SpendingsStoreActionsContext value={storeActions as spendingsStoreActions}>
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

    // Autofocus on amount after adding new spending
    expect(amountInput).toHaveFocus()

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

    expect(saveSpendingChangesMock).toHaveBeenCalledOnce()
    expect(saveSpendingChangesMock).toHaveBeenCalledWith(
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

  test('group/unite-receipt', async () => {
    const budgetsById: BudgetsWithSpentById = {
      1: {id: 1, alias: 'drinks', currency: 'RUB', amount: 0, amountSpent: 0} as BudgetWithSpent,
      2: {id: 2, alias: 'food', currency: 'RUB', amount: 0, amountSpent: 0} as BudgetWithSpent,
    }

    const sp1 = {
      rowId: 1,
      budgetId: 1,
      id: 'id-1',
      version: '1',
      date: new Date('2026-06-10'),
      amount: 100_00,
      currency: 'RUB',
      description: 'кофе',
      sort: 1,
    } as SpendingRow

    const sp2 = {
      rowId: 2,
      budgetId: 2,
      id: 'id-2',
      version: '1',
      date: new Date('2026-06-10'),
      amount: 500_00,
      currency: 'RUB',
      description: 'продукты',
      sort: 2,
    } as SpendingRow

    const updateSpendingMock = vi.fn()

    const storeActions = {
      updateSpending: updateSpendingMock as typeof updateSpending,
    } as spendingsStoreActions

    render(
      <SpendingsStoreActionsContext value={storeActions}>
        <BudgetsContext value={budgetsById}>
          <SpendingTable
            date={new Date('2026-06-10')}
            initSpendings={[
              sp1,
              sp2,
              {
                rowId: 3,
                budgetId: 2,
                id: 'id-3',
                version: '1',
                date: new Date('2026-06-10'),
                amount: 300_00,
                currency: 'RUB',
                description: 'помидоры',
                sort: 3,
              } as SpendingRow,
            ]}
          />
        </BudgetsContext>
      </SpendingsStoreActionsContext>
    )

    const user = userEvent.setup()

    const gpModeBtn = screen.getByRole('button', {name: 'Enable group mode'})
    await user.click(gpModeBtn)

    assertGroupOperations(true)

    const tbl = screen.getByRole('table')

    const row1 = within(within(tbl).getByTestId('row-1')).getByRole('checkbox', {name: "select item"})
    const row2 = within(within(tbl).getByTestId('row-2')).getByRole('checkbox', {name: "select item"})
    const row3 = within(within(tbl).getByTestId('row-3')).getByRole('checkbox', {name: "select item"})

    await user.click(row1)
    await user.click(row2)
    await user.click(row3)
    await user.click(row3) // toggle

    expect(row1).toBeChecked()
    expect(row2).toBeChecked()
    expect(row3).not.toBeChecked()

    const receiptIdMock = 0xb3a3d8_112233
    vi.spyOn(helper, 'genReceiptId').mockReturnValue(receiptIdMock)

    updateSpendingMock.mockReturnValue({receiptGroupId: receiptIdMock} as Spending)

    const uniteReceiptBtn = screen.getByRole('button', {name: 'Объединить в чек'})
    await user.click(uniteReceiptBtn)

    assertGroupOperations(false)

    // Test store savings
    expect(updateSpendingMock).toHaveBeenCalledTimes(2)
    expect(updateSpendingMock).toHaveBeenNthCalledWith(1,
      sp1,
      {receiptId: receiptIdMock} satisfies Partial<SpendingData>,
      NOW_TIME,
    )
    expect(updateSpendingMock).toHaveBeenNthCalledWith(2,
      sp2,
      {receiptId: receiptIdMock} satisfies Partial<SpendingData>,
      NOW_TIME,
    )

    // Check color change and total appeared in the last element
    const row1final = screen.getByTestId('row-1')
    const row2final = screen.getByTestId('row-2')
    const row3final = screen.getByTestId('row-3')


    expect(row1final).toHaveStyle({'--row-bg-color': '#112233'})
    expect(row2final).toHaveStyle({'--row-bg-color': '#112233'})
    expect(row3final).not.toHaveStyle({'--row-bg-color': '#112233'})

    const row1finalAmount = within(row1final).getAllByRole('cell')[0]
    const row2finalAmount = within(row2final).getAllByRole('cell')[0]
    const row3finalAmount = within(row3final).getAllByRole('cell')[0]

    expect(row1finalAmount.textContent).toEqual('100')
    expect(row2finalAmount.textContent).toEqual('600 \\ 500')
    expect(row3finalAmount.textContent).toEqual('300')
  })

  test('group/cancel-group', async () => {
    const budgetsById: BudgetsWithSpentById = {
      1: { id: 1, alias: 'drinks', currency: 'RUB', amount: 0, amountSpent: 0} as BudgetWithSpent,
      2: { id: 2, alias: 'food', currency: 'RUB', amount: 0, amountSpent: 0} as BudgetWithSpent,
    }

    render(
      <BudgetsContext value={budgetsById}>
        <SpendingTable
          date={new Date('2026-06-10')}
          initSpendings={[
            {
              rowId: 1,
              budgetId: 1,
              id: 'id-1',
              version: '1',
              date: new Date('2026-06-10'),
              amount: 100_00,
              currency: 'RUB',
              description: 'кофе',
              sort: 1,
            } as SpendingRow,
          ]}
        />
      </BudgetsContext>
    )

    const gpModeBtn = screen.getByRole('button', {name: 'Enable group mode'})

    const user = userEvent.setup()

    await user.click(gpModeBtn)
    assertGroupOperations(true)

    const cancelGrModeBtn = screen.getByRole('button', {name: 'Отменить'})
    await user.click(cancelGrModeBtn)

    assertGroupOperations(false)
  })

  test('ref/add-spending-row', async () => {
    const budgetsById: BudgetsWithSpentById = {
      3: {
        id: 3,
        description: 'очарование',
        alias: 'charm',
        currency: 'EUR',
        amount: 2500_00,
        amountSpent: 0,
      } as BudgetWithSpent,
    }

    const ref = createRef<SpendingTableHandle>()

    render(
      <BudgetsContext value={budgetsById}>
        <SpendingTable
          ref={ref}
          date={new Date('2026-06-10')}
          initSpendings={[
            {
              rowId: 933,
              budgetId: 3,
              id: 'id-1',
              version: '1',
              date: new Date('2026-06-10'),
              amount: 100_00,
              currency: 'EUR',
              description: 'something',
              sort: 1,
            } as SpendingRow
          ]}
        />
      </BudgetsContext>
    )

    ref.current!.addSpendingRow({
      rowId: 9192,
      budgetId: 3,
      date: new Date(''),
      id: "id-11",
      version: "v1-233",
      amount: 99_99,
      currency: 'EUR',
      description: "ресторанчик",
      createdAt: new Date(),
      updatedAt: new Date(),
      receiptGroupId: 0,
      sort: 99,
    })

    await screen.findByText('something')
    await screen.findByText('ресторанчик')
    await screen.findAllByText('charm')

    expect(screen.getByTestId('totals').textContent).toBe('199.99 EUR')
  })
})

function assertGroupOperations(enabled: boolean) {
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(0, -1) // TODO: fix last row is "+" button
    .forEach(row => {
      const checkbox = within(row).queryByRole('checkbox', {name: 'select item'})
      if (enabled) {
        expect(checkbox).toBeVisible()
        expect(checkbox).not.toBeChecked()
      } else {
        expect(checkbox).not.toBeInTheDocument()
      }
    })

  const groupActions = screen.queryByRole('group', {
    name: 'group-actions',
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  enabled
    ? expect(groupActions).toBeInTheDocument()
    : expect(groupActions).not.toBeInTheDocument()
}
