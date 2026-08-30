import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';

export const canvases = sqliteTable('canvases', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  frameworkType: text('framework_type').notNull().default('lean_canvas'),
  ownerId: text('owner_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const canvasBlocks = sqliteTable(
  'canvas_blocks',
  {
    id: text('id').primaryKey(),
    canvasId: text('canvas_id')
      .notNull()
      .references(() => canvases.id, { onDelete: 'cascade' }),
    blockKey: text('block_key').notNull(),
    contentJson: text('content_json').notNull().default('{}'),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [unique().on(t.canvasId, t.blockKey)]
);
