import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirebaseApp } from './firebase-config.js';
import { showNotification } from './admin.js';

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
// Kullanıcıya her seferinde hesap seçtirir, "sessiz" (tek hesaba sabitlenmiş) hatalı girişleri önler.
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Oturumun tarayıcı kapansa bile kalıcı olmasını sağla (bazı ortamlarda
// varsayılan persistence ayarı Google popup sonrası oturumun "kaybolmuş"
// gibi görünmesine, yani "giriş hatası" izlenimine yol açabiliyordu).
setPersistence(auth, browserLocalPersistence).catch(() => {});

async function saveUserProfile(user, extra = {}) {
    try {
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email || '',
            username: extra.username || user.displayName || (user.email ? user.email.split('@')[0] : 'Oyuncu'),
            photoURL: user.photoURL || '',
            updatedAt: serverTimestamp(),
            createdAt: extra.isNew ? serverTimestamp() : undefined
        }, { merge: true });
    } catch (err) {
        console.error('Profil kaydedilemedi:', err);
    }
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const username = document.getElementById('username').value;

        if (password !== confirmPassword) { showNotification('Şifreler eşleşmiyor!', 'error'); return; }
        if (password.length < 6) { showNotification('Şifre en az 6 karakter olmalıdır!', 'error'); return; }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            localStorage.setItem('username', username);
            await saveUserProfile(userCredential.user, { username, isNew: true });
            showNotification('Hesap başarıyla oluşturuldu!', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } catch (error) {
            showNotification(mapAuthError(error), 'error');
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
            showNotification('Giriş başarılı!', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        } catch (error) {
            showNotification(mapAuthError(error), 'error');
        }
    });
}

const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleRegisterBtn = document.getElementById('googleRegisterBtn');

const handleGoogleSignIn = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await saveUserProfile(result.user, { isNew: true });
        showNotification('Google ile giriş başarılı!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    } catch (error) {
        // Popup engellendiyse veya ortam popup'ı desteklemiyorsa (bazı mobil
        // tarayıcılar / uygulama içi web görünümleri) yönlendirme (redirect)
        // akışına otomatik geç. Bu, "Google ile girişte hata oluyor" sorununun
        // en yaygın sebebiydi.
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            return; // kullanıcı kendi kapattı, hata gösterme
        }
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
            showNotification('Popup engellendi, yönlendiriliyorsunuz...', 'success');
            try { await signInWithRedirect(auth, googleProvider); } catch (redirectErr) {
                showNotification(mapAuthError(redirectErr), 'error');
            }
            return;
        }
        showNotification(mapAuthError(error), 'error');
    }
};

googleLoginBtn?.addEventListener('click', handleGoogleSignIn);
googleRegisterBtn?.addEventListener('click', handleGoogleSignIn);

// Sayfa signInWithRedirect sonrası tekrar yüklendiğinde sonucu yakala.
getRedirectResult(auth).then(async (result) => {
    if (result?.user) {
        await saveUserProfile(result.user, { isNew: true });
        showNotification('Google ile giriş başarılı!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    }
}).catch((error) => {
    if (error.code) showNotification(mapAuthError(error), 'error');
});

function mapAuthError(error) {
    const code = error?.code || '';
    const map = {
        'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor!',
        'auth/invalid-email': 'Geçersiz e-posta adresi!',
        'auth/weak-password': 'Şifre çok zayıf!',
        'auth/user-not-found': 'Hatalı e-posta veya şifre!',
        'auth/wrong-password': 'Hatalı e-posta veya şifre!',
        'auth/invalid-credential': 'Hatalı e-posta veya şifre!',
        'auth/too-many-requests': 'Çok fazla başarısız deneme! Lütfen daha sonra tekrar deneyin.',
        'auth/unauthorized-domain': "Bu site alan adı Firebase Console'da yetkilendirilmemiş. (Authentication > Settings > Authorized domains kısmına bu domaini ekleyin.)",
        'auth/operation-not-allowed': "Google ile giriş, Firebase Console'da etkinleştirilmemiş görünüyor. (Authentication > Sign-in method > Google)",
        'auth/network-request-failed': 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.'
    };
    return map[code] || 'İşlem sırasında bir hata oluştu! (' + (code || 'bilinmiyor') + ')';
}

export { auth, googleProvider };
