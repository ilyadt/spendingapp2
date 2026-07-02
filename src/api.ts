import createClient from 'openapi-fetch'
import {type BudgetsAndSpendingsRepository} from '@/repository'
import {type StatusStoreApi} from '@/stores/status'
import {type ConflictVersionStoreApi} from '@/stores/conflictVersions'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import type { Spending, ApiSpendingEvent, DelSpending, ApiUploadError, ApiSchemaPaths } from '@/models/models'
import {currencyFraction} from "@/helpers/money.ts";

// Получение бюджетов и расходов по ним
export const createFetcher = (
  ls: Storage,
  serverUrl: string,
  repo: BudgetsAndSpendingsRepository,
  statusApi: StatusStoreApi,
  conflictVersionsApi: ConflictVersionStoreApi,
) => ({
  lsUpdatedAtKey: 'fetcher:lastUpdatedAt',
  async initAndStart() {
    // Startup fetch data (no-blocking)
    const task = this.fetchAndStore()

    // Blocks on first run
    if (!this.getUpdatedAt()) {
      await task
    }

    // Every 60 seconds
    setInterval(() => this.fetchAndStore(), 60 * 1000)
  },

  async fetchAndStore() {
    const client = createClient<ApiSchemaPaths>({ baseUrl: serverUrl })

    try {
      const { data, response } = await client.GET('/budgets/spendings', {
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      statusApi.setGetSpendingStatus('ok')

      repo.storeBudgetsFromRemote(data!.budgets)

      for (const apiSpsByBudget of data!.spendings) {
        const revoked = repo.storeSpendingsFromRemote(apiSpsByBudget.budgetId, apiSpsByBudget.spendings)

        conflictVersionsApi.add(...revoked)
      }

      ls.setItem(this.lsUpdatedAtKey, String(Date.now()))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      statusApi.setGetSpendingStatus(err.name + ' ' + err.message)
    }
  },

  getUpdatedAt(): number {
    return Number(ls.getItem(this.lsUpdatedAtKey))
  },
})

export const createUploader = (
  ls: Storage,
  serverUrl: string,
  repo: BudgetsAndSpendingsRepository,
  statusApi: StatusStoreApi,
  conflictVersionsApi: ConflictVersionStoreApi,
) => ({
  _lsEventsKey: 'updater:events',
  _events: [] as ApiSpendingEvent[],

  init(): ReturnType<typeof setInterval> {
    this.loadEvents()

    const task = async () => {
      const events = this.getEvents()

      if (events.length == 0) {
        return
      }

      await this.processEvents(events)
    }

    // Initially run
    task()

    return setInterval(task, 30_000)
  },

  createSpending(bid: number, newSp: Spending) {
    const ev: ApiSpendingEvent = {
      eventId: uuidv4(),
      dateTime: newSp.createdAt.toISOString(),
      type: 'create',
      newVersion: newSp.version,
      budgetId: bid,
      spendingId: newSp.id,
      createData: {
        date: format(newSp.date, 'yyyy-MM-dd'),
        description: newSp.description,
        money: {
          amount: newSp.amount,
          currency: newSp.currency,
          fraction: currencyFraction(newSp.currency),
        },
        sort: newSp.sort,
      },
    }

    const evts = this.addEvent(ev)

    return this.processEvents(evts)
  },

  updateSpending(bid: number, upd: Spending) {
    const ev: ApiSpendingEvent = {
      eventId: uuidv4(),
      dateTime: upd.updatedAt.toISOString(),
      type: 'update',
      newVersion: upd.version,
      budgetId: bid,
      spendingId: upd.id,
      updateData: {
        prevVersion: upd.prev!.version,
        date: format(upd.date, 'yyyy-MM-dd'),
        sort: upd.sort,
        money: {
          amount: upd.amount,
          currency: upd.currency,
          fraction: currencyFraction(upd.currency),
        },
        description: upd.description,
        receiptGroupId: upd.receiptGroupId,
      },
    }

    const evts = this.addEvent(ev)

    return this.processEvents(evts)
  },

  deleteSpending(bid: number, del: DelSpending) {
    const ev: ApiSpendingEvent = {
      eventId: uuidv4(),
      dateTime: del.updatedAt.toISOString(),
      type: 'delete',
      newVersion: del.version,
      budgetId: bid,
      spendingId: del.id,
      deleteData: {
        prevVersion: del.prev!.version,
      },
    }

    const evts = this.addEvent(ev)

    return  this.processEvents(evts)
  },

  async sendEvents(events: ApiSpendingEvent[]): Promise<{ success: ApiSpendingEvent[]; conflict: ApiSpendingEvent[], errors: ApiUploadError[] }> {
    const client = createClient<ApiSchemaPaths>({ baseUrl: serverUrl })

    try {
      const { response, data } = await client.POST('/budgets/spendings/bulk', {
        body: {
          updates: events,
        },
        signal: AbortSignal.timeout(10_000),
      })

      if (response.status != 200) {
        throw new Error('status: ' + response.status)
      }

      statusApi.setUpdateSpendingStatus('ok')

      const successIds = data?.success ?? []
      const conflictIds = data?.errors.map((e: { eventId: string }) => e.eventId) ?? []

      return {
        success: events.filter(e => successIds.includes(e.eventId)),
        conflict: events.filter(e => conflictIds.includes(e.eventId)),
        errors: data?.errors ?? [],
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      statusApi.setUpdateSpendingStatus(err.name + ' ' + err.message)
    }

    return { success: [], conflict: [], errors: [] }
  },

  async processEvents(events: ApiSpendingEvent[]) {
    const { success, conflict, errors } = await this.sendEvents(events)

    // Помечаем все события во внешнем Storage
    for (const ev of success) {
      repo.setStatusApplied(ev.budgetId, ev.spendingId, ev.newVersion)
    }

    for (const ev of conflict) {
      const conflictedVers = repo.revokeConflictVersion(ev.budgetId, ev.spendingId, ev.newVersion)

      for (const c of conflictedVers) {
        c.reason = errors.find(e => e.eventId == ev.eventId)?.error ?? null
        conflictVersionsApi.add(c)
      }
    }

    // Удаляем все success и conflict из внутренних events
    this.deleteEvents([...success, ...conflict])
  },

  loadEvents(): void {
    this._events = JSON.parse(ls.getItem(this._lsEventsKey) || '[]')
    statusApi.setPendingEvents(this._events.length)
  },

  getEvents(): ApiSpendingEvent[] {
    return this._events
  },

  deleteEvents(del: ApiSpendingEvent[]) {
    const idsToDelete = new Set(del.map(e => e.eventId))
    this._events = this._events.filter(e => !idsToDelete.has(e.eventId))

    ls.setItem(this._lsEventsKey, JSON.stringify(this._events))
    statusApi.setPendingEvents(this._events.length)
  },

  addEvent(e: ApiSpendingEvent): ApiSpendingEvent[] {
    this._events.push(e)

    ls.setItem(this._lsEventsKey, JSON.stringify(this._events))
    statusApi.setPendingEvents(this._events.length)

    return this._events
  },
})
