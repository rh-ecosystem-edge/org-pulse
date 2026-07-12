# Rename RFE Review → PRD Review, Feature Review → Design Review

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the two AI Impact review pipeline tabs from "RFE Review"/"Feature Review" to "PRD Review"/"Design Review" — UI labels and route IDs only, no data key changes.

**Architecture:** Pure find-and-replace across Vue components, route definitions, and constants. Route IDs change (`rfe-review` → `prd-review`, `feature-review` → `design-review`) which affects URLs, `navigateTo()` calls, and `crossNavigate()` calls across modules. Internal data keys (`rfeData`, `sourceRfe`, `rfe-data.json`) are explicitly untouched.

**Tech Stack:** Vue 3, Vitest, Playwright integration tests

**Jira:** OSAC-2385

---

### Task 1: Update constants and route definitions

The central source of truth for phase names and route IDs.

**Files:**
- Modify: `modules/ai-impact/client/constants.js:5-6`
- Modify: `modules/ai-impact/client/index.js:6-7`
- Modify: `modules/ai-impact/module.json:40-41`

**Step 1: Update PHASES array in constants.js**

```js
// Line 5-6: change id and name for both phases
{ id: 'prd-review', name: 'PRD Review', order: 1, status: 'active' },
{ id: 'design-review', name: 'Design Review', order: 2, status: 'active' },
```

**Step 2: Update route map in index.js**

```js
// Line 6-7: change route keys (keep same component imports for now)
'prd-review': defineAsyncComponent(() => import('./views/RFEReviewView.vue')),
'design-review': defineAsyncComponent(() => import('./views/FeatureReviewView.vue')),
```

**Step 3: Update navItems in module.json**

```json
{ "id": "prd-review", "label": "PRD Review", "icon": "ClipboardList", "separatorBefore": true },
{ "id": "design-review", "label": "Design Review", "icon": "Target" },
```

**Step 4: Update widget descriptions in module.json**

```json
// Line 11-13: update RFE Action Items widget
"id": "rfe-actions",
"name": "PRD Action Items",
"description": "PRDs needing your attention, filtered by your components",

// Line 31: update pipeline stats description
"description": "Summary stats for your PRD and design review pipeline",
```

**Step 5: Run tests**

Run: `cd org-pulse && npm test -- --run 2>&1 | tail -20`

**Step 6: Commit**

```
feat(ai-impact): rename RFE/Feature Review route IDs and labels to PRD/Design Review

OSAC-2385
```

---

### Task 2: Update RFEReviewView.vue (now renders the PRD Review page)

**Files:**
- Modify: `modules/ai-impact/client/views/RFEReviewView.vue:33,100,106`

**Step 1: Update all `'rfe-review'` references to `'prd-review'`**

Line 33:
```js
const phase = PHASES.find(p => p.id === 'prd-review')
```

Line 100:
```js
moduleNav.navigateTo('prd-review', { select: rfe.key })
```

Line 106:
```js
moduleNav.navigateTo('prd-review', params)
```

**Step 2: Commit**

```
feat(ai-impact): update RFEReviewView to use prd-review route ID

OSAC-2385
```

---

### Task 3: Update FeatureReviewView.vue (now renders the Design Review page)

**Files:**
- Modify: `modules/ai-impact/client/views/FeatureReviewView.vue:38,45,49`

**Step 1: Update route references**

Line 38 — navigation param stays `fromFeatureReview` (internal, not user-visible):
```js
fromFeatureReview: '1'
```
(no change needed — this is a nav param key, not a label)

Line 45:
```js
moduleNav.navigateTo('design-review')
```

Line 49:
```js
moduleNav.navigateTo('prd-review', { select: rfeKey })
```

**Step 2: Commit**

```
feat(ai-impact): update FeatureReviewView to use design-review/prd-review route IDs

OSAC-2385
```

---

### Task 4: Update AIFactoryGuideView.vue

This is the largest single file — has both "RFE Review" and "Feature Review" detail sections with headings, buttons, and cross-links.

**Files:**
- Modify: `modules/ai-impact/client/views/AIFactoryGuideView.vue`

**Step 1: Update phaseInfo keys (lines 34-41)**

```js
'prd-review': {
  desc: 'Incoming PRDs are ingested from Jira, assessed for quality, and scored against the rubric.',
  color: 'blue',
},
'design-review': {
  desc: 'Design documents are auto-generated from approved PRDs, refined by AI, and reviewed by SMEs.',
  color: 'indigo',
},
```

**Step 2: Update RFE Review detail section**

Line 449 — v-else-if condition:
```html
v-else-if="selectedPhase.id === 'prd-review'"
```

Line 467 — heading:
```html
<h2 class="...">PRD Review</h2>
```

Line 472 — goToPage call:
```js
goToPage('prd-review')
```

