# BRIEFR — Master Implementation Prompt
## AI-Powered Project Memory Platform — Agent Execution Document v1.0
> Tüm fazlar sırasıyla implement edilecek. Placeholder, TODO, stub yok.
> Her faz typecheck + lint geçmeden bir sonrakine geçilmez.
> Raw SQL yasak. bcrypt yasak. Tailwind JS config yok.

---

## ÜRÜN TANIMI

**Briefr**, ajansların, freelancer'ların ve startup kurucularının projelerine ait tüm
iletişimi (e-posta, Slack, Notion, toplantı notu, döküman, WhatsApp export) tek bir
AI hafızasına dönüştüren multi-tenant SaaS platformudur.

Kullanıcı bir proje seçer, o projeyle Türkçe veya İngilizce sohbet eder:
- "Bu müşteriyle bugüne kadar ne kararlaştırdık?"
- "Geçen toplantının action item'larını listele"
- "Bu proje için teknik brief yaz"
- "Müşteriye haftalık durum raporu hazırla"

Briefr tüm geçmişe bakarak anında, bağlamlı yanıt üretir.

---

## TEMEL KAVRAMLAR

```
Workspace  → Bir ajans veya freelancer'ın hesabı
Project    → Bir müşteri veya iş projesi (workspace altında)
Source     → Projeye bağlı veri kaynağı (Slack kanal, Gmail label,
              Notion sayfası, dosya upload, webhook)
Chunk      → Bir source'dan alınan, embedding'e dönüştürülmüş metin parçası
Memory     → Projenin tüm chunk'larının Vectorize index'indeki temsili
Thread     → Kullanıcının proje hafızasıyla yaptığı sohbet oturumu
```

---

## MİMARİ

```
┌─────────────────────────────────────────────────────────────┐
│                     BRIEFR MONOREPO                         │
│                                                             │
│  apps/web          → React 19 dashboard (CF Pages)         │
│  apps/worker       → Hono + tRPC v11 API (CF Workers)      │
│  apps/ingestion    → Async ingestion pipeline (CF Workers)  │
│  packages/types    → Zod şemaları                          │
│                                                             │
│  Cloudflare:                                                │
│  ├── Workers           API + ingestion                     │
│  ├── Vectorize         Embedding storage (namespace/proje)  │
│  ├── Workers AI        BGE-M3 embedding (768 dim)          │
│  ├── Queues            Ingestion kuyruğu                   │
│  ├── KV                Rate limit + session cache          │
│  ├── R2                Ham dosya depolama                  │
│  └── Durable Objects   Chat stream state                   │
│                                                             │
│  External:                                                  │
│  ├── Neon PostgreSQL   Kalıcı metadata (Drizzle ORM)       │
│  ├── DIFY.ai           LLM chat + RAG orchestration        │
│  ├── Slack API         Kanal okuma + webhook               │
│  ├── Gmail API (OAuth) E-posta thread okuma                │
│  ├── Notion API        Sayfa + DB okuma + webhook          │
│  ├── Make.com          Otomasyon webhook trigger           │
│  ├── iyzico            Abonelik ödemesi                    │
│  └── Resend            Bildirim e-postaları                │
└─────────────────────────────────────────────────────────────┘
```

---

## MONO-REPO YAPISI

```
briefr/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── auth/              # Login, Register, OAuth callback
│   │       │   ├── onboarding/        # Workspace kurulum sihirbazı
│   │       │   ├── dashboard/         # Proje listesi + özet
│   │       │   ├── project/           # Proje detay + chat
│   │       │   ├── sources/           # Kaynak yönetimi
│   │       │   ├── settings/          # Workspace, üyeler, entegrasyonlar
│   │       │   └── billing/           # Plan + iyzico
│   │       ├── components/
│   │       │   ├── ui/                # Button, Input, Badge, Modal, Toast
│   │       │   ├── chat/              # Chat arayüzü (streaming)
│   │       │   ├── source-cards/      # Her kaynak tipi için kart
│   │       │   └── memory-viewer/     # Chunk önizleme
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   ├── useStream.ts       # SSE/WS chat stream
│   │       │   └── useIngestion.ts    # Ingestion durum takibi
│   │       └── lib/
│   │           ├── trpc.ts
│   │           ├── store.ts
│   │           └── utils.ts
│   │
│   ├── worker/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── context.ts
│   │       ├── router/
│   │       │   ├── index.ts
│   │       │   ├── auth.ts
│   │       │   ├── workspace.ts
│   │       │   ├── project.ts
│   │       │   ├── source.ts
│   │       │   ├── chat.ts
│   │       │   ├── memory.ts
│   │       │   ├── billing.ts
│   │       │   └── analytics.ts
│   │       ├── routes/
│   │       │   ├── slack-webhook.ts
│   │       │   ├── notion-webhook.ts
│   │       │   ├── make-webhook.ts
│   │       │   ├── oauth-gmail.ts
│   │       │   ├── oauth-slack.ts
│   │       │   ├── oauth-notion.ts
│   │       │   ├── iyzico-callback.ts
│   │       │   └── upload.ts
│   │       ├── services/
│   │       │   ├── vectorize.ts
│   │       │   ├── dify.ts
│   │       │   ├── slack.ts
│   │       │   ├── gmail.ts
│   │       │   ├── notion.ts
│   │       │   ├── iyzico.ts
│   │       │   └── resend.ts
│   │       └── durable-objects/
│   │           └── chat-stream.ts
│   │
│   └── ingestion/
│       └── src/
│           └── index.ts               # Queue consumer
│
└── packages/
    └── types/
        └── src/index.ts
```

---

## PHASE 1 — MONOREPO KURULUM

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "typecheck": { "dependsOn": ["^typecheck"] }
  }
}
```

---

## PHASE 2 — PAYLAŞILAN TIPLER

`packages/types/src/index.ts`:

```typescript
import { z } from 'zod'

// ─── PLAN ─────────────────────────────────────────────────────
export const PlanSchema = z.enum(['free', 'starter', 'pro'])

// ─── AUTH ─────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  workspaceName: z.string().min(2),
})
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ─── WORKSPACE ────────────────────────────────────────────────
export const WorkspaceRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer'])
export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: WorkspaceRoleSchema,
})

// ─── PROJECT ──────────────────────────────────────────────────
export const CreateProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  clientName: z.string().max(100).optional(),
  emoji: z.string().max(4).optional().default('📁'),
  language: z.enum(['tr', 'en', 'auto']).default('auto'),
})
export const UpdateProjectSchema = CreateProjectSchema.partial().omit({ workspaceId: true })

// ─── SOURCE ───────────────────────────────────────────────────
export const SourceTypeSchema = z.enum([
  'slack_channel',
  'gmail_label',
  'notion_page',
  'notion_database',
  'file_upload',
  'make_webhook',
  'manual_note',
  'whatsapp_export',
])

export const SlackSourceConfigSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  teamId: z.string(),
  accessToken: z.string(), // encrypted at rest
})
export const GmailSourceConfigSchema = z.object({
  labelId: z.string(),
  labelName: z.string(),
  accessToken: z.string(),  // encrypted
  refreshToken: z.string(), // encrypted
})
export const NotionSourceConfigSchema = z.object({
  pageId: z.string(),
  pageTitle: z.string(),
  accessToken: z.string(), // encrypted
})
export const FileSourceConfigSchema = z.object({
  r2Key: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
})
export const MakeWebhookConfigSchema = z.object({
  webhookSecret: z.string(),
})
export const ManualNoteConfigSchema = z.object({
  content: z.string().max(50000),
})
export const WhatsAppConfigSchema = z.object({
  r2Key: z.string(),
  participantCount: z.number(),
  messageCount: z.number(),
})

export const CreateSourceSchema = z.object({
  projectId: z.string().uuid(),
  type: SourceTypeSchema,
  name: z.string().min(1).max(100),
  config: z.record(z.string(), z.unknown()),
  syncEnabled: z.boolean().default(true),
  syncIntervalHours: z.number().int().min(1).max(168).default(6),
})

// ─── CHAT ─────────────────────────────────────────────────────
export const CreateThreadSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().max(200).optional(),
})
export const SendMessageSchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  language: z.enum(['tr', 'en', 'auto']).default('auto'),
})

