import { create } from 'zustand';
import { DiaryEntry, EmotionType, CalendarDay, MonthlyReport } from '@/types';

interface DiaryState {
  entries: DiaryEntry[];
  currentEntry: DiaryEntry | null;
  monthlyReport: MonthlyReport | null;
  calendarData: CalendarDay[];
  isLoading: boolean;
  error: string | null;
  // 페이지네이션 관련 상태 추가
  currentPage: number;
  hasMore: boolean;
  allEntries: DiaryEntry[]; // 전체 데이터를 저장하는 배열

  // Actions
  setEntries: (entries: DiaryEntry[]) => void;
  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (id: string, entry: Partial<DiaryEntry>) => void;
  deleteEntry: (id: string) => void;
  setCurrentEntry: (entry: DiaryEntry | null) => void;
  setMonthlyReport: (report: MonthlyReport) => void;
  setCalendarData: (data: CalendarDay[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 페이지네이션 액션 추가
  fetchPosts: () => Promise<void>;
  loadMorePosts: (page: number) => Promise<DiaryEntry[]>;
  resetPagination: () => void;

  // 유틸리티 함수들
  getEntriesByDate: (date: string) => DiaryEntry[];
  getEmotionDistribution: (
    year: number,
    month: number,
  ) => Record<EmotionType, number>;
  getKeywordDistribution: (
    year: number,
    month: number,
  ) => { word: string; count: number }[];
  getKeywordWithEmotionDistribution: (
    year: number,
    month: number,
  ) => { word: string; count: number; emotion: EmotionType }[];
}

// 더미 데이터 생성 함수 (더 많은 데이터 생성)
const generateDummyEntries = (count: number = 100): DiaryEntry[] => {
  const emotions: EmotionType[] = [
    'happy',
    'sad',
    'angry',
    'peaceful',
    'unrest',
  ];
  const entries: DiaryEntry[] = [];

  // 더 많은 더미 데이터 생성 (count개)
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // 로컬 시간대 기준으로 YYYY-MM-DD 형식 생성
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const emotion = emotions[Math.floor(Math.random() * emotions.length)];

    // 시간 정보 추가
    const entryDate = new Date(date);
    entryDate.setHours(9 + (i % 12), 0, 0, 0);
    const entryDateTime = entryDate.toISOString();

    entries.push({
      id: `entry-${i}`,
      title: `${i + 1}번째 일기 - ${emotion}한 하루`,
      content: `오늘의 감정을 기록합니다. ${emotion} 한 하루였습니다. 이는 ${i + 1}번째 기록입니다.`,
      userEmotion: emotion,
      aiEmotion: emotion,
      aiEmotionConfidence: 0.7 + Math.random() * 0.3,
      aiGeneratedText: generateAIText(emotion),
      images: [],
      keywords: generateKeywords(emotion),
      isPublic: false,
      createdAt: dateString,
      updatedAt: entryDateTime,
    });
  }

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

const generateAIText = (emotion: EmotionType): string => {
  const texts = {
    happy:
      '따스한 햇살처럼 밝은 하루,\n마음에 피어나는 행복의 꽃잎이\n바람에 흩날리며 춤을 춘다.',
    sad: '회색 구름 사이로 스며드는\n작은 빛줄기를 바라보며\n마음의 비가 그칠 때를 기다린다.',
    angry:
      '거센 바람처럼 휘몰아치는 마음,\n잔잔한 호수가 되기까지\n시간이 필요한 오늘이다.',
    peaceful:
      '고요한 숲속에서 듣는\n새들의 지저귐처럼\n마음에도 평화가 찾아왔다.',
    unrest:
      '안개 낀 새벽길을 걷듯\n불안한 마음이지만\n해가 뜨면 길이 보일 것이다.',
  };
  return texts[emotion];
};

const generateKeywords = (emotion: EmotionType): string[] => {
  const keywords = {
    happy: ['기쁨', '행복', '즐거움', '만족', '웃음'],
    sad: ['슬픔', '우울', '외로움', '아쉬움', '그리움'],
    angry: ['화남', '짜증', '분노', '스트레스', '답답함'],
    peaceful: ['평온', '차분', '안정', '여유', '힐링'],
    unrest: ['불안', '걱정', '망설임', '두려움', '혼란'],
  };
  return keywords[emotion].slice(0, 2 + Math.floor(Math.random() * 3));
};

const PAGE_SIZE = 8; // 한 페이지당 보여줄 항목 수

export const useDiaryStore = create<DiaryState>((set, get) => {
  const allDummyEntries = generateDummyEntries(100);

  return {
    entries: allDummyEntries.slice(0, PAGE_SIZE), // 처음에는 첫 페이지만 로드
    allEntries: allDummyEntries, // 전체 데이터 저장
    currentEntry: null,
    monthlyReport: null,
    calendarData: [],
    isLoading: false,
    error: null,
    currentPage: 1,
    hasMore: true,

    setEntries: (entries) => set({ entries }),

    addEntry: (entry) =>
      set((state) => ({
        entries: [entry, ...state.entries],
        allEntries: [entry, ...state.allEntries],
      })),

    updateEntry: (id, updatedEntry) =>
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { ...entry, ...updatedEntry } : entry,
        ),
        allEntries: state.allEntries.map((entry) =>
          entry.id === id ? { ...entry, ...updatedEntry } : entry,
        ),
      })),

