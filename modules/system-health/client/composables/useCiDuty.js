import { ref, computed } from 'vue'
import { apiRequest } from '@shared/client/services/api.js'

// Plain YYYY-MM-DD string comparison keeps "today" timezone-safe: both sides
// reduce to date strings before comparing, so no local/UTC boundary skew.
export function todayUtc() {
  return new Date().toISOString().slice(0, 10)
}

export function findCurrentEntry(entries, today) {
  const matches = (entries || []).filter(e => e.startDate <= today && today <= e.endDate)
  if (matches.length === 0) return null
  return matches.reduce((latest, e) => (e.startDate > latest.startDate ? e : latest))
}

export function findNextEntry(entries, today) {
  const upcoming = (entries || []).filter(e => e.startDate > today)
  if (upcoming.length === 0) return null
  return upcoming.reduce((earliest, e) => (e.startDate < earliest.startDate ? e : earliest))
}

export function sortedRotation(entries) {
  return [...(entries || [])].sort((a, b) => a.startDate.localeCompare(b.startDate))
}

// Dates are plain YYYY-MM-DD with no time component; format via UTC fields so
// the displayed date never shifts across the browser's local timezone.
export function formatDutyDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function useCiDuty() {
  const roster = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const notFound = ref(false)

  async function load() {
    loading.value = true
    error.value = null
    notFound.value = false
    try {
      roster.value = await apiRequest('/modules/system-health/ci-duty')
    } catch (e) {
      if (e.status === 404) {
        notFound.value = true
      } else {
        error.value = e.message || 'Failed to load CI Duty roster'
      }
      roster.value = null
    } finally {
      loading.value = false
    }
  }

  const entries = computed(() => roster.value?.entries || [])
  const currentEntry = computed(() => findCurrentEntry(entries.value, todayUtc()))
  const nextEntry = computed(() => findNextEntry(entries.value, todayUtc()))
  const rotation = computed(() => sortedRotation(entries.value))

  return { roster, loading, error, notFound, load, entries, currentEntry, nextEntry, rotation }
}