// ─── MEMORY ───────────────────────────────────────────────────
export const SearchMemorySchema = z.object({
  projectId: z.string().uuid(),
  query: z.string().min(1).max(1000),
  topK: z.number().int().min(1).max(20).default(10),
  sourceTypes: z.array(SourceTypeSchema).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

// ─── BILLING ──────────────────────────────────────────────────
export const TopUpSchema = z.object({
  workspaceId: z.string().uuid(),
  planId: z.enum(['starter', 'pro']),
  billingCycle: z.enum(['monthly', 'yearly']),
})

// ─── EXPORTS ──────────────────────────────────────────────────
export type Plan = z.infer<typeof PlanSchema>
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>
export type SourceType = z.infer<typeof SourceTypeSchema>
export type CreateProject = z.infer<typeof CreateProjectSchema>
export type CreateSource = z.infer<typeof CreateSourceSchema>
export type SendMessage = z.infer<typeof SendMessageSchema>
export type SearchMemory = z.infer<typeof SearchMemorySchema>
```

---

## PHASE 3 — VERİTABANI ŞEMASI

`drizzle/schema.ts`:

```typescript
import {
  pgTable, uuid, text, varchar, timestamp, boolean,
  integer, jsonb, pgEnum, index, uniqueIndex, bigint
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

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
}, (t) => ({
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
  // Kullanım sayaçları (aylık)
  chunksThisMonth: integer('chunks_this_month').default(0).notNull(),
  chatsThisMonth: integer('chats_this_month').default(0).notNull(),
  storageBytes: bigint('storage_bytes', { mode: 'number' }).default(0).notNull(),
  countersResetAt: timestamp('counters_reset_at').defaultNow().notNull(),
  // OAuth tokens (şifreli)
  slackAccessToken: text('slack_access_token'),
  slackTeamId: varchar('slack_team_id', { length: 50 }),
  gmailAccessToken: text('gmail_access_token'),
  gmailRefreshToken: text('gmail_refresh_token'),
  notionAccessToken: text('notion_access_token'),
  // iyzico
  iyzicoCustomerToken: text('iyzico_customer_token'),
  subscriptionId: text('subscription_id'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
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
}, (t) => ({
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
  // Vectorize namespace = project id (UUID)
  vectorNamespace: varchar('vector_namespace', { length: 100 }).notNull(),
  // İstatistikler
  sourceCount: integer('source_count').default(0).notNull(),
  chunkCount: integer('chunk_count').default(0).notNull(),
  threadCount: integer('thread_count').default(0).notNull(),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
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
  config: jsonb('config').notNull(),       // tip bazlı ayarlar (şifreli tokenlar dahil)
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
}, (t) => ({
  projectIdx: index('source_project_idx').on(t.projectId),
  syncIdx: index('source_sync_idx').on(t.nextSyncAt, t.syncEnabled),
}))

// ─── CHUNKS ───────────────────────────────────────────────────
// Bir chunk = embedding yapılmış metin parçası
// Vectorize'daki ID = chunk.id (UUID)
// Namespace = project.vectorNamespace
export const chunks = pgTable('chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),          // Ham metin (arama önizleme için)
  contentHash: varchar('content_hash', { length: 64 }).notNull(), // SHA-256 dedupe için
  status: chunkStatusEnum('status').default('pending').notNull(),
  tokenCount: integer('token_count'),
  embeddingModel: varchar('embedding_model', { length: 100 }),
  // Metadata (Vectorize'a da yansıtılır)
  sourceType: sourceTypeEnum('source_type').notNull(),
  sourceName: varchar('source_name', { length: 100 }).notNull(),
  originalDate: timestamp('original_date'),    // Mesajın/dokümanın tarihi
  author: varchar('author', { length: 100 }),
  language: varchar('language', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
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
}, (t) => ({
  projectIdx: index('thread_project_idx').on(t.projectId),
}))

// ─── MESSAGES ─────────────────────────────────────────────────
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  // RAG: hangi chunk'lar kullanıldı
  usedChunkIds: jsonb('used_chunk_ids').default([]),
  // DIFY metadata
  difyMessageId: text('dify_message_id'),
  difyConversationId: text('dify_conversation_id'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  threadIdx: index('message_thread_idx').on(t.threadId),
}))

// ─── INGESTION JOBS ───────────────────────────────────────────
export const ingestionJobs = pgTable('ingestion_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: pgEnum('ingestion_status', ['pending','running','done','failed'])('status').default('pending').notNull(),
  triggeredBy: varchar('triggered_by', { length: 20 }).default('scheduler').notNull(), // scheduler|manual|webhook
  chunksCreated: integer('chunks_created').default(0).notNull(),
  chunksSkipped: integer('chunks_skipped').default(0).notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  sourceIdx: index('ingestion_source_idx').on(t.sourceId),
}))

// ─── RELATIONS ────────────────────────────────────────────────
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  projects: many(projects),
}))
export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  sources: many(sources),
  threads: many(threads),
}))
export const sourcesRelations = relations(sources, ({ one, many }) => ({
  project: one(projects, { fields: [sources.projectId], references: [projects.id] }),
  chunks: many(chunks),
  ingestionJobs: many(ingestionJobs),
}))
export const threadsRelations = relations(threads, ({ one, many }) => ({
  project: one(projects, { fields: [threads.projectId], references: [projects.id] }),
  messages: many(messages),
}))
```

---

## PHASE 4 — WORKER API

### 4.1 Ortam Değişkenleri

`apps/worker/.dev.vars`:
```env
DATABASE_URL=postgresql://...neon.tech/briefr
RESEND_API_KEY=re_...
DIFY_API_KEY=app-...
DIFY_API_URL=https://api.dify.ai/v1
DIFY_CHAT_APP_ID=...
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_BASE_URL=https://api.iyzipay.com
FRONTEND_URL=https://briefr.app
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
ENCRYPTION_KEY=<32-byte-hex>
```

### 4.2 Worker Entry

`apps/worker/src/index.ts`:
```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './router'
import { createContext } from './context'
import { slackWebhookHandler } from './routes/slack-webhook'
import { notionWebhookHandler } from './routes/notion-webhook'
import { makeWebhookHandler } from './routes/make-webhook'
import { gmailOAuthHandler } from './routes/oauth-gmail'
import { slackOAuthHandler } from './routes/oauth-slack'
import { notionOAuthHandler } from './routes/oauth-notion'
import { iyzicoCallbackHandler } from './routes/iyzico-callback'
import { uploadHandler } from './routes/upload'

export { ChatStreamDO } from './durable-objects/chat-stream'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('*', logger())
app.use('*', cors({
  origin: ['https://briefr.app', 'http://localhost:5173'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))
app.use('*', prettyJSON())

// OAuth callbacks
app.get('/oauth/gmail/callback',  gmailOAuthHandler)
app.get('/oauth/slack/callback',  slackOAuthHandler)
app.get('/oauth/notion/callback', notionOAuthHandler)

// Webhook ingestion (public, secret doğrulamalı)
app.post('/webhooks/slack',   slackWebhookHandler)
app.post('/webhooks/notion',  notionWebhookHandler)
app.post('/webhooks/make/:projectId/:secret', makeWebhookHandler)

// iyzico callback
app.post('/billing/callback', iyzicoCallbackHandler)
app.get('/billing/callback',  iyzicoCallbackHandler)

// Dosya upload
app.post('/upload', uploadHandler)

// Chat SSE stream
app.get('/chat/stream/:threadId', async (c) => {
  const threadId = c.req.param('threadId')
  const doId = c.env.CHAT_STREAM_DO.idFromName(threadId)
  const stub = c.env.CHAT_STREAM_DO.get(doId)
  return stub.fetch(c.req.raw)
})

// tRPC
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext: (opts) => createContext(opts, (opts.req as any).env),
}))

app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }))

export default app
```

### 4.3 Context

`apps/worker/src/context.ts`:
```typescript
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sessions, users } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export type CloudflareBindings = {
  DATABASE_URL: string
  RESEND_API_KEY: string
  DIFY_API_KEY: string
  DIFY_API_URL: string
  DIFY_CHAT_APP_ID: string
  IYZICO_API_KEY: string
  IYZICO_SECRET_KEY: string
  IYZICO_BASE_URL: string
  FRONTEND_URL: string
  SLACK_CLIENT_ID: string
  SLACK_CLIENT_SECRET: string
  GMAIL_CLIENT_ID: string
  GMAIL_CLIENT_SECRET: string
  NOTION_CLIENT_ID: string
  NOTION_CLIENT_SECRET: string
  ENCRYPTION_KEY: string
  CHAT_STREAM_DO: DurableObjectNamespace
  BRIEFR_VECTORIZE: VectorizeIndex
  BRIEFR_AI: Ai
  INGESTION_QUEUE: Queue
  BRIEFR_KV: KVNamespace
  BRIEFR_R2: R2Bucket
}

export type AppContext = Awaited<ReturnType<typeof createContext>>

export async function createContext(opts: FetchCreateContextFnOptions, env: CloudflareBindings) {
  const sql = neon(env.DATABASE_URL)
  const db = drizzle(sql)
  let user: typeof users.$inferSelect | null = null

  const authHeader = opts.req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const [row] = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1)
    if (row) user = row.user
  }

  return { db, env, user, req: opts.req }
}
```

### 4.4 Auth Router

`apps/worker/src/router/auth.ts`:
```typescript
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { router, publicProcedure, protectedProcedure } from './index'
import { users, sessions, workspaces, workspaceMembers } from '../../../drizzle/schema'
import { RegisterSchema, LoginSchema } from '@briefr/types'
import { Resend } from 'resend'
import { nanoid } from 'nanoid'

// PBKDF2 (Workers uyumlu — bcrypt yasak)
async function hashPassword(pw: string): Promise<string> {
  const enc = new TextEncoder()
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, km, 256)
  return `${Array.from(salt).join(',')};${Array.from(new Uint8Array(bits)).join(',')}`
}

async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [sp, hp] = stored.split(';')
  const salt = new Uint8Array(sp.split(',').map(Number))
  const expected = hp.split(',').map(Number)
  const enc = new TextEncoder()
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, km, 256)
  return Array.from(new Uint8Array(bits)).every((b, i) => b === expected[i])
}

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + nanoid(4)
}

