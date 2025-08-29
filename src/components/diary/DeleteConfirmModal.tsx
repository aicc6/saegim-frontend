'use client';

import { Trash2, AlertTriangle } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!isLoading ? onClose : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isLoading) {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="모달 닫기"
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-background-secondary rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-border-subtle">
        {/* 아이콘과 제목 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-h4 font-semibold text-text-primary">
              다이어리 삭제 확인
            </h3>
          </div>
        </div>

        {/* 메시지 */}
        <div className="mb-6 space-y-3">
          <p className="text-body text-text-secondary">
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
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
            <div className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">주의사항:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>삭제된 다이어리는 복구할 수 없습니다</li>
                  <li>포함된 모든 이미지도 함께 삭제됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-sage-10 rounded-xl transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                삭제
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
