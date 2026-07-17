import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
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
const googleProvider = new GoogleAuthProvider();

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

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const username = document.getElementById('username').value;

        if (password !== confirmPassword) { showNotification('\u015Eifreler e\u015Fle\u015Fmiyor!', 'error'); return; }
        if (password.length < 6) { showNotification('\u015Eifre en az 6 karakter olmal\u0131d\u0131r!', 'error'); return; }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            localStorage.setItem('username', username);
            showNotification('Hesap ba\u015Far\u0131yla olu\u015Fturuldu!', 'success');
            setTimeout(() => { window.location.href = 'profile.html'; }, 1500);
        } catch (error) {
            let errorMessage = 'Kay\u0131t s\u0131ras\u0131nda bir hata olu\u015Ftu!';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'Bu e-posta adresi zaten kullan\u0131l\u0131yor!';
            else if (error.code === 'auth/invalid-email') errorMessage = 'Ge\u00E7ersiz e-posta adresi!';
            else if (error.code === 'auth/weak-password') errorMessage = '\u015Eifre \u00E7ok zay\u0131f!';
            showNotification(errorMessage, 'error');
        }
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showNotification('Giri\u015F ba\u015Far\u0131l\u0131!', 'success');
            setTimeout(() => { window.location.href = 'profile.html'; }, 1500);
        } catch (error) {
            let errorMessage = 'Giri\u015F s\u0131ras\u0131nda bir hata olu\u015Ftu!';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') errorMessage = 'Hatal\u0131 e-posta veya \u015Fifre!';
            else if (error.code === 'auth/invalid-email') errorMessage = 'Ge\u00E7ersiz e-posta adresi!';
            else if (error.code === 'auth/too-many-requests') errorMessage = '\u00C7ok fazla ba\u015Far\u0131s\u0131z deneme! L\u00FCtfen daha sonra tekrar deneyin.';
            showNotification(errorMessage, 'error');
        }
    });
}

const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleRegisterBtn = document.getElementById('googleRegisterBtn');

const handleGoogleSignIn = async (e) => {
    if (e) e.preventDefault();
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        localStorage.setItem('username', user.displayName || 'Oyuncu');
        showNotification('Google ile giri\u015F ba\u015Far\u0131l\u0131!', 'success');
        setTimeout(() => { window.location.href = 'profile.html'; }, 1500);
    } catch (error) {
        console.error('Google giri\u015F hatas\u0131:', error.code, error.message);
        if (error.code === 'auth/popup-closed-by-user') return;
        if (error.code === 'auth/cancelled-popup-request') return;
        if (error.code === 'auth/popup-blocked') {
            showNotification('Pop-up engellendi! L\u00FCtfen pop-up engelleyicisini kapat\u0131n.', 'error');
        } else if (error.code === 'auth/unauthorized-domain') {
            showNotification('Bu alan ad\u0131nda Google giri\u015F yap\u0131lam\u0131yor. Firebase konsolunda alan ad\u0131n\u0131z\u0131 do\u011Frulay\u0131n.', 'error');
        } else if (error.code === 'auth/operation-not-allowed') {
            showNotification('Google giri\u015F y\u00F6ntemi aktif de\u011Fil. Firebase konsolundan etkinle\u015Ftirin.', 'error');
        } else {
            showNotification('Google ile giri\u015F s\u0131ras\u0131nda hata: ' + (error.message || 'Bilinmeyen hata'), 'error');
        }
    }
};

googleLoginBtn?.addEventListener('click', handleGoogleSignIn);
googleRegisterBtn?.addEventListener('click', handleGoogleSignIn);

onAuthStateChanged(auth, (user) => {
    const navCta = document.querySelector('.nav-cta');
    if (user) {
        if (navCta) {
            navCta.textContent = 'Profilim';
            navCta.href = 'profile.html';
        }
    } else {
        if (navCta && navCta.textContent.includes('rofil')) {
            navCta.textContent = 'Giri\u015F Yap';
            navCta.href = 'login.html';
        }
    }
});

export { auth, googleProvider };