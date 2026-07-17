const CHANNEL_ID = 'UCpr85MloJqbS0kWZ8RLd5-g';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

async function fetchYouTubeVideos() {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;

    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(RSS_URL));
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entries = xmlDoc.querySelectorAll('entry');
        const videos = [];

        for (let i = 0; i < Math.min(3, entries.length); i++) {
            const entry = entries[i];
            const videoId = entry.querySelector('videoId')?.textContent || '';
            videos.push({
                id: videoId,
                title: entry.querySelector('title')?.textContent || 'Video',
                published: formatDate(entry.querySelector('published')?.textContent || ''),
                link: entry.querySelector('link')?.getAttribute('href') || '#',
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
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
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/640x360/8B00FF/ffffff?text=Video'">
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
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
            <p style="font-size: 3rem; margin-bottom: 1rem;">\uD83D\uDE14</p>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Videolar Y\u00FCklenemedi</h3>
            <p style="color: var(--text-secondary);">L\u00FCtfen daha sonra tekrar deneyin.</p>
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

    if (years > 0) return `${years} y\u0131l \u00F6nce`;
    if (months > 0) return `${months} ay \u00F6nce`;
    if (days > 0) return `${days} g\u00FCn \u00F6nce`;
    if (hours > 0) return `${hours} saat \u00F6nce`;
    if (minutes > 0) return `${minutes} dakika \u00F6nce`;
    return 'Az \u00F6nce';
}

if (document.getElementById('videosGrid')) { fetchYouTubeVideos(); }

console.log('\uD83D\uDCFA YouTube Integration Loaded');