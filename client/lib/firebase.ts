import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoI8-cgoOvvEzAPXTQ0xohtuZJd-4_pO4",
  authDomain: "karaischool-ai-38852612-e32e6.firebaseapp.com",
  projectId: "karaischool-ai-38852612-e32e6",
  storageBucket: "karaischool-ai-38852612-e32e6.firebasestorage.app",
  messagingSenderId: "904460666655",
  appId: "1:904460666655:web:606e9d2f9f3716ba74d22a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
