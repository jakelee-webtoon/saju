"use client";

import { useState, useRef } from "react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// 귀여운 큐피드 SVG 컴포넌트
function CupidIcon() {
  return (
    <svg viewBox="0 0 120 120" className="w-20 h-20" fill="none">
      {/* 날개 (왼쪽) */}
      <ellipse cx="28" cy="55" rx="18" ry="25" fill="white" opacity="0.9" />
      <ellipse cx="25" cy="50" rx="12" ry="18" fill="white" opacity="0.95" />
      
      {/* 날개 (오른쪽) */}
      <ellipse cx="92" cy="55" rx="18" ry="25" fill="white" opacity="0.9" />
      <ellipse cx="95" cy="50" rx="12" ry="18" fill="white" opacity="0.95" />
      
      {/* 몸통 */}
      <ellipse cx="60" cy="70" rx="22" ry="26" fill="#FFE4E1" />
      
      {/* 얼굴 */}
      <circle cx="60" cy="42" r="24" fill="#FFE4E1" />
      
      {/* 볼터치 */}
      <circle cx="45" cy="48" r="5" fill="#FFB6C1" opacity="0.6" />
      <circle cx="75" cy="48" r="5" fill="#FFB6C1" opacity="0.6" />
      
      {/* 눈 */}
      <ellipse cx="52" cy="40" rx="3.5" ry="4" fill="#2D1B14" />
      <ellipse cx="68" cy="40" rx="3.5" ry="4" fill="#2D1B14" />
      <circle cx="51" cy="39" r="1.5" fill="white" />
      <circle cx="67" cy="39" r="1.5" fill="white" />
      
      {/* 미소 */}
      <path d="M54 52 Q60 58 66 52" stroke="#E8A0A0" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* 머리카락 (곱슬곱슬) */}
      <circle cx="45" cy="22" r="8" fill="#FFD700" />
      <circle cx="60" cy="18" r="9" fill="#FFD700" />
      <circle cx="75" cy="22" r="8" fill="#FFD700" />
      <circle cx="50" cy="28" r="6" fill="#FFD700" />
      <circle cx="70" cy="28" r="6" fill="#FFD700" />
      
      {/* 하트 화살 */}
      <g transform="translate(75, 58) rotate(-25)">
        {/* 화살대 */}
        <rect x="0" y="8" width="35" height="3" fill="#8B4513" rx="1" />
        {/* 하트 촉 */}
        <path d="M-2 9.5 C-2 6, 2 3, 5 6 C8 3, 12 6, 12 9.5 C12 13, 5 18, 5 18 C5 18, -2 13, -2 9.5Z" fill="#FF6B8A" />
        {/* 화살 깃 */}
        <path d="M35 4 L45 9.5 L35 15 L38 9.5 Z" fill="#FFB6C1" />
      </g>
      
      {/* 반짝임 */}
      <g fill="#FFD700">
        <path d="M20 25 L22 30 L24 25 L22 28 Z" />
        <path d="M98 30 L100 35 L102 30 L100 33 Z" />
      </g>
    </svg>
  );
}

// 일반 슬라이드 타입
interface BasicSlide {
  type: "basic";
  emoji: string;
  title: string;
  description: string;
  gradient: string;
}

// 앱 미리보기 슬라이드 타입
interface PreviewSlide {
  type: "preview";
  title: string;
  gradient: string;
}

type Slide = BasicSlide | PreviewSlide;

const SLIDES: Slide[] = [
  {
    type: "basic",
    emoji: "✨",
    title: "나를 알면, 연애가 쉬워져요",
    description: "30초면 끝!\n나만의 연애 캐릭터를 만나보세요",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    type: "preview",
    title: "이런 걸 알 수 있어요",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    type: "basic",
    emoji: "💗",
    title: "매일 달라지는 연애 운세",
    description: "오늘의 감정 흐름을 읽고\n연애 타이밍을 가이드해드려요",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    type: "basic",
    emoji: "cupid",
    title: "고백할까 말까? 큐피드가 답해요",
    description: "망설여지는 그 순간,\n화살 하나로 결정하세요",
    gradient: "from-pink-400 to-rose-500",
  },
];

