// Admin yetkisi kontrol yardımcı modülü
// Bir kullanıcının admin olup olmadığı, Firestore'daki "admins" koleksiyonunda
// kendi UID'si ile bir doküman olup olmadığına bakılarak belirlenir.
// ÖNEMLİ (GÜVENLİK): Bu istemci taraflı kontrol sadece ARAYÜZÜ gizler/gösterir.
// Gerçek güvenlik, Firestore Security Rules ile sağlanmalıdır (bkz. firestore.rules).
// Bir kullanıcıyı admin yapmak için Firebase Console > Firestore Database içinde
// "admins" koleksiyonuna, UID'sini doküman ID'si yaparak boş bir doküman eklemeniz yeterlidir.
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirebaseApp } from './firebase-config.js';

const db = getFirestore(getFirebaseApp());

export async function isAdmin(uid) {
    if (!uid) return false;
    try {
        const snap = await getDoc(doc(db, 'admins', uid));
        return snap.exists();
    } catch (err) {
        console.error('Admin kontrolü başarısız:', err);
        return false;
    }
}

export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 100px; right: 2rem;
        background: ${type === 'success' ? 'var(--purple-primary, #8B00FF)' : '#ff4444'};
        color: white; padding: 1rem 1.5rem; border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); z-index: 10000;
        font-weight: 600; animation: slideInRight 0.3s ease-out;
        max-width: 90vw;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}
