// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    // ⚠️ QUI DEVI INCOLLARE LA TUA API KEY REALE TRA LE VIRGOLETTE
    apiKey: "AIzaSyBWCYCtZRTDe8x_Pprkuwq950II8YZeU9M",

    authDomain: "cronacheapp.firebaseapp.com",
    projectId: "cronacheapp",
    storageBucket: "cronacheapp.firebasestorage.app",
    messagingSenderId: "83972958279",
    appId: "1:83972958279:web:68fa88c13c37ca61be6962",
    measurementId: "G-KMWWZV6EB9"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta il database per usarlo nel resto del sito
export const db = getFirestore(app);