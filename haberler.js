import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy,
    onSnapshot, serverTimestamp, where, getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirebaseApp } from './firebase-config.js';
import { isAdmin, showNotification } from './admin.js';

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentUserIsAdmin = false;
let selectedType = 'news';
let fieldCounter = 0;

// ---------- Admin: içerik oluşturma paneli ----------
const typeButtons = document.querySelectorAll('.type-btn');
const formFieldsBuilder = document.getElementById('formFieldsBuilder');
const fieldsList = document.getElementById('fieldsList');
const addFieldBtn = document.getElementById('addFieldBtn');
const newsForm = document.getElementById('newsForm');

typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.dataset.type;
        formFieldsBuilder.style.display = selectedType === 'form' ? 'block' : 'none';
    });
});

function addFieldRow(label = '', type = 'text') {
    fieldCounter++;
    const id = 'f' + fieldCounter;
    const row = document.createElement('div');
    row.className = 'field-row';
    row.dataset.fieldId = id;
    row.innerHTML = `
        <input type="text" class="form-input field-label-input" placeholder="Soru metni" value="${label}">
        <select class="form-input field-type-select">
            <option value="text" ${type === 'text' ? 'selected' : ''}>Kısa Metin</option>
            <option value="textarea" ${type === 'textarea' ? 'selected' : ''}>Uzun Metin</option>
        </select>
        <button type="button" class="remove-field-btn" title="Kaldır">✕</button>
    `;
    row.querySelector('.remove-field-btn').addEventListener('click', () => row.remove());
    fieldsList.appendChild(row);
}

addFieldBtn?.addEventListener('click', () => addFieldRow());

if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserIsAdmin) { showNotification('Bu işlem için admin yetkiniz yok!', 'error'); return; }

        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const imageUrl = document.getElementById('postImage').value.trim();

        if (!title || !content) { showNotification('Lütfen başlık ve içerik girin!', 'error'); return; }

        let formFields = [];
        if (selectedType === 'form') {
            const rows = fieldsList.querySelectorAll('.field-row');
            formFields = Array.from(rows).map((row, i) => ({
                id: 'q' + i,
                label: row.querySelector('.field-label-input').value.trim() || `Soru ${i + 1}`,
                type: row.querySelector('.field-type-select').value
            }));
            if (formFields.length === 0) { showNotification('Formda en az 1 soru olmalı!', 'error'); return; }
        }

        try {
            await addDoc(collection(db, 'news'), {
                title, content, imageUrl,
                type: selectedType,
                formFields,
                createdBy: currentUser.uid,
                createdByEmail: currentUser.email,
                createdAt: serverTimestamp()
            });
            showNotification('Yayınlandı!', 'success');
            newsForm.reset();
            fieldsList.innerHTML = '';
        } catch (error) {
            showNotification('Yayınlanırken hata oluştu! (Firestore kurallarını kontrol edin)', 'error');
        }
    });
}

// ---------- Genel akış ----------
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    currentUserIsAdmin = user ? await isAdmin(user.uid) : false;
    document.getElementById('adminPanelSection').style.display = currentUserIsAdmin ? 'block' : 'none';
    loadFeed();
});

function loadFeed() {
    const feed = document.getElementById('newsFeed');
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            feed.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Henüz paylaşım yok</p></div>';
            return;
        }
        feed.innerHTML = '';
        snapshot.forEach((docSnap) => {
            feed.appendChild(renderPost(docSnap.data(), docSnap.id));
        });
    }, () => {
        feed.innerHTML = '<div class="empty-state"><div class="empty-icon">😔</div><p>İçerikler yüklenirken hata oluştu</p></div>';
    });
}

