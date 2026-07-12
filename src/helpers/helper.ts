import type {Budget, SpendingActions, SpendingRow} from "@/models/models.ts";
import {daysFrom2000UTC} from "@/helpers/date.ts";
import {v7 as uuidv7} from "uuid";
import {customAlphabet} from "nanoid/non-secure";
import {alphanumeric} from "nanoid-dictionary";
import type {NavLinkRenderProps} from "react-router";
import clsx from "clsx/lite";
import styles from "@/app/App.module.css";
import type {BudgetsWithSpentById, BudgetWithSpent} from "@/stores/budgets.ts";
import type {SpendingsByBudget} from "@/stores/spendings.ts";
import type {BudgetsAndSpendingsRepository} from "@/repository.ts";
import type {SubmitEventHandler} from "react";

export const genSpendingID = (): string => uuidv7()

// null    -> v1-xxxxx
// xxxxx   -> yyyyy
// v1-3829f -> v2-xxxxx
export const genVersion = (prevVer: string | null): string => {
  const versionSuffix = customAlphabet(alphanumeric, 7)

  if (prevVer === null) {
    return `v1-${versionSuffix()}`
  }

  const match = prevVer.match(/^v(\d+)-/i)
  if (!match) {
    return versionSuffix()
  }

  const nextNum = parseInt(match[1]!, 10) + 1

  return `v${nextNum}-${versionSuffix()}`
}

export function randomSoftRGB(): number {
  const rand = () => Math.floor(100 + Math.random() * 120); // 100–219

  const r = rand();
  const g = rand();
  const b = rand();

  return (r << 16) | (g << 8) | b;
}

export function colorFromReceiptId(rId: number|undefined): string|null {
  if (!rId) {
    return null
  }

  return '#' + (rId & 0xff_ff_ff).toString(16)
}

export function genReceiptId(dt: Date): number {
  const days = daysFrom2000UTC(dt)
  const color = randomSoftRGB()

  // 3byte + 3byte
  return Number(BigInt(days) << 24n | BigInt(color))
}

export function budgetsSortFn(a: Budget, b: Budget) {
  let aSort = a.sort
  if (a.sort == 0) {
    aSort = 1e6
  }

  let bSort = b.sort
  if (b.sort == 0) {
    bSort = 1e6
  }

  if (aSort == bSort) {
    return a.id - b.id
  }

  return aSort - bSort
}

export const genRandInt = () => Math.floor(Math.random() * 1e15)

type RowId = number
type Total = number
type ReceiptId = number

export function receiptTotals(rows: SpendingRow[]): Record<RowId, Total> {
  const rId2total: Record<ReceiptId, [RowId, Total] > = {}

  for (const spRow of rows) {
    if (!spRow.receiptGroupId) {
      continue
    }

    const amount = rId2total[spRow.receiptGroupId]?.[1] ?? 0

    rId2total[spRow.receiptGroupId] = [spRow.rowId, amount + spRow.amount]
  }

  const res: Record<RowId, Total> = {}

  for (const [rowIdx, totalReceipt] of  Object.values(rId2total)) {
    res[rowIdx] = totalReceipt
  }

  return res
}

export function navLinkClass({isActive}: NavLinkRenderProps): string {
  return clsx(styles.navLink, isActive && styles.active)
}

export function percentAmount(b: BudgetWithSpent) {
  return Math.floor(b.amountSpent/b.amount * 100)
}

export function composeSpActions(subjects: SpendingActions[]): SpendingActions {
  return {
    createSpending(bid, newSp) {
      subjects.forEach(s => s.createSpending(bid, newSp))
    },
    updateSpending(bid, upd) {
      subjects.forEach(s => s.updateSpending(bid, upd))
    },
    deleteSpending(bid, del) {
      subjects.forEach(s => s.deleteSpending(bid, del))
    },
  }
}

type BudgetsAndSpendings = {
  budgetsById: BudgetsWithSpentById
  spendingsByBid: SpendingsByBudget
}

// TODO: write test
export function getAllBudgetsAndSpendings(repo: BudgetsAndSpendingsRepository): BudgetsAndSpendings {
  const budgets = repo.getBudgets()

  const spendingsByBid: SpendingsByBudget = {}
  const budgetsById: BudgetsWithSpentById = {}

  for (const b of budgets) {
    const spendings = repo.spendingsByBudgetId(b.id)

    spendingsByBid[b.id] = spendings

    budgetsById[b.id] = {
      ...b,
      amountSpent: spendings.reduce((sum, sp) => sum + sp.amount, 0),
    }
  }

  return {budgetsById, spendingsByBid}
}

export function submitFormData(handler: (fd: FormData) => boolean|void): SubmitEventHandler<HTMLFormElement> {
  return e => {
    e.preventDefault()

    const form = e.currentTarget

    if (handler(new FormData(form)) !== false) {
      form.reset()
    }
  }
}
