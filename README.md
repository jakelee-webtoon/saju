This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# PortOne (구 아임포트) 설정
# 테스트용 Merchant ID (실제 결제를 위해서는 포트원 가입 후 발급받은 ID를 사용하세요)
NEXT_PUBLIC_PORTONE_MERCHANT_ID=imp00000000

# PortOne API 키 (서버 사이드 결제 검증용, 선택사항)
# 실제 결제 검증을 위해서는 포트원 대시보드에서 발급받은 키를 사용하세요
# PORTONE_API_KEY=your_api_key_here
# PORTONE_API_SECRET=your_api_secret_here

# 네이버 로그인 설정
# 네이버 개발자 센터(https://developers.naver.com)에서 발급받은 Client ID와 Secret을 입력하세요
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 카카오 로그인 설정
# 카카오 개발자 센터(https://developers.kakao.com)에서 발급받은 JavaScript 키를 입력하세요
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key

# Google AI (Gemini) API 설정
# Google AI Studio(https://makersuite.google.com/app/apikey)에서 발급받은 API 키를 입력하세요
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

**참고**: 
- 테스트 환경에서는 `imp00000000`을 사용할 수 있습니다.
- 실제 결제를 위해서는 [포트원](https://portone.io)에 가입 후 발급받은 Merchant ID를 사용하세요.
- 네이버/카카오 로그인을 사용하려면 각각 개발자 센터에서 앱을 등록하고 Client ID/Secret을 발급받아야 합니다.

### 개발 서버 실행

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
