import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore, collection, addDoc, doc, updateDoc, query, where, orderBy,
    onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirebaseApp } from './firebase-config.js';
import { isAdmin, showNotification } from './admin.js';

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentUserIsAdmin = false;

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    const loginPrompt = document.getElementById('loginPrompt');
    const ticketSection = document.getElementById('ticketSection');
    if (user) {
        loginPrompt.style.display = 'none';
        ticketSection.style.display = 'block';
        currentUserIsAdmin = await isAdmin(user.uid);
        document.getElementById('adminBadgeArea')?.classList.toggle('show', currentUserIsAdmin);
        if (currentUserIsAdmin) {
            loadAllTicketsForAdmin();
            document.getElementById('myTicketsCard').style.display = 'none';
            document.getElementById('adminTicketsCard').style.display = 'block';
        } else {
            loadUserTickets(user);
            document.getElementById('myTicketsCard').style.display = 'block';
            document.getElementById('adminTicketsCard').style.display = 'none';
        }
    } else {
        loginPrompt.style.display = 'block';
        ticketSection.style.display = 'none';
    }
});

const ticketForm = document.getElementById('ticketForm');
if (ticketForm) {
    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) { showNotification('Lütfen giriş yapın!', 'error'); return; }

        const title = document.getElementById('ticketTitle').value;
        const category = document.getElementById('ticketCategory').value;
        const description = document.getElementById('ticketDescription').value;

        if (!title || !category || !description) {
            showNotification('Lütfen tüm alanları doldurun!', 'error');
            return;
        }

        try {
            await addDoc(collection(db, 'launcher_tickets'), {
                userId: user.uid, userEmail: user.email,
                title, category, description, status: 'open',
                adminReply: '', repliedBy: '', repliedAt: null,
                createdAt: serverTimestamp(), updatedAt: serverTimestamp()
            });
            showNotification('Destek talebiniz oluşturuldu!', 'success');
            ticketForm.reset();
        } catch (error) {
            showNotification('Ticket oluşturulurken hata oluştu!', 'error');
        }
    });
}

async function loadUserTickets(user) {
    const ticketsList = document.getElementById('ticketsList');
    if (!ticketsList) return;

    try {
        const q = query(collection(db, 'launcher_tickets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                ticketsList.innerHTML = '<div class="empty-state"><div class="empty-icon">📬</div><p>Henüz destek talebiniz yok</p></div>';
                return;
            }
            ticketsList.innerHTML = '';
            querySnapshot.forEach((docSnap) => {
                ticketsList.appendChild(createTicketElement(docSnap.data(), docSnap.id, false));
            });
        });
    } catch (error) {
        ticketsList.innerHTML = '<div class="empty-state"><div class="empty-icon">😔</div><p>Ticketlar yüklenirken hata oluştu</p></div>';
    }
}

function loadAllTicketsForAdmin() {
    const ticketsList = document.getElementById('adminTicketsList');
    if (!ticketsList) return;

    try {
        const q = query(collection(db, 'launcher_tickets'), orderBy('createdAt', 'desc'));
        onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                ticketsList.innerHTML = '<div class="empty-state"><div class="empty-icon">📬</div><p>Henüz hiç destek talebi yok</p></div>';
                return;
            }
            ticketsList.innerHTML = '';
            querySnapshot.forEach((docSnap) => {
                ticketsList.appendChild(createTicketElement(docSnap.data(), docSnap.id, true));
            });
        });
    } catch (error) {
        ticketsList.innerHTML = '<div class="empty-state"><div class="empty-icon">😔</div><p>Ticketlar yüklenirken hata oluştu</p></div>';
    }
}

