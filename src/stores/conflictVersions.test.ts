import {describe, expect, it, vi} from 'vitest'

import {type ConflictSpendingVersion, conflictVersionStateCreator} from './conflictVersions'
import {create} from "zustand";

describe('useConflictVersionStore', () => {

  it('adds versions', () => {
    const ver1: ConflictSpendingVersion = {
      version: 'v1-23989dfi2j3lkdss',
    } as ConflictSpendingVersion

    const ver2: ConflictSpendingVersion = {
      version: 'v2-2398cselstuigkpcs',
    } as ConflictSpendingVersion

    const conflictVersionState = create(conflictVersionStateCreator).getState()
    conflictVersionState.add(ver1, ver2)

    expect(conflictVersionState.conflictVersionsArr()).toEqual(expect.arrayContaining([ver1, ver2]))

    conflictVersionState.remove(ver1.version)

    expect(conflictVersionState.conflictVersionsArr()).toContainEqual(ver2)
    expect(conflictVersionState.conflictVersionsArr()).not.toContainEqual(ver1)

    // New Store from localStorage
    const conflictVersionState2 = create(conflictVersionStateCreator).getState()
    expect(conflictVersionState2.conflictVersionsArr()).toContainEqual(ver2)
  })

  it('persists to localStorage', () => {
    const ver1: ConflictSpendingVersion = {
      version: 'v1-2393fzS3lkdss',
    } as ConflictSpendingVersion

    const ver2: ConflictSpendingVersion = {
      version: 'v2-DKKsllkf',
    } as ConflictSpendingVersion

    const conflictVersionState = create(conflictVersionStateCreator).getState()

    conflictVersionState.add(ver1)
    conflictVersionState.add(ver2)
    conflictVersionState.remove(ver2.version)

    const raw = localStorage.getItem('conflictVersionsV2')

    expect(raw).toContain(ver1.version)
    expect(raw).not.toContain(ver2.version)
  })

  it('subscribers notify', () => {
    const ver1: ConflictSpendingVersion = {
      version: 'v1-239asdef03l0309fdidss',
    } as ConflictSpendingVersion

    const ver2: ConflictSpendingVersion = {
      version: 'v2-l2j3rkl89v672dfjadstwqpbi',
    } as ConflictSpendingVersion

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