export const authRouter = router({
  register: publicProcedure.input(RegisterSchema).mutation(async ({ input, ctx }) => {
    const [existing] = await ctx.db.select().from(users).where(eq(users.email, input.email)).limit(1)
    if (existing) throw new Error('Bu e-posta zaten kayıtlı')

    const passwordHash = await hashPassword(input.password)
    const [user] = await ctx.db.insert(users).values({
      email: input.email, passwordHash, fullName: input.fullName,
      kvkkConsentAt: new Date(),
    }).returning()

    const slug = generateSlug(input.workspaceName)
    const [workspace] = await ctx.db.insert(workspaces).values({
      name: input.workspaceName, slug, ownerId: user.id,
    }).returning()

    await ctx.db.insert(workspaceMembers).values({
      workspaceId: workspace.id, userId: user.id, role: 'owner', acceptedAt: new Date(),
    })

    const resend = new Resend(ctx.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Briefr <noreply@briefr.app>',
      to: input.email,
      subject: "Briefr'a Hoş Geldiniz 🧠",
      html: `<h1>Merhaba ${input.fullName}!</h1>
             <p>İlk projenizi oluşturarak kaynakları bağlamaya başlayın.</p>
             <p><a href="${ctx.env.FRONTEND_URL}/onboarding">Kuruluma Başla →</a></p>`,
    })

    const token = nanoid(48)
    await ctx.db.insert(sessions).values({
      userId: user.id, token, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return { token, user: { id: user.id, email: user.email, fullName: user.fullName }, workspace }
  }),

  login: publicProcedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.email, input.email)).limit(1)
    if (!user) throw new Error('Geçersiz e-posta veya şifre')
    if (!(await verifyPassword(input.password, user.passwordHash))) throw new Error('Geçersiz e-posta veya şifre')

    const token = nanoid(48)
    await ctx.db.insert(sessions).values({
      userId: user.id, token, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    return { token, user: { id: user.id, email: user.email, fullName: user.fullName } }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const token = ctx.req.headers.get('Authorization')!.slice(7)
    await ctx.db.delete(sessions).where(eq(sessions.token, token))
    return { ok: true }
  }),

  me: protectedProcedure.query(({ ctx }) => ({
    id: ctx.user.id, email: ctx.user.email,
    fullName: ctx.user.fullName, avatarUrl: ctx.user.avatarUrl,
  })),

  deleteAccount: protectedProcedure
    .input(z.object({ confirmPassword: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!(await verifyPassword(input.confirmPassword, ctx.user.passwordHash)))
        throw new Error('Şifre doğrulaması başarısız')
      // Soft delete — KVKK cron ile 30 gün sonra hard delete
      await ctx.db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, ctx.user.id))
      return { ok: true }
    }),
})
```

### 4.5 Project Router

`apps/worker/src/router/project.ts`:
```typescript
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { router, protectedProcedure } from './index'
import { projects, workspaceMembers, sources, chunks } from '../../../drizzle/schema'
import { CreateProjectSchema, UpdateProjectSchema } from '@briefr/types'

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await assertWorkspaceMember(ctx, input.workspaceId)
      return ctx.db.select().from(projects)
        .where(and(eq(projects.workspaceId, input.workspaceId), eq(projects.archived, false)))
        .orderBy(desc(projects.lastActivityAt))
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      await assertWorkspaceMember(ctx, project.workspaceId)
      return project
    }),

  create: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      await assertWorkspaceMember(ctx, input.workspaceId, ['owner', 'admin', 'member'])
      const namespace = `prj_${input.workspaceId.replace(/-/g, '')}_${Date.now()}`
      const [project] = await ctx.db.insert(projects).values({
        workspaceId: input.workspaceId,
        createdBy: ctx.user.id,
        name: input.name,
        description: input.description,
        clientName: input.clientName,
        emoji: input.emoji ?? '📁',
        language: input.language ?? 'auto',
        vectorNamespace: namespace,
      }).returning()
      return project
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: UpdateProjectSchema }))
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      await assertWorkspaceMember(ctx, project.workspaceId, ['owner', 'admin', 'member'])
      const [updated] = await ctx.db.update(projects)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(projects.id, input.id)).returning()
      return updated
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      await assertWorkspaceMember(ctx, project.workspaceId, ['owner', 'admin'])
      await ctx.db.update(projects).set({ archived: true }).where(eq(projects.id, input.id))
      return { ok: true }
    }),

  // Proje hafızasını tamamen sil (KVKK talebi)
  purgeMemory: protectedProcedure
    .input(z.object({ id: z.string().uuid(), confirmName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.id)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')
      if (input.confirmName !== project.name) throw new Error('Proje adı doğrulaması başarısız')
      await assertWorkspaceMember(ctx, project.workspaceId, ['owner'])

      // Vectorize namespace temizle — tüm chunk'ları sil
      const projectChunks = await ctx.db.select({ id: chunks.id }).from(chunks)
        .where(eq(chunks.projectId, input.id))
      if (projectChunks.length > 0) {
        const ids = projectChunks.map(c => c.id)
        // Batch olarak sil (max 1000/istek)
        for (let i = 0; i < ids.length; i += 1000) {
          await ctx.env.BRIEFR_VECTORIZE.deleteByIds(ids.slice(i, i + 1000))
        }
      }

      // DB'den chunk ve source kayıtlarını sil
      await ctx.db.delete(chunks).where(eq(chunks.projectId, input.id))
      await ctx.db.delete(sources).where(eq(sources.projectId, input.id))
      await ctx.db.update(projects)
        .set({ chunkCount: 0, sourceCount: 0, updatedAt: new Date() })
        .where(eq(projects.id, input.id))

      return { ok: true, chunksDeleted: projectChunks.length }
    }),
})

async function assertWorkspaceMember(
  ctx: any,
  workspaceId: string,
  allowedRoles: string[] = ['owner', 'admin', 'member', 'viewer']
) {
  const [member] = await ctx.db.select().from(workspaceMembers)
    .where(and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, ctx.user.id),
    )).limit(1)
  if (!member || !allowedRoles.includes(member.role)) throw new Error('Erişim reddedildi')
  return member
}
```

### 4.6 Source Router

`apps/worker/src/router/source.ts`:
```typescript
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { router, protectedProcedure } from './index'
import { sources, projects, ingestionJobs } from '../../../drizzle/schema'
import { CreateSourceSchema } from '@briefr/types'
import { encryptField, decryptField } from '../utils/crypto'

export const sourceRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select({
        id: sources.id, name: sources.name, type: sources.type,
        status: sources.status, chunkCount: sources.chunkCount,
        lastSyncAt: sources.lastSyncAt, lastError: sources.lastError,
        syncEnabled: sources.syncEnabled, createdAt: sources.createdAt,
      }).from(sources)
        .where(eq(sources.projectId, input.projectId))
        .orderBy(desc(sources.createdAt))
    }),

  create: protectedProcedure
    .input(CreateSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      // Config içindeki token'ları şifrele
      const encryptedConfig = await encryptSensitiveFields(input.config, ctx.env.ENCRYPTION_KEY)

      const [source] = await ctx.db.insert(sources).values({
        projectId: input.projectId,
        workspaceId: project.workspaceId,
        type: input.type,
        name: input.name,
        config: encryptedConfig,
        syncEnabled: input.syncEnabled,
        syncIntervalHours: input.syncIntervalHours,
        nextSyncAt: new Date(), // Hemen sync başlat
      }).returning()

      // İlk sync'i hemen kuyruğa ekle
      await ctx.env.INGESTION_QUEUE.send({
        sourceId: source.id,
        projectId: input.projectId,
        triggeredBy: 'manual',
      })

      // Source count güncelle
      await ctx.db.update(projects).set({
        sourceCount: project.sourceCount + 1,
        updatedAt: new Date(),
      }).where(eq(projects.id, input.projectId))

      return { id: source.id, name: source.name, type: source.type, status: source.status }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [source] = await ctx.db.select().from(sources)
        .where(eq(sources.id, input.id)).limit(1)
      if (!source) throw new Error('Kaynak bulunamadı')

      // Bu source'un chunk'larını Vectorize'dan sil
      const { deleteSourceChunks } = await import('../services/vectorize')
      await deleteSourceChunks(ctx.env, source.id, source.projectId)

      await ctx.db.delete(sources).where(eq(sources.id, input.id))

      // Source count güncelle
      await ctx.db.update(projects).set({
        sourceCount: (project: any) => project.sourceCount - 1,
        updatedAt: new Date(),
      }).where(eq(projects.id, source.projectId))

      return { ok: true }
    }),

  resync: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [source] = await ctx.db.select().from(sources)
        .where(eq(sources.id, input.id)).limit(1)
      if (!source) throw new Error('Kaynak bulunamadı')

      await ctx.env.INGESTION_QUEUE.send({
        sourceId: source.id, projectId: source.projectId, triggeredBy: 'manual',
      })
      await ctx.db.update(sources)
        .set({ status: 'pending', updatedAt: new Date() })
        .where(eq(sources.id, input.id))
      return { ok: true }
    }),

  ingestionHistory: protectedProcedure
    .input(z.object({ sourceId: z.string().uuid(), limit: z.number().int().max(20).default(10) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select().from(ingestionJobs)
        .where(eq(ingestionJobs.sourceId, input.sourceId))
        .orderBy(desc(ingestionJobs.createdAt))
        .limit(input.limit)
    }),
})