// 앱 미리보기 컴포넌트
function AppPreview() {
  const [activeTooltip, setActiveTooltip] = useState(0);
  
  const tooltips = [
    { id: 0, label: "나의 캐릭터", description: "사주 기반 연애 캐릭터", top: "18%", left: "50%" },
    { id: 1, label: "오늘의 모드", description: "매일 달라지는 컨디션", top: "42%", left: "50%" },
    { id: 2, label: "연애 성향", description: "나의 연애 스타일 분석", top: "62%", left: "50%" },
    { id: 3, label: "궁합 보기", description: "상대와의 케미 확인", top: "82%", left: "50%" },
  ];

  // 자동으로 툴팁 순환
  useState(() => {
    const interval = setInterval(() => {
      setActiveTooltip((prev) => (prev + 1) % tooltips.length);
    }, 2000);
    return () => clearInterval(interval);
  });

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      {/* 폰 프레임 */}
      <div className="relative bg-[#FAFBFC] rounded-[2rem] p-3 shadow-2xl border-4 border-gray-800">
        {/* 상단 노치 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-800 rounded-b-xl" />
        
        {/* 앱 화면 (미리보기) */}
        <div className="bg-[#FAFBFC] rounded-2xl overflow-hidden h-[420px] relative">
          {/* 헤더 */}
          <div className="px-4 pt-8 pb-3">
            <p className="text-xs text-gray-400">오늘의 나</p>
            <p className="text-sm font-bold text-gray-800">2월 6일 금요일</p>
          </div>

          {/* 카드들 (더미) */}
          <div className="px-3 space-y-3">
            {/* 캐릭터 카드 */}
            <div className={`rounded-xl bg-[#1E234B] p-4 transition-all duration-500 ${activeTooltip === 0 ? 'ring-2 ring-purple-400 ring-offset-2' : 'opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-400/20 flex items-center justify-center text-2xl">🔥</div>
                <div>
                  <p className="text-white text-sm font-bold">폭주 기관차</p>
                  <p className="text-white/60 text-xs">불꽃처럼 뜨겁게!</p>
                </div>
              </div>
            </div>

            {/* 오늘 모드 카드 */}
            <div className={`rounded-xl bg-orange-50 p-4 transition-all duration-500 ${activeTooltip === 1 ? 'ring-2 ring-orange-400 ring-offset-2' : 'opacity-60'}`}>
              <p className="text-xs text-orange-600 font-medium">오늘의 연애 모드</p>
              <p className="text-sm font-bold text-gray-800 mt-1">🌸 설렘모드</p>
            </div>

            {/* 연애 성향 카드 */}
            <div className={`rounded-xl bg-white border border-gray-100 p-4 transition-all duration-500 ${activeTooltip === 2 ? 'ring-2 ring-pink-400 ring-offset-2' : 'opacity-60'}`}>
              <p className="text-xs text-gray-500 font-medium">💗 나의 연애 성향</p>
              <p className="text-sm text-gray-700 mt-1">"직진형, 감정에 솔직한 타입"</p>
            </div>

            {/* 궁합 카드 */}
            <div className={`rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4 transition-all duration-500 ${activeTooltip === 3 ? 'ring-2 ring-purple-400 ring-offset-2' : 'opacity-60'}`}>
              <p className="text-xs text-purple-600 font-medium">💕 궁합 보기</p>
              <p className="text-sm text-gray-700 mt-1">상대방과 얼마나 맞을까?</p>
            </div>
          </div>
        </div>
      </div>

      {/* 툴팁 */}
      {tooltips.map((tooltip) => (
        <div
          key={tooltip.id}
          className={`absolute left-0 right-0 mx-auto w-fit px-4 py-2 rounded-full bg-white shadow-lg text-center transition-all duration-500 ${
            activeTooltip === tooltip.id 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-90 pointer-events-none'
          }`}
          style={{ 
            top: tooltip.top,
            transform: `translateY(-50%) ${activeTooltip === tooltip.id ? '' : 'translateX(20px)'}`,
            left: '-20px',
            right: 'auto'
          }}
        >
          <p className="text-xs font-bold text-purple-600">{tooltip.label}</p>
          <p className="text-[10px] text-gray-500">{tooltip.description}</p>
        </div>
      ))}
    </div>
  );
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // 스와이프 관련 ref
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const handleNext = () => {
    if (isAnimating) return;
    
    if (currentSlide < SLIDES.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (isAnimating || currentSlide === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(currentSlide - 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    onComplete();
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
    const diff = touchEndX.current - touchStartX.current;
    // 스와이프 진행 중 시각적 피드백 (최대 100px)
    setSwipeOffset(Math.max(-100, Math.min(100, diff * 0.5)));
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    
    const diff = touchEndX.current - touchStartX.current;
    const threshold = 50; // 스와이프 감지 임계값
    
    setSwipeOffset(0); // 오프셋 리셋
    
    if (diff < -threshold) {
      // 왼쪽 스와이프 → 다음
      handleNext();
    } else if (diff > threshold) {
      // 오른쪽 스와이프 → 이전
      handlePrev();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a1a2e] flex flex-col">
      {/* Skip 버튼 - 가시성 개선 */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-white/80 text-sm font-medium hover:text-white hover:underline transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* 메인 콘텐츠 - 터치 이벤트 추가 */}
      <div 
        className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)`, transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none' }}
      >
        {slide.type === "preview" ? (
          /* 앱 미리보기 슬라이드 */
          <div className={`transition-all duration-500 ${isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
            <h1 className="text-xl font-bold text-white text-center mb-6">
              {slide.title}
            </h1>
            <AppPreview />
          </div>
        ) : (
          /* 일반 슬라이드 */
          <>
            {/* 이모지/아이콘 */}
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 ${
                isAnimating ? "scale-75 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              {slide.emoji === "cupid" ? (
                <CupidIcon />
              ) : (
                <span className="text-6xl">{slide.emoji}</span>
              )}
            </div>

            {/* 타이틀 */}
            <h1
              className={`text-2xl font-bold text-white text-center mb-4 transition-all duration-500 ${
                isAnimating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              {slide.title}
            </h1>

            {/* 설명 */}
            <p
              className={`text-base text-white/70 text-center whitespace-pre-line leading-relaxed transition-all duration-500 delay-100 ${
                isAnimating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              {slide.description}
            </p>
          </>
        )}
      </div>

      {/* 하단 영역 */}
      <div className="px-8 pb-12">
        {/* 인디케이터 */}
        <div className="flex justify-center gap-2 mb-4">
          {SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-white"
                  : index < currentSlide
                  ? "w-2 bg-white/60"
                  : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
        
        {/* 스와이프 힌트 - 첫 슬라이드에서만 표시 */}
        {currentSlide === 0 && (
          <p className="text-center text-white/50 text-xs mb-4 animate-pulse">
            ← 스와이프해서 넘기기 →
          </p>
        )}
        {currentSlide > 0 && <div className="mb-4" />}

        {/* 다음 버튼 */}
        <button
          onClick={handleNext}
          className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 bg-gradient-to-r ${slide.gradient} hover:shadow-lg active:scale-[0.98]`}
        >
          {currentSlide === SLIDES.length - 1 ? "지금 시작하기 🚀" : "다음"}
        </button>
      </div>
    </div>
  );
}
