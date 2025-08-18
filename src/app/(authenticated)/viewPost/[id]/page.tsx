'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDiaryStore } from '@/stores/diary';
import { Button } from '@/components/ui/custom/Button';
import { formatDate } from '@/lib/utils';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  userEmotion: string;
  keywords: string[];
  createdAt: string;
}

const emotionLabels = {
  happy: { emoji: '😊', name: '행복', color: 'text-emotion-happy' },
  sad: { emoji: '😢', name: '슬픔', color: 'text-emotion-sad' },
  angry: { emoji: '😡', name: '화남', color: 'text-emotion-angry' },
  peaceful: { emoji: '😌', name: '평온', color: 'text-emotion-peaceful' },
  unrest: { emoji: '😨', name: '불안', color: 'text-emotion-unrest' },
};

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const { entries, updateEntry, deleteEntry } = useDiaryStore();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sameDateEntries, setSameDateEntries] = useState<DiaryEntry[]>([]);

  const entryId = params.id as string;

  useEffect(() => {
    // 현재 엔트리 찾기
    const foundEntry = entries.find((e) => e.id === entryId);
    if (foundEntry) {
      setEntry(foundEntry);
      setEditedTitle(foundEntry.title);
      setEditedContent(foundEntry.content);

      // 같은 날짜의 다른 엔트리들 찾기
      const sameDateEntries = entries.filter(
        (e) => e.createdAt === foundEntry.createdAt,
      );
      setSameDateEntries(sameDateEntries);

      // 현재 엔트리의 인덱스 찾기
      const index = sameDateEntries.findIndex((e) => e.id === entryId);
      setCurrentIndex(index);
    }
  }, [entryId, entries]);

  const handleEdit = () => {
    if (isEditing && entry) {
      // 수정 완료
      const updatedEntry = {
        ...entry,
        title: editedTitle,
        content: editedContent,
      };
      updateEntry(entry.id, updatedEntry);
      setEntry(updatedEntry);
      setIsEditing(false);
    } else {
      // 수정 모드 시작
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (
      entry &&
      window.confirm(
        '정말로 이 글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다.',
      )
    ) {
      deleteEntry(entry.id);
      router.push('/calendar');
    }
  };

  const handleCancelEdit = () => {
    if (entry) {
      setIsEditing(false);
      setEditedTitle(entry.title);
      setEditedContent(entry.content);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      const prevEntry = sameDateEntries[currentIndex - 1];
      router.push(`/viewPost/${prevEntry.id}`);
    } else if (
      direction === 'next' &&
      currentIndex < sameDateEntries.length - 1
    ) {
      const nextEntry = sameDateEntries[currentIndex + 1];
      router.push(`/viewPost/${nextEntry.id}`);
    }
  };

  const handleBack = () => {
    router.push('/calendar');
  };

  if (!entry) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">기록을 찾을 수 없습니다.</p>
          <Button onClick={handleBack} className="mt-4">
            캘린더로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const emotion =
    emotionLabels[entry.userEmotion as keyof typeof emotionLabels];

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-sage-20 to-ivory-cream rounded-2xl px-6 py-4 mb-6 border border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-text-secondary hover:text-text-primary hover:bg-background-hover"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-h3 font-bold text-text-primary">
                {formatDate(entry.createdAt)}
              </h1>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="space-y-6">
          {/* 감정 및 키워드 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 감정 섹션 */}
            <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
              <h2 className="text-body font-semibold text-text-primary mb-4 flex items-center">
                <span className="text-sage-70 mr-2">💭</span>
                감정
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{emotion?.emoji}</span>
                <div>
                  <p
                    className={`text-body-large font-medium ${emotion?.color}`}
                  >
                    {emotion?.name}
                  </p>
                  <p className="text-body-small text-text-secondary">100%</p>
                </div>
              </div>
            </div>

            {/* 키워드 섹션 */}
            <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
              <h2 className="text-body font-semibold text-text-primary mb-4 flex items-center">
                <span className="text-sage-70 mr-2">🏷️</span>
                키워드
              </h2>
              <div className="flex flex-wrap gap-2">
                {entry.keywords && entry.keywords.length > 0 ? (
                  entry.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-sage-20 text-sage-100 rounded-full text-body font-medium border border-sage-30"
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
          <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
            <h2 className="text-body font-semibold text-text-primary mb-4 flex items-center">
              <span className="text-sage-70 mr-2">📝</span>
              제목
            </h2>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-4 py-3 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 focus:border-sage-50 bg-background-primary text-text-primary text-body-large"
                placeholder="제목을 입력하세요"
              />
            ) : (
              <p className="text-body-large text-text-primary font-medium">
                {entry.title || '제목이 없습니다'}
              </p>
            )}
          </div>

          {/* 본문 섹션 */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
            <h2 className="text-body font-semibold text-text-primary mb-4 flex items-center">
              <span className="text-sage-70 mr-2">📖</span>
              본문
            </h2>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-80 px-4 py-3 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 focus:border-sage-50 bg-background-primary text-text-primary resize-none text-body"
                placeholder="글 내용을 입력하세요"
              />
            ) : (
              <div className="min-h-[320px] bg-background-primary rounded-lg p-4 border border-border-subtle">
                <p className="text-body text-text-primary leading-relaxed whitespace-pre-wrap">
                  {entry.content || '내용이 없습니다'}
                </p>
              </div>
            )}
          </div>

          {/* 하단 액션 버튼 */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate('prev')}
                disabled={currentIndex === 0}
                className={`p-3 rounded-full border border-border-subtle hover:bg-background-hover ${
                  currentIndex > 0
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
                      className="bg-sage-50 hover:bg-sage-60 text-sage-100 border border-sage-60 px-6 py-3"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="text-text-secondary hover:text-text-primary hover:bg-background-hover px-6 py-3"
                    >
                      취소
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleEdit}
                      className="bg-sage-50 hover:bg-sage-60 text-sage-100 border border-sage-60 px-6 py-3"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </Button>
                    <Button
                      onClick={handleDelete}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-3"
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
                onClick={() => handleNavigate('next')}
                disabled={currentIndex === sameDateEntries.length - 1}
                className={`p-3 rounded-full border border-border-subtle hover:bg-background-hover ${
                  currentIndex < sameDateEntries.length - 1
                    ? 'text-text-primary hover:text-sage-70'
                    : 'text-text-secondary cursor-not-allowed'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* 같은 날짜의 다른 기록들 표시 */}
          {sameDateEntries.length > 1 && (
            <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
              <h2 className="text-body font-semibold text-text-primary mb-4">
                같은 날의 다른 기록들 ({sameDateEntries.length}개)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sameDateEntries.map((sameDateEntry, index) => (
                  <div
                    key={sameDateEntry.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      sameDateEntry.id === entry.id
                        ? 'bg-sage-20 border-sage-50 ring-2 ring-sage-50'
                        : 'bg-background-primary border-border-subtle hover:bg-background-hover hover:border-border-strong'
                    }`}
                    onClick={() => router.push(`/viewPost/${sameDateEntry.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/viewPost/${sameDateEntry.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${sameDateEntry.title || `기록 ${index + 1}`} 보기`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-body-small font-medium text-text-primary truncate">
                        {sameDateEntry.title || `기록 ${index + 1}`}
                      </h3>
                      <span className="text-lg">
                        {
                          emotionLabels[
                            sameDateEntry.userEmotion as keyof typeof emotionLabels
                          ]?.emoji
                        }
                      </span>
                    </div>
                    <p className="text-caption text-text-secondary line-clamp-2">
                      {sameDateEntry.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