async function encryptSensitiveFields(config: Record<string, unknown>, key: string) {
  const sensitiveKeys = ['accessToken', 'refreshToken', 'webhookSecret']
  const result = { ...config }
  for (const k of sensitiveKeys) {
    if (typeof result[k] === 'string') {
      result[k] = await encryptField(result[k] as string, key)
    }
  }
  return result
}
```

### 4.7 Chat Router (DIFY ile RAG)

`apps/worker/src/router/chat.ts`:
```typescript
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { router, protectedProcedure } from './index'
import { threads, messages, projects } from '../../../drizzle/schema'
import { CreateThreadSchema, SendMessageSchema } from '@briefr/types'
import { searchMemory } from '../services/vectorize'
import { streamDifyChat } from '../services/dify'

export const chatRouter = router({
  listThreads: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select().from(threads)
        .where(and(eq(threads.projectId, input.projectId), eq(threads.userId, ctx.user.id)))
        .orderBy(desc(threads.lastMessageAt))
        .limit(50)
    }),

  createThread: protectedProcedure
    .input(CreateThreadSchema)
    .mutation(async ({ input, ctx }) => {
      const [thread] = await ctx.db.insert(threads).values({
        projectId: input.projectId,
        userId: ctx.user.id,
        title: input.title ?? 'Yeni Sohbet',
      }).returning()
      return thread
    }),

  getMessages: protectedProcedure
    .input(z.object({ threadId: z.string().uuid(), limit: z.number().int().max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      const [thread] = await ctx.db.select().from(threads)
        .where(and(eq(threads.id, input.threadId), eq(threads.userId, ctx.user.id))).limit(1)
      if (!thread) throw new Error('Thread bulunamadı')
      return ctx.db.select().from(messages)
        .where(eq(messages.threadId, input.threadId))
        .orderBy(messages.createdAt)
        .limit(input.limit)
    }),

  // Ana chat endpoint — RAG + DIFY streaming
  sendMessage: protectedProcedure
    .input(SendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const [thread] = await ctx.db.select().from(threads)
        .where(and(eq(threads.id, input.threadId), eq(threads.userId, ctx.user.id))).limit(1)
      if (!thread) throw new Error('Thread bulunamadı')

      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, thread.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      // 1. Kullanıcı mesajını kaydet
      await ctx.db.insert(messages).values({
        threadId: input.threadId,
        projectId: thread.projectId,
        role: 'user',
        content: input.content,
      })

      // 2. Vektör arama ile ilgili chunk'ları bul
      const relevantChunks = await searchMemory(ctx.env, {
        namespace: project.vectorNamespace,
        query: input.content,
        topK: 8,
      })

      // 3. Context oluştur
      const context = relevantChunks
        .map(c => `[${c.metadata?.sourceType ?? 'not'}] ${c.metadata?.sourceName ?? ''} (${c.metadata?.originalDate ?? ''})\n${c.metadata?.content ?? ''}`)
        .join('\n\n---\n\n')

      // 4. DIFY'ye gönder (streaming)
      const systemPrompt = buildSystemPrompt(project.name, project.language ?? 'auto', context)

      // Mesaj ID'sini döndür — client SSE stream'i bu ID ile açar
      const pendingMsgId = crypto.randomUUID()

      // DO'ya stream'i başlat (fire-and-forget)
      ctx.req.raw['executionCtx']?.waitUntil(
        streamDifyChat(ctx.env, {
          userMessage: input.content,
          systemPrompt,
          threadId: input.threadId,
          projectId: thread.projectId,
          pendingMsgId,
          usedChunkIds: relevantChunks.map(c => c.id),
          difyConversationId: await getOrCreateDifyConversation(ctx, thread.id),
        })
      )

      return { pendingMsgId, chunksUsed: relevantChunks.length }
    }),

  renameThread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid(), title: z.string().min(1).max(200) }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(threads)
        .set({ title: input.title })
        .where(and(eq(threads.id, input.threadId), eq(threads.userId, ctx.user.id)))
      return { ok: true }
    }),

  deleteThread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(threads)
        .where(and(eq(threads.id, input.threadId), eq(threads.userId, ctx.user.id)))
      return { ok: true }
    }),
})

function buildSystemPrompt(projectName: string, language: string, context: string): string {
  const lang = language === 'tr' ? 'Türkçe' : language === 'en' ? 'English' : 'same language as the user'
  return `Sen "${projectName}" projesi için bir proje hafıza asistanısın.
Aşağıdaki proje kaynaklarından alınan bilgileri kullanarak soruları yanıtla.
Yanıtlarını ${lang} ver.
Eğer bilgi kaynaklarda yoksa bunu açıkça belirt, uydurma.

PROJE KAYNAKLARI:
${context || 'Henüz kaynak eklenmemiş.'}

KURALLAR:
- Kaynaktan bilgi alırken hangi kaynaktan geldiğini belirt (örn: "[Slack #genel]", "[Gmail]", "[Notion]")
- Tarihleri belirt (ne zaman söylendiği önemli)
- Çelişkili bilgi varsa her ikisini de göster
- "Brief yaz", "rapor hazırla", "karar listesi çıkar" gibi isteklerde yapılandırılmış çıktı ver`
}

async function getOrCreateDifyConversation(ctx: any, threadId: string): Promise<string | undefined> {
  const [lastMsg] = await ctx.db.select({ difyConversationId: messages.difyConversationId })
    .from(messages)
    .where(and(eq(messages.threadId, threadId), eq(messages.role, 'assistant')))
    .orderBy(desc(messages.createdAt))
    .limit(1)
  return lastMsg?.difyConversationId ?? undefined
}
```

### 4.8 Memory Router

`apps/worker/src/router/memory.ts`:
```typescript
import { z } from 'zod'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { router, protectedProcedure } from './index'
import { chunks, sources, projects } from '../../../drizzle/schema'
import { SearchMemorySchema } from '@briefr/types'
import { searchMemory } from '../services/vectorize'

export const memoryRouter = router({
  search: protectedProcedure
    .input(SearchMemorySchema)
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      const results = await searchMemory(ctx.env, {
        namespace: project.vectorNamespace,
        query: input.query,
        topK: input.topK ?? 10,
        filter: input.sourceTypes
          ? { sourceType: { $in: input.sourceTypes } }
          : undefined,
      })

      return results.map(r => ({
        chunkId: r.id,
        score: r.score,
        content: r.metadata?.content ?? '',
        sourceType: r.metadata?.sourceType,
        sourceName: r.metadata?.sourceName,
        author: r.metadata?.author,
        originalDate: r.metadata?.originalDate,
      }))
    }),

  stats: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db.select().from(projects)
        .where(eq(projects.id, input.projectId)).limit(1)
      if (!project) throw new Error('Proje bulunamadı')

      const sourceStats = await ctx.db
        .select({ type: sources.type, count: sources.chunkCount, name: sources.name })
        .from(sources)
        .where(eq(sources.projectId, input.projectId))

      return {
        totalChunks: project.chunkCount,
        sources: sourceStats,
        namespace: project.vectorNamespace,
      }
    }),

  recentChunks: protectedProcedure
    .input(z.object({ projectId: z.string().uuid(), limit: z.number().int().max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.select({
        id: chunks.id, content: chunks.content, sourceType: chunks.sourceType,
        sourceName: chunks.sourceName, originalDate: chunks.originalDate, author: chunks.author,
        createdAt: chunks.createdAt,
      }).from(chunks)
        .where(and(eq(chunks.projectId, input.projectId), eq(chunks.status, 'embedded')))
        .orderBy(desc(chunks.createdAt))
        .limit(input.limit)
    }),
})
```

---

## PHASE 5 — SERVİSLER

### 5.1 Vectorize Servisi

`apps/worker/src/services/vectorize.ts`:
```typescript
import type { CloudflareBindings } from '../context'

interface EmbedAndStoreParams {
  env: CloudflareBindings
  chunkId: string
  content: string
  namespace: string
  metadata: {
    sourceId: string
    sourceType: string
    sourceName: string
    projectId: string
    content: string          // önizleme için (ilk 500 karakter)
    originalDate?: string
    author?: string
    language?: string
  }
}

export async function embedAndStore(params: EmbedAndStoreParams): Promise<void> {
  const { env, chunkId, content, namespace, metadata } = params

  // BGE-M3 embedding (768 dim, çok dilli — Türkçe mükemmel)
  const embedResult = await env.BRIEFR_AI.run('@cf/baai/bge-m3', {
    text: [content],
  }) as { data: number[][] }

  const vector = embedResult.data[0]

  await env.BRIEFR_VECTORIZE.upsert([{
    id: chunkId,
    values: vector,
    namespace,
    metadata: {
      ...metadata,
      content: metadata.content.substring(0, 500), // Vectorize metadata limiti
    },
  }])
}

export async function searchMemory(
  env: CloudflareBindings,
  params: {
    namespace: string
    query: string
    topK: number
    filter?: Record<string, unknown>
  }
) {
  const embedResult = await env.BRIEFR_AI.run('@cf/baai/bge-m3', {
    text: [params.query],
  }) as { data: number[][] }

  const queryVector = embedResult.data[0]

  const results = await env.BRIEFR_VECTORIZE.query(queryVector, {
    topK: params.topK,
    namespace: params.namespace,
    returnMetadata: 'all',
    filter: params.filter,
  })

  return results.matches
}

