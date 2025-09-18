import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNZLDo49MQQ3fyTaixYXcjtTpFLWMWcZA",
  authDomain: "alphapartslist.firebaseapp.com",
  projectId: "alphapartslist",
  storageBucket: "alphapartslist.firebasestorage.app",
  messagingSenderId: "1077784893523",
  appId: "1:1077784893523:web:6a8b8e162f4d5d5e32cea6",
  measurementId: "G-T8N60ND7B2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
