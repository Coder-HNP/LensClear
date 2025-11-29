import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider
} from "firebase/auth";
import {
    getFirestore
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDvzrL8zXX0ZYgsdIL8bpRykVeFVepb68s",
    authDomain: "lens-clear.firebaseapp.com",
    projectId: "lens-clear",
    storageBucket: "lens-clear.firebasestorage.app",
    messagingSenderId: "409429034938",
    appId: "1:409429034938:web:0eedd0be4c7cabb3523f83",
    measurementId: "G-KHRZD3BYPF"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);