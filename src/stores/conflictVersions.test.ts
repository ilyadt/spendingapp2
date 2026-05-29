import {beforeEach, describe, expect, it, vi} from 'vitest'

import { conflictVersionStateCreator } from './conflictVersions'
import type { ConflictVersion } from '@src/models/models'
import {create} from "zustand";

beforeEach(() => {
  localStorage.removeItem('conflictVersionsV2')
})

describe('useConflictVersionStore', () => {
  const ver1: ConflictVersion = {
    version: 'v1',
  } as ConflictVersion

  const ver2: ConflictVersion = {
    version: 'v2',
  } as ConflictVersion

  it('adds versions', () => {
    const useConflictVersionStore = create(conflictVersionStateCreator)
    useConflictVersionStore.getState().add(ver1, ver2)

    expect(
      useConflictVersionStore.getState().conflictVersions
    ).toEqual([ver1, ver2])

    useConflictVersionStore.getState().remove('v1')

    expect(
      useConflictVersionStore.getState().conflictVersions
    ).toEqual([ver2])

    const useConflictVersionStore2 = create(conflictVersionStateCreator)
    expect(
      useConflictVersionStore2.getState().conflictVersions
    ).toEqual([ver2])
  })

  it('persists to localStorage', () => {
    const useConflictVersionStore = create(conflictVersionStateCreator)

    useConflictVersionStore.getState().add(ver1)
    useConflictVersionStore.getState().add(ver2)
    useConflictVersionStore.getState().remove(ver2.version)

    const raw = localStorage.getItem('conflictVersionsV2')

    expect(raw).toContain('"version":"v1"')
    expect(raw).not.toContain('"version":"v2"')
  })

  it('subscribers notify', () => {
    const useConflictVersionStore = create(conflictVersionStateCreator)

    const listener = vi.fn()

    useConflictVersionStore.subscribe(listener)

    useConflictVersionStore.getState().add(ver1)
    expect(listener).toHaveBeenCalledTimes(1)
    useConflictVersionStore.getState().add(ver2)
    expect(listener).toHaveBeenCalledTimes(2)

    useConflictVersionStore.getState().remove(ver2.version)
    expect(listener).toHaveBeenCalledTimes(3)

    useConflictVersionStore.getState().remove('unknown version')
    expect(listener).toHaveBeenCalledTimes(3) // not called again
  })
})
