const CHANNEL_ID = 'UCpr85MloJqbS0kWZ8RLd5-g';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

// Tek bir CORS proxy'ye bağımlı kalmak videoların hiç çekilememesine sebep
// oluyordu (allorigins sık sık kota/yoğunluk hatası veriyor). Birden fazla
// proxy sırayla denenir, ilk çalışan kullanılır.
const CORS_PROXIES = [
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchWithFallback(targetUrl) {
    let lastError;
    for (const buildProxyUrl of CORS_PROXIES) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(buildProxyUrl(targetUrl), { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const text = await response.text();
            if (!text || text.length < 20) throw new Error('Boş yanıt');
            return text;
        } catch (err) {
            lastError = err;
            continue;
        }
    }
    throw lastError || new Error('Tüm proxyler başarısız oldu');
}

async function fetchYouTubeVideos() {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;

    try {
        const xmlText = await fetchWithFallback(RSS_URL);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        if (xmlDoc.querySelector('parsererror')) throw new Error('XML ayrıştırılamadı');

        const entries = xmlDoc.querySelectorAll('entry');
        if (!entries.length) throw new Error('Video bulunamadı');

        const videos = [];
        for (let i = 0; i < Math.min(3, entries.length); i++) {
            const entry = entries[i];
            const videoId = entry.getElementsByTagNameNS('*', 'videoId')[0]?.textContent
                || entry.querySelector('videoId')?.textContent || '';
            videos.push({
                id: videoId,
                title: entry.querySelector('title')?.textContent || 'Video',
                published: formatDate(entry.querySelector('published')?.textContent || ''),
                link: entry.querySelector('link')?.getAttribute('href') || `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''
            });
        }

        renderVideos(videos);
    } catch (error) {
        console.error('YouTube feed error:', error);
        renderError();
    }
}

function renderVideos(videos) {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;
    videosGrid.innerHTML = '';

    videos.forEach((video, index) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.style.animationDelay = `${index * 0.1}s`;
        videoCard.innerHTML = `
            <a href="${video.link}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${escapeAttr(video.title)}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/640x360/1a1a1a/8B00FF?text=CREW+SMP'">
                </div>
                <div class="video-info">
                    <h3 class="video-title">${escapeHtml(video.title)}</h3>
                    <p class="video-date">${video.published}</p>
                </div>
            </a>
        `;
        videosGrid.appendChild(videoCard);
    });

    const style = document.createElement('style');
    style.textContent = `.video-card { animation: fadeInUp 0.6s ease-out both; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`;
    document.head.appendChild(style);
}

function renderError() {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;
    videosGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <p style="font-size: 3rem; margin-bottom: 1rem;">😔</p>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Videolar Yüklenemedi</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">YouTube beslemesine şu an ulaşılamıyor. Doğrudan kanalı ziyaret edebilirsiniz.</p>
            <a href="https://www.youtube.com/channel/${CHANNEL_ID}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-small">YouTube Kanalına Git</a>
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const diff = new Date() - new Date(dateString);
    const days = Math.floor(diff / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (years > 0) return `${years} yıl önce`;
    if (months > 0) return `${months} ay önce`;
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

function escapeAttr(text) {
    return escapeHtml(text).replace(/"/g, '&quot;');
}

// ---------- Kanal / Profil fotoğrafı çekme ----------
// YouTube RSS akışı avatar döndürmez. unavatar.io herhangi bir API key
// gerektirmeden YouTube handle/kanal ID'sinden profil fotoğrafı getirir.
// Elemanın data-yt-avatar özniteliğindeki handle/ID kullanılarak img.src
// otomatik doldurulur; hata halinde mevcut src (varsa) korunur.
function loadChannelAvatars() {
    document.querySelectorAll('img[data-yt-avatar]').forEach((img) => {
        const handle = img.getAttribute('data-yt-avatar');
        if (!handle) return;
        const avatarUrl = `https://unavatar.io/youtube/${encodeURIComponent(handle)}`;
        const testImg = new Image();
        testImg.onload = () => { img.src = avatarUrl; };
        testImg.onerror = () => { /* mevcut placeholder/src korunur */ };
        testImg.src = avatarUrl;
    });
}

if (document.getElementById('videosGrid')) { fetchYouTubeVideos(); }
loadChannelAvatars();

console.log('📺 YouTube Integration Loaded (multi-proxy + avatar fetch)');
