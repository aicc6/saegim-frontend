'use client';

import { useModal } from '@/hooks/use-modal';
import { AlertModal, ConfirmModal } from '@/components/ui/enhanced-modal';

export function ModalProvider() {
  const { alertModal, confirmModal, closeAlert, closeConfirm } = useModal();

  return (
    <>
      {/* Global Alert Modal */}
      <AlertModal
        open={alertModal.open}
        onOpenChange={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText={alertModal.confirmText}
        onConfirm={alertModal.onConfirm}
      />

      {/* Global Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onOpenChange={closeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        isLoading={confirmModal.isLoading}
      />
    </>
  );
}
