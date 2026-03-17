
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXBlSusbXtvNHTXLfM3VAPP8rAmlhNByw",
  authDomain: "brainstorm-trooper.firebaseapp.com",
  projectId: "brainstorm-trooper",
  storageBucket: "brainstorm-trooper.firebasestorage.app",
  messagingSenderId: "1072317149934",
  appId: "1:1072317149934:web:f38d2e28cbf5859ca0f9ff",
  measurementId: "G-RH1Y34NPMG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
