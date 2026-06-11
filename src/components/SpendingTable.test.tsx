import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpendingTable from './SpendingTable'
import {vi, describe, test, expect, afterEach} from 'vitest'
import {BudgetsContext} from "@src/models/contexts.ts";
import type {BudgetsWithSpentById, BudgetWithSpent} from "@src/stores/budgets.ts";

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SpendingTable', () => {
  test('empty-table/cancel', async () => {
    const user = userEvent.setup()

    const budgetsById: BudgetsWithSpentById = {
      1: {
        id: 1,
        alias: 'Food',
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
})
