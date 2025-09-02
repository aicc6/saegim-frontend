'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/enhanced-modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  diaryTitle?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  diaryTitle,
  isLoading = false,
}: DeleteConfirmModalProps) {
  const message = (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        {diaryTitle ? (
          <>
            <span className="font-medium text-text-primary">
              &quot;{diaryTitle}&quot;
            </span>{' '}
            다이어리를 정말 삭제하시겠습니까?
          </>
        ) : (
          '이 다이어리를 정말 삭제하시겠습니까?'
        )}
      </p>
      <div className="bg-emotion-angry-bg border border-red-200 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <Trash2 className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
          <div className="text-sm text-text-primary">
            <p className="font-medium mb-1">주의사항:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>삭제된 다이어리는 복구할 수 없습니다</li>
              <li>포함된 모든 이미지도 함께 삭제됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ConfirmModal
      open={isOpen}
      onOpenChange={onClose}
      title="다이어리 삭제 확인"
      message={message}
      confirmText="삭제"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onClose}
      type="danger"
      isLoading={isLoading}
    />
  );
}