function createTicketElement(ticket, ticketId, adminView) {
    const ticketItem = document.createElement('div');
    ticketItem.className = 'ticket-item';
    const createdAt = ticket.createdAt?.toDate ? formatDate(ticket.createdAt.toDate()) : 'Bilinmiyor';
    const statusClass = ticket.status === 'open' ? 'open' : 'closed';
    const statusText = ticket.status === 'open' ? 'Açık' : 'Kapalı';

    let replyHtml = '';
    if (ticket.adminReply) {
        replyHtml = `
        <div class="ticket-admin-reply">
            <span class="reply-badge">🛡️ Admin Yanıtı${ticket.repliedBy ? ' — ' + escapeHtml(ticket.repliedBy) : ''}</span>
            <p>${escapeHtml(ticket.adminReply)}</p>
        </div>`;
    }

    let adminControls = '';
    if (adminView) {
        adminControls = `
        <div class="ticket-admin-controls">
            <span class="ticket-owner">👤 ${escapeHtml(ticket.userEmail || 'bilinmiyor')}</span>
            <textarea class="form-input ticket-reply-input" rows="2" placeholder="Yanıt yazın...">${escapeHtml(ticket.adminReply || '')}</textarea>
            <div class="ticket-admin-actions">
                <button class="btn btn-primary btn-small reply-btn">Yanıtla</button>
                <button class="btn btn-outline btn-small toggle-status-btn">${ticket.status === 'open' ? 'Kapat' : 'Yeniden Aç'}</button>
            </div>
        </div>`;
    }

    ticketItem.innerHTML = `
        <div class="ticket-header">
            <h3 class="ticket-title">${escapeHtml(ticket.title)}</h3>
            <span class="ticket-status ${statusClass}">${statusText}</span>
        </div>
        <span class="ticket-category">📁 ${getCategoryName(ticket.category)}</span>
        <p class="ticket-description">${escapeHtml(ticket.description)}</p>
        ${replyHtml}
        <div class="ticket-footer">
            <span>Oluşturulma: ${createdAt}</span>
            <span>#${ticketId.substring(0, 8)}</span>
        </div>
        ${adminControls}
    `;

    if (adminView) {
        const replyBtn = ticketItem.querySelector('.reply-btn');
        const textarea = ticketItem.querySelector('.ticket-reply-input');
        const toggleBtn = ticketItem.querySelector('.toggle-status-btn');

        replyBtn.addEventListener('click', async () => {
            if (!currentUserIsAdmin) { showNotification('Bu işlem için admin yetkiniz yok!', 'error'); return; }
            const replyText = textarea.value.trim();
            if (!replyText) { showNotification('Yanıt boş olamaz!', 'error'); return; }
            try {
                await updateDoc(doc(db, 'launcher_tickets', ticketId), {
                    adminReply: replyText,
                    repliedBy: currentUser?.email || 'Admin',
                    repliedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                showNotification('Yanıt gönderildi!', 'success');
            } catch (error) {
                showNotification('Yanıt gönderilirken hata oluştu! (Firestore kurallarını kontrol edin)', 'error');
            }
        });

        toggleBtn.addEventListener('click', async () => {
            if (!currentUserIsAdmin) { showNotification('Bu işlem için admin yetkiniz yok!', 'error'); return; }
            try {
                await updateDoc(doc(db, 'launcher_tickets', ticketId), {
                    status: ticket.status === 'open' ? 'closed' : 'open',
                    updatedAt: serverTimestamp()
                });
            } catch (error) {
                showNotification('Durum güncellenirken hata oluştu!', 'error');
            }
        });
    }

    return ticketItem;
}

function getCategoryName(category) {
    const categories = { 'teknik': 'Teknik Sorun', 'hesap': 'Hesap Sorunu', 'ban': 'Ban/Ceza İtirazı', 'öneri': 'Öneri', 'diger': 'Diğer' };
    return categories[category] || category;
}

function formatDate(date) {
    if (!date) return 'Bilinmiyor';
    const diff = new Date() - date;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    if (days > 7) return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' });
    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

console.log('🎫 Ticket System Loaded (admin-enabled)');
