# ⚡ Briefr

**Briefr**, ekip hafızanızı yapay zeka ile sohbet edilebilir hale getiren tam yığın (full-stack) bir SaaS platformudur. Slack kanallarınızı, Gmail yazışmalarınızı, Notion sayfalarınızı ve manuel notlarınızı bir araya getirerek projeye özel bir bilgi tabanı oluşturur ve bu bilgi tabanıyla doğrudan sohbet etmenizi sağlar.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Mimari Yapı](#-mimari-yapı)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Geliştirme](#-geliştirme)
- [Veritabanı Şeması](#-veritabanı-şeması)
- [API Yapısı](#-api-yapısı)
- [Dağıtım](#-dağıtım)

---

## ✨ Özellikler

### 🧠 Yapay Zeka Destekli Sohbet
- Proje kaynaklarınıza dayalı bağlamsal AI yanıtları
- Dify Chatflow entegrasyonu (SSE akışı ile gerçek zamanlı yanıt)
- Vektör arama (BGE-M3 embedding modeli) ile anlam temelli içerik getirme
- Sohbet geçmişi ve çoklu sohbet oturumu desteği

### 📂 Veri Kaynakları
| Kaynak Türü | Açıklama |
|---|---|
| **Slack** | Kanal mesajları OAuth ile otomatik senkronize edilir |
| **Gmail** | Etiket bazlı e-posta alımı |
| **Notion** | Sayfa ve veritabanı içerikleri |
| **Dosya Yükleme** | PDF, DOCX, TXT formatları |
| **Manuel Not** | Doğrudan metin girişi |
| **Make Webhook** | Harici otomasyon entegrasyonu |
| **WhatsApp Dışa Aktarım** | Sohbet geçmişi yükleme |

### 📊 AI & Token Kullanım Takibi
- Proje bazlı token harcama raporları
- Dify metrik takibi (Girdi/Çıktı token, Toplam maliyet, İlk yanıt hızı, Üretim süresi)
- Kullanıcı dostu Türkçe arayüz

### 👥 Çok Kiracılı (Multi-Tenant) Yapı
- Çalışma alanı (workspace) bazlı proje yönetimi
- Rol tabanlı erişim kontrolü (Owner, Admin, Member, Viewer)
- Üyelik daveti sistemi

### 💳 Abonelik & Faturalandırma
- İyzico ödeme altyapısı ile Türkiye'ye özel ödeme sistemi
- Ücretsiz / Starter / Pro plan desteği
- Aylık kullanım kotası takibi (token, chunk, depolama)

### 🔐 Güvenlik
- KVKK uyumlu kullanıcı onayı
- Şifreli oturum yönetimi (Bearer token)
- E-posta doğrulama akışı
- Şifre sıfırlama (Resend API)

---

## 🛠️ Teknoloji Yığını

### Frontend (`apps/web`)
| Teknoloji | Kullanım Amacı |
|---|---|
| **React 19** | UI çerçevesi |
| **TypeScript** | Tip güvenliği |
| **Vite** | Build ve geliştirme sunucusu |
| **React Router v7** | Sayfa yönlendirmesi |
| **tRPC + TanStack Query** | Type-safe API iletişimi |
| **Vanilla CSS** | Özel tasarım sistemi (glassmorphism + dark mode) |
| **Lucide React** | İkon kütüphanesi |
| **Zustand** | Global state yönetimi |

### Backend (`apps/worker`)
| Teknoloji | Kullanım Amacı |
|---|---|
| **Cloudflare Workers** | Edge çalışma zamanı |
| **Hono** | HTTP çerçevesi |
| **tRPC** | Type-safe RPC API |
| **Drizzle ORM** | Veritabanı ORM |
| **Neon PostgreSQL** | Sunucu taraflı veritabanı |
| **Cloudflare Vectorize** | Vektör veritabanı |
| **Cloudflare AI** | Embedding modeli (BGE-M3) |
| **Cloudflare R2** | Nesne depolama |
| **Cloudflare KV** | Anahtar-değer deposu |
| **Durable Objects** | Sohbet akışı koordinasyonu |

### Veri İşleme (`apps/ingestion`)
| Teknoloji | Kullanım Amacı |
|---|---|
| **Cloudflare Queues** | Asenkron veri işleme kuyruğu |
| **BGE-M3** | Metin embedding |
| **Cloudflare Workers** | Chunk'lama ve vektör yükleme |

### Veritabanı & Şema
- **Drizzle Kit** ile şema yönetimi ve migrasyon
- **Neon PostgreSQL** (serverless, havuzlu bağlantı)

---

## 🏗️ Mimari Yapı

```
briefr/
├── apps/
│   ├── web/               # React SPA (Cloudflare Pages)
│   ├── worker/            # tRPC API + Business Logic (Cloudflare Workers)
│   └── ingestion/         # Veri işleme pipeline (Cloudflare Queues)
├── packages/
│   └── types/             # Paylaşımlı TypeScript tipleri
├── drizzle/
│   ├── schema.ts          # Veritabanı şeması
│   └── migrations/        # SQL migrasyon dosyaları
├── drizzle.config.ts
├── turbo.json             # Turborepo build grafiği
└── pnpm-workspace.yaml    # Monorepo çalışma alanları
```

### Veri Akışı

```
Kullanıcı Sorusu
    │
    ▼
[Worker] sendMessage tRPC
    │
    ├─► Cloudflare Vectorize (benzer chunk arama)
    │         │ yok ise PostgreSQL fallback
    │
    ├─► Sistem Prompt oluştur (proje bağlamı + kaynaklar)
    │
    ▼
[Dify API] Chatflow SSE Akışı
    │
    ├─► Token'lar gerçek zamanlı frontend'e gönderilir
    │
    ▼
[Worker] Yanıt + Dify Metrikleri PostgreSQL'e kaydedilir
```

---

## 🚀 Kurulum

### Gereksinimler

- **Node.js** ≥ 18
- **pnpm** ≥ 11 (`npm install -g pnpm`)
- **Cloudflare** hesabı (Workers, Pages, Vectorize, KV, R2, Queues, AI)
- **Neon PostgreSQL** veritabanı
- **Dify** hesabı (Chatflow uygulaması oluşturulmuş)
- **Resend** hesabı (e-posta gönderimi)
- **İyzico** hesabı (ödeme, isteğe bağlı)

### 1. Depoyu Klonlayın

```bash
git clone https://github.com/<kullanici-adiniz>/briefr.git
cd briefr
```

### 2. Bağımlılıkları Yükleyin

```bash
pnpm install
```

### 3. Ortam Değişkenlerini Ayarlayın

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# .dev.vars dosyasını düzenleyin
```

### 4. Veritabanını Oluşturun

```bash
# Şemayı Neon PostgreSQL'e uygula
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

### 5. Geliştirme Sunucusunu Başlatın

```bash
make dev
# veya ayrı ayrı:
# pnpm --filter @briefr/worker dev
# pnpm --filter @briefr/web dev
```

Frontend: `http://localhost:5173`
Worker API: `http://localhost:8787`

---

## 🔑 Ortam Değişkenleri

`apps/worker/.dev.vars` dosyasına aşağıdaki değişkenleri ekleyin:

```env
# Veritabanı
DATABASE_URL="postgresql://..."

# Dify AI
DIFY_API_KEY="app-..."
DIFY_API_URL=https://api.dify.ai/v1
DIFY_CHAT_APP_ID="..."

# E-posta (Resend)
RESEND_API_KEY="re_..."

# Ödeme (İyzico)
IYZICO_API_KEY="..."
IYZICO_SECRET_KEY="..."
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Slack Entegrasyonu
SLACK_BOT_TOKEN="xoxb-..."
SLACK_CLIENT_ID="..."
SLACK_CLIENT_SECRET="..."

# Gmail Entegrasyonu
GMAIL_CLIENT_ID="..."
GMAIL_CLIENT_SECRET="..."

# Şifreleme
ENCRYPTION_KEY="64 karakter hex string"

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

---

## 💻 Geliştirme

### Kullanılabilir Komutlar

```bash
# Tüm uygulamaları geliştirme modunda başlat
make dev

# Yalnızca web'i derle
make build-web

# Tip kontrolü (tüm paketler)
npx pnpm -r typecheck

# Veritabanı şemasını canlıya uygula
npm run db:push

# Worker'ı canlıya deploy et
npx wrangler deploy --config apps/worker/wrangler.toml

# Web'i Cloudflare Pages'e deploy et
npx wrangler pages deploy apps/web/dist
```

### Monorepo Yapısı

Proje **pnpm workspaces** + **Turborepo** ile yönetilen bir monorepo'dur. Build bağımlılıkları `turbo.json` ile tanımlanmıştır.

---

## 🗃️ Veritabanı Şeması

| Tablo | Açıklama |
|---|---|
| `users` | Kullanıcı hesapları |
| `sessions` | Oturum token'ları |
| `workspaces` | Çalışma alanları (kiracı birimi) |
| `workspace_members` | Üyelik & roller |
| `projects` | Projeler (bilgi tabanı birimi) |
| `sources` | Veri kaynakları (Slack, Gmail vb.) |
| `chunks` | Vektör embedding için metin parçaları |
| `threads` | Sohbet oturumları |
| `messages` | Sohbet mesajları + Dify metrikleri |
| `ingestion_jobs` | Veri işleme iş kayıtları |

---

## 🔌 API Yapısı

Tüm API endpoint'leri **tRPC** ile tip güvenli olarak tanımlanmıştır:

| Router | Prosedürler |
|---|---|
| `auth` | register, login, logout, verifyEmail, forgotPassword, resetPassword |
| `workspace` | get, update, members |
| `project` | list, create, update, archive |
| `source` | list, create, sync, delete |
| `chat` | listThreads, createThread, getMessages, sendMessage, renameThread, deleteThread |
| `analytics` | workspaceOverview, tokenUsage |
| `billing` | getPlans, subscribe, cancel |

---

## 🌐 Dağıtım

### Cloudflare Pages (Frontend)

```bash
make build-web
npx wrangler pages deploy apps/web/dist --project-name briefr
```

### Cloudflare Workers (Backend)

```bash
npx wrangler deploy --config apps/worker/wrangler.toml
```

### Gerekli Cloudflare Kaynakları

Canlıya almadan önce aşağıdaki Cloudflare kaynaklarının `wrangler.toml`'da tanımlı olduğundan emin olun:

- **Vectorize Index** (`BRIEFR_VECTORIZE`) — BGE-M3 1024 boyut, cosine metric
- **KV Namespace** (`BRIEFR_KV`)
- **R2 Bucket** (`BRIEFR_R2`)
- **Queue** (`INGESTION_QUEUE`)
- **Durable Object** (`CHAT_STREAM_DO`)
- **AI Binding** (`BRIEFR_AI`)

---

## 📄 Lisans

Bu proje **MIT + Commons Clause** lisansı altında yayımlanmaktadır.

- ✅ Kullanma, değiştirme ve fork etme serbesttir.
- ❌ Yazılımın satılması, kiralanması veya üçüncü şahıslara ticari amaçla dağıtılması **yasaktır**.

Detaylar için [LICENSE](./LICENSE) dosyasına bakınız.

---

<div align="center">
  <strong>Briefr</strong> — Ekip hafızanızı yapay zeka ile konuşturun.
</div>
