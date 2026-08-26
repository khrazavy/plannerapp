# PlannerApp — Product Specification

| | |
|---|---|
| **Version** | 1.0 (Draft) |
| **Status** | Approved for implementation |
| **Date** | 2026-08-23 |
| **Product** | PlannerApp — Lean Canvas business planning tool |
| **Type** | Internal company tool |

---

## 1. Overview

PlannerApp is a web application for authoring and maintaining business plans structured
around the **Lean Business Canvas** (Ash Maurya). The user works with a classic 9-block
canvas grid as the central overview, opens any block in a dedicated, distraction-free
editing page, and returns to the grid to see an up-to-date read-only snapshot of the plan.

The v1 focus is **UX quality**: smooth navigation between the grid overview and block
editors, reliable manual saving, and a clean rich-text editing experience. The data model
and architecture are deliberately **template-driven** so additional planning frameworks
(SWOT, OKRs, roadmaps), user identity, sharing, and PDF export can be added later
without schema redesign.

### Problem Statement

There is no lightweight internal tool to structure early-stage business thinking.
Existing documents (docs, slides) lose the at-a-glance structure of a one-page canvas,
and generic planning tools are too heavy for a single author iterating on a plan.

### Solution Summary

A focused single-user web app: manage multiple business plans (canvases) from a
dashboard, edit each canvas block as structured rich text, and view the whole plan on
one grid page suitable for later presentation during periodic leadership reviews.

---

## 2. Goals & Non-Goals

### Goals (v1)

1. Fast, pleasant navigation: dashboard → grid → block editor → back, with minimal friction.
2. Classic 9-block Lean Canvas layout rendered from saved content as uneditable snapshots.
3. Full rich-text editing per block with explicit manual save and unsaved-changes protection.
4. Multiple canvases per user with full lifecycle management (create, rename, duplicate, delete).
5. Template-driven, extensible data model ready for future frameworks, identity, and sharing.

### Non-Goals (v1)

| Excluded | Rationale |
|---|---|
| Authentication / real identity | Single trusted user for now; identity arrives in Phase 2 |
| Sharing or multi-user access | Deferred; periodic review is out of scope until Phase 3 |
| Real-time collaboration | Not needed for single-user editing |
| PDF export implementation | Stub interface only; UX comes first |
| Additional frameworks (SWOT, OKRs…) | Architecture supports them; UI ships Lean Canvas only |
| Mobile native apps, offline mode | Web app only |
| Comments, version history, audit log | Deferred |

---

## 3. Target Users & Context

- **Primary user (v1):** a single internal author creating and iterating on business plans.
- **Future consumers:** company leadership reviewing plans periodically (Phase 3 sharing).
- **Environment:** internal deployment; trusted network; no auth in v1.

---

## 4. Functional Requirements

### 4.1 Dashboard (`/`)

- FR-1.1 List all canvases showing **name**, **created date**, and **last updated date**,
  sorted by most recently updated first.
- FR-1.2 **Create** a new canvas: prompts for a name; seeds all 9 Lean Canvas blocks as empty.
- FR-1.3 **Rename** a canvas inline or via dialog.
- FR-1.4 **Duplicate** a canvas: copies name + ` (copy)` and the full content of every block.
- FR-1.5 **Delete** a canvas: requires confirmation; cascades to all blocks.
- FR-1.6 Empty dashboard shows a friendly empty state with a create call-to-action.

### 4.2 Canvas Grid View (`/canvas/[id]`)

- FR-2.1 Render the canonical **9-block Lean Canvas layout** (see §5.2):
  - Row 1 (tall): Problem · Solution · Unique Value Proposition · Unfair Advantage · Customer Segments
  - Row 2: Key Metrics · Channels
  - Row 3: Cost Structure · Revenue Streams
- FR-2.2 Each block renders its **saved content as a read-only snapshot** (rich text rendered
  safely; no editor chrome).
- FR-2.3 Blocks show a subtle empty-state hint when content has never been saved.
- FR-2.4 Clicking anywhere on a block navigates to that block's dedicated editing page.
- FR-2.5 The canvas name is visible and renameable from the grid header.

### 4.3 Block Editor Page (`/canvas/[id]/block/[blockKey]`)

