import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { trpc } from '../../lib/trpc'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function OnboardingWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [projectName, setProjectName] = useState('')
  const [clientName, setClientName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState('')

  const { workspace } = useAuth()
  const navigate = useNavigate()

  const createProjectMutation = trpc.project.create.useMutation()
  const createSourceMutation = trpc.source.create.useMutation()

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || !workspace?.id) return

    try {
      const project = await createProjectMutation.mutateAsync({
        workspaceId: workspace.id,
        name: projectName,
        clientName: clientName || undefined,
        emoji,
      })
      setCreatedProjectId(project.id)
      setStep(2)
    } catch { /* empty */ }
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createdProjectId) return

    if (noteContent.trim()) {
      try {
        await createSourceMutation.mutateAsync({
          projectId: createdProjectId,
          type: 'manual_note',
          name: 'İlk Proje Notu',
          config: { content: noteContent },
        })
      } catch { /* empty */ }
    }
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8">
        {/* Step indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-colors ${
                  step === s
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : step > s
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-medium ${step === s ? 'text-slate-200' : 'text-slate-500'}`}>
                {s === 1 ? 'İlk Proje' : s === 2 ? 'Veri Ekle' : 'Hazır!'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Create Project */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">1. Adım: İlk Projenizi Oluşturun</h3>
              <p className="text-sm text-slate-400">Takip ettiğiniz müşteri veya iç projenin bilgilerini girin.</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-16">
                  <Input
                    label="Emoji"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    maxLength={4}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="Proje Adı"
                    placeholder="E-Ticaret Yenileme Projesi"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Input
                label="Müşteri / Marka Adı (Opsiyonel)"
                placeholder="Acme Corp."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full justify-center" isLoading={createProjectMutation.isPending}>
              Devam Et <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Step 2: Add First Source */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">2. Adım: İlk Hafıza Notunuzu Ekleyin</h3>
              <p className="text-sm text-slate-400">
                Proje hakkındaki başlangıç notlarınızı veya brief metninizi buraya yapıştırın.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Başlangıç Notu / Brief</label>
              <textarea
                rows={6}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Örn: Bu projede hedef 2 ay içinde landing page tamamlamak. Bütçe $5,000..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)}>
                Şimdilik Atla
              </Button>
              <Button type="submit" className="flex-1" isLoading={createSourceMutation.isPending}>
                Hafızaya Kaydet <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Complete Ready */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-100">Briefr Hafızanız Hazır! 🧠</h3>
              <p className="text-sm text-slate-400">
                Projeniz başarıyla oluşturuldu. Hemen sohbet etmeye ve Slack, Gmail, Notion bağlantılarınızı kurmaya başlayabilirsiniz.
              </p>
            </div>

            <Button
              onClick={() => navigate(createdProjectId ? `/projects/${createdProjectId}` : '/dashboard')}
              className="w-full justify-center"
            >
              Proje Detayına Git →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
