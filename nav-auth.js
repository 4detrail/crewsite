// Tüm sayfalarda ortak navbar oturum durumu yönetimi.
// Giriş/Çıkış butonunu ve admin rozetini günceller.
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirebaseApp } from './firebase-config.js';
import { isAdmin, showNotification } from './admin.js';

const auth = getAuth(getFirebaseApp());

onAuthStateChanged(auth, async (user) => {
    const navCta = document.querySelector('.nav-cta');
    const profileLink = document.querySelector('.nav-link[href="profile.html"]');

    if (user) {
        if (navCta) {
            navCta.textContent = 'Çıkış Yap';
            navCta.href = '#';
            navCta.onclick = async (e) => {
                e.preventDefault();
                try {
                    await signOut(auth);
                    showNotification('Çıkış yapıldı!', 'success');
                    setTimeout(() => { window.location.href = 'index.html'; }, 800);
                } catch (error) {
                    showNotification('Çıkış yapılırken hata oluştu!', 'error');
                }
            };
        }

        const admin = await isAdmin(user.uid);
        if (admin) {
            document.body.classList.add('is-admin');
            if (profileLink && !document.querySelector('.admin-tag')) {
                const tag = document.createElement('span');
                tag.className = 'admin-tag';
                tag.textContent = 'ADMIN';
                profileLink.appendChild(tag);
            }
        }
    } else {
        if (navCta) {
            navCta.textContent = 'Giriş Yap';
            navCta.href = 'login.html';
            navCta.onclick = null;
        }
        document.body.classList.remove('is-admin');
    }
});
