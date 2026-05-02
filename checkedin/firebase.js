import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
  apiKey: "AIzaSyD3C6fQ6q6ZVL_SdOeGefjv7LsYx3OMJDw",
  authDomain: "checkedin-app-e5688.firebaseapp.com",
  projectId: "checkedin-app-e5688",
  storageBucket: "checkedin-app-e5688.firebasestorage.app",
  messagingSenderId: "133359152998",
  appId: "1:133359152998:web:2b019cf1ef293326fce2a7",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);