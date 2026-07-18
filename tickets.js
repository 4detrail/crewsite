import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore, collection, addDoc, query, where, orderBy,
    onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const db = getFirestore(app);

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

onAuthStateChanged(auth, (user) => {
    const loginPrompt = document.getElementById('loginPrompt');
    const ticketSection = document.getElementById('ticketSection');
    if (user) {
        loginPrompt.style.display = 'none';
        ticketSection.style.display = 'block';
        loadUserTickets(user);
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
        if (!user) { showNotification('L\u00FCtfen giri\u015F yap\u0131n!', 'error'); return; }

        const title = document.getElementById('ticketTitle').value;
        const category = document.getElementById('ticketCategory').value;
        const description = document.getElementById('ticketDescription').value;

        if (!title || !category || !description) {
            showNotification('L\u00FCtfen t\u00FCm alanlar\u0131 doldurun!', 'error');
            return;
        }

        try {
            await addDoc(collection(db, 'launcher_tickets'), {
                userId: user.uid, userEmail: user.email,
                title, category, description, status: 'open',
                createdAt: serverTimestamp(), updatedAt: serverTimestamp()
            });
            showNotification('Destek talebiniz olu\u015Fturuldu!', 'success');
            ticketForm.reset();
            loadUserTickets(user);
        } catch (error) {
            showNotification('Ticket olu\u015Fturulurken hata olu\u015Ftu!', 'error');
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
                ticketsList.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCAC</div><p>Hen\u00FCz destek talebiniz yok</p></div>';
                return;
            }
            ticketsList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                ticketsList.appendChild(createTicketElement(doc.data(), doc.id));
            });
        });
    } catch (error) {
        ticketsList.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDE14</div><p>Ticketlar y\u00FCklenirken hata olu\u015Ftu</p></div>';
    }
}

function createTicketElement(ticket, ticketId) {
    const ticketItem = document.createElement('div');
    ticketItem.className = 'ticket-item';
    const createdAt = ticket.createdAt?.toDate ? formatDate(ticket.createdAt.toDate()) : 'Bilinmiyor';
    const statusClass = ticket.status === 'open' ? 'open' : 'closed';
    const statusText = ticket.status === 'open' ? 'A\u00E7\u0131k' : 'Kapal\u0131';

    ticketItem.innerHTML = `
        <div class="ticket-header">
            <h3 class="ticket-title">${escapeHtml(ticket.title)}</h3>
            <span class="ticket-status ${statusClass}">${statusText}</span>
        </div>
        <span class="ticket-category">\uD83D\uDCC1 ${getCategoryName(ticket.category)}</span>
        <p class="ticket-description">${escapeHtml(ticket.description)}</p>
        <div class="ticket-footer">
            <span>Olu\u015Fturulma: ${createdAt}</span>
            <span>#${ticketId.substring(0, 8)}</span>
        </div>
    `;
    return ticketItem;
}

function getCategoryName(category) {
    const categories = { 'teknik': 'Teknik Sorun', 'hesap': 'Hesap Sorunu', 'ban': 'Ban/Ceza \u0130tiraz\u0131', '\u00F6neri': '\u00D6neri', 'diger': 'Di\u011Fer' };
    return categories[category] || category;
}

function formatDate(date) {
    if (!date) return 'Bilinmiyor';
    const diff = new Date() - date;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    if (days > 7) return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' });
    if (days > 0) return `${days} g\u00FCn \u00F6nce`;
    if (hours > 0) return `${hours} saat \u00F6nce`;
    if (minutes > 0) return `${minutes} dakika \u00F6nce`;
    return 'Az \u00F6nce';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('\uD83C\uDFAB Ticket System Loaded');