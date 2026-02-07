/**
 * 공유 타입 정의
 */

// 생년월일 폼 데이터
export interface FormData {
  name: string;
  calendarType: "양력" | "음력";
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  hasTime: boolean;
}
