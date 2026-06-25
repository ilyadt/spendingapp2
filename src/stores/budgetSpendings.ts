import type {
  ApiBudget,
  ApiSpending,
  Budget,
  DelSpending,
  Spending,
} from '@/models/models'
import {type Currency, formatAmount} from '@/helpers/money'
import { format, isAfter, isBefore, subSeconds } from 'date-fns'
import type {ConflictSpendingVersion} from "@/stores/conflictVersions";

export enum VersionStatus {
  InDb = 'FROM_BACKEND', // версия, полученная с бека
  Pending = 'PENDING', // версия, которая применена, но еще не синхронизирована с беком (нужно для оффлайн работы)

  // версия, PENDING -> APPLIED, статус означает, что версия применена на беке, но сохраняем ее на случай если с бека будут приходить еще старая версия
  // READ lag
  Applied = 'APPLIED',
}

export interface SpendingVersion {
  // Пока это не нужно
  // version: number, // порядковый номер версии 1,2,3,4,5 ....
  // TODO: version -> versionHash (более точное название)
  version: string // хеш версии (рандомные), для того, чтобы строить правильные связи ver1 -> ver2 -> ver3

  // Пока это не нужно, ограничимся проверками на добавление / изменение
  // prevVersionHash: string | null, // хеш родительской версии для того, чтобы применять (как в блокчейне)
  status: VersionStatus
  // Relevant for Applied only
  statusAt?: Date
  date?: Date | string
  description?: string
  amount?: number
  currency?: Currency
  sort?: number
  updatedAt: Date | string // заменить на versionDt
  deleted?: boolean
  receiptId?: number // объединение в один чек в рамках одного дня
}

const SpendingVersionProto = {
  // Final status
  isFinal(this: SpendingVersion): boolean {
    return this.deleted == true
  },
}

function withProto(obj: SpendingVersion): SpendingVersion & typeof SpendingVersionProto {
  return Object.setPrototypeOf(obj, SpendingVersionProto)
}

interface SpendingVersioned {
  id: string
  createdAt: Date
  versions: SpendingVersion[]
}

interface BudgetSpendingsStoreInterface {
  // -----------------------------------------------------------------
  // Методы получения данных из стора

  getBudgets(): Budget[]
  spendingsByBudgetId(bid: number): Spending[]

  // -----------------------------------------------------------------

  // Синхронные методы, используемые UI для манипуляции с Spending ДО всякого взаимодействия с беком
  // Они должны отрабатывать без ошибок. В случае ошибки не давать пользователю сохранять действие

  /**
   * Creates a new spending.
   * @throws Error if already there
   */
  createSpending(bid: number, sp: Spending): void

  /**
   * @throws Error if not exist / cannot be applied
   */
  updateSpending(bid: number, sp: Spending): void

  // Silently skips if not there
  // fields: id, version, prevVersion, updatedAt / deletedAt /,
  // @throws Error if not exist / cannot be applied
  deleteSpending(bid: number, sp: Spending): void

  // -----------------------------------------------------------------

  // Методы, синхронизации с беком

  // Железная логика по сохранению бюджетов (перетирание всех данных по бюджету, даже spendings)
  // (если бюджет исчез, то предполагается, что в него никак нельзя добавить данные, поэтому все pending Spending's будут нерелевантны)
  // в дальнейшем можно предусмотреть возвращение удаленных Pending
  storeBudgetsFromRemote(bs: ApiBudget[]): void

  // Поэлементное spendingID, сравнение текущих данных и новых.
  // Новые данные имеют точку правды, все несоответствующие pending переносятся в <Error Storage>.
  storeSpendingsFromRemote(bid: number, sps: ApiSpending[]): ConflictSpendingVersion[]

  // После доставки обновления на бек изменяем статус версии в Storage
  setStatusApplied(bid: number, spId: string, version: string): void