export async function deleteSourceChunks(
  env: CloudflareBindings,
  sourceId: string,
  projectId: string
): Promise<number> {
  // Önce DB'den chunk ID'leri al, sonra Vectorize'dan sil
  const { drizzle } = await import('drizzle-orm/neon-http')
  const { neon } = await import('@neondatabase/serverless')
  const { chunks } = await import('../../../drizzle/schema')
  const { eq } = await import('drizzle-orm')

  const db = drizzle(neon(env.DATABASE_URL))
  const chunkIds = await db.select({ id: chunks.id }).from(chunks)
    .where(eq(chunks.sourceId, sourceId))

  if (chunkIds.length === 0) return 0

  for (let i = 0; i < chunkIds.length; i += 1000) {
    await env.BRIEFR_VECTORIZE.deleteByIds(chunkIds.slice(i, i + 1000).map(c => c.id))
  }

  return chunkIds.length
}
```

### 5.2 DIFY Servisi (Streaming)

`apps/worker/src/services/dify.ts`:
```typescript
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { messages, threads } from '../../../drizzle/schema'
import { eq, sql } from 'drizzle-orm'

export async function streamDifyChat(
  env: CloudflareBindings,
  params: {
    userMessage: string
    systemPrompt: string
    threadId: string
    projectId: string
    pendingMsgId: string
    usedChunkIds: string[]
    difyConversationId?: string
  }
): Promise<void> {
  const db = drizzle(neon(env.DATABASE_URL))
  const startTime = Date.now()

  try {
    const response = await fetch(`${env.DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { system_prompt: params.systemPrompt },
        query: params.userMessage,
        response_mode: 'streaming',
        conversation_id: params.difyConversationId ?? '',
        user: params.threadId,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`DIFY API hatası: ${response.status}`)
    }

    // SSE stream'i oku ve DO üzerinden client'a ilet
    const doId = env.CHAT_STREAM_DO.idFromName(params.threadId)
    const stub = env.CHAT_STREAM_DO.get(doId)

    let fullContent = ''
    let difyMessageId = ''
    let difyConversationId = params.difyConversationId ?? ''
    let inputTokens = 0
    let outputTokens = 0

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const event = JSON.parse(data)
          if (event.event === 'message') {
            fullContent += event.answer ?? ''
            difyMessageId = event.message_id ?? difyMessageId
            difyConversationId = event.conversation_id ?? difyConversationId
            // DO'ya parça gönder
            await stub.fetch(new Request('https://do/chunk', {
              method: 'POST',
              body: JSON.stringify({ pendingMsgId: params.pendingMsgId, chunk: event.answer ?? '' }),
            }))
          } else if (event.event === 'message_end') {
            inputTokens = event.metadata?.usage?.prompt_tokens ?? 0
            outputTokens = event.metadata?.usage?.completion_tokens ?? 0
          }
        } catch { /* geçersiz JSON satırı, atla */ }
      }
    }

    // Tamamlanan mesajı DB'ye kaydet
    const [savedMsg] = await db.insert(messages).values({
      threadId: params.threadId,
      projectId: params.projectId,
      role: 'assistant',
      content: fullContent,
      usedChunkIds: params.usedChunkIds,
      difyMessageId,
      difyConversationId,
      inputTokens,
      outputTokens,
      durationMs: Date.now() - startTime,
    }).returning()

    // Thread istatistiklerini güncelle
    await db.update(threads)
      .set({ messageCount: sql`${threads.messageCount} + 2`, lastMessageAt: new Date() })
      .where(eq(threads.id, params.threadId))

    // DO'ya stream tamamlandı sinyali gönder
    await stub.fetch(new Request('https://do/done', {
      method: 'POST',
      body: JSON.stringify({ pendingMsgId: params.pendingMsgId, messageId: savedMsg.id }),
    }))

  } catch (err: any) {
    // Hata mesajını DO üzerinden client'a ilet
    const doId = env.CHAT_STREAM_DO.idFromName(params.threadId)
    const stub = env.CHAT_STREAM_DO.get(doId)
    await stub.fetch(new Request('https://do/error', {
      method: 'POST',
      body: JSON.stringify({ pendingMsgId: params.pendingMsgId, error: err.message }),
    }))
  }
}
```

### 5.3 Ingestion — Slack

`apps/worker/src/services/slack.ts`:
```typescript
import type { CloudflareBindings } from '../context'

interface SlackMessage {
  ts: string
  text: string
  user: string
  username?: string
  files?: Array<{ name: string; mimetype: string; url_private: string }>
}

export async function fetchSlackChannel(
  accessToken: string,
  channelId: string,
  oldestTs?: string
): Promise<SlackMessage[]> {
  const params = new URLSearchParams({
    channel: channelId,
    limit: '200',
    ...(oldestTs ? { oldest: oldestTs } : {}),
  })

  const response = await fetch(`https://slack.com/api/conversations.history?${params}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  const data = await response.json() as any
  if (!data.ok) throw new Error(`Slack API hatası: ${data.error}`)
  return data.messages ?? []
}

export function chunkSlackMessages(
  messages: SlackMessage[],
  channelName: string,
  windowSize = 10
): Array<{ content: string; date: string; authors: string[] }> {
  const chunks: Array<{ content: string; date: string; authors: string[] }> = []
  for (let i = 0; i < messages.length; i += windowSize) {
    const window = messages.slice(i, i + windowSize)
    const authors = [...new Set(window.map(m => m.username ?? m.user).filter(Boolean))]
    const content = window
      .map(m => `${m.username ?? m.user}: ${m.text}`)
      .join('\n')
    const date = new Date(parseFloat(window[0].ts) * 1000).toISOString()
    if (content.trim().length > 20) {
      chunks.push({ content: `#${channelName}\n${content}`, date, authors })
    }
  }
  return chunks
}
```

### 5.4 Ingestion — Gmail

`apps/worker/src/services/gmail.ts`:
```typescript
export async function fetchGmailThreads(
  accessToken: string,
  labelId: string,
  maxResults = 50,
  pageToken?: string
) {
  const params = new URLSearchParams({
    labelIds: labelId,
    maxResults: String(maxResults),
    ...(pageToken ? { pageToken } : {}),
  })
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads?${params}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  const data = await response.json() as any
  return { threads: data.threads ?? [], nextPageToken: data.nextPageToken }
}

export async function fetchGmailThread(accessToken: string, threadId: string) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  return response.json()
}

export function extractEmailText(thread: any): {
  subject: string; participants: string[]; date: string; content: string
} {
  const messages = thread.messages ?? []
  const firstMsg = messages[0]
  const headers = firstMsg?.payload?.headers ?? []
  const subject = headers.find((h: any) => h.name === 'Subject')?.value ?? ''
  const date = headers.find((h: any) => h.name === 'Date')?.value ?? ''
  const participants = messages.flatMap((m: any) =>
    (m.payload?.headers ?? [])
      .filter((h: any) => h.name === 'From' || h.name === 'To')
      .map((h: any) => h.value)
  )

  const bodies: string[] = []
  for (const msg of messages) {
    const body = extractBody(msg.payload)
    if (body) bodies.push(body)
  }

  return {
    subject,
    participants: [...new Set(participants)],
    date: new Date(date).toISOString(),
    content: `Konu: ${subject}\nKatılımcılar: ${participants.join(', ')}\n\n${bodies.join('\n---\n')}`,
  }
}

function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }
  return ''
}
```

### 5.5 Ingestion — Notion

`apps/worker/src/services/notion.ts`:
```typescript
export async function fetchNotionPage(accessToken: string, pageId: string) {
  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
    },
  })
  return response.json()
}

export function extractNotionText(blocks: any): string {
  const lines: string[] = []
  for (const block of blocks?.results ?? []) {
    const type = block.type
    const richText = block[type]?.rich_text ?? []
    const text = richText.map((t: any) => t.plain_text).join('')
    if (text.trim()) {
      if (type === 'heading_1') lines.push(`# ${text}`)
      else if (type === 'heading_2') lines.push(`## ${text}`)
      else if (type === 'heading_3') lines.push(`### ${text}`)
      else if (type === 'bulleted_list_item') lines.push(`• ${text}`)
      else if (type === 'numbered_list_item') lines.push(`${text}`)
      else if (type === 'to_do') lines.push(`[${block.to_do?.checked ? 'x' : ' '}] ${text}`)
      else lines.push(text)
    }
  }
  return lines.join('\n')
}

// Uzun metin için sliding window chunking
export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks
}
```

### 5.6 WhatsApp Export Parser

`apps/worker/src/services/whatsapp.ts`:
```typescript
// WhatsApp text export formatı: "DD.MM.YYYY HH:mm - İsim: Mesaj"
interface WaMessage { date: string; author: string; content: string }

export function parseWhatsAppExport(rawText: string): WaMessage[] {
  const lineRegex = /^(\d{1,2}\.\d{1,2}\.\d{4})[, ]+(\d{2}:\d{2})\s*-\s*([^:]+):\s*(.+)$/
  const messages: WaMessage[] = []

  for (const line of rawText.split('\n')) {
    const match = line.match(lineRegex)
    if (match) {
      const [, dateStr, time, author, content] = match
      const [day, month, year] = dateStr.split('.')
      messages.push({
        date: new Date(`${year}-${month}-${day}T${time}:00`).toISOString(),
        author: author.trim(),
        content: content.trim(),
      })
    }
  }
  return messages
}