- FR-3.1 Dedicated full-page editor for one block, pre-populated with saved content.
- FR-3.2 Header shows: canvas name (link back to grid), block title, and the block's
  guidance hint.
- FR-3.3 **Full rich-text editing** (Notion-like feel): bold, italic, strikethrough,
  headings, bullet lists, ordered lists; clean paste handling.
- FR-3.4 **Manual save only:** explicit Save button plus `Cmd/Ctrl+S`; saving shows clear
  feedback ("Saved") and refreshes the grid snapshot's underlying content.
- FR-3.5 Dirty-state indicator when unsaved changes exist.
- FR-3.6 Navigating away (back link, browser back, route change, tab close) with unsaved
  changes prompts the user before discarding.
- FR-3.7 Returning to the grid is one click/keystroke (`Esc` or back link); the grid must
  reflect the latest saved content immediately — no stale snapshots.

### 4.4 Persistence & Saving

- FR-4.1 All content persists server-side in SQLite; no client-only persistence.
- FR-4.2 Save replaces the block's stored rich-text document atomically and updates
  `updated_at` on the block and its parent canvas.
- FR-4.3 No autosave in v1.

### 4.5 PDF Export (Stub Only)

- FR-5.1 Define an export service interface, e.g.
  `exportCanvasToPdf(canvasId): Promise<ExportResult>`, returning a
  `NOT_IMPLEMENTED` result in v1.
- FR-5.2 Any export affordance in the UI is present but disabled, with a tooltip
  ("Coming soon"). No runtime errors surface to users.

### 4.6 Validation & Errors

- FR-6.1 Canvas names: required, non-empty after trim, max ~120 chars.
- FR-6.2 Unknown canvas id or block key renders a friendly not-found state, not a crash.
- FR-6.3 Failed saves show an error toast and retain the unsaved editor state.

---

## 5. UX Flows & Navigation

### 5.1 Route Map

```
/                          Dashboard: canvas list + management actions
/canvas/[id]               Grid view: 9-block read-only snapshot
/canvas/[id]/block/[key]   Block editor: full rich-text editing + manual save
```

### 5.2 Canonical Grid Layout

```
+----------------+--------+----------------+-----------+------------------+
|                |        |                |           |                  |
|    PROBLEM     | SOLUTION| UNIQUE VALUE  |  UNFAIR   |    CUSTOMER      |
|  (top 3 probs  |(top 3  |  PROPOSITION   | ADVANTAGE |    SEGMENTS      |
|  + existing    |features|                |           | (+early adopters)|
|  alternatives) |        |                |           |                  |
+----------------+--------+----------------+-----------+------------------+
|        KEY METRICS          |                   CHANNELS                |
+-----------------------------+--------------------------------------------+
|        COST STRUCTURE       |               REVENUE STREAMS              |
+-----------------------------+--------------------------------------------+
```

Row 1 blocks share equal height and dominate the viewport (the "thinking" row);
rows 2–3 are shorter utility rows.

### 5.3 Primary Flow

```
Dashboard ──create/open──▶ Grid View ──click block──▶ Block Editor
     ▲                        ▲  ◀──────Esc/back─────────┘
     └──────breadcrumb────────┘        (after save or discard)
```

Interaction principles:

- Transitions between grid and editor should feel instant (client-side routing,
  preserved scroll position on return).
- Keyboard-first niceties: `Cmd/Ctrl+S` save, `Esc` exit editor, visible focus states.
- Destructive actions always confirm.

---

## 6. Data Model

Template-driven design: framework definitions live in code; adding a framework later
means adding a template config, never a migration.

```ts
// Framework template (code-level config, not DB)
interface FrameworkTemplate {
  type: string                 // e.g. 'lean_canvas'
  title: string
  blocks: BlockTemplate[]      // ordered/grid-positioned definitions
}
interface BlockTemplate {
  key: string                  // e.g. 'problem', 'unique_value_prop'
  title: string
  hint: string                 // guidance shown in editor header
  placeholder: string          // empty-state hint in grid snapshot
  gridArea: GridArea           // canonical layout position (§5.2)
}
```

### Tables (SQLite via Drizzle ORM)