  // Если произошел конфликт обновления (обновление не может быть применено), то удаляем эту версию из Storage,
  // возвращая удаленные (не примененные) версии
  revokeConflictVersion(bid: number, spId: string, version: string): ConflictSpendingVersion[]
}

const lsPrefix = 'storageV2'

function lsSpendingsKey(bid: number): string {
  return `${lsPrefix}:b:${bid}:spendings`
}

function lsBudgetsKey(): string {
  return `${lsPrefix}:budgets`
}

export const BudgetSpendingsStore: BudgetSpendingsStoreInterface = {
  getBudgets(): Budget[] {
    const budgets: ApiBudget[] = JSON.parse(localStorage.getItem(lsBudgetsKey()) ?? '[]')

    return budgets.map(apib => ({
      id: apib.id,
      alias: apib.alias,
      name: apib.name,
      description: apib.description,
      sort: apib.sort,
      amount: apib.money.amount,
      currency: apib.money.currency as Currency,
      dateFrom: new Date(apib.dateFrom),
      dateTo: new Date(apib.dateTo),
      params: apib.params,
    }))
  },

  spendingsByBudgetId(bid: number): Spending[] {
    const fromStore: SpendingVersioned[] = JSON.parse(localStorage.getItem(lsSpendingsKey(bid)) || '[]')

    const res: Spending[] = []

    for (const spVersioned of fromStore) {
      const lastVer = spVersioned.versions.at(-1)!

      if (lastVer.deleted) {
        continue
      }

      res.push({
        id: spVersioned.id,
        version: lastVer.version!,
        date: new Date(lastVer.date!),
        sort: lastVer.sort!,
        amount: lastVer.amount!,
        currency: lastVer.currency! as Currency,
        description: lastVer.description!,
        createdAt: new Date(spVersioned.createdAt),
        updatedAt: new Date(lastVer.updatedAt),
        receiptGroupId: lastVer.receiptId ?? 0,
      })
    }

    return res
  },

  createSpending(bid: number, newSp: Spending): void {
    assertBudget(bid)

    const spendingsFromLS: SpendingVersioned[] = JSON.parse(localStorage.getItem(lsSpendingsKey(bid)) ?? '[]')
    const idx = spendingsFromLS.findIndex(s => s.id >= newSp.id)

    // Дополнительная проверка. Предполагается, что ID создается на клиенте всегда уникальный
    if (idx !== -1 && spendingsFromLS[idx]!.id === newSp.id) {
      throw new Error('spending already exists')
    }

    const newSpVersioned: SpendingVersioned = {
      id: newSp.id,
      createdAt: newSp.createdAt,
      versions: [
        {
          version: newSp.version,
          status: VersionStatus.Pending,
          date: newSp.date,
          description: newSp.description,
          amount: newSp.amount,
          currency: newSp.currency,
          sort: newSp.sort,
          updatedAt: newSp.updatedAt,
          deleted: false,
        },
      ],
    }

    const insertIdx = idx === -1 ? spendingsFromLS.length : idx

    spendingsFromLS.splice(insertIdx, 0, newSpVersioned)

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(spendingsFromLS))
  },

  updateSpending(bid: number, upd: Spending): void {
    assertBudget(bid)

    const fromStore: SpendingVersioned[] = JSON.parse(localStorage.getItem(lsSpendingsKey(bid)) ?? '[]')

    const sp = fromStore.find(s => s.id == upd.id)

    if (!sp) {
      throw new Error('spending not found')
    }

    const lastVer = withProto(sp.versions.at(-1)!)

    if (lastVer.isFinal()) {
      throw new Error('spending cannot be changed')
    }

    if (upd.prev?.version != lastVer.version) {
      throw new Error('invalid parent version')
    }

    sp.versions.push({
      version: upd.version,
      status: VersionStatus.Pending,
      date: upd.date,
      description: upd.description,
      amount: upd.amount,
      currency: upd.currency,
      sort: upd.sort,
      updatedAt: upd.updatedAt,
      receiptId: upd.receiptGroupId,
    })

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))
  },

  deleteSpending(bid: number, del: DelSpending): void {
    assertBudget(bid)

    const fromStore: SpendingVersioned[] = JSON.parse(localStorage.getItem(lsSpendingsKey(bid)) ?? '[]')

    const sp = fromStore.find(s => s.id == del.id)
    if (!sp) {
      throw new Error('spending not found')
    }

    const lastVer = withProto(sp.versions.at(-1)!)

    if (lastVer.isFinal()) {
      throw new Error('spending cannot be changed')
    }

    if (del.prev?.version != lastVer.version) {
      throw new Error('parent version is invalid')
    }

    sp.versions.push({
      version: del.version!,
      status: VersionStatus.Pending,
      updatedAt: del.updatedAt!,
      deleted: true,
    })

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))
  },

  storeBudgetsFromRemote(budgets: ApiBudget[]): void {
    budgets.sort((b1, b2) => b1.id - b2.id)

    const raw = localStorage.getItem(lsBudgetsKey())
    const storageBudgets: ApiBudget[] = raw ? JSON.parse(raw) : []

    const newIds = new Set(budgets.map(b => b.id))
    const oldIds = new Set(storageBudgets.map(b => b.id))

    const toDeleteBids = new Set([...oldIds].filter(id => !newIds.has(id)))

    for (const delId of toDeleteBids) {
      localStorage.removeItem(lsSpendingsKey(delId))
    }

    localStorage.setItem(lsBudgetsKey(), JSON.stringify(budgets))
  },

 storeSpendingsFromRemote(bid: number, remoteSps: ApiSpending[]): ConflictSpendingVersion[] {
    assertBudget(bid)

    const localSps: SpendingVersioned[] = JSON.parse(localStorage.getItem(lsSpendingsKey(bid)) ?? '[]')
    const remoteById = new Map(remoteSps.map(sp => [sp.id, sp]))
    const localById = new Map(localSps.map(sp => [sp.id, sp]))

    const remoteIds = new Set(remoteById.keys())
    const localIds = new Set(localById.keys())

    const onlyRemote = [...remoteIds].filter(id => !localIds.has(id))
    const onlyLocal = [...localIds].filter(id => !remoteIds.has(id))
    const both = [...remoteIds].filter(id => localIds.has(id))

    const result: SpendingVersioned[] = []
    const revoked: ConflictSpendingVersion[] = []

    // --- Remote only ---
    for (const id of onlyRemote) {
      const sp = remoteById.get(id)!
      result.push({
        id,
        createdAt: new Date(sp.createdAt),
        versions: [remoteToVersion(sp)],
      })
    }

    // --- Local only ---
    for (const id of onlyLocal) {
      const spv = localById.get(id)!
      const v1 = spv.versions[0]!
      const at = new Date(v1.statusAt!)
      const createdRecentlyLocally =
        v1.status === VersionStatus.Pending ||
        (v1.status === VersionStatus.Applied && isAfter(at, subSeconds(Date.now(), 15)))

      if (createdRecentlyLocally) {
        result.push(spv)
        continue
      }

      const deleted =
        v1.status === VersionStatus.InDb ||
        (v1.status === VersionStatus.Applied && isBefore(at, subSeconds(Date.now(), 15)))

      if (deleted) {
        revoked.push(
          ...makeConflictVersions(bid, spv.id, spv.versions, v => v.status === VersionStatus.Pending, 'locally or remote deleted')
        )
      }
    }

    // --- Both sides ---
    for (const id of both) {
      const localSp = localById.get(id)!
      const remoteSp = remoteById.get(id)!

      const matchIndex = localSp.versions.findIndex(v => v.version === remoteSp.version)
      let versions: SpendingVersion[]

      if (matchIndex >= 0) {
        versions = localSp.versions.slice(matchIndex)
        versions[0]!.status = VersionStatus.InDb
      } else {
        revoked.push(
          ...makeConflictVersions(bid, id, localSp.versions, v => (v.status === VersionStatus.Pending && !remoteSp.versions.includes(v.version)), 'local and remote diff')
        )
        versions = [remoteToVersion(remoteSp)]
      }

      localSp.versions = versions
      result.push(localSp)
    }

    result.sort((a, b) => a.id.localeCompare(b.id))
    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(result))
    return revoked
  },

  setStatusApplied(bid: number, spId: string, version: string): void {
    const fromStore: SpendingVersioned[] = JSON.parse(localStorage.getItem(lsSpendingsKey(bid)) ?? '[]')

    const spVersioned = fromStore.find(s => spId == s.id)

    if (!spVersioned) {
      return
    }

    const storedVer = spVersioned.versions.find(ver => ver.version == version)

    if (!storedVer) {
      return
    }

    storedVer.status = VersionStatus.Applied
    storedVer.statusAt = new Date()

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))
  },

  revokeConflictVersion(bid: number, spId: string, version: string): ConflictSpendingVersion[] {
    let fromStore: SpendingVersioned[] = JSON.parse(localStorage.getItem(lsSpendingsKey(bid)) ?? '[]')

    const spVersionedIdx = fromStore.findIndex(s => s.id == spId)

    if (spVersionedIdx == -1) {
      return []
    }

    const spVersioned = fromStore[spVersionedIdx]!

    const idx = spVersioned.versions.findIndex(ver => ver.version == version)
    if (idx == -1) {
      return []
    }

    const conflictVersions = makeConflictVersions(bid, spId, spVersioned.versions, v => v.version == version, null)

    spVersioned.versions = spVersioned.versions.slice(0, idx)

    if (spVersioned.versions.length == 0) {
      fromStore = fromStore.splice(spVersionedIdx, 0)
    }

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))

    return conflictVersions
  },
}

