'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  userEmotion: string;
  keywords: string[];
  createdAt: string;
}

interface DiaryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DiaryEntry | null;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (entryId: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
}

const emotionLabels = {
  happy: { emoji: '😊', name: '행복', color: 'text-emotion-happy' },
  sad: { emoji: '😢', name: '슬픔', color: 'text-emotion-sad' },
  angry: { emoji: '😡', name: '화남', color: 'text-emotion-angry' },
  peaceful: { emoji: '😌', name: '평온', color: 'text-emotion-peaceful' },
  unrest: { emoji: '😨', name: '불안', color: 'text-emotion-unrest' },
};

export function DiaryDetailModal({
  isOpen,
  onClose,
  entry,
  onEdit,
  onDelete,
  onNavigate,
  hasPrev,
  hasNext,
}: DiaryDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  if (!isOpen || !entry) return null;

  const handleEdit = () => {
    if (isEditing) {
      // 수정 완료
      onEdit({
        ...entry,
        title: editedTitle,
        content: editedContent,
      });
      setIsEditing(false);
    } else {
      // 수정 모드 시작
      setEditedTitle(entry.title);
      setEditedContent(entry.content);
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        '정말로 이 글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다.',
      )
    ) {
      onDelete(entry.id);
      onClose();
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(entry.title);
    setEditedContent(entry.content);
  };

  const emotion =
    emotionLabels[entry.userEmotion as keyof typeof emotionLabels];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 모달 헤더 - 고정 */}
        <div className="bg-gradient-to-r from-sage-20 to-ivory-cream px-6 py-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-h3 font-bold text-text-primary">
                {formatDate(entry.createdAt)}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary hover:bg-background-hover"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 모달 본문 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 감정 및 키워드 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 감정 섹션 */}
            <div className="bg-background-secondary rounded-lg p-4 border border-border-subtle">
              <h3 className="text-body font-semibold text-text-primary mb-3 flex items-center">
                <span className="text-sage-70 mr-2">💭</span>
                감정
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{emotion?.emoji}</span>
                <div>
                  <p className={`text-body font-medium ${emotion?.color}`}>
                    {emotion?.name}
                  </p>
                  <p className="text-body-small text-text-secondary">100%</p>
                </div>
              </div>
            </div>

            {/* 키워드 섹션 */}
            <div className="bg-background-secondary rounded-lg p-4 border border-border-subtle">
              <h3 className="text-body font-semibold text-text-primary mb-3 flex items-center">
                <span className="text-sage-70 mr-2">🏷️</span>
                키워드
              </h3>
              <div className="flex flex-wrap gap-2">
                {entry.keywords && entry.keywords.length > 0 ? (
                  entry.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-sage-20 text-sage-100 rounded-full text-body-small font-medium border border-sage-30"
                    >
                      #{keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-body-small text-text-secondary">
                    키워드가 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 제목 섹션 */}
          <div className="bg-background-secondary rounded-lg p-4 border border-border-subtle">
            <h3 className="text-body font-semibold text-text-primary mb-3 flex items-center">
              <span className="text-sage-70 mr-2">📝</span>
              제목
            </h3>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 focus:border-sage-50 bg-background-primary text-text-primary"
                placeholder="제목을 입력하세요"
              />
            ) : (
              <p className="text-body text-text-primary font-medium">
                {entry.title || '제목이 없습니다'}
              </p>
            )}
          </div>

          {/* 본문 섹션 */}
          <div className="bg-background-secondary rounded-lg p-4 border border-border-subtle min-h-[300px]">
            <h3 className="text-body font-semibold text-text-primary mb-3 flex items-center">
              <span className="text-sage-70 mr-2">📖</span>
              본문
            </h3>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 focus:border-sage-50 bg-background-primary text-text-primary resize-none"
                placeholder="글 내용을 입력하세요"
              />
            ) : (
              <div className="min-h-[250px] bg-background-primary rounded-lg p-4 border border-border-subtle">
                <p className="text-body text-text-primary leading-relaxed whitespace-pre-wrap">
                  {entry.content || '내용이 없습니다'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 모달 하단 - 고정 */}
        <div className="bg-background-primary px-6 py-4 border-t border-border-subtle flex-shrink-0">
          {/* 탐색 버튼 */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('prev')}
              disabled={!hasPrev}
              className={`p-2 rounded-full border border-border-subtle hover:bg-background-hover ${
                hasPrev
                  ? 'text-text-primary hover:text-sage-70'
                  : 'text-text-secondary cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleEdit}
                    className="bg-sage-50 hover:bg-sage-60 text-sage-100 border border-sage-60"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    저장
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="text-text-secondary hover:text-text-primary hover:bg-background-hover"
                  >
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleEdit}
                    className="bg-sage-50 hover:bg-sage-60 text-sage-100 border border-sage-60"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={!hasNext}
              className={`p-2 rounded-full border border-border-subtle hover:bg-background-hover ${
                hasNext
                  ? 'text-text-primary hover:text-sage-70'
                  : 'text-text-secondary cursor-not-allowed'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
