import { getAuth, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirebaseApp } from './firebase-config.js';
import { isAdmin, showNotification } from './admin.js';

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/identicon/svg?seed=';

onAuthStateChanged(auth, async (user) => {
    const loggedOut = document.getElementById('profileLoggedOut');
    const loggedIn = document.getElementById('profileLoggedIn');

    if (!user) {
        loggedOut.style.display = 'block';
        loggedIn.style.display = 'none';
        return;
    }

    loggedOut.style.display = 'none';
    loggedIn.style.display = 'block';

    let profileData = {};
    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) profileData = snap.data();
    } catch (err) {
        console.error('Profil verisi alınamadı:', err);
    }

    const username = profileData.username || user.displayName || (user.email ? user.email.split('@')[0] : 'Oyuncu');
    const photo = profileData.photoURL || user.photoURL || (DEFAULT_AVATAR + encodeURIComponent(user.uid));
    const joined = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

    document.getElementById('profileAvatar').src = photo;
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileEmail').textContent = user.email || '—';
    document.getElementById('profileJoined').textContent = 'Katılım: ' + joined;
    document.getElementById('editUsername').value = username;
    document.getElementById('editPhoto').value = profileData.photoURL || '';
    document.getElementById('statProvider').textContent = user.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'E-posta / Şifre';
    document.getElementById('statVerified').textContent = user.emailVerified ? 'Evet ✅' : 'Hayır';
    document.getElementById('statUid').textContent = user.uid;

    const admin = await isAdmin(user.uid);
    document.getElementById('profileAdminBadge').style.display = admin ? 'inline-flex' : 'none';
});

document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const username = document.getElementById('editUsername').value.trim();
    const photoURL = document.getElementById('editPhoto').value.trim();

    if (!username) { showNotification('Kullanıcı adı boş olamaz!', 'error'); return; }

    try {
        await setDoc(doc(db, 'users', user.uid), {
            username, photoURL,
            email: user.email || '',
            updatedAt: serverTimestamp()
        }, { merge: true });

        try { await updateProfile(user, { displayName: username, photoURL: photoURL || undefined }); } catch (_) {}

        localStorage.setItem('username', username);
        document.getElementById('profileUsername').textContent = username;
        if (photoURL) document.getElementById('profileAvatar').src = photoURL;
        showNotification('Profil güncellendi!', 'success');
    } catch (error) {
        showNotification('Profil güncellenirken hata oluştu!', 'error');
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showNotification('Çıkış yapıldı!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch (error) {
        showNotification('Çıkış yapılırken hata oluştu!', 'error');
    }
});

console.log('👤 Profil Sayfası Yüklendi');
