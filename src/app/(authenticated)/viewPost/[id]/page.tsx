'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getLogger } from '@/lib/logger';
import { useDiaryStore } from '@/stores/diary';
import {
  DiaryEntry,
  DiaryListEntry,
  ImageInfo,
  EmotionType,
} from '@/types/diary';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmModal from '@/components/diary/DeleteConfirmModal';

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

const logger = getLogger('viewPost');

export default function ViewPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { id: entryId } = use(params); // React.use()로 params unwrap
  const {
    diaries,
    currentDiary,
    fetchDiary,
    updateDiary,
    deleteDiary,
    isLoading,
    deletedImageIds,
    addDeletedImageId,
  } = useDiaryStore();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedEmotion, setEditedEmotion] = useState('');
  const [editedKeywords, setEditedKeywords] = useState<string[]>([]);
  const [editedImages, setEditedImages] = useState<ImageInfo[]>([]);
  const [showImageOptionsModal, setShowImageOptionsModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sameDateEntries, setSameDateEntries] = useState<DiaryListEntry[]>([]);
  // deletedImageIds는 전역 스토어에서 가져옴

  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // 감정 선택 관련 상태
  const [showEmotionSelector, setShowEmotionSelector] = useState(false);

  // 키워드 입력 관련 상태
  const [newKeyword, setNewKeyword] = useState('');
  const [_showKeywordInput, setShowKeywordInput] = useState(false);

  // 이전 페이지 경로 추적 (쿼리 파라미터 우선, referrer 폴백)
  const [previousPath, setPreviousPath] = useState<string>('/calendar');

  // localStorage에서 삭제된 이미지 ID 복원
  useEffect(() => {
    const savedDeletedImageIds = localStorage.getItem(
      `deletedImageIds_${entryId}`,
    );
    if (savedDeletedImageIds) {
      try {
        const parsedIds = JSON.parse(savedDeletedImageIds);
        parsedIds.forEach((imageId: string) => {
          addDeletedImageId(imageId);
        });
        logger.debug('localStorage에서 삭제된 이미지 ID 복원:', parsedIds);
      } catch (error) {
        logger.error('localStorage 파싱 오류:', error);
      }
    }
  }, [entryId, addDeletedImageId]);

  useEffect(() => {
    // 1. URL 쿼리 파라미터에서 from 경로 확인
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');

    if (fromParam) {
      // 쿼리 파라미터에서 온 경우
      const decodedPath = decodeURIComponent(fromParam);
      setPreviousPath(decodedPath);
      logger.debug('쿼리 파라미터에서 이전 경로 확인:', decodedPath);
    } else {
      // 2. document.referrer 사용 (폴백)
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;

      if (referrer && referrer.startsWith(currentOrigin)) {
        const referrerPath = new URL(referrer).pathname;
        if (referrerPath !== window.location.pathname) {
          setPreviousPath(referrerPath);
          logger.debug('referrer에서 이전 경로 확인:', referrerPath);
        }
      }
    }
  }, []);

  useEffect(() => {
    // 페이지 로드 시 항상 해당 다이어리를 API에서 직접 조회
    if (!entry || entry.id !== entryId) {
      logger.debug('다이어리 직접 조회 시작:', entryId);
      fetchDiary(entryId);
    }

    // 현재 엔트리를 diaries에서 찾기 (캐시된 데이터가 있는 경우)
    const foundEntry = diaries.find((e: DiaryListEntry) => e.id === entryId);

    if (foundEntry) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  // currentDiary가 업데이트되면 entry 상태 업데이트
  useEffect(() => {
    if (currentDiary && currentDiary.id === entryId) {
      logger.debug('currentDiary 업데이트:', currentDiary.id);

      // 삭제된 이미지는 제외하고 설정
      const filteredImages = (currentDiary.images || []).filter(
        (img) => !deletedImageIds.has(img.id),
      );

      const updatedEntry = {
        ...currentDiary,
        images: filteredImages,
      };

      setEntry(updatedEntry);
      setEditedImages(filteredImages);

      // 편집 모드가 아닐 때만 초기값으로 설정
      if (!isEditing) {
        setEditedTitle(currentDiary.title || '');
        setEditedContent(currentDiary.content);
        setEditedEmotion(currentDiary.user_emotion || '');
        setEditedKeywords(currentDiary.keywords || []);
      }
    }
  }, [currentDiary, entryId, deletedImageIds, isEditing]);

  // 편집 모드 시작 시 초기값 설정
  useEffect(() => {
    if (isEditing && entry) {
      setEditedTitle(entry.title || '');
      setEditedContent(entry.content);
      setEditedEmotion(entry.user_emotion || '');
      setEditedKeywords(entry.keywords || []);
    }
  }, [isEditing, entry]);

  // editedUserEmotion 상태 변화 추적
  useEffect(() => {
    logger.debug('editedUserEmotion 상태 변화:', {
      현재_감정: editedEmotion,
      감정_라벨: editedEmotion
        ? emotionLabels[editedEmotion as keyof typeof emotionLabels]
        : null,
    });
  }, [editedEmotion]);

  const handleEdit = async () => {
    if (isEditing && entry) {
      // 수정 완료
      try {
        logger.debug('수정 완료 시도', {
          제목: editedTitle,
          내용: editedContent,
          사용자_감정: editedEmotion,
          키워드: editedKeywords,
          원본_감정: entry.user_emotion,
        });

        // 백엔드와 동기화
        await updateDiary(entry.id, {
          title: editedTitle,
          content: editedContent,
          user_emotion: editedEmotion || undefined,
          keywords: editedKeywords,
        });

        logger.info('다이어리 수정 완료 (백엔드 동기화 및 로컬 상태 업데이트)');

        // 수정 완료 후 편집 모드 종료
        setIsEditing(false);
        setShowEmotionSelector(false);
        setShowKeywordInput(false);
        logger.debug('편집 완료');

        // 로컬 상태 즉시 업데이트 (UI 반응성 향상)
        const updatedEntry: DiaryEntry = {
          ...entry,
          title: editedTitle,
          content: editedContent,
          user_emotion: editedEmotion,
          keywords: editedKeywords,
          // 이미지는 현재 상태 유지 (삭제된 이미지 상태 보존)
          images: editedImages,
        };
        setEntry(updatedEntry);

        // 목록 데이터도 즉시 반영 (Calendar 등과 동기화)
        const store = useDiaryStore.getState();
        const updatedDiaries = store.diaries.map((diary) =>
          diary.id === entry.id ? { ...diary, ...updatedEntry } : diary,
        );

        useDiaryStore.setState({
          diaries: updatedDiaries,
        });

        // 편집 완료 후에도 이미지 삭제 상태 유지
        // (false); // 이 줄 제거

        // 성공 메시지 표시
        alert('다이어리가 성공적으로 수정되었습니다.');

        // 페이지 새로고침 없이 상태만 업데이트
        // window.location.reload();
      } catch (error) {
        logger.error('다이어리 수정 실패:', error);
        alert('다이어리 수정에 실패했습니다. 다시 시도해주세요.');
      }
    } else if (!isEditing && entry) {
      // 수정 모드 시작
      setIsEditing(true);
      // 수정 모드 시작 시 현재 상태를 편집 상태로 복사
      setEditedTitle(entry.title || '');
      setEditedContent(entry.content);
      setEditedEmotion(entry.user_emotion || '');
      setEditedKeywords(entry.keywords || []);
      setEditedImages(entry.images || []);
    }
  };

  // 삭제 버튼 클릭 핸들러
  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  // 삭제 확인 핸들러
  const handleDeleteConfirm = async () => {
    if (!entry) return;

    try {
      await deleteDiary(entry.id);
      toast({
        title: '삭제 완료',
        description: '다이어리가 성공적으로 삭제되었습니다.',
      });
      setDeleteModalOpen(false);

      // 삭제 후 이전 페이지로 이동
      handleBack();
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: '다이어리 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      logger.error('다이어리 삭제 실패:', error);
    }
  };

  // 삭제 모달 닫기 핸들러
  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
  };

  const handleCancelEdit = () => {
    // 편집 모드 종료
    setIsEditing(false);
    setShowEmotionSelector(false);
    setShowKeywordInput(false);

    // 원래 값으로 복원
    if (entry) {
      setEditedTitle(entry.title || '');
      setEditedContent(entry.content);
      setEditedEmotion(entry.user_emotion || '');
      setEditedKeywords(entry.keywords || []);
      setEditedImages(entry.images || []);

      // 편집 모드 종료 시 상태 잠금 해제 및 삭제된 이미지 ID 초기화

      // 현재 다이어리의 이미지만 deletedImageIds에서 제거 (편집 취소 시 복원)
      if (entry && entry.images) {
        const store = useDiaryStore.getState();
        const updatedDeletedImageIds = new Set(
          Array.from(store.deletedImageIds).filter(
            (id) => !entry.images!.some((img: ImageInfo) => img.id === id),
          ),
        );

        useDiaryStore.setState({
          deletedImageIds: updatedDeletedImageIds,
        });
      }
    }

    logger.debug('편집 모드 취소');
  };

  // 감정 선택 처리
  const handleEmotionSelect = (emotion: EmotionType) => {
    logger.debug('감정 선택:', {
      선택된_감정: emotion,
      감정_타입: typeof emotion,
      이전_감정: editedEmotion,
      감정_라벨: emotionLabels[emotion],
    });

    setEditedEmotion(emotion);
    setShowEmotionSelector(false);

    logger.debug('감정 상태 업데이트 완료:', {
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

  const handleRemoveImage = (imageId: string) => {
    if (!entry) return;

    // editedImages에서 이미지 제거
    const updatedImages = editedImages.filter((img) => img.id !== imageId);
    setEditedImages(updatedImages);

    // 삭제된 이미지 ID를 추적
    addDeletedImageId(imageId);

    // localStorage에 삭제된 이미지 ID 저장
    const currentDeletedIds = Array.from(deletedImageIds);
    const updatedDeletedIds = [...currentDeletedIds, imageId];
    localStorage.setItem(
      `deletedImageIds_${entryId}`,
      JSON.stringify(updatedDeletedIds),
    );
    logger.debug('localStorage에 삭제된 이미지 ID 저장:', updatedDeletedIds);

    // entry 상태도 즉시 업데이트하여 UI 반응성 향상
    const updatedEntryWithImages = {
      ...entry,
      images: updatedImages,
    };
    setEntry(updatedEntryWithImages);

    // 다이어리 스토어 상태도 즉시 업데이트하여 캘린더와 동기화
    const store = useDiaryStore.getState();
    const updatedDiaries = store.diaries.map((diary) =>
      diary.id === entry.id ? { ...diary, images: updatedImages } : diary,
    );

    // 전역 상태 강제 업데이트
    useDiaryStore.setState({
      diaries: updatedDiaries,
    });

    // 삭제된 이미지 ID를 스토어에 추가 (localStorage 자동 저장)
    useDiaryStore.getState().addDeletedImageId(imageId);

    // 이미지 삭제 상태 설정 (상태 잠금)

    logger.info(
      '이미지 삭제 완료 (로컬 상태만 업데이트, DB는 유지, 상태 잠금 설정)',
    );
    logger.debug('전역 상태 업데이트 완료 - 캘린더와 동기화됨');
    logger.debug('삭제된 이미지 ID:', imageId);
    logger.debug('업데이트된 다이어리 수:', updatedDiaries.length);
  };

  const handleLoadExistingImages = async () => {
    if (!entry) {
      logger.error('entry가 null입니다.');
      return;
    }

    try {
      logger.debug('기존 이미지 불러오기 시작');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/diary/${entry.id}/images`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const existingImages = data.data;
          logger.debug('기존 이미지 조회 성공:', existingImages);

          // 삭제된 이미지는 제외하고 필터링하지 않고 모든 이미지 복원
          // const filteredImages = existingImages.filter(
          //   (img: ImageInfo) => !deletedImageIds.has(img.id),
          // );
          const filteredImages = existingImages; // 모든 이미지 복원

          // editedImages 상태 업데이트
          setEditedImages(filteredImages);

          // entry 상태도 업데이트
          const updatedEntry = {
            ...entry,
            images: filteredImages,
          };
          setEntry(updatedEntry);

          // 다이어리 스토어 상태도 업데이트
          const store = useDiaryStore.getState();
          const updatedDiaries = store.diaries.map((diary) =>
            diary.id === entry.id
              ? { ...diary, images: filteredImages }
              : diary,
          );

          // 전역 상태 강제 업데이트
          useDiaryStore.setState({
            diaries: updatedDiaries,
          });

          // 현재 다이어리의 이미지 ID를 deletedImageIds에서 완전히 제거
          const currentStore = useDiaryStore.getState();
          existingImages.forEach((img: ImageInfo) => {
            if (currentStore.deletedImageIds.has(img.id)) {
              useDiaryStore.getState().removeDeletedImageId(img.id);
            }
          });

          // localStorage에서도 해당 다이어리의 삭제된 이미지 ID 제거
          localStorage.removeItem(`deletedImageIds_${entryId}`);
          logger.debug('localStorage에서 삭제된 이미지 ID 제거 완료');

          // 이미지 복원 시 상태 잠금 해제
          // clearDeletedImageIds() 호출하지 않음 - 전역 상태 유지

          logger.info('기존 이미지 복원 완료 - 캘린더와 동기화됨');
          logger.debug('복원된 이미지 수:', filteredImages.length);
          logger.debug('삭제된 이미지 ID 초기화 완료');
          logger.debug('디버깅 정보:', {
            백엔드_이미지_수: existingImages.length,
            복원된_이미지_수: filteredImages.length,
            현재_삭제된_이미지_ID: Array.from(deletedImageIds),
            업데이트된_삭제된_이미지_ID: Array.from(
              useDiaryStore.getState().deletedImageIds,
            ),
          });

          alert(
            '기존 이미지를 성공적으로 불러왔습니다. (삭제된 이미지도 복원됨)',
          );
        } else {
          logger.error('기존 이미지 조회 실패:', data.message);
          alert('기존 이미지 조회에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        logger.error('기존 이미지 조회 실패:', response.status);
        alert('기존 이미지 조회에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      logger.error('기존 이미지 조회 실패:', error);
      alert('기존 이미지 조회에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !entry) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('diary_id', entry.id);

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiBaseUrl}/api/diary/${entry.id}/upload-image`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      );

      if (response.ok) {
        const result = await response.json();
        logger.info('이미지 업로드 성공:', result);

        // 업로드된 이미지 정보를 entry에 추가
        const newImage: ImageInfo = {
          id: result.data.id,
          file_path: result.data.file_path,
          thumbnail_path: result.data.thumbnail_path,
          mime_type: result.data.mime_type,
        };

        const updatedImages = [...(entry.images || []), newImage];
        const updatedEntry = {
          ...entry,
          images: updatedImages,
        };
        setEntry(updatedEntry);

        // editedImages도 업데이트
        setEditedImages(updatedImages);

        // 다이어리 스토어 상태도 업데이트
        const store = useDiaryStore.getState();
        const updatedDiaries = store.diaries.map((diary) =>
          diary.id === entry.id ? { ...diary, images: updatedImages } : diary,
        );

        // 전역 상태 강제 업데이트
        useDiaryStore.setState({ diaries: updatedDiaries });

        logger.info('새 이미지 업로드 완료 - 캘린더와 동기화됨');
        logger.debug('업로드된 이미지 수:', updatedImages.length);

        alert('이미지가 성공적으로 업로드되었습니다.');
      } else {
        throw new Error('이미지 업로드 실패');
      }
    } catch (error) {
      logger.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleUploadNewImage = () => {
    // 파일 입력 요소를 클릭하여 파일 선택 다이얼로그 열기
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        // 파일 검증
        if (file.size > 10 * 1024 * 1024) {
          alert('파일 크기는 10MB 이하여야 합니다.');
          return;
        }

        if (!file.type.startsWith('image/')) {
          alert('이미지 파일만 업로드 가능합니다.');
          return;
        }

        // 파일을 선택한 후 자동으로 업로드
        try {
          await handleImageUpload(file);
        } catch (error) {
          logger.error('이미지 업로드 실패:', error);
          alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        }
      }
    };
    fileInput.click();
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      const prevEntry = sameDateEntries[currentIndex - 1];
      // 현재 from 파라미터 유지
      const currentFrom = new URLSearchParams(window.location.search).get(
        'from',
      );
      const fromParam = currentFrom
        ? `?from=${encodeURIComponent(currentFrom)}`
        : '';
      router.push(`/viewPost/${prevEntry.id}${fromParam}`);
    } else if (
      direction === 'next' &&
      currentIndex < sameDateEntries.length - 1
    ) {
      const nextEntry = sameDateEntries[currentIndex + 1];
      // 현재 from 파라미터 유지
      const currentFrom = new URLSearchParams(window.location.search).get(
        'from',
      );
      const fromParam = currentFrom
        ? `?from=${encodeURIComponent(currentFrom)}`
        : '';
      router.push(`/viewPost/${nextEntry.id}${fromParam}`);
    }
  };

  const handleBack = () => {
    // 1. URL 파라미터로 전달된 from 경로가 있는 경우 해당 경로로 이동
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');

    if (fromParam) {
      const targetPath = decodeURIComponent(fromParam);
      logger.debug('URL 파라미터의 from 경로로 이동:', targetPath);
      router.push(targetPath);
      return;
    }

    // 2. 추적된 이전 경로가 있고, 유효한 경로인 경우 해당 경로로 이동
    if (
      previousPath &&
      previousPath !== '/viewPost' &&
      previousPath !== window.location.pathname
    ) {
      logger.debug('추적된 이전 경로로 이동:', previousPath);
      router.push(previousPath);
      return;
    }

    // 3. 브라우저 히스토리가 있는 경우 뒤로가기
    if (window.history.length > 1) {
      logger.debug('브라우저 히스토리로 뒤로가기');
      router.back();
      return;
    }

    // 4. 모든 방법이 실패한 경우 기본값으로 캘린더로 이동
    logger.debug('기본 경로(캘린더)로 이동');
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
    <div className="h-full bg-background-primary flex flex-col">
      {/* 페이지 헤더 */}
      <PageHeader
        title={
          isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold text-text-primary bg-transparent border-b-2 border-sage-50 focus:border-sage-70 focus:outline-none px-2 py-1 min-w-[200px]"
                placeholder="제목을 입력하세요"
              />
            </div>
          ) : (
            entry?.title || '제목 없음'
          )
        }
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

      <div className="flex-1 bg-ivory-cream p-8 min-h-0 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* 메인 콘텐츠 영역 */}
          <div className="bg-white rounded-lg border-2 border-sage-30 p-8 shadow-sm">
            {/* 감정 및 키워드 섹션 - 수평 배치 */}
            <div className="flex gap-6 mb-6">
              {/* 감정 섹션 - 크기 축소 */}
              <div
                className="bg-sage-10 rounded-lg p-4 border border-sage-30 flex-shrink-0"
                style={{ minWidth: '200px' }}
              >
                <div className="space-y-3">
                  {/* 사용자 감정 (수정 가능) */}
                  <div className="flex items-center space-x-3">
                    <span className="text-base font-medium text-sage-100">
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
                            {editedEmotion
                              ? emotionLabels[
                                  editedEmotion as keyof typeof emotionLabels
                                ]?.emoji
                              : '😐'}
                          </span>
                          <span className="text-sage-100 font-medium">
                            {editedEmotion
                              ? emotionLabels[
                                  editedEmotion as keyof typeof emotionLabels
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
                      <span className="text-base font-medium text-sage-100">
                        AI 분석 감정 :
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {emotionLabels[
                            entry.ai_emotion as keyof typeof emotionLabels
                          ]?.emoji || '😐'}
                        </span>
                        <span className="text-sage-100 font-medium">
                          {emotionLabels[
                            entry.ai_emotion as keyof typeof emotionLabels
                          ]?.name || '알 수 없음'}
                        </span>
                        {entry.ai_emotion_confidence && (
                          <span className="text-sm text-sage-70">
                            ({Math.round(entry.ai_emotion_confidence * 100)}%)
                          </span>
                        )}
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

              {/* 키워드 섹션 - 한 줄로 표시 */}
              <div className="bg-sage-10 rounded-lg p-4 border border-sage-30 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-base font-medium text-sage-100 flex-shrink-0">
                      키워드 :
                    </span>
                    {isEditing ? (
                      <div className="flex-1">
                        {/* 기존 키워드 표시 및 삭제 */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {editedKeywords.map((keyword, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1 bg-sage-20 text-sage-100 px-2 py-1 rounded-md"
                            >
                              <span className="text-sm">#{keyword}</span>
                              <button
                                onClick={() => handleRemoveKeyword(keyword)}
                                className="text-sage-70 hover:text-sage-100 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* 새 키워드 추가 */}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddKeyword();
                              }
                            }}
                            placeholder="새 키워드 입력"
                            className="flex-1 px-2 py-1 border border-sage-30 rounded-md text-sm focus:outline-none focus:border-sage-70"
                          />
                          <button
                            onClick={handleAddKeyword}
                            className="px-3 py-1 bg-sage-50 text-white text-sm rounded-md hover:bg-sage-60 transition-colors"
                          >
                            추가
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {entry.keywords && entry.keywords.length > 0 ? (
                          entry.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="bg-sage-20 text-sage-100 px-2 py-1 rounded-md text-sm"
                            >
                              #{keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-sage-100 font-medium text-gray-500">
                            설정되지 않음
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 썸네일 이미지 섹션 */}
            {(() => {
              const imagesToShow = isEditing ? editedImages : entry.images;
              const filteredImages =
                imagesToShow?.filter(
                  (img) => img.thumbnail_path && !deletedImageIds.has(img.id),
                ) || [];
              return filteredImages.length > 0;
            })() && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-medium text-sage-100">
                    이미지 :
                  </span>
                  {/* 수정 모드에서 이미지 업로드 버튼 표시 */}
                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowImageOptionsModal(true)}
                        className="px-3 py-1 bg-sage-50 hover:bg-sage-60 text-white text-sm rounded-md cursor-pointer transition-colors"
                      >
                        사진 불러오기
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  {(isEditing ? editedImages : entry.images || [])
                    .filter(
                      (img) =>
                        img.thumbnail_path && !deletedImageIds.has(img.id),
                    )
                    .map((image, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={
                            image.thumbnail_path
                              ? `${
                                  process.env.NEXT_PUBLIC_API_BASE_URL || 
                                (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
                                }/api/public/image-proxy?url=${encodeURIComponent(
                                  image.thumbnail_path,
                                )}`
                              : ''
                          }
                          alt={`다이어리 이미지 ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-32 h-32 object-cover rounded-lg border border-sage-30 shadow-sm hover:shadow-md transition-shadow duration-200"
                        />
                        {/* 수정 모드에서 삭제 버튼 표시 */}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveImage(image.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200 hover:scale-110"
                            title="이미지 임시 삭제 (DB는 유지)"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 수정 모드에서 이미지가 없을 때 업로드 섹션 표시 */}
            {isEditing && (!editedImages || editedImages.length === 0) && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-medium text-sage-100">
                    이미지 :
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowImageOptionsModal(true)}
                      className="px-3 py-1 bg-sage-50 hover:bg-sage-60 text-white text-sm rounded-md cursor-pointer transition-colors"
                    >
                      사진 불러오기
                    </button>
                  </div>
                </div>
                <div className="text-center py-8 border-2 border-dashed border-sage-30 rounded-lg bg-sage-5">
                  <p className="text-sage-70 text-sm">
                    기존 이미지를 불러와주세요
                  </p>
                </div>
              </div>
            )}

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
                    {entry.ai_generated_text || '[글 본문]'}
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
                className={`w-12 h-12 rounded-full border-2 border-sage-30 bg-sage-10 flex items-center justify-center transition-all duration-200 ${
                  currentIndex > 0
                    ? 'hover:bg-sage-20 hover:border-sage-50 text-sage-100 hover:scale-105 shadow-md'
                    : 'text-sage-50 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="text-lg font-bold">
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </button>

              {/* 중앙 버튼들 */}
              <div className="flex space-x-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleEdit}
                      className="group relative px-8 py-3 bg-gradient-to-r from-sage-60 to-sage-70 hover:from-sage-70 hover:to-sage-80 text-white rounded-xl border-0 transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-medium text-base"
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>저장</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-sage-70 to-sage-80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="group relative px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border-0 transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-medium text-base"
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span>취소</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="group relative px-8 py-3 bg-gradient-to-r from-sage-50 to-sage-60 hover:from-sage-60 hover:to-sage-70 text-white rounded-xl border-0 transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-medium text-base"
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>수정</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-sage-60 to-sage-70 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="group relative px-8 py-3 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl border-0 transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-medium text-base"
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>삭제</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </>
                )}
              </div>

              {/* 우측 다음 버튼 */}
              <button
                onClick={() => handleNavigate('next')}
                disabled={currentIndex === sameDateEntries.length - 1}
                className={`w-12 h-12 rounded-full border-2 border-sage-30 bg-sage-10 flex items-center justify-center transition-all duration-200 ${
                  currentIndex < sameDateEntries.length - 1
                    ? 'hover:bg-sage-20 hover:border-sage-50 text-sage-100 hover:scale-105 shadow-md'
                    : 'text-sage-50 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="text-lg font-bold">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 옵션 선택 모달 */}
      <ImageOptionsModal
        isOpen={showImageOptionsModal}
        onClose={() => setShowImageOptionsModal(false)}
        onLoadExisting={handleLoadExistingImages}
        onUploadNew={handleUploadNewImage}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        diaryTitle={entry?.title || '제목 없음'}
        isLoading={isLoading}
      />
    </div>
  );
}

// 이미지 옵션 선택 모달
const ImageOptionsModal = ({
  isOpen,
  onClose,
  onLoadExisting,
  onUploadNew,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLoadExisting: () => void;
  onUploadNew: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          이미지 불러오기 옵션
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => {
              onLoadExisting();
              onClose();
            }}
            className="w-full px-4 py-3 bg-sage-50 hover:bg-sage-60 text-white rounded-md transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔄</span>
              <div>
                <div className="font-medium">기존 이미지 불러오기</div>
                <div className="text-sm text-sage-20">
                  데이터베이스에서 저장된 이미지
                </div>
                <div className="text-xs text-sage-30 mt-1">
                  삭제된 이미지도 복원됩니다
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onUploadNew();
              onClose();
            }}
            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📁</span>
              <div>
                <div className="font-medium">새 이미지 업로드</div>
                <div className="text-sm text-blue-200">
                  로컬에서 새 이미지 선택
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
