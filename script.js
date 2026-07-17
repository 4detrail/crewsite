const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');
const body = document.body;

const savedTheme = localStorage.getItem('theme') || 'dark';
body.classList.toggle('light-theme', savedTheme === 'light');
if (themeIcon) { themeIcon.textContent = savedTheme === 'light' ? '\u2600\uFE0F' : '\uD83C\uDF19'; }

themeToggle?.addEventListener('click', () => {
    const isLight = body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (themeIcon) { themeIcon.textContent = isLight ? '\u2600\uFE0F' : '\uD83C\uDF19'; }
});

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks?.classList.toggle('active');
});

navLinks?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navLinks?.classList.remove('active');
    });
});

const cookieBanner = document.getElementById('cookieBanner');
const cookieAccepted = localStorage.getItem('cookieAccepted');

if (!cookieAccepted && cookieBanner) {
    setTimeout(() => { cookieBanner.classList.add('show'); }, 1000);
}

function acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
    cookieBanner?.classList.remove('show');
}

window.acceptCookies = acceptCookies;

function copyServerIP() {
    const serverIP = 'crewsmp.sorgusmp.fun:25584';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(serverIP).then(() => {
            showNotification('Sunucu IP kopyalandı!', 'success');
        }).catch(() => { fallbackCopy(serverIP); });
    } else {
        fallbackCopy(serverIP);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification('Sunucu IP kopyalandı!', 'success');
    } catch (err) {
        showNotification('Kopyalama başarısız oldu', 'error');
    }
    document.body.removeChild(textarea);
}

window.copyServerIP = copyServerIP;

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 2rem;
        background: ${type === 'success' ? 'var(--purple-primary)' : '#ff4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: var(--purple-primary);
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: particleFloat ${5 + Math.random() * 10}s linear infinite;
            opacity: ${0.3 + Math.random() * 0.7};
        `;
        particlesContainer.appendChild(particle);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
    }
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 80%', toggleActions: 'play none none reverse' },
            opacity: 0, y: 50, duration: 0.8, delay: i * 0.1
        });
    });
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: { trigger: header, start: 'top 80%', toggleActions: 'play none none reverse' },
            opacity: 0, y: 30, duration: 0.8
        });
    });
}

let lastScroll = 0;
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) { navbar?.classList.remove('scrolled'); return; }
    navbar?.classList.add('scrolled');
    lastScroll = currentScroll;
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

console.log('%c\uD83C\uDFAE CREW SMP', 'font-size: 24px; font-weight: bold; color: #8B00FF;');
console.log('%cPowered by Hexages Games', 'font-size: 14px; color: #666;');