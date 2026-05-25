import type {Budget} from "@src/models/models.ts";
import {daysFrom2000UTC} from "@src/helpers/date.ts";

export function randomSoftRGB(): number {
  const rand = () => Math.floor(100 + Math.random() * 120); // 100–219

  const r = rand();
  const g = rand();
  const b = rand();

  return (r << 16) | (g << 8) | b;
}

export function colorFromReceiptId(rId: number): number {
  return rId & 0xff_ff_ff
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
