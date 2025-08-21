'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { DiaryEntry, DiaryListEntry, EmotionType } from '@/types/diary';
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

const emotionOptions: EmotionType[] = [
  'happy',
  'sad',
  'angry',
  'peaceful',
  'unrest',
];

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const { diaries, currentDiary, fetchDiary, updateDiary } = useDiaryStore();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedUserEmotion, setEditedUserEmotion] = useState<string>('');
  const [editedKeywords, setEditedKeywords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sameDateEntries, setSameDateEntries] = useState<DiaryListEntry[]>([]);

  // 감정 선택 관련 상태
  const [showEmotionSelector, setShowEmotionSelector] = useState(false);

  // 키워드 입력 관련 상태
  const [newKeyword, setNewKeyword] = useState('');
  const [showKeywordInput, setShowKeywordInput] = useState(false);

  const entryId = params.id as string;

  // 이전 페이지 경로 추적 (쿼리 파라미터 우선, referrer 폴백)
  const [previousPath, setPreviousPath] = useState<string>('/calendar');

  useEffect(() => {
    // 1. URL 쿼리 파라미터에서 from 경로 확인
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');

    if (fromParam) {
      // 쿼리 파라미터에서 온 경우
      setPreviousPath(decodeURIComponent(fromParam));
      console.log('🔍 쿼리 파라미터에서 이전 경로 확인:', fromParam);
    } else {
      // 2. document.referrer 사용 (폴백)
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;

      if (referrer && referrer.startsWith(currentOrigin)) {
        const referrerPath = new URL(referrer).pathname;
        if (referrerPath !== window.location.pathname) {
          setPreviousPath(referrerPath);
          console.log('🔍 referrer에서 이전 경로 확인:', referrerPath);
        }
      }
    }
  }, []);

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
      // 편집 모드가 아닐 때만 초기값으로 설정
      if (!isEditing) {
        setEditedTitle(currentDiary.title);
        setEditedContent(currentDiary.content);
        setEditedUserEmotion(currentDiary.user_emotion || '');
        setEditedKeywords(currentDiary.keywords || []);
      }
    }
  }, [currentDiary, isEditing]);

  // 편집 모드 시작 시 초기값 설정
  useEffect(() => {
    if (isEditing && entry) {
      setEditedTitle(entry.title);
      setEditedContent(entry.content);
      setEditedUserEmotion(entry.user_emotion || '');
      setEditedKeywords(entry.keywords || []);
    }
  }, [isEditing, entry]);

  // editedUserEmotion 상태 변화 추적
  useEffect(() => {
    console.log('🔍 editedUserEmotion 상태 변화:', {
      현재_감정: editedUserEmotion,
      감정_라벨: editedUserEmotion
        ? emotionLabels[editedUserEmotion as keyof typeof emotionLabels]
        : null,
    });
  }, [editedUserEmotion]);

  const handleEdit = async () => {
    if (isEditing && entry) {
      try {
        console.log('🔍 다이어리 수정 시작:', {
          제목: editedTitle,
          내용: editedContent,
          사용자_감정: editedUserEmotion,
          키워드: editedKeywords,
          원본_감정: entry.user_emotion,
        });

        // 백엔드 API 호출하여 다이어리 수정
        await updateDiary(entry.id, {
          title: editedTitle,
          content: editedContent,
          user_emotion: editedUserEmotion,
          keywords: editedKeywords,
        });

        console.log('✅ 다이어리 수정 완료');

        // 수정 완료 후 편집 모드 종료
        setIsEditing(false);
        setShowEmotionSelector(false);
        setShowKeywordInput(false);
        console.log('📝 ViewPost: 편집 완료');

        // 로컬 상태 즉시 업데이트 (UI 반응성 향상)
        const updatedEntry = {
          ...entry,
          title: editedTitle,
          content: editedContent,
          user_emotion: editedUserEmotion,
          keywords: editedKeywords,
        };
        setEntry(updatedEntry);

        // 성공 메시지 표시
        alert('다이어리가 성공적으로 수정되었습니다.');
      } catch (error) {
        console.error('❌ 다이어리 수정 실패:', error);
        alert('다이어리 수정에 실패했습니다. 다시 시도해주세요.');
      }
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
      setEditedUserEmotion(entry.user_emotion || '');
      setEditedKeywords(entry.keywords || []);
      setShowEmotionSelector(false);
      setShowKeywordInput(false);
    }
  };

  // 감정 선택 처리
  const handleEmotionSelect = (emotion: EmotionType) => {
    console.log('🔍 감정 선택:', {
      선택된_감정: emotion,
      감정_타입: typeof emotion,
      이전_감정: editedUserEmotion,
      감정_라벨: emotionLabels[emotion],
    });

    setEditedUserEmotion(emotion);
    setShowEmotionSelector(false);

    console.log('🔍 감정 상태 업데이트 완료:', {
      선택된_감정: emotion,
      감정_라벨: emotionLabels[emotion],
    });
  };

  // 키워드 추가 처리
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !editedKeywords.includes(newKeyword.trim())) {
      setEditedKeywords([...editedKeywords, newKeyword.trim()]);
      setNewKeyword('');
      setShowKeywordInput(false);
    }
  };

  // 키워드 삭제 처리
  const handleRemoveKeyword = (keywordToRemove: string) => {
    setEditedKeywords(
      editedKeywords.filter((keyword) => keyword !== keywordToRemove),
    );
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
    // 추적된 이전 경로가 있고, 유효한 경로인 경우 해당 경로로 이동
    if (
      previousPath &&
      previousPath !== '/viewPost' &&
      previousPath !== window.location.pathname
    ) {
      console.log('🔙 추적된 이전 경로로 이동:', previousPath);
      router.push(previousPath);
    } else if (window.history.length > 1) {
      // 추적된 경로가 없거나 유효하지 않은 경우 브라우저 히스토리 사용
      console.log('🔙 브라우저 히스토리로 뒤로가기');
      router.back();
    } else {
      // 히스토리가 없는 경우 기본값으로 캘린더로 이동
      console.log('🔙 기본 경로(캘린더)로 이동');
      router.push('/calendar');
    }
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
  const aiEmotion =
    emotionLabels[entry.ai_emotion as keyof typeof emotionLabels];

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* 페이지 헤더 */}
      <PageHeader
        title={'글 편집 / 저장'}
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
                <div className="space-y-3">
                  {/* 사용자 감정 (수정 가능) */}
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium text-sage-100">
                      사용자 감정 :
                    </span>
                    {isEditing ? (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowEmotionSelector(!showEmotionSelector)
                          }
                          className="flex items-center space-x-2 px-3 py-1 bg-white border border-sage-30 rounded-md hover:bg-sage-20"
                        >
                          <span className="text-2xl">
                            {editedUserEmotion
                              ? emotionLabels[
                                  editedUserEmotion as keyof typeof emotionLabels
                                ]?.emoji
                              : '😐'}
                          </span>
                          <span className="text-sage-100 font-medium">
                            {editedUserEmotion
                              ? emotionLabels[
                                  editedUserEmotion as keyof typeof emotionLabels
                                ]?.name
                              : '선택하세요'}
                          </span>
                        </button>

                        {/* 감정 선택 드롭다운 */}
                        {showEmotionSelector && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-sage-30 rounded-md shadow-lg z-10 min-w-[200px]">
                            {emotionOptions.map((emotionOption) => (
                              <button
                                key={emotionOption}
                                onClick={() =>
                                  handleEmotionSelect(emotionOption)
                                }
                                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-sage-20 text-left"
                              >
                                <span className="text-xl">
                                  {emotionLabels[emotionOption].emoji}
                                </span>
                                <span className="text-sage-100">
                                  {emotionLabels[emotionOption].name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {entry.user_emotion ? (
                          <>
                            <span className="text-2xl">{emotion?.emoji}</span>
                            <span className="text-sage-100 font-medium">
                              {emotion?.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sage-100 font-medium text-gray-500">
                            설정되지 않음
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI 감정 (읽기 전용) */}
                  {entry.ai_emotion && (
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-medium text-sage-100">
                        AI 분석 감정 :
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{aiEmotion?.emoji}</span>
                        <span className="text-sage-100 font-medium">
                          {aiEmotion?.name}
                          {entry.ai_emotion_confidence &&
                            ` (${Math.round(entry.ai_emotion_confidence * 100)}%)`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 감정이 모두 없는 경우 */}
                  {!entry.user_emotion && !entry.ai_emotion && (
                    <div className="text-sage-100 font-medium text-gray-500">
                      감정 정보가 없습니다
                    </div>
                  )}
                </div>
              </div>

              {/* 키워드 섹션 */}
              <div className="bg-sage-10 rounded-lg p-4 border border-sage-30 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">키워드 :</span>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        {/* 기존 키워드 표시 및 삭제 */}
                        <div className="flex flex-wrap gap-2">
                          {editedKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-sage-20 text-sage-100 rounded-full text-sm"
                            >
                              <span>#{keyword}</span>
                              <button
                                onClick={() => handleRemoveKeyword(keyword)}
                                className="ml-1 text-sage-60 hover:text-sage-80"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* 새 키워드 입력 */}
                        {showKeywordInput ? (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === 'Enter' && handleAddKeyword()
                              }
                              placeholder="새 키워드 입력"
                              className="flex-1 px-2 py-1 text-sm border border-sage-30 rounded focus:outline-none focus:border-sage-70"
                            />
                            <button
                              onClick={handleAddKeyword}
                              className="px-2 py-1 bg-sage-50 text-white rounded text-sm hover:bg-sage-60"
                            >
                              추가
                            </button>
                            <button
                              onClick={() => setShowKeywordInput(false)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowKeywordInput(true)}
                            className="flex items-center space-x-1 text-sage-60 hover:text-sage-80 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>키워드 추가</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {entry.keywords && entry.keywords.length > 0 ? (
                          entry.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="text-sage-100 font-medium"
                            >
                              #{keyword}
                            </span>
                          ))
                        ) : (
                          <>
                            <span className="text-sage-100 font-medium">
                              #소풍
                            </span>
                            <span className="text-sage-100 font-medium">
                              #데이트
                            </span>
                          </>
                        )}
                      </div>
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
