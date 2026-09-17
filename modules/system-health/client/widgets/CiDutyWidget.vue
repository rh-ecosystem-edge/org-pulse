<script setup>
import { onMounted } from 'vue'
import { useModuleLink } from '@shared/client/composables/useModuleLink.js'
import { useCiDuty, formatDutyDate, getInitials } from '../composables/useCiDuty.js'
import WorkgroupBadge from '../components/ci-duty/WorkgroupBadge.vue'

defineProps({
  size: { type: String, default: 'half' }
})

const { navigateTo } = useModuleLink()
const { loading, error, notFound, load, currentEntry, nextEntry, workgroupColors } = useCiDuty()

onMounted(load)
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">CI Duty</h3>
      <button
        @click="navigateTo('system-health', 'ci-duty')"
        class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
      >View all</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="animate-pulse flex items-center gap-3">
      <div class="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
        <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>

    <!-- Error / missing data -->
    <p v-else-if="error || notFound" class="text-sm text-gray-500 dark:text-gray-400 py-1">
      CI Duty roster unavailable.
    </p>

    <!-- No current duty -->
    <p v-else-if="!currentEntry" class="text-sm text-gray-500 dark:text-gray-400 py-1">
      No one is currently on CI Duty.
    </p>

    <template v-else>
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-primary-500 bg-primary-50/40 dark:bg-primary-500/5 p-4">
        <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
          <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
          Current
        </span>
        <div class="flex items-center gap-3 mt-3">
          <div class="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-200 dark:ring-primary-800/60 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300 shrink-0">
            {{ getInitials(currentEntry.lead) }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ currentEntry.lead }}</p>
            <WorkgroupBadge class="mt-1" :workgroup="currentEntry.workgroup" :color-class="workgroupColors[currentEntry.workgroup]" />
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
          {{ formatDutyDate(currentEntry.startDate) }} – {{ formatDutyDate(currentEntry.endDate) }}
        </p>
      </div>

      <div v-if="nextEntry" class="flex items-center gap-2.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
        <div class="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300 shrink-0">
          {{ getInitials(nextEntry.lead) }}
        </div>
        <p class="min-w-0 flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">
          <span class="font-medium text-gray-700 dark:text-gray-300">Next:</span> {{ nextEntry.lead }}
        </p>
        <WorkgroupBadge :workgroup="nextEntry.workgroup" :color-class="workgroupColors[nextEntry.workgroup]" />
        <span class="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{{ formatDutyDate(nextEntry.startDate) }}</span>
      </div>
    </template>
  </div>
</template>
