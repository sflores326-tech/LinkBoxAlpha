// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