// Check budget exists
function assertBudget(bid: number) {
  const budgets: ApiBudget[] = JSON.parse(localStorage.getItem(lsBudgetsKey()) ?? '[]')
  const b = budgets.find(b => b.id === bid)
  if (!b) {
    throw new Error('not existing budget')
  }
}

function remoteToVersion(sp: ApiSpending): SpendingVersion {
  return {
    version: sp.version,
    status: VersionStatus.InDb,
    date: new Date(sp.date),
    description: sp.description,
    amount: sp.money.amount,
    currency: sp.money.currency as Currency,
    sort: sp.sort,
    updatedAt: new Date(sp.updatedAt),
    deleted: false,
    receiptId: sp.receiptGroupId,
  }
}

export function makeConflictVersions(
  bid: number,
  spID: string,
  spVersions: SpendingVersion[],
  fromIdx: (spVer: SpendingVersion) => boolean,
  reason: string | null,
): ConflictSpendingVersion[] {
  const idx = spVersions.findIndex(fromIdx)
  if (idx == -1) {
    return []
  }

  const revoked: ConflictSpendingVersion[] = []

  for (let i = idx; i < spVersions.length; i++) {
    const curr = spVersions[i]!
    const prev = spVersions[i - 1]

    revoked.push({
      version: curr.version,
      budgetId: bid,
      spendingId: spID,
      versionDt: new Date(curr.updatedAt),
      conflictedAt: new Date(),
      from: formatVersionPayload(prev),
      to: formatVersionPayload(curr),
      reason: reason,
    })
  }

  return revoked
}

export function formatVersionPayload(ver?: SpendingVersion): string | null {
  if (!ver || ver.deleted) {
    return null
  }

  return `${format(ver.date!, 'dd.MM')}: ${formatAmount(ver.amount!, ver.currency!)} ${ver.description!}`
}

export const _test = {
  lsBudgetsKey,
  lsSpendingsKey,
  lsPrefix,
}
