import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyC4Pok6O8s3NU4ImmfOWSDdoBMt3uDTbLw",
    authDomain: "crew-universe.firebaseapp.com",
    projectId: "crew-universe",
    storageBucket: "crew-universe.firebasestorage.app",
    messagingSenderId: "365765069306",
    appId: "1:365765069306:web:2ecd7e320215c09b027c43",
    measurementId: "G-MQ5PZLD16W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 100px; right: 2rem;
        background: ${type === 'success' ? '#8B00FF' : '#ff4444'};
        color: white; padding: 1rem 1.5rem; border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); z-index: 10000;
        font-weight: 600; animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const displayName = user.displayName || localStorage.getItem('username') || 'Oyuncu';
    const email = user.email || '-';
    const photoURL = user.photoURL;
    const emailVerified = user.emailVerified;
    const createdAt = user.metadata.creationTime;
    const lastSignIn = user.metadata.lastSignInTime;
    const providerData = user.providerData;
    const isGoogle = providerData && providerData.length > 0 && providerData[0].providerId === 'google.com';

    document.getElementById('profileName').textContent = displayName;
    document.getElementById('profileEmail').textContent = email;

    const letter = displayName.charAt(0).toUpperCase();
    document.getElementById('avatarLetter').textContent = letter;

    document.getElementById('statJoined').textContent = formatDate(createdAt);
    document.getElementById('lastLogin').textContent = formatDate(lastSignIn);
    document.getElementById('emailVerified').textContent = emailVerified ? '✅ Doğrulanmış' : '❌ Doğrulanmamış';
    document.getElementById('loginMethod').textContent = isGoogle ? '🔵 Google' : '📧 E-posta';

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showNotification('Çıkış yapıldı!', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        } catch (error) {
            showNotification('Çıkış yapılırken hata oluştu!', 'error');
        }
    });
});
