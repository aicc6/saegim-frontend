'use client';

import { ConfirmModal as UnifiedConfirmModal } from '@/components/ui/modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'warning' | 'danger';
  isLoading?: boolean;
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'warning',
  isLoading = false,
}: ConfirmModalProps) => {
  return (
    <UnifiedConfirmModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={title}
      message={message}
      type={variant === 'danger' ? 'danger' : 'warning'}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      size="sm"
    />
  );
};

export default ConfirmModal;
