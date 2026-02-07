"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SwipeBack from "@/app/components/SwipeBack";
import { getArrowBalanceSync, canUseArrowSync, useArrowSync } from "@/app/lib/cupid/arrowBalance";

interface AnalysisResult {
  emotionSummary: string;
  affectionScore: number;
  affectionReasons: string[];
  emotionFlow: string;
  riskSignals: string[];
  recommendedAction: string;
}

export default function ChatAnalysisPage({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [chatText, setChatText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [image1, setImage1] = useState<{ file: File; preview: string } | null>(null);
  const [image2, setImage2] = useState<{ file: File; preview: string } | null>(null);
  const [ocrText1, setOcrText1] = useState<string>("");
  const [ocrText2, setOcrText2] = useState<string>("");
  const [arrowBalance, setArrowBalance] = useState(0);
  const [unlockedTips, setUnlockedTips] = useState(false);
  const [unlockedForecast, setUnlockedForecast] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // 화살 잔액 로드
  useEffect(() => {
    const loadBalance = async () => {
      const balance = await getArrowBalanceSync();
      setArrowBalance(balance);
    };
    loadBalance();
  }, []);

  const handleAnalyze = async () => {
    if (!chatText.trim()) {
      setError("대화 내용을 입력해주세요");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/chat-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatText: chatText.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "분석에 실패했어요");
      }

      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        throw new Error("분석 결과를 받지 못했어요");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했어요");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-blue-500 to-cyan-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    if (score >= 20) return "from-orange-500 to-red-500";
    return "from-red-500 to-red-600";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "강한 호감";
    if (score >= 60) return "긍정적 관심";
    if (score >= 40) return "중립/관찰";
    if (score >= 20) return "소극적";
    return "거부/회피";
  };

  // 감정 온도계 해석 생성
  const getEmotionTemperature = (score: number): string => {
    if (score >= 80) return "지금은 매우 좋은 상태예요. 하지만 너무 밀면 부담될 수 있어요";
    if (score >= 60) return "지금은 편안하지만 더 밀면 부담될 수 있어요";
    if (score >= 40) return "지금은 적당한 거리예요. 서서히 다가가는 게 좋아 보여요";
    if (score >= 20) return "지금은 조심스러운 상태예요. 무리하지 않는 게 좋아 보여요";
    return "지금은 거리를 두는 게 좋아 보여요. 시간을 두고 천천히 다가가세요";
  };

  // 시간 문자열을 분 단위로 변환
  const parseTimeToMinutes = (timeStr: string): number | null => {
    // "오전 10:05", "오후 2:30", "10:05" 등의 형식 파싱
    const timeMatch = timeStr.match(/(오전|오후)?\s*(\d{1,2}):(\d{2})/);
    if (!timeMatch) return null;

    let hour = parseInt(timeMatch[2], 10);
    const minute = parseInt(timeMatch[3], 10);
    const ampm = timeMatch[1];

    if (ampm === "오후" && hour !== 12) {
      hour += 12;
    } else if (ampm === "오전" && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  };

  // 답장 패턴 분석 (실제 대화 텍스트 기반)
  const getReplyPattern = () => {
    if (!chatText) {
      return [
        { label: "평균 답장 속도", value: "분석 불가", description: "대화 내용이 없어 분석할 수 없어요" },
        { label: "시간대별 반응", value: "분석 불가", description: "대화 내용이 없어 분석할 수 없어요" },
      ];
    }

    const lines = chatText.split("\n").filter(line => line.trim().length > 0);
    const myMessages: Array<{ index: number; time: number | null; text: string }> = [];
    const theirMessages: Array<{ index: number; time: number | null; text: string }> = [];
    
    // 각 줄을 분석하여 메시지와 시간 정보 추출
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // 시간 정보 추출 (예: "오전 10:05", "오후 2:30")
      const timeMatch = trimmed.match(/(오전|오후)?\s*\d{1,2}:\d{2}/);
      const timeStr = timeMatch ? timeMatch[0] : null;
      const timeMinutes = timeStr ? parseTimeToMinutes(timeStr) : null;
      
      // 메시지 내용에서 시간 제거
      const messageText = trimmed.replace(/(오전|오후)?\s*\d{1,2}:\d{2}/g, "").trim();
      
      // "나:"로 시작하면 내 메시지
      if (messageText.startsWith("나:")) {
        myMessages.push({ index, time: timeMinutes, text: messageText });
      } else {
        // "나:"가 아니고 ":"로 끝나는 패턴이면 상대방 메시지 (예: "민지:", "지훈:", "상대:" 등)
        const nameMatch = messageText.match(/^([^:]+):/);
        if (nameMatch) {
          theirMessages.push({ index, time: timeMinutes, text: messageText });
        }
      }
    });

    // 상대방의 답장 속도 분석
    let replySpeedAnalysis = "분석 불가";
    let replySpeedDescription = "시간 정보가 없어 정확한 답장 속도를 분석할 수 없어요";
    
    if (theirMessages.length > 0 && myMessages.length > 0) {
      // 시간 정보가 있는 경우: 실제 시간 차이 계산
      const replyTimes: number[] = []; // 분 단위 답장 시간
      
      for (let i = 0; i < myMessages.length; i++) {
        const myMsg = myMessages[i];
        if (!myMsg.time) continue;
        
        const myMsgTime = myMsg.time; // 타입 가드
        
        // 다음 상대방 메시지 찾기
        const nextTheirMsg = theirMessages.find(msg => 
          msg.index > myMsg.index && msg.time !== null && msg.time >= myMsgTime
        );
        
        if (nextTheirMsg && nextTheirMsg.time !== null) {
          let timeDiff = nextTheirMsg.time - myMsgTime;
          // 자정을 넘어간 경우 처리
          if (timeDiff < 0) {
            timeDiff += 24 * 60; // 다음 날로 간주
          }
          replyTimes.push(timeDiff);
        }
      }

      if (replyTimes.length > 0) {
        // 평균 답장 시간 계산
        const avgMinutes = replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length;
        
        if (avgMinutes <= 5) {
          replySpeedAnalysis = "매우 빠름 (5분 이내)";
          replySpeedDescription = `상대방이 평균 ${Math.round(avgMinutes)}분 내에 답장하는 경향이 있어 보여요. 대화에 매우 적극적인 모습이 관찰돼요`;
        } else if (avgMinutes <= 30) {
          replySpeedAnalysis = "빠른 편 (30분 이내)";
          replySpeedDescription = `상대방이 평균 ${Math.round(avgMinutes)}분 내에 답장하는 경향이 있어 보여요. 비교적 빠르게 반응하는 편이에요`;
        } else if (avgMinutes <= 60) {
          replySpeedAnalysis = "보통 (1시간 이내)";
          replySpeedDescription = `상대방이 평균 ${Math.round(avgMinutes)}분 내에 답장하는 경향이 있어 보여요. 답장 속도는 보통 수준이에요`;
        } else if (avgMinutes <= 180) {
          replySpeedAnalysis = "느린 편 (3시간 이내)";
          replySpeedDescription = `상대방이 평균 ${Math.round(avgMinutes)}분 내에 답장하는 경향이 있어 보여요. 답장하는 데 시간이 걸리는 편이에요`;
        } else {
          replySpeedAnalysis = "매우 느림 (3시간 이상)";
          replySpeedDescription = `상대방이 평균 ${Math.round(avgMinutes)}분 내에 답장하는 경향이 있어 보여요. 답장이 상당히 늦는 편이에요`;
        }
      } else {
        // 시간 정보가 없는 경우: 메시지 순서로 추정
        let quickReplies = 0;
        let slowReplies = 0;
        
        for (let i = 0; i < myMessages.length; i++) {
          const myMsgIndex = myMessages[i].index;
          const nextTheirMsg = theirMessages.find(msg => msg.index > myMsgIndex);
          
          if (nextTheirMsg) {
            const gap = nextTheirMsg.index - myMsgIndex;
            if (gap <= 2) {
              quickReplies++;
            } else if (gap > 3) {
              slowReplies++;
            }
          }
        }

        const totalReplies = quickReplies + slowReplies;
        if (totalReplies > 0) {
          const quickRatio = quickReplies / totalReplies;
          
          if (quickRatio >= 0.7) {
            replySpeedAnalysis = "빠른 편";
            replySpeedDescription = "상대방이 보통 빠르게 답장하는 경향이 있어 보여요. 대화에 적극적인 모습이 관찰돼요";
          } else if (quickRatio >= 0.5) {
            replySpeedAnalysis = "보통";
            replySpeedDescription = "상대방이 비교적 빠르게 답장하는 경향이 있어 보여요";
          } else {
            replySpeedAnalysis = "느린 편";
            replySpeedDescription = "상대방이 답장하는 데 시간이 걸리는 경향이 있어 보여요";
          }
        }
      }
    }

    // 시간대별 반응 분석
    let timePatternAnalysis = "패턴 불명확";
    let timePatternDescription = "시간대별 반응 패턴을 명확히 파악하기 어려워 보여요";
    
    // 상대방 메시지가 많은 경우 활발한 것으로 간주
    if (theirMessages.length > myMessages.length * 0.8) {
      timePatternAnalysis = "활발한 반응";
      timePatternDescription = "상대방이 대화에 적극적으로 반응하는 모습이 관찰돼요";
    } else if (theirMessages.length < myMessages.length * 0.5) {
      timePatternAnalysis = "소극적 반응";
      timePatternDescription = "상대방의 반응이 상대적으로 적은 편으로 보여요";
    }

    return [
      { 
        label: "평균 답장 속도", 
        value: replySpeedAnalysis, 
        description: replySpeedDescription 
      },
      { 
        label: "시간대별 반응", 
        value: timePatternAnalysis, 
        description: timePatternDescription 
      },
    ];
  };

  // 좋은 말 / 피해야 할 말 (가상 데이터)
  const getGoodAndBadPhrases = () => {
    return {
      direction: "지금은 자연스러운 대화를 유지하는 게 좋아 보여요. 긍정적인 에너지를 주되 부담스럽지 않게 표현하는 게 중요해 보여요",
      goodPhrases: [
        "오늘 하루 어땠어?",
        "고마워, 덕분에 기분이 좋아졌어",
        "시간 되면 또 이야기하자"
      ],
      badPhrases: [
        "왜 답장이 이렇게 늦어?",
        "나한테 관심 없어?",
        "지금 뭐 하는 거야?"
      ]
    };
  };

  // 단기 관계 전망 (가상 데이터)
  const getShortTermForecast = (score: number): string => {
    if (score >= 80) return "1~3일 내로 관계가 더 가까워질 가능성이 있어 보여요. 하지만 너무 빠르게 진행하면 부담을 줄 수 있으니 자연스러운 흐름을 유지하는 게 좋아 보여요";
    if (score >= 60) return "1~3일 내로 긍정적인 변화가 있을 수 있어 보여요. 지금처럼 편안한 대화를 이어가면 관계가 자연스럽게 발전할 수 있을 것 같아요";
    if (score >= 40) return "1~3일 내로는 큰 변화보다는 현재 상태를 유지할 가능성이 높아 보여요. 서서히 신뢰를 쌓아가는 게 중요해 보여요";
    return "1~3일 내로는 조심스러운 접근이 필요해 보여요. 시간을 두고 천천히 다가가는 게 좋을 것 같아요";
  };

  // 행동 선택지 (가상 데이터)
  const getActionChoices = (): Array<{ id: string; text: string; result: string }> => {
    return [
      {
        id: "casual",
        text: "편하게 대화 이어가기",
        result: "자연스러운 대화를 이어가면 현재 관계를 유지하면서도 서서히 가까워질 수 있어 보여요"
      },
      {
        id: "active",
        text: "조금 더 적극적으로 다가가기",
        result: "적극적인 접근이 긍정적으로 받아들여질 수도 있지만, 부담을 줄 수 있으니 조심스럽게 시도해 보세요"
      },
      {
        id: "wait",
        text: "상대 반응 기다리기",
        result: "상대의 반응을 기다리면서 자연스러운 흐름을 유지하는 것도 좋은 선택일 수 있어요"
      }
    ];
  };

  // 잠금 해제 핸들러
  const handleUnlockTips = async () => {
    if (!canUseArrowSync(1)) {
      router.push("/shop");
      return;
    }

    const result = await useArrowSync(1);
    if (result.success) {
      setArrowBalance(result.newBalance);
      setUnlockedTips(true);
    } else {
      router.push("/shop");
    }
  };

  const handleUnlockForecast = async () => {
    if (!canUseArrowSync(1)) {
      router.push("/shop");
      return;
    }

    const result = await useArrowSync(1);
    if (result.success) {
      setArrowBalance(result.newBalance);
      setUnlockedForecast(true);
    } else {
      router.push("/shop");
    }
  };

  // 접두사 추가 함수: 두 번째 이미지의 OCR 결과에 "나:" 또는 상대방 이름 접두사가 없으면 추가
  const addPrefixToLines = (text: string, previousContext: string | null): string => {
    if (!previousContext) return text;
    
    const lines = text.split("\n").filter(line => line.trim().length > 0);
    if (lines.length === 0) return text;

    // 첫 번째 이미지의 마지막 발화자와 상대방 이름 확인
    const prevLines = previousContext.split("\n").filter(line => line.trim().length > 0);
    let lastSpeaker: "나" | "their" | null = null;
    let opponentName: string | null = null;
    
    // 뒤에서부터 발화자 찾기
    for (let i = prevLines.length - 1; i >= 0; i--) {
      const line = prevLines[i].trim();
      if (line.startsWith("나:")) {
        lastSpeaker = "나";
        break;
      } else {
        // "나:"가 아니고 ":"로 끝나는 패턴이면 상대방
        const nameMatch = line.match(/^([^:]+):/);
        if (nameMatch) {
          lastSpeaker = "their";
          if (!opponentName) {
            opponentName = nameMatch[1].trim();
          }
          break;
        }
      }
    }

    // 상대방 이름이 없으면 "상대" 사용
    const theirPrefix = opponentName || "상대";

    // 접두사가 없는 줄에 자동으로 추가
    const processedLines = lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // 이미 접두사가 있으면 그대로 반환
      if (trimmedLine.includes(":")) {
        return line;
      }
      
      // 접두사가 없으면 이전 발화자의 반대편으로 추가
      // 첫 줄은 이전 발화자의 반대편, 그 다음은 번갈아가며
      if (lastSpeaker === "나") {
        // 이전이 "나"였으면 다음은 상대방
        return index === 0 ? `${theirPrefix}: ${trimmedLine}` : (index % 2 === 0 ? `${theirPrefix}: ${trimmedLine}` : `나: ${trimmedLine}`);
      } else if (lastSpeaker === "their") {
        // 이전이 상대방이었으면 다음은 "나"
        return index === 0 ? `나: ${trimmedLine}` : (index % 2 === 0 ? `나: ${trimmedLine}` : `${theirPrefix}: ${trimmedLine}`);
      } else {
        // 이전 맥락이 없으면 첫 줄은 "나:"로 시작
        return index % 2 === 0 ? `나: ${trimmedLine}` : `${theirPrefix}: ${trimmedLine}`;
      }
    });

    return processedLines.join("\n");
  };

  // 중복 제거 함수: 첫 번째 텍스트 끝부분과 두 번째 텍스트 시작부분이 겹치면 제거
  const removeDuplicateLines = (text1: string, text2: string): string => {
    const lines1 = text1.trim().split("\n").filter(line => line.trim().length > 0);
    const lines2 = text2.trim().split("\n").filter(line => line.trim().length > 0);

    if (lines1.length === 0) return text2;
    if (lines2.length === 0) return text1;

    // 최대 10줄까지 비교 (더 많은 중복 패턴 감지)
    const maxCheck = Math.min(10, Math.min(lines1.length, lines2.length));

    // 뒤에서부터 비교: 첫 번째 텍스트의 끝부분과 두 번째 텍스트의 시작부분이 얼마나 겹치는지 확인
    for (let checkLen = maxCheck; checkLen >= 1; checkLen--) {
      const lastLines1 = lines1.slice(-checkLen);
      const firstLines2 = lines2.slice(0, checkLen);

      // 줄 단위로 비교
      let matchCount = 0;
      for (let i = 0; i < checkLen; i++) {
        const line1 = lastLines1[i]?.toLowerCase().trim();
        const line2 = firstLines2[i]?.toLowerCase().trim();
        
        // 완전 일치
        if (line1 === line2 && line1.length > 0) {
          matchCount++;
        } else {
          // 부분 일치 확인 (한 쪽이 다른 쪽에 포함되는 경우)
          // 예: "또 무심사까지" vs "또 무심사까지" (공백 차이 등)
          if (line1 && line2) {
            // 공백 제거 후 비교
            const normalized1 = line1.replace(/\s+/g, '');
            const normalized2 = line2.replace(/\s+/g, '');
            
            if (normalized1 === normalized2 && normalized1.length > 0) {
              matchCount++;
            } else if (
              (normalized1.length > 3 && normalized2.includes(normalized1)) ||
              (normalized2.length > 3 && normalized1.includes(normalized2))
            ) {
              // 한 쪽이 다른 쪽에 포함되는 경우 (3자 이상)
              matchCount++;
            } else {
              break; // 일치하지 않으면 중단
            }
          } else {
            break;
          }
        }
      }

      // 일치하는 줄이 있으면 중복 제거
      if (matchCount > 0 && matchCount === checkLen) {
        // 첫 번째 텍스트 + 두 번째 텍스트의 중복되지 않은 부분
        return text1 + "\n" + lines2.slice(matchCount).join("\n");
      } else if (matchCount >= Math.ceil(checkLen * 0.7)) {
        // 70% 이상 일치하면 중복으로 간주 (부분 중복 처리)
        return text1 + "\n" + lines2.slice(matchCount).join("\n");
      }
    }

    // 추가: 마지막 줄과 첫 줄이 같은 경우 (짧은 문장도 처리)
    const lastLine1 = lines1[lines1.length - 1]?.toLowerCase().trim();
    const firstLine2 = lines2[0]?.toLowerCase().trim();
    
    if (lastLine1 && firstLine2) {
      const normalizedLast = lastLine1.replace(/\s+/g, '');
      const normalizedFirst = firstLine2.replace(/\s+/g, '');
      
      // 완전 일치 또는 한 쪽이 다른 쪽에 포함되는 경우
      if (
        normalizedLast === normalizedFirst ||
        (normalizedLast.length > 2 && normalizedFirst.includes(normalizedLast)) ||
        (normalizedFirst.length > 2 && normalizedLast.includes(normalizedFirst))
      ) {
        return text1 + "\n" + lines2.slice(1).join("\n");
      }
    }

    // 중복 없으면 그냥 합치기
    return text1 + "\n" + text2;
  };

  // OCR 텍스트가 변경될 때마다 chatText 업데이트
  useEffect(() => {
    if (ocrText1 && ocrText2) {
      const mergedText = removeDuplicateLines(ocrText1, ocrText2);
      setChatText(mergedText);
    } else if (ocrText1) {
      setChatText(ocrText1);
    } else if (ocrText2) {
      setChatText(ocrText2);
    } else {
      // 둘 다 없을 때만 초기화 (사용자가 직접 입력한 경우를 위해)
      if (!image1 && !image2) {
        // 이미지가 없을 때만 초기화
      }
    }
  }, [ocrText1, ocrText2]);

  const handleImageUpload1 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 검증
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 크기는 5MB 이하여야 해요");
      return;
    }

    setIsExtracting(true);
    setError(null);

    // 이미지 미리보기
    const preview = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    setImage1({ file, preview });

    try {
      // OCR 처리
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // JSON 파싱 실패 시
        if (!response.ok) {
          throw new Error(`서버 오류 (${response.status}): 텍스트 추출에 실패했어요`);
        }
        throw new Error("응답을 처리할 수 없어요");
      }

      if (!response.ok) {
        throw new Error(data?.error || `서버 오류 (${response.status}): 첫 번째 이미지 텍스트 추출에 실패했어요`);
      }

      if (data?.success && data?.text) {
        const extractedText1 = data.text.trim();
        setOcrText1(extractedText1);
        setError(null);
      } else {
        throw new Error(data?.error || "첫 번째 이미지에서 텍스트를 추출하지 못했어요");
      }
    } catch (err) {
      console.error("OCR error:", err);
      const errorMessage = err instanceof Error ? err.message : "이미지 처리 중 오류가 발생했어요";
      setError(errorMessage);
      setImage1(null);
      setOcrText1("");
    } finally {
      setIsExtracting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleImageUpload2 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 검증
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 크기는 5MB 이하여야 해요");
      return;
    }

    setIsExtracting(true);
    setError(null);

    // 이미지 미리보기
    const preview = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    setImage2({ file, preview });

    try {
      // OCR 처리
      const formData = new FormData();
      formData.append("image", file);
      formData.append("isSecondImage", "true");
      // 첫 번째 이미지의 맥락 제공
      if (ocrText1) {
        formData.append("previousContext", ocrText1);
      }

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // JSON 파싱 실패 시
        if (!response.ok) {
          throw new Error(`서버 오류 (${response.status}): 텍스트 추출에 실패했어요`);
        }
        throw new Error("응답을 처리할 수 없어요");
      }

      if (!response.ok) {
        throw new Error(data?.error || `서버 오류 (${response.status}): 두 번째 이미지 텍스트 추출에 실패했어요`);
      }

      if (data?.success && data?.text) {
        let extractedText2 = data.text.trim();
        
        // 후처리: 접두사가 없는 줄에 자동으로 추가
        extractedText2 = addPrefixToLines(extractedText2, ocrText1);
        
        setOcrText2(extractedText2);
        setError(null);
      } else {
        throw new Error(data?.error || "두 번째 이미지에서 텍스트를 추출하지 못했어요");
      }
    } catch (err) {
      console.error("OCR error:", err);
      const errorMessage = err instanceof Error ? err.message : "이미지 처리 중 오류가 발생했어요";
      setError(errorMessage);
      setImage2(null);
      setOcrText2("");
    } finally {
      setIsExtracting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveImage1 = () => {
    setImage1(null);
    setOcrText1("");
  };

  const handleRemoveImage2 = () => {
    setImage2(null);
    setOcrText2("");
  };

  return (
    <SwipeBack>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
        <div className="mx-auto max-w-md px-5 py-6">
          {/* 헤더 */}
          <header className="mb-6">
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>←</span>
              <span>돌아가기</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg">
                💬
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">카톡 대화 분석</h1>
                <p className="text-sm text-indigo-600">
                  대화 내용으로 상대 마음 읽기
                </p>
              </div>
            </div>
          </header>

          {/* 입력 영역 */}
          {!analysisResult && (
            <div className="mb-6 space-y-4">
              {/* 이미지 업로드 영역 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📸 카톡 스크린샷 업로드
                </label>
                
                <div className="space-y-4">
                  {/* 첫 번째 이미지 업로드 칸 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      첫 번째 이미지
                    </label>
                    {image1 ? (
                      <div className="relative flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <img
                          src={image1.preview}
                          alt="첫 번째 이미지"
                          className="flex-1 max-h-20 rounded object-cover"
                        />
                        <button
                          onClick={handleRemoveImage1}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-sm"
                          disabled={isExtracting}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          ref={fileInputRef1}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload1}
                          disabled={isExtracting || isAnalyzing}
                          className="hidden"
                          id="image-upload-1"
                        />
                        <label
                          htmlFor="image-upload-1"
                          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            isExtracting || isAnalyzing
                              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                              : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400"
                          }`}
                        >
                          {isExtracting ? (
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-3 border-indigo-500 border-t-transparent mx-auto mb-2" />
                              <p className="text-xs text-gray-600">처리 중...</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-2xl mb-1">📷</span>
                              <p className="text-xs text-gray-600">첫 번째 이미지 업로드</p>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 두 번째 이미지 업로드 칸 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      두 번째 이미지 (선택)
                    </label>
                    {image2 ? (
                      <div className="relative flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <img
                          src={image2.preview}
                          alt="두 번째 이미지"
                          className="flex-1 max-h-20 rounded object-cover"
                        />
                        <button
                          onClick={handleRemoveImage2}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-sm"
                          disabled={isExtracting}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          ref={fileInputRef2}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload2}
                          disabled={isExtracting || isAnalyzing}
                          className="hidden"
                          id="image-upload-2"
                        />
                        <label
                          htmlFor="image-upload-2"
                          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            isExtracting || isAnalyzing
                              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                              : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400"
                          }`}
                        >
                          {isExtracting ? (
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-3 border-indigo-500 border-t-transparent mx-auto mb-2" />
                              <p className="text-xs text-gray-600">처리 중...</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-2xl mb-1">📷</span>
                              <p className="text-xs text-gray-600">두 번째 이미지 업로드 (선택)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 텍스트 입력 영역 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    또는 직접 입력하기
                  </label>
                  {chatText && (
                    <button
                      onClick={() => {
                        setChatText("");
                        setImage1(null);
                        setImage2(null);
                        setOcrText1("");
                        setOcrText2("");
                        setError(null);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      지우기
                    </button>
                  )}
                </div>
                <textarea
                  value={chatText}
                  onChange={(e) => {
                    setChatText(e.target.value);
                    setError(null);
                  }}
                  placeholder={`예시:
나: 오늘 뭐해?
상대: 집에 있어
나: 심심하겠다 ㅋㅋ
상대: 응 ㅋㅋ 너는?
나: 나도 집에 있는데
상대: 그럼 만날까?`}
                  className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={isAnalyzing || isExtracting}
                />
                <p className="mt-2 text-xs text-gray-500">
                  최소 5줄 이상의 대화가 필요해요
                </p>

                {/* 에러 메시지 */}
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* 분석 버튼 */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !chatText.trim() || isExtracting}
                  className={`mt-4 w-full py-4 rounded-xl font-bold text-white transition-all ${
                    isAnalyzing || !chatText.trim() || isExtracting
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 active:scale-[0.98]"
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      분석 중...
                    </span>
                  ) : (
                    "🔮 분석 시작하기"
                  )}
                </button>

                {/* 프라이버시 안내 */}
                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-700 text-center leading-relaxed">
                    🔒 <strong>프라이버시 보호</strong><br/>
                    사용자의 대화 내용은 절대 저장되지 않으며,<br/>
                    분석 용도로만 일시적으로 처리됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 분석 결과 */}
          {analysisResult && (
            <div className="space-y-4">
              {/* 다시 분석 버튼 */}
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setChatText("");
                  setImage1(null);
                  setImage2(null);
                  setOcrText1("");
                  setOcrText2("");
                  setError(null);
                }}
                className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                ← 다른 대화 분석하기
              </button>

              {/* 감정 요약 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💭</span>
                  <span>상대 감정 요약</span>
                </h2>
                <p className="text-gray-700 leading-relaxed">{analysisResult.emotionSummary}</p>
              </div>

              {/* 호감도 점수 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📊</span>
                    <span>호감도 분석</span>
                  </h2>
                  <span className="text-2xl font-black text-indigo-600">
                    {analysisResult.affectionScore}
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div className="mb-4">
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getScoreColor(analysisResult.affectionScore)} transition-all duration-500`}
                      style={{ width: `${analysisResult.affectionScore}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-600 text-center">
                    {getScoreLabel(analysisResult.affectionScore)}
                  </p>
                </div>

                {/* 근거 */}
                <div className="space-y-2">
                  {analysisResult.affectionReasons.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 상대 감정 온도계 */}
              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 p-6 border border-orange-200 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🌡️</span>
                  <span>상대 감정 온도계</span>
                </h2>
                
                {/* 온도계 게이지 */}
                <div className="mb-4">
                  <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full bg-gradient-to-r ${getScoreColor(analysisResult.affectionScore)} transition-all duration-500`}
                      style={{ width: `${analysisResult.affectionScore}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-700">
                        {analysisResult.affectionScore}°C
                      </span>
                    </div>
                  </div>
                </div>

                {/* 한 줄 해석 */}
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "{getEmotionTemperature(analysisResult.affectionScore)}"
                </p>
              </div>

              {/* 감정 흐름 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📈</span>
                  <span>감정 흐름</span>
                </h2>
                <p className="text-gray-700 leading-relaxed">{analysisResult.emotionFlow}</p>
              </div>

              {/* 답장 패턴 리듬 분석 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>⏱️</span>
                  <span>답장 패턴 리듬 분석</span>
                </h2>
                
                <div className="space-y-4">
                  {getReplyPattern().map((pattern, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{pattern.label}</span>
                        <span className="text-sm font-bold text-indigo-600">{pattern.value}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 위험 신호 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>위험 신호 체크</span>
                </h2>
                {analysisResult.riskSignals.length === 0 ? (
                  <p className="text-gray-600 text-sm">뚜렷한 위험 신호는 없어요</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.riskSignals.map((signal, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <span className="text-sm text-red-700">{signal}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 위험 신호 타임라인 */}
              {analysisResult.riskSignals.length > 0 && (
                <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📅</span>
                    <span>향후 대화에서 감지해야 할 신호</span>
                  </h2>
                  <div className="space-y-2">
                    {analysisResult.riskSignals.map((signal, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>다음 대화에서 "{signal}" 같은 패턴이 반복되면 주의가 필요해 보여요</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🔒 지금 쓰면 좋은 말 / 피해야 할 말 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg relative overflow-hidden">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🔒</span>
                  <span>지금 쓰면 좋은 말 / 피해야 할 말</span>
                </h2>
                
                {/* 무료: 방향성 설명 */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getGoodAndBadPhrases().direction}
                  </p>
                </div>

                {/* 유료: 실제 예시 문장 */}
                {unlockedTips ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1">
                        <span>✅</span>
                        <span>이런 말은 좋아 보여요</span>
                      </h3>
                      <div className="space-y-2 pl-5">
                        {getGoodAndBadPhrases().goodPhrases.map((phrase, index) => (
                          <div key={index} className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-200">
                            "{phrase}"
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1">
                        <span>❌</span>
                        <span>이런 말은 피하는 게 좋아 보여요</span>
                      </h3>
                      <div className="space-y-2 pl-5">
                        {getGoodAndBadPhrases().badPhrases.map((phrase, index) => (
                          <div key={index} className="text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-200">
                            "{phrase}"
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Blur 효과 */}
                    <div className="blur-sm space-y-4 pointer-events-none">
                      <div>
                        <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1">
                          <span>✅</span>
                          <span>이런 말은 좋아 보여요</span>
                        </h3>
                        <div className="space-y-2 pl-5">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-200">
                              예시 문장 {i}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1">
                          <span>❌</span>
                          <span>이런 말은 피하는 게 좋아 보여요</span>
                        </h3>
                        <div className="space-y-2 pl-5">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-200">
                              예시 문장 {i}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 잠금 오버레이 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                      <div className="text-4xl mb-3">🔒</div>
                      <p className="text-sm font-bold text-gray-700 mb-4">화살 1개로 열기</p>
                      {canUseArrowSync(1) ? (
                        <button
                          onClick={handleUnlockTips}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm transition-all hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] shadow-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span>💘</span>
                            <span>화살 1개 사용</span>
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push("/shop")}
                          className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm transition-all hover:bg-gray-800 active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-2">
                            <span>💘</span>
                            <span>화살 충전하러 가기</span>
                          </span>
                        </button>
                      )}
                      <p className="mt-3 text-xs text-gray-500">내 화살 {arrowBalance}개</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 추천 행동 */}
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 border border-purple-200 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  <span>오늘의 추천 행동</span>
                </h2>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {analysisResult.recommendedAction}
                </p>
              </div>

              {/* 🔒 단기 관계 전망 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg relative overflow-hidden">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🔒</span>
                  <span>단기 관계 전망</span>
                </h2>
                
                {unlockedForecast ? (
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {getShortTermForecast(analysisResult.affectionScore)}
                    </p>
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600">
                        💡 1~3일 기준 감정 흐름 예측은 참고용이며, 실제 관계는 더 복잡할 수 있어요
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Blur 효과 */}
                    <div className="blur-sm pointer-events-none">
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {getShortTermForecast(analysisResult.affectionScore)}
                      </p>
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600">
                          💡 1~3일 기준 감정 흐름 예측은 참고용이며, 실제 관계는 더 복잡할 수 있어요
                        </p>
                      </div>
                    </div>
                    
                    {/* 잠금 오버레이 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                      <div className="text-4xl mb-3">🔒</div>
                      <p className="text-sm font-bold text-gray-700 mb-4">화살 1개로 열기</p>
                      {canUseArrowSync(1) ? (
                        <button
                          onClick={handleUnlockForecast}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm transition-all hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] shadow-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span>💘</span>
                            <span>화살 1개 사용</span>
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push("/shop")}
                          className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm transition-all hover:bg-gray-800 active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-2">
                            <span>💘</span>
                            <span>화살 충전하러 가기</span>
                          </span>
                        </button>
                      )}
                      <p className="mt-3 text-xs text-gray-500">내 화살 {arrowBalance}개</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 오늘의 행동 선택 시뮬레이터 */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 border border-indigo-200 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎮</span>
                  <span>오늘의 행동 선택 시뮬레이터</span>
                </h2>
                <p className="text-xs text-gray-600 mb-4">
                  각 선택지를 눌러보면 예상 결과를 확인할 수 있어요 (참고용)
                </p>
                
                <div className="space-y-3 mb-4">
                  {getActionChoices().map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => setSelectedAction(choice.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedAction === choice.id
                          ? "bg-indigo-500 text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200"
                      }`}
                    >
                      <span className="text-sm font-medium">{choice.text}</span>
                    </button>
                  ))}
                </div>

                {selectedAction && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {getActionChoices().find(c => c.id === selectedAction)?.result}
                    </p>
                  </div>
                )}
              </div>

              {/* 답장 탭 연결 카드 */}
              <div className="mt-6 mb-6">
                <div
                  onClick={() => router.push("/?tab=reply")}
                  className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-5 border-2 border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <span>✨</span>
                        <span>이 분석으로 답장 만들기</span>
                      </h3>
                      <p className="text-sm text-gray-600">
                        분석 결과를 바탕으로 답장을 생성해보세요
                      </p>
                    </div>
                    <span className="text-purple-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              {/* 하단 안내 */}
              <div className="mt-6 space-y-3">
                <p className="text-center text-xs text-gray-400">
                  ⚠️ 분석 결과는 참고용이며, 실제 관계는 더 복잡할 수 있어요
                </p>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-700 text-center leading-relaxed">
                    🔒 <strong>프라이버시 보호</strong><br/>
                    사용자의 대화 내용은 절대 저장되지 않으며,<br/>
                    분석 용도로만 일시적으로 처리됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 로딩 중 */}
          {isAnalyzing && !analysisResult && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-3xl animate-pulse">🔮</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">대화 분석 중...</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    상대방의 감정과 호감도를 분석하고 있어요
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SwipeBack>
  );
}
