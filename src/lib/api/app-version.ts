/**
 * 앱 버전 관리 API
 * 모바일 앱 다운로드 및 버전 확인
 */

import { apiClient } from './client';
import type { ApiResponse } from './client';

/**
 * 플랫폼 타입
 */
export type PlatformType = 'android' | 'ios';

/**
 * 앱 버전 정보
 */
export interface AppVersionData {
  id: string;
  version_name: string;
  platform: PlatformType;
  file_path: string;
  file_name: string;
  file_size: number | null;
  description: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  download_url: string | null;
}

/**
 * 최신 버전 조회 응답
 */
export type GetLatestVersionResponse = ApiResponse<AppVersionData>;

/**
 * 특정 플랫폼의 최신 버전 조회
 * @param platform - 플랫폼 (android, ios)
 * @returns 최신 앱 버전 정보
 */
export async function getLatestVersion(
  platform: PlatformType,
): Promise<GetLatestVersionResponse> {
  return apiClient.get<AppVersionData>(
    `/api/app-version/latest?platform=${platform}`,
  );
}

/**
 * 앱 다운로드 정보
 */
export interface AppDownloadInfo {
  url: string;
  version: string;
  fileName: string;
}

/**
 * 앱 다운로드 URL 가져오기
 * @param platform - 플랫폼 (android, ios)
 * @returns 다운로드 URL 또는 null
 */
export async function getAppDownloadUrl(
  platform: PlatformType,
): Promise<string | null> {
  try {
    const response = await getLatestVersion(platform);
    if (response.success && response.data) {
      return response.data.download_url || response.data.file_path;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get ${platform} app download URL:`, error);
    return null;
  }
}

/**
 * 앱 다운로드 정보 가져오기 (URL + 버전 + 파일명)
 * @param platform - 플랫폼 (android, ios)
 * @returns 다운로드 정보 또는 null
 */
export async function getAppDownloadInfo(
  platform: PlatformType,
): Promise<AppDownloadInfo | null> {
  try {
    const response = await getLatestVersion(platform);
    if (response.success && response.data) {
      const url = response.data.download_url || response.data.file_path;
      const version = response.data.version_name;
      const fileName = `saegim-${version}.apk`;
      return { url, version, fileName };
    }
    return null;
  } catch (error) {
    console.error(`Failed to get ${platform} app download info:`, error);
    return null;
  }
}