function renderPost(post, postId) {
    const card = document.createElement('article');
    card.className = 'news-card';
    const createdAt = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    let adminDelete = '';
    if (currentUserIsAdmin) {
        adminDelete = `<button class="news-delete-btn" title="Sil">🗑️</button>`;
    }

    card.innerHTML = `
        <div class="news-card-header">
            <span class="news-type-badge ${post.type === 'form' ? 'form' : 'news'}">${post.type === 'form' ? '📋 Form' : '📰 Haber'}</span>
            <span class="news-date">${createdAt}</span>
            ${adminDelete}
        </div>
        ${post.imageUrl ? `<div class="news-image"><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : ''}
        <h3 class="news-title">${escapeHtml(post.title)}</h3>
        <p class="news-content">${escapeHtml(post.content)}</p>
        <div class="news-form-area"></div>
        <div class="news-responses-area"></div>
    `;

    card.querySelector('.news-delete-btn')?.addEventListener('click', async () => {
        if (!confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDoc(doc(db, 'news', postId));
            showNotification('Silindi', 'success');
        } catch { showNotification('Silinirken hata oluştu!', 'error'); }
    });

    if (post.type === 'form') {
        renderFormArea(card.querySelector('.news-form-area'), post, postId);
        if (currentUserIsAdmin) renderResponsesArea(card.querySelector('.news-responses-area'), postId);
    }

    return card;
}

function renderFormArea(container, post, postId) {
    if (!currentUser) {
        container.innerHTML = `<p class="form-login-hint">Bu formu yanıtlamak için <a href="login.html" class="policy-link">giriş yapın</a>.</p>`;
        return;
    }

    const form = document.createElement('form');
    form.className = 'ticket-form news-response-form';
    form.innerHTML = (post.formFields || []).map(f => `
        <div class="form-group">
            <label class="form-label">${escapeHtml(f.label)}</label>
            ${f.type === 'textarea'
                ? `<textarea class="form-input" data-field-id="${f.id}" rows="3" required></textarea>`
                : `<input type="text" class="form-input" data-field-id="${f.id}" required>`
            }
        </div>
    `).join('') + `<button type="submit" class="btn btn-primary btn-small">Gönder</button>`;

    // Daha önce yanıtlanmış mı kontrol et
    getDocs(query(collection(db, 'news', postId, 'responses'), where('userId', '==', currentUser.uid)))
        .then(snap => {
            if (!snap.empty) {
                container.innerHTML = `<p class="form-login-hint">✅ Bu formu zaten yanıtladınız. Teşekkürler!</p>`;
            } else {
                container.appendChild(form);
            }
        }).catch(() => { container.appendChild(form); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const answers = {};
        form.querySelectorAll('[data-field-id]').forEach(input => {
            answers[input.dataset.fieldId] = input.value.trim();
        });
        try {
            await addDoc(collection(db, 'news', postId, 'responses'), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                answers,
                createdAt: serverTimestamp()
            });
            showNotification('Yanıtınız gönderildi!', 'success');
            container.innerHTML = `<p class="form-login-hint">✅ Bu formu zaten yanıtladınız. Teşekkürler!</p>`;
        } catch (error) {
            showNotification('Yanıt gönderilirken hata oluştu!', 'error');
        }
    });
}

function renderResponsesArea(container, postId) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn btn-outline btn-small';
    toggle.textContent = 'Yanıtları Gör';
    const list = document.createElement('div');
    list.className = 'responses-list';
    list.style.display = 'none';

    toggle.addEventListener('click', async () => {
        const showing = list.style.display !== 'none';
        list.style.display = showing ? 'none' : 'block';
        toggle.textContent = showing ? 'Yanıtları Gör' : 'Yanıtları Gizle';
        if (!showing && !list.dataset.loaded) {
            list.dataset.loaded = '1';
            try {
                const snap = await getDocs(collection(db, 'news', postId, 'responses'));
                if (snap.empty) {
                    list.innerHTML = '<p class="form-login-hint">Henüz yanıt yok.</p>';
                    return;
                }
                list.innerHTML = '';
                snap.forEach(r => {
                    const data = r.data();
                    const answersHtml = Object.values(data.answers || {}).map(v => `<p>• ${escapeHtml(v)}</p>`).join('');
                    const div = document.createElement('div');
                    div.className = 'response-item';
                    div.innerHTML = `<strong>${escapeHtml(data.userEmail || 'bilinmiyor')}</strong>${answersHtml}`;
                    list.appendChild(div);
                });
            } catch {
                list.innerHTML = '<p class="form-login-hint">Yanıtlar yüklenemedi.</p>';
            }
        }
    });

    container.appendChild(toggle);
    container.appendChild(list);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

console.log('📰 Haberler / Form Sistemi Yüklendi');
