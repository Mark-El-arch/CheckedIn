import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxIdGmZOVAV-Cu7fuu4ozMvO6pLYYdWeY",
  authDomain: "checkedin-3a722.firebaseapp.com",
  projectId: "checkedin-3a722",
  storageBucket: "checkedin-3a722.firebasestorage.app",
  messagingSenderId: "965132902920",
  appId: "1:965132902920:web:73a43516b595eac45de7bd",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);