/**
 * Firebase Admin SDK 초기화
 * 서버 사이드에서만 사용 가능합니다.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;

// Firebase Admin SDK 초기화
if (getApps().length === 0) {
  // 환경 변수에서 서비스 계정 키 가져오기
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let credential = null;

  // 방법 1: 환경 변수에서 JSON 문자열로 제공
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      credential = cert(serviceAccount);
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    }
  }
  // 방법 2: 서비스 계정 키 파일 경로
  else if (serviceAccountPath) {
    try {
      credential = cert(serviceAccountPath);
    } catch (error) {
      console.error("Failed to load service account from file:", error);
    }
  }

  if (credential) {
    adminApp = initializeApp({
      credential,
      projectId: "saju-app-a4eb6",
    });
  } else {
    // 개발 환경에서는 기본 인증 사용 시도 (GCP 환경에서만 작동)
    try {
      adminApp = initializeApp({
        projectId: "saju-app-a4eb6",
      });
    } catch (error) {
      console.error(
        "Firebase Admin SDK 초기화 실패. 서비스 계정 키가 필요합니다.\n" +
        "설정 방법:\n" +
        "1. Firebase Console > 프로젝트 설정 > 서비스 계정\n" +
        "2. '새 비공개 키 생성' 클릭하여 JSON 파일 다운로드\n" +
        "3. .env.local에 추가:\n" +
        "   FIREBASE_SERVICE_ACCOUNT_KEY='{\"type\":\"service_account\",...}'\n" +
        "   또는\n" +
        "   GOOGLE_APPLICATION_CREDENTIALS=\"/path/to/serviceAccountKey.json\""
      );
      throw error;
    }
  }
} else {
  adminApp = getApps()[0];
}

adminDb = getFirestore(adminApp);
adminAuth = getAuth(adminApp);

export { adminDb, adminAuth };
