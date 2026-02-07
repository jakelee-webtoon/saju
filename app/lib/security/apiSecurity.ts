/**
 * API 보안 및 방어 로직 유틸리티
 * - Rate Limiting 강화
 * - 입력 검증 및 필터링
 * - 중복 요청 방지
 * - 부적절한 내용 필터링
 */

// ========================
// Rate Limiting (강화 버전)
// ========================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  dailyCount: number;
  dailyResetAt: number;
  lastRequestTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate Limit 설정
const RATE_LIMITS = {
  // 단기 제한 (1분)
  SHORT_WINDOW: 60 * 1000,
  SHORT_MAX: {
    chatAnalysis: 5,  // 대화 분석: 1분에 5회
    reply: 10,        // 답장 생성: 1분에 10회
    ocr: 5,           // OCR: 1분에 5회
  },
  
  // 중기 제한 (1시간)
  MEDIUM_WINDOW: 60 * 60 * 1000,
  MEDIUM_MAX: {
    chatAnalysis: 30,  // 대화 분석: 1시간에 30회
    reply: 50,         // 답장 생성: 1시간에 50회
    ocr: 30,           // OCR: 1시간에 30회
  },
  
  // 일일 제한
  DAILY_MAX: {
    chatAnalysis: 100,  // 대화 분석: 하루 100회
    reply: 200,         // 답장 생성: 하루 200회
    ocr: 100,           // OCR: 하루 100회
  },
  
  // 최소 요청 간격 (중복 요청 방지)
  MIN_INTERVAL: 2000, // 2초
};

/**
 * 강화된 Rate Limiting 체크
 */
export function checkRateLimit(
  identifier: string,
  endpoint: 'chatAnalysis' | 'reply' | 'ocr'
): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // 새 사용자
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMITS.SHORT_WINDOW,
      dailyCount: 1,
      dailyResetAt: now + 24 * 60 * 60 * 1000,
      lastRequestTime: now,
    });
    return { allowed: true };
  }

  // 일일 제한 체크
  if (now > entry.dailyResetAt) {
    entry.dailyCount = 1;
    entry.dailyResetAt = now + 24 * 60 * 60 * 1000;
  } else {
    entry.dailyCount++;
    if (entry.dailyCount > RATE_LIMITS.DAILY_MAX[endpoint]) {
      return {
        allowed: false,
        reason: `하루 사용 한도를 초과했습니다. 내일 다시 시도해주세요.`,
      };
    }
  }

  // 단기 제한 체크 (1분)
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMITS.SHORT_WINDOW;
  } else {
    entry.count++;
    if (entry.count > RATE_LIMITS.SHORT_MAX[endpoint]) {
      return {
        allowed: false,
        reason: `요청이 너무 많아요. 잠시 후 다시 시도해주세요.`,
      };
    }
  }

  // 최소 요청 간격 체크 (중복 요청 방지)
  const timeSinceLastRequest = now - entry.lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMITS.MIN_INTERVAL) {
    return {
      allowed: false,
      reason: `너무 빠른 연속 요청입니다. 잠시 후 다시 시도해주세요.`,
    };
  }

  entry.lastRequestTime = now;
  return { allowed: true };
}

// 오래된 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.dailyResetAt + 24 * 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000); // 10분마다 정리

// ========================
// 입력 검증 및 필터링
// ========================

// 입력 길이 제한
const INPUT_LIMITS = {
  chatAnalysis: {
    min: 50,
    max: 50000, // 약 50KB
  },
  reply: {
    min: 1,
    max: 1000, // 답장 생성은 짧은 메시지만
  },
  ocr: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
};

/**
 * 대화 분석 입력 검증
 */
export function validateChatInput(text: string): { valid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: '대화 내용을 입력해주세요' };
  }

  const trimmed = text.trim();

  // 길이 체크
  if (trimmed.length < INPUT_LIMITS.chatAnalysis.min) {
    return {
      valid: false,
      error: `대화 내용이 너무 짧아요. 최소 ${INPUT_LIMITS.chatAnalysis.min}자 이상 필요해요`,
    };
  }

  if (trimmed.length > INPUT_LIMITS.chatAnalysis.max) {
    return {
      valid: false,
      error: `대화 내용이 너무 길어요. 최대 ${INPUT_LIMITS.chatAnalysis.max.toLocaleString()}자까지 가능해요`,
    };
  }

  // 최소 줄 수 체크
  const lines = trimmed.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 5) {
    return {
      valid: false,
      error: '분석을 위해서는 최소 5줄 이상의 대화가 필요해요',
    };
  }

  // 부적절한 패턴 체크
  const suspiciousPatterns = [
    /(.)\1{100,}/, // 같은 문자 100번 이상 반복
    /[^\s]{500,}/, // 공백 없이 500자 이상
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: '부적절한 입력 형식입니다',
      };
    }
  }

  return { valid: true };
}

