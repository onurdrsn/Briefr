import {
  pgTable, uuid, text, varchar, timestamp, boolean,
  integer, jsonb, pgEnum, index, uniqueIndex, bigint
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── ENUMS ────────────────────────────────────────────────────
export const planEnum = pgEnum('plan', ['free', 'starter', 'pro'])
export const roleEnum = pgEnum('role', ['owner', 'admin', 'member', 'viewer'])
export const sourceTypeEnum = pgEnum('source_type', [
  'slack_channel', 'gmail_label', 'notion_page', 'notion_database',
  'file_upload', 'make_webhook', 'manual_note', 'whatsapp_export',
])
export const sourceStatusEnum = pgEnum('source_status', [
  'pending', 'syncing', 'ready', 'error', 'paused',
])
export const chunkStatusEnum = pgEnum('chunk_status', [
  'pending', 'embedded', 'failed',
])
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant'])
export const languageEnum = pgEnum('language', ['tr', 'en', 'auto'])
export const ingestionStatusEnum = pgEnum('ingestion_status', [
  'pending', 'running', 'done', 'failed',
])

// ─── USERS ────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerifyToken: text('email_verify_token'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpiry: timestamp('reset_password_expiry'),
  kvkkConsentAt: timestamp('kvkk_consent_at'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── SESSIONS ─────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t: any) => ({
  tokenIdx: uniqueIndex('session_token_idx').on(t.token),
}))

// ─── WORKSPACES ───────────────────────────────────────────────
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: text('logo_url'),
  plan: planEnum('plan').default('free').notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  chunksThisMonth: integer('chunks_this_month').default(0).notNull(),
  chatsThisMonth: integer('chats_this_month').default(0).notNull(),
  storageBytes: bigint('storage_bytes', { mode: 'number' }).default(0).notNull(),
  countersResetAt: timestamp('counters_reset_at').defaultNow().notNull(),
  slackAccessToken: text('slack_access_token'),
  slackTeamId: varchar('slack_team_id', { length: 50 }),
  gmailAccessToken: text('gmail_access_token'),
  gmailRefreshToken: text('gmail_refresh_token'),
  notionAccessToken: text('notion_access_token'),
  iyzicoCustomerToken: text('iyzico_customer_token'),
  subscriptionId: text('subscription_id'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t: any) => ({
  slugIdx: uniqueIndex('workspace_slug_idx').on(t.slug),
}))

// ─── WORKSPACE MEMBERS ────────────────────────────────────────
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum('role').default('member').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t: any) => ({
  uniqueIdx: uniqueIndex('ws_member_unique_idx').on(t.workspaceId, t.userId),
}))

// ─── PROJECTS ─────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  clientName: varchar('client_name', { length: 100 }),
  emoji: varchar('emoji', { length: 8 }).default('📁').notNull(),
  language: languageEnum('language').default('auto').notNull(),
  archived: boolean('archived').default(false).notNull(),
  vectorNamespace: varchar('vector_namespace', { length: 100 }).notNull(),
  sourceCount: integer('source_count').default(0).notNull(),
  chunkCount: integer('chunk_count').default(0).notNull(),
  threadCount: integer('thread_count').default(0).notNull(),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t: any) => ({
  workspaceIdx: index('project_ws_idx').on(t.workspaceId),
}))

// ─── SOURCES ──────────────────────────────────────────────────
export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  type: sourceTypeEnum('type').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  status: sourceStatusEnum('status').default('pending').notNull(),
  config: jsonb('config').notNull(),
  syncEnabled: boolean('sync_enabled').default(true).notNull(),
  syncIntervalHours: integer('sync_interval_hours').default(6).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  nextSyncAt: timestamp('next_sync_at'),
  lastErrorAt: timestamp('last_error_at'),
  lastError: text('last_error'),
  chunkCount: integer('chunk_count').default(0).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t: any) => ({
  projectIdx: index('source_project_idx').on(t.projectId),
  syncIdx: index('source_sync_idx').on(t.nextSyncAt, t.syncEnabled),
}))

// ─── CHUNKS ───────────────────────────────────────────────────
export const chunks = pgTable('chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  status: chunkStatusEnum('status').default('pending').notNull(),
  tokenCount: integer('token_count'),
  embeddingModel: varchar('embedding_model', { length: 100 }),
  sourceType: sourceTypeEnum('source_type').notNull(),
  sourceName: varchar('source_name', { length: 100 }).notNull(),
  originalDate: timestamp('original_date'),
  author: varchar('author', { length: 100 }),
  language: varchar('language', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t: any) => ({
  sourceIdx: index('chunk_source_idx').on(t.sourceId),
  projectIdx: index('chunk_project_idx').on(t.projectId),
  hashIdx: index('chunk_hash_idx').on(t.contentHash, t.projectId),
}))

// ─── THREADS (Sohbet oturumları) ──────────────────────────────
export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }),
  messageCount: integer('message_count').default(0).notNull(),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t: any) => ({
  projectIdx: index('thread_project_idx').on(t.projectId),
}))

// ─── MESSAGES ─────────────────────────────────────────────────
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  usedChunkIds: jsonb('used_chunk_ids').default([]),
  difyMessageId: text('dify_message_id'),
  difyConversationId: text('dify_conversation_id'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  durationMs: integer('duration_ms'),
  difyMetrics: jsonb('dify_metrics'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t: any) => ({
  threadIdx: index('message_thread_idx').on(t.threadId),
}))

// ─── INGESTION JOBS ───────────────────────────────────────────
export const ingestionJobs = pgTable('ingestion_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: ingestionStatusEnum('status').default('pending').notNull(),
  triggeredBy: varchar('triggered_by', { length: 20 }).default('scheduler').notNull(),
  chunksCreated: integer('chunks_created').default(0).notNull(),
  chunksSkipped: integer('chunks_skipped').default(0).notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t: any) => ({
  sourceIdx: index('ingestion_source_idx').on(t.sourceId),
}))

// ─── RELATIONS ────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }: any) => ({
  sessions: many(sessions),
  workspaceMemberships: many(workspaceMembers),
  ownedWorkspaces: many(workspaces),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }: any) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  projects: many(projects),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }: any) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}))

export const projectsRelations = relations(projects, ({ one, many }: any) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  sources: many(sources),
  threads: many(threads),
  chunks: many(chunks),
}))

export const sourcesRelations = relations(sources, ({ one, many }: any) => ({
  project: one(projects, { fields: [sources.projectId], references: [projects.id] }),
  workspace: one(workspaces, { fields: [sources.workspaceId], references: [workspaces.id] }),
  chunks: many(chunks),
  ingestionJobs: many(ingestionJobs),
}))

export const threadsRelations = relations(threads, ({ one, many }: any) => ({
  project: one(projects, { fields: [threads.projectId], references: [projects.id] }),
  user: one(users, { fields: [threads.userId], references: [users.id] }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }: any) => ({
  thread: one(threads, { fields: [messages.threadId], references: [threads.id] }),
  project: one(projects, { fields: [messages.projectId], references: [projects.id] }),
}))
