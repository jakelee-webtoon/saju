// Firebase 설정 파일
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB1I_EoZ4LaPmB3Y8OntQP0g9gSf1bKhyE",
  authDomain: "saju-app-a4eb6.firebaseapp.com",
  projectId: "saju-app-a4eb6",
  storageBucket: "saju-app-a4eb6.firebasestorage.app",
  messagingSenderId: "1009908129616",
  appId: "1:1009908129616:web:6c5fe1c0b85df3b0a0d655",
  measurementId: "G-V7DL2RESW9"
};

// Firebase 앱 초기화 (이미 초기화되어 있으면 기존 앱 사용)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore 인스턴스
export const db = getFirestore(app);

// Auth 인스턴스
export const auth = getAuth(app);

export default app;