/**
 * 답장 생성 입력 검증
 */
export function validateReplyInput(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: '메시지를 입력해주세요' };
  }

  const trimmed = message.trim();

  if (trimmed.length < INPUT_LIMITS.reply.min) {
    return { valid: false, error: '메시지를 입력해주세요' };
  }

  if (trimmed.length > INPUT_LIMITS.reply.max) {
    return {
      valid: false,
      error: `메시지가 너무 길어요. 최대 ${INPUT_LIMITS.reply.max}자까지 가능해요`,
    };
  }

  // 부적절한 패턴 체크
  const suspiciousPatterns = [
    /(.)\1{50,}/, // 같은 문자 50번 이상 반복
    /[^\s]{200,}/, // 공백 없이 200자 이상
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: '부적절한 입력 형식입니다',
      };
    }
  }

  return { valid: true };
}

/**
 * OCR 파일 검증
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: '이미지 파일이 필요해요' };
  }

  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '이미지 파일만 업로드할 수 있어요' };
  }

  // 허용된 이미지 타입만
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'JPEG, PNG, WebP 형식만 지원해요',
    };
  }

  // 파일 크기 제한
  if (file.size > INPUT_LIMITS.ocr.maxFileSize) {
    return {
      valid: false,
      error: `이미지 크기는 ${INPUT_LIMITS.ocr.maxFileSize / 1024 / 1024}MB 이하여야 해요`,
    };
  }

  // 최소 크기 체크 (너무 작은 이미지 방지)
  if (file.size < 1024) { // 1KB 미만
    return {
      valid: false,
      error: '이미지 파일이 너무 작아요',
    };
  }

  return { valid: true };
}

// ========================
// 부적절한 내용 필터링
// ========================

// 부적절한 키워드 패턴 (기본적인 필터)
const INAPPROPRIATE_PATTERNS = [
  /(?:spam|광고|홍보|링크|http|www\.)/i,
  /(?:해킹|크래킹|exploit|vulnerability)/i,
  /(?:악성코드|malware|virus|trojan)/i,
];

/**
 * 부적절한 내용 체크 (기본 필터)
 */
export function checkInappropriateContent(text: string): { safe: boolean; reason?: string } {
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: '부적절한 내용이 포함되어 있습니다',
      };
    }
  }
  return { safe: true };
}

// ========================
// 중복 요청 방지
// ========================

const recentRequests = new Map<string, { hash: string; timestamp: number }>();

/**
 * 중복 요청 체크 (같은 내용 반복 요청 방지)
 */
export function checkDuplicateRequest(
  identifier: string,
  content: string,
  windowMs: number = 60000 // 기본 1분
): { isDuplicate: boolean } {
  const now = Date.now();
  
  // 간단한 해시 생성 (실제로는 crypto 사용 권장)
  const hash = Buffer.from(content).toString('base64').substring(0, 50);
  
  const recent = recentRequests.get(identifier);
  
  if (recent && recent.hash === hash && (now - recent.timestamp) < windowMs) {
    return { isDuplicate: true };
  }
  
  recentRequests.set(identifier, { hash, timestamp: now });
  
  // 오래된 요청 정리
  if (recentRequests.size > 10000) {
    const cutoff = now - windowMs * 2;
    for (const [key, value] of recentRequests.entries()) {
      if (value.timestamp < cutoff) {
        recentRequests.delete(key);
      }
    }
  }
  
  return { isDuplicate: false };
}

// ========================
// IP/식별자 추출
// ========================

/**
 * 요청 식별자 추출 (IP 또는 세션)
 */
export function getRequestIdentifier(request: Request): string {
  // 실제 환경에서는 세션 ID나 사용자 ID 사용 권장
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  
  return ip;
}

// ========================
// API 타임아웃 래퍼
// ========================

/**
 * 타임아웃이 있는 Promise 실행
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000 // 기본 30초
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('요청 시간이 초과되었습니다')), timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
}

// ========================
// 에러 핸들링 및 로깅
// ========================

/**
 * 안전한 에러 응답 생성
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = '오류가 발생했습니다'
): { error: string; status: number } {
  // 프로덕션에서는 상세 에러 정보 노출하지 않음
  if (error instanceof Error) {
    console.error('API Error:', error.message, error.stack);
    
    // 특정 에러 타입별 처리
    if (error.message.includes('timeout')) {
      return { error: '요청 시간이 초과되었습니다', status: 504 };
    }
    if (error.message.includes('rate limit')) {
      return { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.', status: 429 };
    }
  }
  
  return { error: defaultMessage, status: 500 };
}
