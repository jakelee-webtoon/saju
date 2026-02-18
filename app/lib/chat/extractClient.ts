/**
 * 클라이언트 사이드 Extract 유틸리티
 */

export interface ExtractResponse {
  success: boolean;
  cached: boolean;
  extract_id: string;
  messages: Array<{
    msg_id: string;
    speaker: 'me' | 'other' | 'unknown';
    text: string;
    time: string | null;
    confidence: number;
  }>;
  meta: {
    dedup: { removed_count: number };
    speaker_resolution: { unknown_count: number };
  };
  cache_key: string;
  created_at: number;
}

/**
 * Extract API 호출
 */
export async function extractImages(
  images: File[],
  locale: string = 'ko-KR'
): Promise<ExtractResponse> {
  const formData = new FormData();
  
  // 이미지 추가 (최대 3개)
  images.slice(0, 3).forEach((image, idx) => {
    formData.append(`image${idx + 1}`, image);
  });
  
  formData.append('locale', locale);

  const headers = await import('@/app/lib/cost/client').then(m => m.getSessionHeaders());

  let response: Response;
  try {
    response = await fetch('/api/chat/extract', {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (fetchError) {
    if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
      throw new Error('네트워크 연결을 확인해주세요. 인터넷 연결이 끊어졌을 수 있습니다.');
    }
    throw new Error('요청을 보내는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }

  if (!response.ok) {
    let error: any = { error: 'Extract 실패' };
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
      } else {
        const text = await response.text();
        error = { error: text || '이미지 추출에 실패했습니다' };
      }
    } catch {
      error = { error: '이미지 추출에 실패했습니다' };
    }
    throw new Error(error.error || '이미지 추출에 실패했습니다');
  }

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      console.error("[ExtractClient] Non-JSON response:", {
        status: response.status,
        statusText: response.statusText,
        contentType,
        url: response.url,
        preview: text.substring(0, 500)
      });
      
      // 상태 코드에 따른 구체적인 에러 메시지
      if (response.status === 429) {
        throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else if (response.status === 500) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else if (response.status === 503) {
        throw new Error('서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      } else if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('서버에서 HTML 응답을 받았습니다. 네트워크 연결을 확인해주세요.');
      } else {
        throw new Error(`이미지 추출 실패 (${response.status}): ${text.substring(0, 100)}`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('서버에서 예상치 못한')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('예상치 못한 응답')) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('응답 파싱에 실패했습니다');
  }
}

/**
 * Extract 결과를 기존 chatText 형식으로 변환
 * ExtractResponse 또는 ExtractResult 모두 지원
 */
export function extractToChatText(extract: ExtractResponse | { messages: ExtractResponse['messages'] }): string {
  if (!extract.messages || !Array.isArray(extract.messages)) {
    return '';
  }
  
  return extract.messages
    .map(msg => {
      const prefix = msg.speaker === 'me' ? '나' : msg.speaker === 'other' ? '상대' : '알수없음';
      return `${prefix}: ${msg.text}`;
    })
    .join('\n');
}
