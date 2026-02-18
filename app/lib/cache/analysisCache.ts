/**
 * 대화 분석 결과 캐시 (메모리 기반)
 * 같은 텍스트에 대한 분석 결과를 캐싱하여 API 호출 비용 절감
 */

interface CachedAnalysis {
  result: any;
  timestamp: number;
}

// 간단한 해시 함수
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// 캐시 저장소 (메모리)
const analysisCache = new Map<string, CachedAnalysis>();

// 캐시 TTL: 24시간
const CACHE_TTL = 24 * 60 * 60 * 1000;

// 최대 캐시 크기: 100개
const MAX_CACHE_SIZE = 100;

/**
 * 분석 결과 캐시에서 조회
 */
export function getCachedAnalysis(chatText: string): any | null {
  const normalizedText = chatText.trim().toLowerCase();
  const cacheKey = hashText(normalizedText);
  const cached = analysisCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // TTL 체크
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    analysisCache.delete(cacheKey);
    return null;
  }

  return cached.result;
}

/**
 * 분석 결과 캐시에 저장
 */
export function setCachedAnalysis(chatText: string, result: any): void {
  const normalizedText = chatText.trim().toLowerCase();
  const cacheKey = hashText(normalizedText);

  // 캐시 크기 제한
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    // 가장 오래된 항목 삭제
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, value] of analysisCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      analysisCache.delete(oldestKey);
    }
  }

  analysisCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * 캐시 통계
 */
export function getCacheStats() {
  return {
    size: analysisCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearCache(): void {
  analysisCache.clear();
}
