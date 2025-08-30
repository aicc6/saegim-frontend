import { getLogger } from '@/lib/logger';

const logger = getLogger('storage-service');

// localStorage 안전 액세스 헬퍼
export class StorageService {
  private static isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window;
    } catch {
      return false;
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) {
      logger.debug('localStorage 사용 불가능, 기본값 반환', { key });
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.error('localStorage 읽기 실패', { key, error });
      return defaultValue;
    }
  }

  static setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      logger.debug('localStorage 사용 불가능', { key });
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('localStorage 저장 실패', { key, error });
      return false;
    }
  }

  static removeItem(key: string): boolean {
    if (!this.isAvailable()) {
      logger.debug('localStorage 사용 불가능', { key });
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error('localStorage 삭제 실패', { key, error });
      return false;
    }
  }

  static clear(): boolean {
    if (!this.isAvailable()) {
      logger.debug('localStorage 사용 불가능');
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      logger.error('localStorage 전체 삭제 실패', { error });
      return false;
    }
  }
}

// 이미지 삭제 ID 관리 서비스
export class ImageStorageService {
  private static readonly DELETED_IMAGES_KEY = 'deletedImageIds';

  static getDeletedImageIds(): Set<string> {
    const ids = StorageService.getItem<string[]>(this.DELETED_IMAGES_KEY, []);
    return new Set(ids);
  }

  static addDeletedImageId(imageId: string): boolean {
    const current = this.getDeletedImageIds();
    current.add(imageId);
    return StorageService.setItem(this.DELETED_IMAGES_KEY, Array.from(current));
  }

  static removeDeletedImageId(imageId: string): boolean {
    const current = this.getDeletedImageIds();
    current.delete(imageId);
    return StorageService.setItem(this.DELETED_IMAGES_KEY, Array.from(current));
  }

  static clearDeletedImageIds(): boolean {
    return StorageService.removeItem(this.DELETED_IMAGES_KEY);
  }
}