    deleteEntry: (id) =>
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
        allEntries: state.allEntries.filter((entry) => entry.id !== id),
      })),

    setCurrentEntry: (entry) => set({ currentEntry: entry }),

    setMonthlyReport: (report) => set({ monthlyReport: report }),

    setCalendarData: (data) => set({ calendarData: data }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    // 초기 데이터 로드
    fetchPosts: async () => {
      set({ isLoading: true, error: null });

      try {
        // API 호출 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { allEntries } = get();
        const firstPageEntries = allEntries.slice(0, PAGE_SIZE);

        set({
          entries: firstPageEntries,
          currentPage: 1,
          hasMore: allEntries.length > PAGE_SIZE,
          isLoading: false,
        });
      } catch (error) {
        set({ error: '데이터를 불러오는데 실패했습니다.', isLoading: false });
      }
    },

    // 더 많은 포스트 로드
    loadMorePosts: async (page: number) => {
      const { allEntries, entries } = get();

      // API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const newEntries = allEntries.slice(startIndex, endIndex);

      if (newEntries.length > 0) {
        set((state) => ({
          entries: [...state.entries, ...newEntries],
          currentPage: page,
          hasMore: endIndex < allEntries.length,
        }));
      }

      return newEntries;
    },

    resetPagination: () => {
      const { allEntries } = get();
      set({
        entries: allEntries.slice(0, PAGE_SIZE),
        currentPage: 1,
        hasMore: allEntries.length > PAGE_SIZE,
      });
    },

    getEntriesByDate: (date) => {
      const entries = get().allEntries;
      return entries.filter((entry) => entry.createdAt.startsWith(date));
    },

    getEmotionDistribution: (year, month) => {
      const entries = get().allEntries;
      const monthEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate.getFullYear() === year && entryDate.getMonth() === month - 1
        );
      });

      const distribution: Record<EmotionType, number> = {
        happy: 0,
        sad: 0,
        angry: 0,
        peaceful: 0,
        unrest: 0,
      };

      monthEntries.forEach((entry) => {
        if (entry.userEmotion) {
          distribution[entry.userEmotion]++;
        }
      });

      return distribution;
    },

    getKeywordDistribution: (year, month) => {
      const entries = get().allEntries;
      const monthEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate.getFullYear() === year && entryDate.getMonth() === month - 1
        );
      });

      const keywordMap: Record<string, number> = {};

      monthEntries.forEach((entry) => {
        entry.keywords?.forEach((keyword) => {
          keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
        });
      });

      return Object.entries(keywordMap)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },

    getKeywordWithEmotionDistribution: (year, month) => {
      const entries = get().allEntries;
      const monthEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate.getFullYear() === year && entryDate.getMonth() === month - 1
        );
      });

      const keywordMap: Record<
        string,
        { count: number; emotion: EmotionType }
      > = {};

      monthEntries.forEach((entry) => {
        entry.keywords?.forEach((keyword) => {
          if (!keywordMap[keyword]) {
            keywordMap[keyword] = {
              count: 0,
              emotion: entry.userEmotion || 'happy',
            };
          }
          keywordMap[keyword].count++;
        });
      });

      return Object.entries(keywordMap)
        .map(([word, data]) => ({
          word,
          count: data.count,
          emotion: data.emotion,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  };
});
