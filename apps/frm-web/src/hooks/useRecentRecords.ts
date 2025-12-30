/**
 * useRecentRecords Hook - LRU Cache for Recently Accessed Records
 * Tracks last 5 accessed records across all DocTypes
 * Reference: specs/001-sfa-app-build/tasks.md ENT-005
 */

import { useState, useEffect } from 'react'

export interface RecentRecord {
  doctype: string
  name: string
  timestamp: number
  thumbnail?: string
  display_name?: string
}

const STORAGE_KEY = 'sfa_recent_records'
const MAX_RECORDS = 5
const EXPIRY_DAYS = 7

/**
 * Get recent records from localStorage
 */
function getRecentRecords(): RecentRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const records = JSON.parse(stored) as RecentRecord[]
    const now = Date.now()
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000

    // Filter out expired records
    return records.filter(record => now - record.timestamp < expiryMs)
  } catch (error) {
    console.error('Error reading recent records:', error)
    return []
  }
}

/**
 * Save recent records to localStorage
 */
function saveRecentRecords(records: RecentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    console.error('Error saving recent records:', error)
  }
}

/**
 * Hook for managing recently accessed records
 */
export function useRecentRecords() {
  const [records, setRecords] = useState<RecentRecord[]>(getRecentRecords())

  /**
   * Add a record to the recent list (LRU)
   */
  const addRecord = (doctype: string, name: string, displayName?: string, thumbnail?: string) => {
    const newRecord: RecentRecord = {
      doctype,
      name,
      timestamp: Date.now(),
      display_name: displayName,
      thumbnail
    }

    setRecords(currentRecords => {
      // Remove existing entry for the same record
      const filtered = currentRecords.filter(
        r => !(r.doctype === doctype && r.name === name)
      )

      // Add new record to the front (most recent)
      const updated = [newRecord, ...filtered].slice(0, MAX_RECORDS)

      // Save to localStorage
      saveRecentRecords(updated)

      return updated
    })
  }

  /**
   * Clear all recent records
   */
  const clearRecords = () => {
    setRecords([])
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Remove a specific record
   */
  const removeRecord = (doctype: string, name: string) => {
    setRecords(currentRecords => {
      const updated = currentRecords.filter(
        r => !(r.doctype === doctype && r.name === name)
      )
      saveRecentRecords(updated)
      return updated
    })
  }

  // Cleanup on mount - remove expired records
  useEffect(() => {
    const cleanedRecords = getRecentRecords()
    if (cleanedRecords.length !== records.length) {
      setRecords(cleanedRecords)
      saveRecentRecords(cleanedRecords)
    }
  }, [])

  return {
    records,
    addRecord,
    clearRecords,
    removeRecord,
    isEmpty: records.length === 0
  }
}
