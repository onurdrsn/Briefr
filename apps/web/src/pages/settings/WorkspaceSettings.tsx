import React, { useState } from 'react'
import { Users, UserPlus, Shield, Trash2, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { trpc } from '../../lib/trpc'
import { Header } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

export function WorkspaceSettings() {
  const { workspace } = useAuth()
  const [name, setName] = useState(workspace?.name || '')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [successMsg, setSuccessMsg] = useState('')
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)

  const workspaceQuery = trpc.workspace.get.useQuery(
    { id: workspace?.id! },
    { enabled: !!workspace?.id }
  )

  const membersQuery = trpc.workspace.listMembers.useQuery(
    { workspaceId: workspace?.id! },
    { enabled: !!workspace?.id }
  )

  const updateWsMutation = trpc.workspace.update.useMutation({
    onSuccess: () => {
      setSuccessMsg('Çalışma alanı güncellendi.')
      setTimeout(() => setSuccessMsg(''), 3000)
    },
  })

  const inviteMutation = trpc.workspace.inviteMember.useMutation({
    onSuccess: () => {
      setIsInviteOpen(false)
      setInviteEmail('')
      membersQuery.refetch()
    },
  })

  const removeMemberMutation = trpc.workspace.removeMember.useMutation({
    onSuccess: () => {
      setDeletingMemberId(null)
      membersQuery.refetch()
    },
  })

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspace?.id) return
    updateWsMutation.mutate({
      id: workspace.id,
      name,
    })
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspace?.id || !inviteEmail.trim()) return
    inviteMutation.mutate({
      workspaceId: workspace.id,
      data: {
        email: inviteEmail,
        role: inviteRole,
      },
    })
  }

  const handleConfirmRemoveMember = () => {
    if (workspace?.id && deletingMemberId) {
      removeMemberMutation.mutate({
        workspaceId: workspace.id,
        memberId: deletingMemberId,
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Header title="Çalışma Alanı Ayarları" />

      <main className="p-8 space-y-8 max-w-4xl mx-auto w-full">
        {/* Workspace Info Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Çalışma Alanı Bilgileri</h3>
              <p className="text-xs text-slate-400">Ajansınızın genel profilini yönetin</p>
            </div>
            {successMsg && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <Check className="w-3.5 h-3.5" /> {successMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Çalışma Alanı Adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={updateWsMutation.isPending}>
                Kaydet
              </Button>
            </div>
          </form>
        </div>

        {/* Team Members List */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Ekip Üyeleri</h3>
              <p className="text-xs text-slate-400">Çalışma alanına erişimi olan kişilerin rolleri</p>
            </div>
            <Button onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="w-4 h-4" />
              <span>Üye Davet Et</span>
            </Button>
          </div>

          <div className="space-y-3">
            {membersQuery.data?.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                    {item.user.fullName?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{item.user.fullName}</h4>
                    <p className="text-xs text-slate-400">{item.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="purple">{item.role}</Badge>
                  <button
                    onClick={() => setDeletingMemberId(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Üyeyi Çıkar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Invite Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Yeni Ekip Üyesi Davet Et">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="E-posta Adresi"
            type="email"
            placeholder="colleague@ajans.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Rol</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="admin">Admin (Tam yetki)</option>
              <option value="member">Member (Proje oluşturabilir ve düzenleyebilir)</option>
              <option value="viewer">Viewer (Sadece okuma yetkisi)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
              İptal
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending}>
              Davet Gönder →
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingMemberId}
        onClose={() => setDeletingMemberId(null)}
        onConfirm={handleConfirmRemoveMember}
        isLoading={removeMemberMutation.isPending}
        title="Ekip Üyesini Çıkar"
        description="Bu kişiyi çalışma alanınızdan çıkarmak istediğinize emin misiniz? Çalışma alanına ve projelere erişimi derhal sonlandırılacaktır."
        confirmText="Evet, Üyeyi Çıkar"
      />
    </div>
  )
}