Line 475 — button text:
```
Go to PRD Review
```

Line 538 — inline link button text:
```html
<button @click="goToPage('prd-review')" class="...">PRD Review</button>
```

**Step 3: Update Feature Review detail section**

Line 598 — "What's next" link that references Feature Review:
```js
selectPhase(PHASES.find(p => p.id === 'design-review'))
```

Line 603 — "What's next" card title:
```html
Design Review
```

Line 604 — "What's next" card description:
```
Once a PRD is approved, the pipeline creates a Design document in Jira, refines it with architecture context, and scores it across 4 dimensions.
```

Line 645 — v-else-if condition:
```html
v-else-if="selectedPhase.id === 'design-review'"
```

Line 663 — heading:
```html
<h2 class="...">Design Review</h2>
```

Line 668 — goToPage call:
```js
goToPage('design-review')
```

Line 671 — button text:
```
Go to Design Review
```

Line 765 — inline link button text:
```html
<button @click="goToPage('design-review')" class="...">Design Review</button>
```

**Step 4: Commit**

```
feat(ai-impact): rename RFE/Feature Review to PRD/Design Review in AI Factory Guide

OSAC-2385
```

---

### Task 5: Update cross-link components (ForYouCard, ForYouBoardTab, PipelineTimeline, TestPlanDetailPanel)

**Files:**
- Modify: `modules/ai-impact/client/components/ForYouCard.vue` — change all `rfe-review` → `prd-review`, `feature-review` → `design-review` in guide URLs; change label strings `'RFE Review guide'` → `'PRD Review guide'`, `'Feature Review guide'` → `'Design Review guide'`
- Modify: `modules/ai-impact/client/components/ForYouBoardTab.vue` — change all `guide: 'rfe-review'` → `guide: 'prd-review'`, `guide: 'feature-review'` → `guide: 'design-review'`
- Modify: `modules/ai-impact/client/components/PipelineTimeline.vue` — change case `'rfe-review':` → `'prd-review':`, `'feature-review'` → `'design-review'` in switch statements; change detail text `'RFE reviewed'` → `'PRD reviewed'`
- Modify: `modules/ai-impact/client/components/TestPlanDetailPanel.vue:338,347` — change button labels `'Feature Review'` → `'Design Review'`, `'RFE Review'` → `'PRD Review'`

**Step 1: ForYouCard.vue — replace route IDs and labels**

All `rfe-review` → `prd-review` in guide URL strings (lines 119, 124, 129, 139)
All `feature-review` → `design-review` in guide URL strings (lines 134, 147, 152, 157, 167)
All `'RFE Review guide'` → `'PRD Review guide'` (lines 120, 125, 130, 140)
All `'Feature Review guide'` → `'Design Review guide'` (lines 135, 148, 153, 158, 168)

**Step 2: ForYouBoardTab.vue — replace guide references**

All `guide: 'rfe-review'` → `guide: 'prd-review'` (lines 53, 57, 61, 65)
All `guide: 'feature-review'` → `guide: 'design-review'` (lines 69, 73, 77, 81)

**Step 3: PipelineTimeline.vue — replace switch cases and labels**

All `case 'rfe-review':` → `case 'prd-review':` (lines 40, 65, 109)
All `'feature-review'` → `'design-review'` in conditionals (lines 47, 74, 118)
Line 45: `detail: 'RFE reviewed'` → `detail: 'PRD reviewed'`

**Step 4: TestPlanDetailPanel.vue — replace button labels**

Line 338: `Feature Review` → `Design Review`
Line 347: `RFE Review` → `PRD Review`

**Step 5: Commit**

```
feat(ai-impact): update cross-link components to use PRD/Design Review naming

OSAC-2385
```

---

### Task 6: Update AssessmentGuideModal and AIImpactSettings

**Files:**
- Modify: `modules/ai-impact/client/components/AssessmentGuideModal.vue:81,174,177` — tab label `'Feature Review'` → `'Design Review'`, section heading `'How Feature Review Works'` → `'How Design Review Works'`
- Modify: `modules/ai-impact/client/components/FeatureReviewContent.vue:56` — empty state heading `'No Feature Reviews Yet'` → `'No Design Reviews Yet'`
- Modify: `modules/ai-impact/client/components/AIImpactSettings.vue:545,547` — section headings `'Feature Review Data'` → `'Design Review Data'`, `'Feature Reviews'` → `'Design Reviews'`

**Step 1: Apply all label changes**

**Step 2: Commit**

```
feat(ai-impact): rename Feature Review labels in modal, settings, and empty state

OSAC-2385
```

---

### Task 7: Update cross-module references (releases, team-tracker widgets)

These are other modules that link back to the AI Impact review pages.

