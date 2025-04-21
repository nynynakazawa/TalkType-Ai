// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCBsfJUtylylw-eMDDbWb-57czXRVGkLiM",
    authDomain: "talktype-ai.firebaseapp.com",
    projectId: "talktype-ai",
    storageBucket: "talktype-ai.firebasestorage.app",
    messagingSenderId: "20794056947",
    appId: "1:20794056947:web:b025c49ee610c23cdd5786",
    measurementId: "G-1WE8759L0K"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);