export function chunkWaMessages(messages: WaMessage[], windowSize = 15) {
  const chunks = []
  for (let i = 0; i < messages.length; i += windowSize) {
    const window = messages.slice(i, i + windowSize)
    const authors = [...new Set(window.map(m => m.author))]
    const content = window.map(m => `${m.author}: ${m.content}`).join('\n')
    chunks.push({ content, date: window[0].date, authors })
  }
  return chunks
}
```

### 5.7 iyzico Servisi

`apps/worker/src/services/iyzico.ts`:
```typescript
import type { CloudflareBindings } from '../context'

const PLANS = {
  starter: { monthly: 149, yearly: 1490, name: 'Starter' },
  pro:     { monthly: 399, yearly: 3990, name: 'Pro' },
} as const

export async function initSubscriptionPayment(
  env: CloudflareBindings,
  params: { workspaceId: string; planId: 'starter' | 'pro'; billingCycle: 'monthly' | 'yearly'; buyerEmail: string; buyerName: string }
) {
  const plan = PLANS[params.planId]
  const price = params.billingCycle === 'yearly' ? plan.yearly : plan.monthly
  const randomString = crypto.randomUUID()
  const conversationId = crypto.randomUUID()
  const nameParts = params.buyerName.split(' ')

  const requestBody = {
    locale: 'tr', conversationId,
    price: price.toFixed(2), paidPrice: price.toFixed(2),
    currency: 'TRY',
    basketId: `briefr_${params.workspaceId}_${params.planId}_${params.billingCycle}`,
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: `${env.FRONTEND_URL}/billing/callback`,
    enabledInstallments: [1],
    buyer: {
      id: params.workspaceId,
      name: nameParts[0] ?? 'Ad',
      surname: nameParts.slice(1).join(' ') || 'Soyad',
      email: params.buyerEmail,
      identityNumber: '11111111111',
      registrationAddress: 'Türkiye', city: 'İstanbul', country: 'Türkiye',
    },
    shippingAddress: { contactName: params.buyerName, city: 'İstanbul', country: 'Türkiye', address: 'Türkiye' },
    billingAddress: { contactName: params.buyerName, city: 'İstanbul', country: 'Türkiye', address: 'Türkiye' },
    basketItems: [{
      id: `${params.planId}_${params.billingCycle}`,
      name: `Briefr ${plan.name} — ${params.billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'}`,
      category1: 'Yazılım', itemType: 'VIRTUAL',
      price: price.toFixed(2),
    }],
  }

  const authHeader = await buildIyzicoAuth(env, randomString, requestBody)
  const response = await fetch(`${env.IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'x-iyzi-rnd': randomString, 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })
  const data = await response.json() as any
  if (data.status !== 'success') throw new Error(data.errorMessage ?? 'iyzico hatası')
  return { checkoutFormContent: data.checkoutFormContent, token: data.token }
}

async function buildIyzicoAuth(env: CloudflareBindings, rand: string, body: object): Promise<string> {
  const msg = env.IYZICO_API_KEY + rand + JSON.stringify(body)
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(env.IYZICO_SECRET_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `IYZWSv2 ${btoa(`apiKey:${env.IYZICO_API_KEY}&randomKey:${rand}&signature:${hex}`)}`
}

export { PLANS }
```

---

## PHASE 6 — INGESTION PIPELINE (Queue Consumer)

`apps/ingestion/src/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sources, chunks, ingestionJobs, projects, workspaces } from '../../drizzle/schema'
import { eq, and, sql } from 'drizzle-orm'
import { embedAndStore } from '../../apps/worker/src/services/vectorize'
import { fetchSlackChannel, chunkSlackMessages } from '../../apps/worker/src/services/slack'
import { fetchGmailThreads, fetchGmailThread, extractEmailText } from '../../apps/worker/src/services/gmail'
import { fetchNotionPage, extractNotionText, chunkText } from '../../apps/worker/src/services/notion'
import { parseWhatsAppExport, chunkWaMessages } from '../../apps/worker/src/services/whatsapp'
import { decryptField } from '../../apps/worker/src/utils/crypto'

export type IngestionBindings = {
  DATABASE_URL: string
  ENCRYPTION_KEY: string
  BRIEFR_VECTORIZE: VectorizeIndex
  BRIEFR_AI: Ai
  BRIEFR_R2: R2Bucket
  INGESTION_QUEUE: Queue
}

interface QueueMsg { sourceId: string; projectId: string; triggeredBy: string }

export default {
  async queue(batch: MessageBatch<QueueMsg>, env: IngestionBindings) {
    const db = drizzle(neon(env.DATABASE_URL))
    for (const msg of batch.messages) {
      try {
        await processIngestion(db, env, msg.body)
        msg.ack()
      } catch (err) {
        console.error(`Ingestion hatası ${msg.body.sourceId}:`, err)
        msg.retry()
      }
    }
  }
}

async function processIngestion(db: any, env: IngestionBindings, msg: QueueMsg) {
  const { sourceId, projectId, triggeredBy } = msg

  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1)
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!source || !project) return

  // Job kaydı oluştur
  const [job] = await db.insert(ingestionJobs).values({
    sourceId, projectId, status: 'running', triggeredBy, startedAt: new Date(),
  }).returning()

  await db.update(sources).set({ status: 'syncing', updatedAt: new Date() }).where(eq(sources.id, sourceId))

  let chunksCreated = 0
  let chunksSkipped = 0

  try {
    const config = source.config as any
    const rawChunks = await extractChunks(db, env, source, config)

    for (const raw of rawChunks) {
      // SHA-256 ile dedupe
      const enc = new TextEncoder()
      const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(projectId + raw.content))
      const contentHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

      const [existing] = await db.select({ id: chunks.id }).from(chunks)
        .where(and(eq(chunks.contentHash, contentHash), eq(chunks.projectId, projectId))).limit(1)

      if (existing) { chunksSkipped++; continue }

      const chunkId = crypto.randomUUID()

      // DB'ye kaydet
      await db.insert(chunks).values({
        id: chunkId, sourceId, projectId,
        content: raw.content, contentHash,
        status: 'pending',
        sourceType: source.type,
        sourceName: source.name,
        originalDate: raw.date ? new Date(raw.date) : null,
        author: raw.authors?.join(', ') ?? null,
      })

      // Embed et ve Vectorize'a kaydet
      await embedAndStore({
        env: env as any,
        chunkId,
        content: raw.content,
        namespace: project.vectorNamespace,
        metadata: {
          sourceId,
          sourceType: source.type,
          sourceName: source.name,
          projectId,
          content: raw.content.substring(0, 500),
          originalDate: raw.date,
          author: raw.authors?.join(', '),
        },
      })

      // Chunk durumunu güncelle
      await db.update(chunks).set({ status: 'embedded', embeddingModel: '@cf/baai/bge-m3' })
        .where(eq(chunks.id, chunkId))

      chunksCreated++
    }

    // Source ve proje istatistiklerini güncelle
    await db.update(sources).set({
      status: 'ready',
      chunkCount: sql`${sources.chunkCount} + ${chunksCreated}`,
      lastSyncAt: new Date(),
      nextSyncAt: new Date(Date.now() + source.syncIntervalHours * 60 * 60 * 1000),
      lastError: null, lastErrorAt: null, updatedAt: new Date(),
    }).where(eq(sources.id, sourceId))

    await db.update(projects).set({
      chunkCount: sql`${projects.chunkCount} + ${chunksCreated}`,
      lastActivityAt: new Date(), updatedAt: new Date(),
    }).where(eq(projects.id, projectId))

    // Job'u tamamla
    await db.update(ingestionJobs).set({
      status: 'done', chunksCreated, chunksSkipped, completedAt: new Date(),
    }).where(eq(ingestionJobs.id, job.id))

  } catch (err: any) {
    await db.update(sources).set({
      status: 'error', lastError: err.message, lastErrorAt: new Date(), updatedAt: new Date(),
    }).where(eq(sources.id, sourceId))
    await db.update(ingestionJobs).set({
      status: 'failed', errorMessage: err.message, completedAt: new Date(),
    }).where(eq(ingestionJobs.id, job.id))
    throw err
  }
}

async function extractChunks(db: any, env: IngestionBindings, source: any, config: any) {
  const dk = (val: string) => decryptField(val, env.ENCRYPTION_KEY)

  switch (source.type) {
    case 'slack_channel': {
      const token = await dk(config.accessToken)
      const msgs = await fetchSlackChannel(token, config.channelId)
      return chunkSlackMessages(msgs, config.channelName)
    }
    case 'gmail_label': {
      const token = await dk(config.accessToken)
      const { threads } = await fetchGmailThreads(token, config.labelId, 30)
      const results = []
      for (const t of threads) {
        const full = await fetchGmailThread(token, t.id)
        const extracted = extractEmailText(full)
        results.push({ content: extracted.content, date: extracted.date, authors: extracted.participants })
      }
      return results
    }
    case 'notion_page':
    case 'notion_database': {
      const token = await dk(config.accessToken)
      const blocks = await fetchNotionPage(token, config.pageId)
      const text = extractNotionText(blocks)
      return chunkText(text, 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] }))
    }
    case 'file_upload':
    case 'whatsapp_export': {
      const r2Object = await env.BRIEFR_R2.get(config.r2Key)
      if (!r2Object) return []
      const rawText = await r2Object.text()
      if (source.type === 'whatsapp_export') {
        const msgs = parseWhatsAppExport(rawText)
        return chunkWaMessages(msgs)
      }
      return chunkText(rawText, 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] }))
    }
    case 'manual_note': {
      return chunkText(config.content, 600, 80).map(c => ({ content: c, date: new Date().toISOString(), authors: [] }))
    }
    case 'make_webhook': {
      // Make webhook'tan gelen veri — config.pendingContent ile gelir
      return config.pendingContent
        ? [{ content: config.pendingContent, date: new Date().toISOString(), authors: ['Make.com'] }]
        : []
    }
    default:
      return []
  }
}
```

---

## PHASE 7 — OAUTH ROUTE'LARI

### 7.1 Gmail OAuth

`apps/worker/src/routes/oauth-gmail.ts`:
```typescript
import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { workspaces } from '../../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { encryptField } from '../utils/crypto'

export async function gmailOAuthHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const code = c.req.query('code')
  const state = c.req.query('state') // workspaceId
  if (!code || !state) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=oauth_failed`)

  // Token exchange
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: c.env.GMAIL_CLIENT_ID, client_secret: c.env.GMAIL_CLIENT_SECRET,
      redirect_uri: `${c.env.FRONTEND_URL}/oauth/gmail/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenResponse.json() as any
  if (tokens.error) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=${tokens.error}`)

  const db = drizzle(neon(c.env.DATABASE_URL))
  await db.update(workspaces).set({
    gmailAccessToken: await encryptField(tokens.access_token, c.env.ENCRYPTION_KEY),
    gmailRefreshToken: await encryptField(tokens.refresh_token, c.env.ENCRYPTION_KEY),
    updatedAt: new Date(),
  }).where(eq(workspaces.id, state))

  return c.redirect(`${c.env.FRONTEND_URL}/settings/integrations?connected=gmail`)
}
```

### 7.2 Slack OAuth

`apps/worker/src/routes/oauth-slack.ts`:
```typescript
import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { workspaces } from '../../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { encryptField } from '../utils/crypto'

