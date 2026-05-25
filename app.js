// 1. Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// 2. आपका पर्सनल Firebase कॉन्फ़िगरेशन
const firebaseConfig = {
    apiKey: "AIzaSyD-uA2AbtyldMCHgVumDZx3ro9avKzDSNg",
    authDomain: "janta-aec36.firebaseapp.com",
    projectId: "janta-aec36",
    storageBucket: "janta-aec36.firebasestorage.app",
    messagingSenderId: "656922061658",
    appId: "1:656922061658:web:65f773b55e0b565d20a163",
    measurementId: "G-2QCFRNY5XG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. HTML DOM Elements
const newsContainer = document.getElementById('newsContainer');
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const tabs = document.querySelectorAll('.tab-item');
const navItems = document.querySelectorAll('.nav-item');

const searchInput = document.getElementById('newsSearchInput');
const resultsContainer = document.getElementById('searchResultsContainer');

// 4. डार्क/लाइट थीम लॉजिक
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', savedTheme);
if (themeToggle) themeToggle.innerText = savedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        themeToggle.innerText = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
        localStorage.setItem('theme', newTheme);
    });
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return "अभी";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "अभी";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} मिनट पहले`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} घंटे पहले`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} दिन पहले`;
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// 5. Firestore से सामान्य खबरें लोड करने का मुख्य फ़ंक्शन
async function fetchNews(tabName = 'टॉप न्यूज़') {
    // नॉर्मल मोड में कंटेनर से शॉर्ट्स वाली स्टाइल हटा दें
    newsContainer.removeAttribute('style');
    newsContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--sub-text);">समाचार लोड हो रहे हैं...</div>`;

    try {
        const newsCollection = collection(db, "news_feeds");
        const querySnapshot = await getDocs(newsCollection);
        
        let allNews = [];
        querySnapshot.forEach((doc) => {
            allNews.push({ id: doc.id, ...doc.data() });
        });

        allNews.sort((a, b) => {
            const timeA = a.timestamp ? (a.timestamp.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime()) : 0;
            const timeB = b.timestamp ? (b.timestamp.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime()) : 0;
            return timeB - timeA; 
        });

        if (tabName !== 'टॉप न्यूज़' && tabName !== 'होम') {
            allNews = allNews.filter(news => {
                const dbLocation = news.location ? news.location.trim().toLowerCase() : '';
                const dbCategory = news.category ? news.category.trim().toLowerCase() : '';
                const targetTab = tabName.trim().toLowerCase();
                return dbLocation === targetTab || dbCategory === targetTab;
            });
        }

        newsContainer.innerHTML = ''; 

        if (allNews.length === 0) {
            newsContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--sub-text);">${tabName} में अभी कोई खबर नहीं है।</div>`;
            return;
        }

        allNews.forEach((data) => {
            const timeAgo = formatTimeAgo(data.timestamp);
            let formattedDate = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' }) : new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });

            const cardHTML = `
                <article class="news-card">
                    <div class="card-body">
                        <div class="text-area">
                            <div class="live-status">● LIVE <span class="location-text">${data.category || 'सामान्य'}</span></div>
                            <h2 class="news-title">${data.title}</h2>
                            <p class="news-meta"><span class="meta-date-time">${timeAgo} (${formattedDate}):</span> ${data.description}</p>
                        </div>
                        <a href="${data.videoUrl}" target="_blank" class="image-area">
                            <img src="${data.image || 'https://via.placeholder.com/115x85?text=News'}" alt="News Image" class="news-img">
                            <div class="video-overlay"><div class="play-icon">▶</div></div>
                        </a>
                    </div>
                    <div class="card-footer">
                        <span class="location-tag-bottom">${data.location || 'लोकल'} ❯</span>
                        <button class="share-btn" onclick="shareNews('${data.title.replace(/'/g, "\\'")}', '${data.videoUrl}')">🔗 शेयर</button>
                    </div>
                </article>
            `;
            newsContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    } catch (error) {
        console.error(error);
    }
}

