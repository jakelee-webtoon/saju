/**
 * Extract 결과 캐시 (메모리 기반)
 * OCR 추출 결과를 캐싱하여 재분석 시 사용
 */

export interface Message {
  msg_id: string;
  speaker: 'me' | 'other' | 'unknown';
  text: string;
  time: string | null;
  confidence: number;
}

interface CachedExtract {
  extract_id: string;
  messages: Message[];
  meta: {
    dedup: { removed_count: number };
    speaker_resolution: { unknown_count: number };
  };
  cache_key: string;
  created_at: number;
  timestamp: number;
}

// 캐시 저장소 (메모리)
const extractCache = new Map<string, CachedExtract>();

// 캐시 TTL: 24시간
const CACHE_TTL = 24 * 60 * 60 * 1000;

// 최대 캐시 크기: 200개
const MAX_CACHE_SIZE = 200;

/**
 * Extract ID로 추출 결과 조회
 */
export function getExtractById(extract_id: string): CachedExtract | null {
  const cached = extractCache.get(extract_id);

  if (!cached) {
    return null;
  }

  // TTL 체크
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    extractCache.delete(extract_id);
    return null;
  }

  return cached;
}

/**
 * Extract 결과 캐시에 저장
 */
export function setExtractCache(extract: {
  extract_id: string;
  messages: Message[];
  meta: {
    dedup: { removed_count: number };
    speaker_resolution: { unknown_count: number };
  };
  cache_key: string;
  created_at: number;
}): void {
  // 캐시 크기 제한
  if (extractCache.size >= MAX_CACHE_SIZE) {
    // 가장 오래된 항목 삭제
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, value] of extractCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      extractCache.delete(oldestKey);
    }
  }

  extractCache.set(extract.extract_id, {
    ...extract,
    timestamp: Date.now(),
  });
}

/**
 * 캐시 통계
 */
export function getExtractCacheStats() {
  return {
    size: extractCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearExtractCache(): void {
  extractCache.clear();
}