export async function slackOAuthHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const code = c.req.query('code')
  const state = c.req.query('state') // workspaceId
  if (!code || !state) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=oauth_failed`)

  const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: c.env.SLACK_CLIENT_ID, client_secret: c.env.SLACK_CLIENT_SECRET,
      redirect_uri: `${c.env.FRONTEND_URL}/oauth/slack/callback`,
    }),
  })
  const data = await tokenResponse.json() as any
  if (!data.ok) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=${data.error}`)

  const db = drizzle(neon(c.env.DATABASE_URL))
  await db.update(workspaces).set({
    slackAccessToken: await encryptField(data.access_token, c.env.ENCRYPTION_KEY),
    slackTeamId: data.team?.id,
    updatedAt: new Date(),
  }).where(eq(workspaces.id, state))

  return c.redirect(`${c.env.FRONTEND_URL}/settings/integrations?connected=slack`)
}
```

### 7.3 Notion OAuth

`apps/worker/src/routes/oauth-notion.ts`:
```typescript
import type { Context } from 'hono'
import type { CloudflareBindings } from '../context'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { workspaces } from '../../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { encryptField } from '../utils/crypto'

export async function notionOAuthHandler(c: Context<{ Bindings: CloudflareBindings }>) {
  const code = c.req.query('code')
  const state = c.req.query('state')
  if (!code || !state) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=oauth_failed`)

  const credentials = btoa(`${c.env.NOTION_CLIENT_ID}:${c.env.NOTION_CLIENT_SECRET}`)
  const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code', code,
      redirect_uri: `${c.env.FRONTEND_URL}/oauth/notion/callback`,
    }),
  })
  const data = await tokenResponse.json() as any
  if (data.error) return c.redirect(`${c.env.FRONTEND_URL}/settings?error=${data.error}`)

  const db = drizzle(neon(c.env.DATABASE_URL))
  await db.update(workspaces).set({
    notionAccessToken: await encryptField(data.access_token, c.env.ENCRYPTION_KEY),
    updatedAt: new Date(),
  }).where(eq(workspaces.id, state))

  return c.redirect(`${c.env.FRONTEND_URL}/settings/integrations?connected=notion`)
}
```

---

## PHASE 8 — DURABLE OBJECT (Chat Stream)

`apps/worker/src/durable-objects/chat-stream.ts`:
```typescript
import { DurableObject } from 'cloudflare:workers'

export class ChatStreamDO extends DurableObject {
  private clients = new Map<string, ReadableStreamDefaultController>()

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Client SSE bağlantısı
    if (url.pathname.endsWith('/stream')) {
      const pendingMsgId = url.searchParams.get('msgId')
      if (!pendingMsgId) return new Response('msgId gerekli', { status: 400 })

      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const encoder = new TextEncoder()

      // Controller'ı kaydet
      const controller = { enqueue: (data: string) => writer.write(encoder.encode(data)) } as any
      this.clients.set(pendingMsgId, controller)

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    if (url.pathname === '/chunk') {
      const { pendingMsgId, chunk } = await request.json() as any
      const ctrl = this.clients.get(pendingMsgId)
      if (ctrl) ctrl.enqueue(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
      return new Response('ok')
    }

    if (url.pathname === '/done') {
      const { pendingMsgId, messageId } = await request.json() as any
      const ctrl = this.clients.get(pendingMsgId)
      if (ctrl) {
        ctrl.enqueue(`data: ${JSON.stringify({ type: 'done', messageId })}\n\n`)
        this.clients.delete(pendingMsgId)
      }
      return new Response('ok')
    }

    if (url.pathname === '/error') {
      const { pendingMsgId, error } = await request.json() as any
      const ctrl = this.clients.get(pendingMsgId)
      if (ctrl) {
        ctrl.enqueue(`data: ${JSON.stringify({ type: 'error', error })}\n\n`)
        this.clients.delete(pendingMsgId)
      }
      return new Response('ok')
    }

    return new Response('Not Found', { status: 404 })
  }
}
```

---

## PHASE 9 — FRONTEND

### 9.1 Tailwind v4 CSS Config

`apps/web/src/app.css`:
```css
@import "tailwindcss";

@theme {
  --color-brand-50:  #faf5ff;
  --color-brand-100: #f3e8ff;
  --color-brand-200: #e9d5ff;
  --color-brand-500: #a855f7;
  --color-brand-600: #9333ea;
  --color-brand-700: #7e22ce;
  --color-brand-900: #3b0764;

  --color-surface:   #f8fafc;
  --color-card:      #ffffff;
  --color-border:    #e2e8f0;
  --color-muted:     #94a3b8;
  --color-success:   #22c55e;
  --color-warning:   #f59e0b;
  --color-danger:    #ef4444;

  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;
}
```

### 9.2 Zustand Store

`apps/web/src/lib/store.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: { id: string; email: string; fullName: string; avatarUrl?: string } | null
  workspace: { id: string; name: string; slug: string; plan: string } | null
  setAuth: (token: string, user: AuthState['user'], workspace: AuthState['workspace']) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null, user: null, workspace: null,
      setAuth: (token, user, workspace) => set({ token, user, workspace }),
      clearAuth: () => set({ token: null, user: null, workspace: null }),
    }),
    { name: 'briefr-auth' }
  )
)

interface AppState {
  activeProjectId: string | null
  activeThreadId: string | null
  sidebarOpen: boolean
  setActiveProject: (id: string | null) => void
  setActiveThread: (id: string | null) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectId: null,
  activeThreadId: null,
  sidebarOpen: true,
  setActiveProject: (activeProjectId) => set({ activeProjectId }),
  setActiveThread: (activeThreadId) => set({ activeThreadId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

### 9.3 Chat Streaming Hook

`apps/web/src/hooks/useStream.ts`:
```typescript
import { useCallback, useRef, useState } from 'react'

export function useChatStream(workerUrl: string) {
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)

  const startStream = useCallback((threadId: string, pendingMsgId: string) => {
    setStreaming(true)
    setStreamContent('')

    const url = `${workerUrl}/chat/stream/${threadId}?msgId=${pendingMsgId}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'chunk') {
        setStreamContent(prev => prev + data.content)
      } else if (data.type === 'done' || data.type === 'error') {
        setStreaming(false)
        es.close()
      }
    }
    es.onerror = () => { setStreaming(false); es.close() }
  }, [workerUrl])

  const cancelStream = useCallback(() => {
    eventSourceRef.current?.close()
    setStreaming(false)
  }, [])

  return { streaming, streamContent, startStream, cancelStream }
}
```

### 9.4 Sayfa Yapısı — Tüm Sayfalar Tam Implement Edilecek

**`/login`** — E-posta + şifre, KVKK linki, "Hesabınız yok mu?" linki

**`/register`** — Ad soyad, e-posta, şifre, workspace adı, KVKK onay zorunlu checkbox

**`/onboarding`** — 3 adımlı sihirbaz:
1. İlk proje oluştur (isim, müşteri adı, emoji)
2. Kaynak seç (Slack/Gmail/Notion/Dosya/Manuel not)
3. "Briefr hazır!" — ilk sohbete yönlendir

**`/dashboard`** — 
- Proje kartları (emoji, isim, müşteri, kaynak sayısı, son aktivite)
- "Yeni Proje" butonu
- Workspace istatistikleri (toplam kaynak, chunk, sohbet)

**`/projects/:id`** — 2 panel:
- Sol: Kaynak listesi + "Kaynak Ekle" butonu + ingestion durumu
- Sağ: Chat arayüzü (thread listesi + mesaj akışı + input)

**`/projects/:id/memory`** —
- Semantic arama (query input + sonuç listesi)
- Chunk önizleme (kaynak, tarih, yazar, içerik)
- Kaynak tipi filtresi

**`/settings/integrations`** —
- Slack: "Slack ile Bağlan" OAuth butonu + bağlı kanal sayısı
- Gmail: "Gmail ile Bağlan" OAuth butonu + bağlı label sayısı
- Notion: "Notion ile Bağlan" OAuth butonu + bağlı sayfa sayısı
- Make.com: Webhook URL kopyalama
- Tüm bağlantılar bağlı/bağlı değil durumu gösterir

**`/settings/workspace`** — İsim, logo, üye listesi, üye davet formu, rol yönetimi

**`/billing`** —
- Mevcut plan (Free/Starter/Pro) + özellik listesi
- Aylık/yıllık toggle (%17 indirim göster)
- Plan karşılaştırma kartları: Free (3 proje, 500 chunk/ay), Starter ₺149/ay (20 proje, 5000 chunk/ay), Pro ₺399/ay (sınırsız, 50000 chunk/ay)
- iyzico CheckoutForm enjeksiyonu
- Kullanım çubuğu (bu ay chunk, sohbet)
- KVKK: "Tüm verilerimi sil" butonu (şifre onaylı)

---

## PHASE 10 — DEPLOYMENT

### 10.1 wrangler.toml

```toml
# API Worker
[[workers]]
name = "briefr-api"
main = "apps/worker/src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[workers.durable_objects.bindings]]
name = "CHAT_STREAM_DO"
class_name = "ChatStreamDO"

[[workers.migrations]]
tag = "v1"
new_classes = ["ChatStreamDO"]

[[workers.vectorize]]
binding = "BRIEFR_VECTORIZE"
index_name = "briefr-memory"

[[workers.ai]]
binding = "BRIEFR_AI"

[[workers.kv_namespaces]]
binding = "BRIEFR_KV"
id = "YOUR_KV_ID"

[[workers.r2_buckets]]
binding = "BRIEFR_R2"
bucket_name = "briefr-uploads"

[[workers.queues.producers]]
binding = "INGESTION_QUEUE"
queue = "briefr-ingestion"

# Ingestion Queue Consumer
[[workers]]
name = "briefr-ingestion"
main = "apps/ingestion/src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[workers.queues.consumers]]
queue = "briefr-ingestion"
max_batch_size = 5
max_batch_timeout = 10
max_retries = 3
dead_letter_queue = "briefr-ingestion-dlq"

[[workers.vectorize]]
binding = "BRIEFR_VECTORIZE"
index_name = "briefr-memory"

[[workers.ai]]
binding = "BRIEFR_AI"

[[workers.r2_buckets]]
binding = "BRIEFR_R2"
bucket_name = "briefr-uploads"
```

### 10.2 Vectorize Index Oluşturma

```bash
# BGE-M3 için 768 boyut, cosine similarity
wrangler vectorize create briefr-memory \
  --dimensions=768 \
  --metric=cosine

# Queue oluştur
wrangler queues create briefr-ingestion
wrangler queues create briefr-ingestion-dlq

# KV oluştur
wrangler kv namespace create BRIEFR_KV

# R2 oluştur
wrangler r2 bucket create briefr-uploads

# DB migration
pnpm drizzle-kit push
```

### 10.3 Şifreleme Util

`apps/worker/src/utils/crypto.ts`:
```typescript
// AES-256-GCM ile field şifreleme (OAuth token'ları için)
export async function encryptField(value: string, hexKey: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', hexToBytes(hexKey), { name: 'AES-GCM' }, false, ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(value))
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptField(encrypted: string, hexKey: string): Promise<string> {
  const combined = new Uint8Array(
    atob(encrypted).split('').map(c => c.charCodeAt(0))
  )
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const key = await crypto.subtle.importKey(
    'raw', hexToBytes(hexKey), { name: 'AES-GCM' }, false, ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}
```

---

## TAMAMLAMA KONTROL LİSTESİ

### Backend
- [ ] Monorepo kurulum (pnpm + turbo)
- [ ] packages/types — tüm Zod şemaları
- [ ] Drizzle schema + Neon migration
- [ ] Auth (register/login/logout/me/deleteAccount) + PBKDF2
- [ ] Workspace router (get/update/inviteMember/removeMember)
- [ ] Project router (list/get/create/update/archive/purgeMemory)
- [ ] Source router (list/create/delete/resync/ingestionHistory)
- [ ] Chat router (listThreads/createThread/getMessages/sendMessage/renameThread/deleteThread)
- [ ] Memory router (search/stats/recentChunks)
- [ ] Billing router (currentPlan/initPayment/callback/usage)
- [ ] Analytics router (workspace ve proje istatistikleri)
- [ ] Gmail OAuth route + token exchange
- [ ] Slack OAuth route + token exchange
- [ ] Notion OAuth route + token exchange
- [ ] Slack webhook handler (Notion event push)
- [ ] Make.com webhook handler (secret doğrulama)
- [ ] iyzico callback handler (POST + GET)
- [ ] Dosya upload handler (R2)
- [ ] AES-256-GCM field şifreleme util
- [ ] Ingestion queue consumer (tüm source tipleri)
- [ ] Slack ingestion (fetchSlackChannel + chunkSlackMessages)
- [ ] Gmail ingestion (fetchGmailThreads + extractEmailText)
- [ ] Notion ingestion (fetchNotionPage + extractNotionText)
- [ ] WhatsApp export parser
- [ ] Dosya ingestion (sliding window chunking)
- [ ] Manuel not ingestion
- [ ] SHA-256 dedupe (aynı chunk iki kez embed edilmez)
- [ ] Vectorize embedAndStore (BGE-M3, 768 dim)
- [ ] Vectorize searchMemory (namespace filtreli)
- [ ] Vectorize deleteSourceChunks
- [ ] DIFY streaming chat + DB kayıt
- [ ] ChatStreamDO (SSE proxy)
- [ ] KVKK soft-delete + cron hard-delete

### Frontend
- [ ] Tailwind v4 CSS-first @theme config
- [ ] Zustand store (auth + app state)
- [ ] tRPC react-query client
- [ ] Chat streaming hook (SSE EventSource)
- [ ] Login sayfası
- [ ] Register sayfası (KVKK checkbox zorunlu)
- [ ] Onboarding sihirbazı (3 adım)
- [ ] Dashboard (proje kartları)
- [ ] Project detail (kaynak panel + chat panel)
- [ ] Memory search sayfası
- [ ] Integrations sayfası (OAuth butonları + durum)
- [ ] Workspace settings (üye yönetimi)
- [ ] Billing sayfası (plan kartları + iyzico + kullanım)
- [ ] Toast notification sistemi
- [ ] Responsive layout + mobile hamburger

### Altyapı
- [ ] wrangler.toml (api + ingestion worker)
- [ ] Vectorize index (briefr-memory, 768 dim, cosine)
- [ ] Queue (briefr-ingestion + DLQ)
- [ ] KV namespace
- [ ] R2 bucket
- [ ] Tüm .dev.vars dokümante edilmiş

---

## AGENT UYGULAMA KURALLARI

1. **Raw SQL yasak** — sadece Drizzle ORM
2. **bcrypt yasak** — PBKDF2 (Web Crypto API)
3. **Tailwind v4** — JS config yok, sadece app.css içinde `@theme {}`
4. **tRPC v11** — `@hono/trpc-server` adapter
5. **Durable Object** — `cloudflare:workers` paketi → `DurableObject` extend
6. **OAuth token'lar** — DB'ye yazmadan önce AES-256-GCM ile şifrele, okurken çöz
7. **Vectorize namespace** — her proje kendi namespace'ini kullanır: `project.vectorNamespace`
8. **Embedding modeli** — `@cf/baai/bge-m3` (768 dim, Türkçe dahil çok dilli)
9. **Dedupe** — `SHA-256(projectId + content)` ile chunk hash'i, aynı chunk iki kez embed edilmez
10. **DIFY streaming** — `response_mode: 'streaming'` + SSE parse + DO üzerinden client'a ilet
11. **R2 dosya yolu** — `uploads/{workspaceId}/{projectId}/{uuid}.{ext}`
12. **iyzico callback** — hem POST hem GET handle edilmeli; basketId'den workspaceId çıkarılır
13. **Make.com webhook** — URL'de `secret` parametresi ile doğrulama
14. **KVKK** — deleteAccount soft-delete yapar; haftalık cron hard-delete uygular; purgeMemory Vectorize + DB chunk'larını siler
15. **Plan limitleri** — her mutation'da workspace.chunksThisMonth ve workspace.plan kontrolü yap; limiti aşınca hata fırlat

