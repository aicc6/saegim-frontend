'use client';

import { diaryApi } from '@/lib/api';
import {
  DiaryEntry,
  DiaryListEntry,
  DiaryFilters,
  CalendarDateRange,
} from '@/types/diary';
import {
  isValidDiaryEntry,
  isValidDiaryList,
  validateApiResponse,
} from '@/lib/type-guards';
import { getLogger } from '@/lib/logger';
import { createServiceMethod } from '@/lib/store-helpers';

const logger = getLogger('diary-service');

export class DiaryService {
  private static _getDiariesImpl = async (
    filters?: DiaryFilters,
  ): Promise<{
    diaries: DiaryListEntry[];
    totalCount: number;
  }> => {
    const params: Record<string, string> = {};

    if (filters?.page) params.page = filters.page.toString();
    if (filters?.page_size) params.page_size = filters.page_size.toString();
    if (filters?.searchTerm) params.searchTerm = filters.searchTerm;
    if (filters?.emotion) params.emotion = filters.emotion;
    if (filters?.is_public !== undefined)
      params.is_public = filters.is_public.toString();
    if (filters?.start_date) params.start_date = filters.start_date;
    if (filters?.end_date) params.end_date = filters.end_date;
    if (filters?.sort_order) params.sort_order = filters.sort_order;

    const response = await diaryApi.getDiaries(params);
    const diaries = validateApiResponse(response.data, isValidDiaryList);

    return {
      diaries,
      totalCount: diaries.length,
    };
  };

  static getDiaries = createServiceMethod(
    DiaryService._getDiariesImpl,
    '다이어리 목록 조회',
    logger,
    '다이어리 목록을 불러오는데 실패했습니다.',
  );

  private static _getDiaryImpl = async (
    id: string,
  ): Promise<DiaryEntry | null> => {
    const response = await diaryApi.getDiary(id);
    return isValidDiaryEntry(response.data) ? response.data : null;
  };

  static getDiary = createServiceMethod(
    DiaryService._getDiaryImpl,
    '다이어리 조회',
    logger,
    '다이어리를 불러오는데 실패했습니다.',
  );

  private static _getCalendarDiariesImpl = async (
    dateRange: CalendarDateRange,
  ): Promise<DiaryListEntry[]> => {
    logger.debug('캘린더 다이어리 조회 시작', { dateRange });

    const response = await diaryApi.getCalendarDiaries(
      dateRange.startDate,
      dateRange.endDate,
    );

    logger.debug('API 응답', {
      response,
      data: response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
    });

    const diaries = validateApiResponse(response.data, isValidDiaryList);

    logger.info('캘린더 다이어리 조회 성공', {
      diariesCount: diaries.length,
      diaries: diaries.slice(0, 3),
    });

    return diaries;
  };

  static getCalendarDiaries = createServiceMethod(
    DiaryService._getCalendarDiariesImpl,
    '캘린더 다이어리 조회',
    logger,
    '캘린더 다이어리를 불러오는데 실패했습니다.',
  );

  private static _updateDiaryImpl = async (
    id: string,
    data: {
      title?: string;
      content?: string;
      user_emotion?: string;
      is_public?: boolean;
      keywords?: string[];
    },
  ): Promise<DiaryEntry> => {
    const response = await diaryApi.updateDiary(id, data);
    return validateApiResponse(response.data, isValidDiaryEntry);
  };

  static updateDiary = createServiceMethod(
    DiaryService._updateDiaryImpl,
    '다이어리 수정',
    logger,
    '다이어리를 수정하는데 실패했습니다.',
  );

  private static _deleteDiaryImpl = async (id: string): Promise<void> => {
    await diaryApi.deleteDiary(id);
  };

  static deleteDiary = createServiceMethod(
    DiaryService._deleteDiaryImpl,
    '다이어리 삭제',
    logger,
    '다이어리를 삭제하는데 실패했습니다.',
  );
}
