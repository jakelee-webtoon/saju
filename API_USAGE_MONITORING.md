# Google API 호출량 확인 방법

## 1. Google Cloud Console에서 확인

### 1.1 Billing (결제) 대시보드
1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/
   - 프로젝트 선택

2. **Billing 메뉴 이동**
   - 좌측 메뉴 → "Billing" 클릭
   - 또는 상단 검색창에서 "Billing" 검색

3. **비용 확인**
   - "Cost breakdown" 섹션에서 API별 비용 확인
   - "Reports" 탭에서 일별/월별 비용 추이 확인
   - "Cost breakdown by service"에서 "Generative AI API" 확인

### 1.2 API & Services 대시보드
1. **API & Services 메뉴**
   - 좌측 메뉴 → "APIs & Services" → "Dashboard"
   - 또는 "APIs & Services" → "Enabled APIs"

2. **Generative Language API 확인**
   - "Generative Language API" 클릭
   - "Metrics" 탭에서 호출량 확인
   - "Quotas" 탭에서 할당량 확인

### 1.3 Cloud Logging (로그 확인)
1. **Logging 메뉴**
   - 좌측 메뉴 → "Logging" → "Logs Explorer"

2. **필터 설정**
   ```
   resource.type="api"
   resource.labels.service="generativelanguage.googleapis.com"
   ```
   또는
   ```
   jsonPayload.@type="type.googleapis.com/google.cloud.audit.AuditLog"
   jsonPayload.serviceName="generativelanguage.googleapis.com"
   ```

## 2. 서버 로그에서 확인

### 2.1 현재 구현된 로깅
- 캐시 히트 시: `[Chat Analysis] Cache hit - API 호출 생략`
- API 호출 시: 서버 콘솔에 자동 로깅

### 2.2 로그 확인 방법
```bash
# 개발 서버 실행 중인 터미널에서 확인
# 또는 프로덕션 환경의 로그 확인
```

## 3. 실시간 호출 추적 (추가 구현 가능)

서버에 API 호출 추적 기능을 추가하여 실시간으로 확인할 수 있습니다.

### 3.1 호출 통계 엔드포인트 추가
- `/api/admin/stats` - 오늘의 API 호출 통계
- 캐시 히트율, 총 호출 수, 실패 횟수 등

### 3.2 클라이언트 측 추적
- 브라우저 개발자 도구 → Network 탭
- `/api/chat-analysis` 요청 확인
- Response Headers에서 캐시 여부 확인

## 4. 비용 절감 확인 방법

### 4.1 캐시 효과 확인
1. 같은 대화를 두 번 분석
2. 첫 번째: API 호출 발생 (비용 발생)
3. 두 번째: 캐시 히트 (비용 없음)
4. 서버 로그에서 `Cache hit` 메시지 확인

### 4.2 호출량 비교
- **이전**: 같은 대화 분석 시마다 API 호출
- **현재**: 같은 대화는 캐시에서 가져옴
- **예상 절감**: 재분석 시 100% 절감

## 5. 모니터링 체크리스트

- [ ] Google Cloud Console Billing 확인
- [ ] API Dashboard에서 호출량 확인
- [ ] 서버 로그에서 캐시 히트율 확인
- [ ] 일일 비용 추이 확인
- [ ] 비정상적인 호출 패턴 확인

## 6. 비용 알림 설정

Google Cloud Console에서:
1. Billing → Budgets & alerts
2. "Create Budget" 클릭
3. 예산 설정 및 알림 임계값 설정
4. 일일/주간/월간 비용 알림 설정

---

**참고**: 현재 구현된 캐싱 시스템으로 인해 같은 대화를 재분석할 때는 API 호출이 발생하지 않습니다. 
비용 절감 효과를 확인하려면 Google Cloud Console의 Billing 대시보드에서 일별 비용 추이를 비교하세요.
