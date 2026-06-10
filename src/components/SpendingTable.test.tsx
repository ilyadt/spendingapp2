import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpendingTable from './SpendingTable'
import {vi, describe, test, expect} from 'vitest'

vi.spyOn(window, 'confirm').mockReturnValue(true)

// mocks
vi.mock('@src/stores/budgets.ts', () => ({
  useBudgetsWithSpent: () => ({
    1: {
      id: 1,
      alias: 'Food',
      currency: 'RUB',
      amount: 100000,
      amountSpent: 0,
    },
  }),
}))

describe('SpendingTable', () => {
  test('empty-table/cancel', async () => {
    const user = userEvent.setup()

    render(<SpendingTable date={new Date('2026-06-10')} initSpendings={[]}/>)

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
      screen.getAllByRole('button')[1]
    )

    expect(
      screen.queryByRole('spinbutton')
    ).not.toBeInTheDocument()

    expect(
      document.getElementById('overlay')
    ).not.toBeInTheDocument()
  })
})
