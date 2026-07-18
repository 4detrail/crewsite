// Ortak Firebase yapılandırması
// Bu dosya tüm sayfalarda tek bir Firebase App örneği kullanılmasını sağlar.
// Aynı config birden fazla dosyada ayrı ayrı initializeApp() ile çağrılırsa
// "Firebase App named '[DEFAULT]' already exists" hatası oluşabiliyordu.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

export const firebaseConfig = {
    apiKey: "AIzaSyC4Pok6O8s3NU4ImmfOWSDdoBMt3uDTbLw",
    authDomain: "crew-universe.firebaseapp.com",
    projectId: "crew-universe",
    storageBucket: "crew-universe.firebasestorage.app",
    messagingSenderId: "365765069306",
    appId: "1:365765069306:web:2ecd7e320215c09b027c43",
    measurementId: "G-MQ5PZLD16W"
};

export function getFirebaseApp() {
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
