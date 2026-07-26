import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Alert } from './Alert'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Silme İşlemi Onayı',
  description = 'Bu veriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ilgili tüm veriler kalıcı olarak silinecektir.',
  confirmText = 'Evet, Sil',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <Alert variant="danger" title="Dikkat: Kalıcı Silme Uyarısı">
          {description}
        </Alert>

        <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300">
            <p className="font-semibold text-slate-100 mb-0.5">Onayınız Gerekmektedir</p>
            <p className="text-slate-400">Silme işlemini gerçekleştirmek için aşağıdaki butona tıklayın.</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            İptal
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
