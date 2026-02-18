/**
 * 상대(Partner) 관련 타입 정의
 */

export type RelationStage = "썸" | "연애" | "소개팅" | "친구" | "기타";

export interface PartnerSaju {
  calendarType: "양력" | "음력";
  birthY: number;
  birthM: number;
  birthD: number;
  birthTimeKnown: boolean;
  birthHour?: number;
  birthMinute?: number;
}

export interface Partner {
  id: string; // UUID
  name: string; // 필수
  relationStage?: RelationStage;
  mbti?: string; // 예: "ENFP", "ISTJ"
  saju?: PartnerSaju;
  memo?: string; // 최대 200자
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface PartnerFormData {
  name: string;
  relationStage?: RelationStage;
  mbti?: string;
  saju?: PartnerSaju;
  memo?: string;
}
