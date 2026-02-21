/**
 * 서버 사이드 Extract 서비스
 */

import type { ExtractResponse } from "./extractClient";

/**
 * 이미지에서 대화 내용 추출
 */
export async function extractFromImages(
  images: globalThis.File[],
  locale: string,
  sessionId: string,
  identifier?: string
): Promise<ExtractResponse & { _wasCached?: boolean }> {
  // TODO: 실제 이미지 추출 로직 구현
  // 현재는 기본 구조만 제공
  
  const extractId = `extract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  return {
    success: true,
    cached: false,
    extract_id: extractId,
    messages: [],
    meta: {
      dedup: { removed_count: 0 },
      speaker_resolution: { unknown_count: 0 },
    },
    cache_key: `cache_${extractId}`,
    created_at: Date.now(),
    _wasCached: false,
  };
}
