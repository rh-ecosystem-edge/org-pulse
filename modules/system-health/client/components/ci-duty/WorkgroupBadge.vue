<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClass"
  >
    {{ workgroup || 'Unspecified' }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  workgroup: { type: String, default: null }
})

const PALETTE = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const badgeClass = computed(() => {
  if (!props.workgroup) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return PALETTE[hashString(props.workgroup) % PALETTE.length]
})
</script>