**Files:**
- Modify: `modules/ai-impact/client/widgets/FeatureBoardWidget.vue:73` — `'rfe-review'` → `'prd-review'`
- Modify: `modules/ai-impact/client/widgets/RfeActionsWidget.vue:132` — `'rfe-review'` → `'prd-review'`
- Modify: `modules/releases/client/plan/components/FeaturesTable.vue:171` — `linkTo('ai-impact', 'rfe-review', ...)` → `linkTo('ai-impact', 'prd-review', ...)`
- Modify: `modules/releases/client/plan/components/RfesTable.vue:91` — `linkTo('ai-impact', 'rfe-review', ...)` → `linkTo('ai-impact', 'prd-review', ...)`
- Modify: `modules/releases/client/views/FeatureDetailView.vue:159` — `crossNavigate('ai-impact', 'rfe-review', ...)` → `crossNavigate('ai-impact', 'prd-review', ...)`
- Modify: `modules/releases/client/views/FeatureDetailView.vue:161` — `crossNavigate('ai-impact', 'feature-review')` → `crossNavigate('ai-impact', 'design-review')`
- Modify: `modules/releases/client/views/FeatureDetailView.vue:368` — back button label `'Back to RFE Review'` → `'Back to PRD Review'`, `'Back to Feature Review'` → `'Back to Design Review'`
- Modify: `modules/releases/client/views/FeatureDetailView.vue:406` — `crossNavigate('ai-impact', 'rfe-review', ...)` → `crossNavigate('ai-impact', 'prd-review', ...)`
- Modify: `modules/team-tracker/client/components/RfeBacklogTable.vue:38` — `linkTo('ai-impact', 'rfe-review', ...)` → `linkTo('ai-impact', 'prd-review', ...)`
- Modify: `modules/releases/client/execute/components/AIReviewSection.vue:130` — heading `'Feature Review History'` → `'Design Review History'`

**Step 1: Apply all route ID and label changes**

**Step 2: Commit**

```
feat: update cross-module links to use prd-review/design-review routes

OSAC-2385
```

---

### Task 8: Update tests

**Files:**
- Modify: `modules/ai-impact/__tests__/client/RFEReviewNavigation.test.js` — all `'rfe-review'` → `'prd-review'`
- Modify: `modules/ai-impact/__tests__/client/FeatureReviewContent.test.js` — update `'No Feature Reviews Yet'` → `'No Design Reviews Yet'` if asserted
- Modify: `modules/ai-impact/__tests__/client/widgets/RfeActionsWidget.test.js` — update any `'rfe-review'` → `'prd-review'`
- Modify: `modules/team-tracker/__tests__/client/RfeBacklogTable.test.js:113` — `'rfe-review'` → `'prd-review'` in href assertion
- Modify: `modules/releases/__tests__/client/execute/AIReviewSection.test.js` — update `'Feature Review History'` → `'Design Review History'` if asserted
- Modify: `tests/integration/ai-impact.spec.js` — all `'rfe-review'` → `'prd-review'`, `'feature-review'` → `'design-review'` in navigation URLs and assertions

**Step 1: Update all test files with new route IDs and labels**

**Step 2: Run all tests**

Run: `cd org-pulse && npm test -- --run 2>&1 | tail -30`
Expected: all pass

**Step 3: Commit**

```
test: update tests for PRD/Design Review rename

OSAC-2385
```

---

### Task 9: Verify in browser

**Step 1: Start dev server**

Run: `cd org-pulse && npm run dev:full`

**Step 2: Verify the following in the browser**

- Sidebar shows "PRD Review" and "Design Review"
- Clicking "PRD Review" navigates to `/#/ai-impact/prd-review`
- Clicking "Design Review" navigates to `/#/ai-impact/design-review`
- AI Factory Guide shows "PRD Review" and "Design Review" as phase names
- Clicking "Go to PRD Review" / "Go to Design Review" buttons in the guide navigates correctly
- Back buttons from releases feature detail say "Back to PRD Review" / "Back to Design Review"
- Settings page shows "Design Review Data" section heading

---

### NOT in scope (do not touch)

These use "RFE" or "feature" internally but are data keys, not user-visible labels:

- `sourceRfe` JSON key — used in ~30 locations + persisted data
- `rfeData` composable variable — ~40 references
- `rfe-data.json` storage filename — server, pipeline, ConfigMap
- `linkedRfeKey` / `linkedRfeApproved` — release execution data
- `featureReview` Vue prop in AIReviewSection — internal prop name
- `fromRfe` / `fromFeatureReview` — navigation param keys (not user-visible)
- Server API endpoint `/modules/ai-impact/rfe-data`
- `RHAIRFE-` Jira project prefix
- Customer-insights "Create RFE" feature
- Team-tracker "RFE Backlog" component names and file names
- All Jira labels (`rfe-creator-*`, `strat-creator-*`)
- Data pipeline files in `org-pulse-data/`
