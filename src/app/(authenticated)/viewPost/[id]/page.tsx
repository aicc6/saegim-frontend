'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DiaryEntry, DiaryListEntry } from '@/types/diary';
import { useDiaryStore } from '@/stores/diary';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/custom/Button';

const emotionLabels = {
  happy: { emoji: '😊', name: '행복', color: 'text-emotion-happy' },
  sad: { emoji: '😢', name: '슬픔', color: 'text-emotion-sad' },
  angry: { emoji: '😡', name: '화남', color: 'text-emotion-angry' },
  peaceful: { emoji: '😌', name: '평온', color: 'text-emotion-peaceful' },
  unrest: { emoji: '😰', name: '불안', color: 'text-emotion-unrest' },
};

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const { diaries, currentDiary, fetchDiary } = useDiaryStore();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sameDateEntries, setSameDateEntries] = useState<DiaryListEntry[]>([]);

  const entryId = params.id as string;

  useEffect(() => {
    // 현재 엔트리를 diaries에서 찾기 (목록용 데이터)
    const foundEntry = diaries.find((e: DiaryListEntry) => e.id === entryId);

    if (foundEntry) {
      // 상세 데이터 가져오기
      fetchDiary(entryId);

      // 같은 날짜의 다른 엔트리들 찾기 (목록용 데이터)
      const sameDateEntries = diaries.filter(
        (e: DiaryListEntry) => e.created_at === foundEntry.created_at,
      );
      setSameDateEntries(sameDateEntries);

      // 현재 엔트리의 인덱스 찾기
      const index = sameDateEntries.findIndex(
        (e: DiaryListEntry) => e.id === entryId,
      );
      setCurrentIndex(index);
    } else {
      console.log(
        '📝 ViewPost: 해당 ID의 다이어리를 찾을 수 없습니다:',
        entryId,
      );
    }
  }, [entryId, diaries, fetchDiary]);

  // currentDiary가 업데이트되면 entry 상태 업데이트
  useEffect(() => {
    if (currentDiary) {
      setEntry(currentDiary);
      setEditedTitle(currentDiary.title);
      setEditedContent(currentDiary.content);
    }
  }, [currentDiary]);

  const handleEdit = () => {
    if (isEditing && entry) {
      // 수정 완료 - 현재는 로컬 상태만 업데이트
      const updatedEntry = {
        ...entry,
        title: editedTitle,
        content: editedContent,
      };
      // updateEntry(entry.id, updatedEntry as any); // 백엔드 API 구조와 스토어 타입 불일치로 인한 임시 캐스팅
      setEntry(updatedEntry);
      setIsEditing(false);
      console.log('📝 ViewPost: 편집 완료 (로컬 상태만 업데이트)');
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
      // 현재는 삭제 기능이 구현되지 않음
      console.log('📝 ViewPost: 삭제 기능은 아직 구현되지 않았습니다');
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
          <p className="text-sage-100">기록을 찾을 수 없습니다.</p>
          <button
            onClick={handleBack}
            className="mt-4 px-6 py-2 bg-sage-50 hover:bg-sage-60 text-white rounded-lg"
          >
            캘린더로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const emotion =
    emotionLabels[entry.user_emotion as keyof typeof emotionLabels];

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* 페이지 헤더 */}
      <PageHeader
        title={'글 편집/ 저장'}
        subtitle={`${new Date(entry.created_at).getMonth() + 1}월 ${new Date(entry.created_at).getDate()}일`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-text-secondary hover:text-text-primary hover:bg-background-hover"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            뒤로가기
          </Button>
        }
      />

      <div className="flex-1 bg-ivory-cream p-8">
        <div className="max-w-4xl mx-auto">
          {/* 메인 콘텐츠 영역 */}
          <div className="bg-white rounded-lg border-2 border-sage-30 p-8 shadow-sm">
            {/* 감정 및 키워드 섹션 - 수평 배치 */}
            <div className="flex gap-8 mb-6">
              {/* 감정 섹션 */}
              <div className="bg-sage-10 rounded-lg p-4 border border-sage-30 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">감정 :</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{emotion?.emoji}</span>
                    <span className="text-sage-100 font-medium">
                      {emotion?.name} / 80%
                    </span>
                    <span className="text-2xl">😨</span>
                    <span className="text-sage-100 font-medium">
                      불안 / 20%
                    </span>
                  </div>
                </div>
              </div>

              {/* 키워드 섹션 */}
              <div className="bg-sage-10 rounded-lg p-4 border border-sage-30 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">키워드 :</span>
                  <div className="flex flex-wrap gap-2">
                    {entry.keywords && entry.keywords.length > 0 ? (
                      entry.keywords.map((keyword, index) => (
                        <span key={index} className="text-sage-100 font-medium">
                          #{keyword}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="text-sage-100 font-medium">#소풍</span>
                        <span className="text-sage-100 font-medium">
                          #데이트
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 제목 섹션 */}
            <div className="mb-6">
              <div className="block text-lg text-sage-100 mb-2">
                제목(Title) :
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-lg text-sage-100 bg-transparent border-0 border-b-2 border-sage-100 focus:outline-none focus:border-sage-70 pb-2"
                  placeholder="제목을 입력하세요"
                />
              ) : (
                <div className="w-full text-lg text-sage-100 border-b-2 border-sage-100 pb-2">
                  {entry.title || ''}
                </div>
              )}
            </div>

            {/* 본문 영역 */}
            <div className="mb-8">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-96 p-4 border-2 border-sage-30 rounded-lg focus:outline-none focus:border-sage-70 bg-white text-sage-100 resize-none text-base leading-relaxed"
                  placeholder="[글 본문]"
                />
              ) : (
                <div className="w-full h-96 p-4 border-2 border-sage-30 rounded-lg bg-sage-5 overflow-y-auto">
                  <p className="text-base text-sage-100 leading-relaxed whitespace-pre-wrap">
                    {entry.content || '[글 본문]'}
                  </p>
                </div>
              )}
            </div>

            {/* 하단 버튼 영역 */}
            <div className="flex justify-between items-center">
              {/* 좌측 이전 버튼 */}
              <button
                onClick={() => handleNavigate('prev')}
                disabled={currentIndex === 0}
                className={`w-12 h-12 rounded-full border-2 border-sage-30 bg-sage-10 flex items-center justify-center transition-all ${
                  currentIndex > 0
                    ? 'hover:bg-sage-20 text-sage-100'
                    : 'text-sage-50 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="text-lg font-bold">{'<'}</span>
              </button>

              {/* 중앙 버튼들 */}
              <div className="flex space-x-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleEdit}
                      className="px-6 py-2 bg-sage-50 hover:bg-sage-60 text-white rounded-lg border-2 border-sage-60 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg border-2 border-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="px-6 py-2 bg-sage-50 hover:bg-sage-60 text-white rounded-lg border-2 border-sage-60 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border-2 border-red-200 transition-colors"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>

              {/* 우측 다음 버튼 */}
              <button
                onClick={() => handleNavigate('next')}
                disabled={currentIndex === sameDateEntries.length - 1}
                className={`w-12 h-12 rounded-full border-2 border-sage-30 bg-sage-10 flex items-center justify-center transition-all ${
                  currentIndex < sameDateEntries.length - 1
                    ? 'hover:bg-sage-20 text-sage-100'
                    : 'text-sage-50 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="text-lg font-bold">{'>'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
