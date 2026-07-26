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
export const VerifyEmailSchema = z.object({
  code: z.string().length(6),
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
export const UpdateProjectSchema = CreateProjectSchema.omit({ workspaceId: true }).partial()

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
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  teamId: z.string().optional(),
  accessToken: z.string().optional(), // encrypted at rest
  webhookUrl: z.string().url().optional(), // Slack Incoming Webhook URL
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
export type UpdateProject = z.infer<typeof UpdateProjectSchema>
export type CreateSource = z.infer<typeof CreateSourceSchema>
export type SendMessage = z.infer<typeof SendMessageSchema>
export type SearchMemory = z.infer<typeof SearchMemorySchema>
export type TopUp = z.infer<typeof TopUpSchema>