```
canvases
  id            TEXT PK (uuid)
  name          TEXT NOT NULL
  framework_type TEXT NOT NULL DEFAULT 'lean_canvas'
  owner_id      TEXT NULL            -- reserved for Phase 2 identity
  created_at    INTEGER NOT NULL     -- unix ms
  updated_at    INTEGER NOT NULL

canvas_blocks
  id            TEXT PK (uuid)
  canvas_id     TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE
  block_key     TEXT NOT NULL
  content_json  TEXT NOT NULL        -- rich-text document JSON (Tiptap/ProseMirror)
  updated_at    INTEGER NOT NULL
  UNIQUE(canvas_id, block_key)
```

Notes:

- All 9 blocks are **seeded on canvas creation** so the grid always renders a complete layout.
- `content_json` stores the structured document model of the rich-text editor; rendering
  snapshots reuses the same renderer as the editor's read-only mode (XSS-safe by design).
- `owner_id` exists now to avoid a later schema change but is unused in v1.

---

## 7. Technical Architecture

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript strict | Single deployable, RSC for reads |
| Styling | Tailwind CSS | Fast iteration on UX polish |
| Rich text | Tiptap (ProseMirror) | Mature, headless, React-friendly; JSON doc model |
| Database | SQLite (local file) via better-sqlite3 | Zero-ops for single user |
| ORM/migrations | Drizzle ORM | Typed schema + lightweight migrations |
| Mutations | Next.js Server Actions | Thin API layer; Zod validation at boundaries |
| IDs | UUIDs (app-generated) | Stable links, safe client-side creation |
| Export | Stubbed service interface (§4.5) | Swappable implementation in Phase 5 |

Rendering rules:

- Grid snapshots render saved `content_json` through a shared read-only renderer.
- Editor loads saved document into Tiptap; local edits stay in memory until Save.

---

## 8. Extensibility Roadmap

| Phase | Feature | Design hooks already present |
|---|---|---|
| 2 | Lightweight identity (name-based login) → private-by-default ownership | `owner_id` column reserved |
| 3 | Sharing for periodic leadership review (explicit invitations) | Ownership model from Phase 2; read-only renderer reusable for review views |
| 4 | Multi-framework suite (SWOT, OKRs, roadmap, financials) | `framework_type` + `FrameworkTemplate` registry; blocks seeded per template |
| 5 | PDF export (one-page canvas sheet) | Export service interface stubbed (§4.5) |

Each phase must be deliverable without breaking changes to existing canvases.

---

## 9. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-1 | Creating a canvas from the dashboard adds it to the list immediately, seeded with all 9 empty blocks. |
| AC-2 | Rename, duplicate, and delete all work; delete and destructive actions require confirmation. |
| AC-3 | Duplicate produces an independent canvas containing copies of all block content. |
| AC-4 | Deleting a canvas removes its blocks (cascade) and it disappears from the list. |
| AC-5 | Grid renders all 9 blocks in the canonical layout (§5.2) with saved content shown read-only. |
| AC-6 | Clicking a block opens its editor within one client-side navigation, pre-populated with saved content. |
| AC-7 | Edits are not persisted until Save; after Save the grid snapshot reflects them and `updated_at` changes. |
| AC-8 | `Cmd/Ctrl+S` triggers save without full page reload; success shows "Saved" feedback. |
| AC-9 | Leaving the editor with unsaved changes prompts before discarding (in-app nav and tab close). |
| AC-10 | Fresh blocks show placeholder hints in the grid; editor shows guidance hints per block. |
| AC-11 | Unknown canvas/block ids render a friendly not-found state. |
| AC-12 | A failed save surfaces an error and preserves unsaved editor content. |
| AC-13 | Export affordance is disabled with "coming soon" tooltip; `exportCanvasToPdf` returns NOT_IMPLEMENTED without user-facing errors. |

---

## 10. Open Questions / Future Considerations

- Hosting target for internal deployment (single VPS vs PaaS) — decide before Phase 3.
- Backup strategy for the SQLite file once canvases become valuable.
- Dark mode and print stylesheet (useful precursor to real PDF export).
- Whether Phase 3 review flow needs comments/discussion threads or view-only suffices.