// 🛠️ 6. यूट्यूब शॉर्ट्स स्टाइल (Line-by-Line Full Screen Swipe Feed)
async function fetchVideoTabFeed() {
    // कंटेनर को रील मोड की तरह फुल स्क्रीन स्क्रॉल स्नैप असाइन करें
    newsContainer.style.height = 'calc(100vh - 70px)'; // बॉटम बार छोड़कर पूरी स्क्रीन
    newsContainer.style.overflowY = 'scroll';
    newsContainer.style.scrollSnapType = 'y mandatory';
    newsContainer.style.webkitOverflowScrolling = 'touch';
    
    newsContainer.innerHTML = `<div style="text-align:center; padding:50px; color:var(--sub-text);">वीडियो फीड लोड हो रही है...</div>`;

    try {
        const querySnapshot = await getDocs(collection(db, "news_feeds"));
        let allNews = [];
        querySnapshot.forEach((doc) => { allNews.push({ id: doc.id, ...doc.data() }); });

        allNews.sort((a, b) => {
            const timeA = a.timestamp ? (a.timestamp.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime()) : 0;
            const timeB = b.timestamp ? (b.timestamp.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime()) : 0;
            return timeB - timeA;
        });

        newsContainer.innerHTML = '';
        let hasVideos = false;

        allNews.forEach((data) => {
            if (data.videoUrl && data.videoUrl.trim() !== "") {
                hasVideos = true;
                const timeAgo = formatTimeAgo(data.timestamp);

                let videoElementHTML = '';
                if (data.videoUrl.includes('youtube.com') || data.videoUrl.includes('youtu.be')) {
                    const videoId = extractYouTubeId(data.videoUrl);
                    videoElementHTML = `
                        <div class="shorts-media-box">
                            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1" frameborder="0" allowfullscreen></iframe>
                        </div>`;
                } else {
                    videoElementHTML = `
                        <div class="shorts-media-box">
                            <video controls poster="${data.image || ''}" preload="metadata" playsinline loop>
                                <source src="${data.videoUrl}" type="video/mp4">
                            </video>
                        </div>`;
                }

                // फुल स्क्रीन रील/शॉर्ट्स कार्ड लेआउट
                const shortsCardHTML = `
                    <div class="youtube-shorts-card">
                        ${videoElementHTML}
                        <div class="shorts-overlay-details">
                            <div class="shorts-badges">
                                <span class="shorts-category">📹 ${data.category || 'वीडियो'}</span>
                                <span class="shorts-time">${timeAgo}</span>
                            </div>
                            <h2 class="shorts-title">${data.title}</h2>
                            <p class="shorts-desc">${data.description || ''}</p>
                            <div class="shorts-footer-meta">
                                <span class="shorts-location">📍 ${data.location || 'लोकल'}</span>
                                <button class="shorts-share-btn" onclick="shareNews('${data.title.replace(/'/g, "\\'")}', '${data.videoUrl}')">🔗 शेयर</button>
                            </div>
                        </div>
                    </div>
                `;
                newsContainer.insertAdjacentHTML('beforeend', shortsCardHTML);
            }
        });

        if (!hasVideos) {
            newsContainer.innerHTML = `<div style="text-align:center; padding:50px; color:var(--sub-text);">कोई वीडियो खबर नहीं मिली।</div>`;
        }
    } catch (error) {
        console.error(error);
    }
}

// 7. लाइव सर्च (वही पुराना कोड सुरक्षित)
if (searchInput && resultsContainer) {
    searchInput.addEventListener('focus', () => { if (searchInput.value.trim() !== "") resultsContainer.classList.remove('hidden'); });
    searchInput.addEventListener('blur', () => { setTimeout(() => resultsContainer.classList.add('hidden'), 250); });
    searchInput.addEventListener('input', async (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        if (searchText === "") { resultsContainer.classList.add('hidden'); return; }
        try {
            const querySnapshot = await getDocs(collection(db, "news_feeds"));
            let matchesFound = false; resultsContainer.innerHTML = "";
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if ((data.title || '').toLowerCase().includes(searchText) || (data.location || '').toLowerCase().includes(searchText)) {
                    matchesFound = true;
                    const searchItem = document.createElement('div');
                    searchItem.className = 'search-item-card';
                    searchItem.innerHTML = `<div class="search-item-info"><h4>${data.title}</h4></div>`;
                    searchItem.addEventListener('click', () => { if(data.videoUrl) window.open(data.videoUrl, '_blank'); });
                    resultsContainer.appendChild(searchItem);
                }
            });
            resultsContainer.classList.remove('hidden');
        } catch (err) { console.error(err); }
    });
}

window.shareNews = function(title, url) {
    if (navigator.share) { navigator.share({ title: title, url: url }); } 
    else { navigator.clipboard.writeText(url); alert("लिंक कॉपी कर दिया गया है!"); }
};

// 8. टैब क्लिक्स
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-item.active');
        if (activeTab) activeTab.classList.remove('active');
        tab.classList.add('active');
        const activeNav = document.querySelector('.nav-item.active');
        if(activeNav && activeNav.id === 'nav-folder') {
            activeNav.classList.remove('active');
            if(document.getElementById('nav-home')) document.getElementById('nav-home').classList.add('active');
        }
        fetchNews(tab.innerText.trim());
    });
});

// 9. बॉटम नेविगेशन (होम बनाम शॉर्ट्स मोड)
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (item.tagName === 'A' || item.hasAttribute('href')) return; 
        e.preventDefault();
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) activeNav.classList.remove('active');
        item.classList.add('active');
        
        if(item.id === 'nav-folder' || item.id === 'folder') {
            const activeTab = document.querySelector('.tab-item.active');
            if (activeTab) activeTab.classList.remove('active');
            fetchVideoTabFeed(); // 📹 रील्स मोड चलाओ
        } else if(item.id === 'nav-home' || item.id === 'home') {
            const activeTab = document.querySelector('.tab-item.active');
            if (activeTab) activeTab.classList.remove('active');
            if (tabs[0]) tabs[0].classList.add('active');
            fetchNews('टॉप न्यूज़');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => { fetchNews('टॉप न्यूज़'); });
