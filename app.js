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

// नए सर्च बार के एलिमेंट्स
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

// टाइमस्टैम्प को "X मिनट पहले" या "X घंटे पहले" में बदलने वाला लाइव फ़ंक्शन
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

// 5. Firestore से खबरें लोड करने का मुख्य फ़ंक्शन (बिना इंडेक्स एरर के)
async function fetchNews(locationName = 'टॉप न्यूज़') {
    newsContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--sub-text);">समाचार लोड हो रहे हैं...</div>`;

    try {
        const newsCollection = collection(db, "news_feeds");
        // बिना Composite Index एरर के डेटा मंगाने के लिए डायरेक्ट क्वेरी
        const querySnapshot = await getDocs(newsCollection);
        
        let allNews = [];
        querySnapshot.forEach((doc) => {
            allNews.push({ id: doc.id, ...doc.data() });
        });

        // जावास्क्रिप्ट के जरिए लेटेस्ट टाइमस्टैम्प को सबसे ऊपर सॉर्ट करें
        allNews.sort((a, b) => {
            const timeA = a.timestamp ? (a.timestamp.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime()) : 0;
            const timeB = b.timestamp ? (b.timestamp.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime()) : 0;
            return timeB - timeA; 
        });

        // अगर कोई विशेष लोकेशन चुनी है (जैसे 'छतरपुर'), तो डेटा फ़िल्टर करें
        if (locationName !== 'टॉप न्यूज़' && locationName !== 'होम') {
            allNews = allNews.filter(news => news.location === locationName);
        }

        newsContainer.innerHTML = ''; 

        if (allNews.length === 0) {
            newsContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--sub-text);">${locationName} में अभी कोई खबर नहीं है।</div>`;
            return;
        }

        allNews.forEach((data) => {
            const timeAgo = formatTimeAgo(data.timestamp);
            
            let formattedDate = "";
            if (data.timestamp) {
                const dateObj = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                formattedDate = dateObj.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });
            } else {
                formattedDate = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });
            }

            const cardHTML = `
                <article class="news-card">
                    <div class="card-body">
                        <div class="text-area">
                            <div class="live-status">
                                ● LIVE <span class="location-text">${data.location || 'लोकल'}</span>
                            </div>
                            <h2 class="news-title">${data.title}</h2>
                            <p class="news-meta">
                                <span class="meta-date-time">${timeAgo} (${formattedDate}):</span> ${data.description}
                            </p>
                        </div>
                        <a href="${data.videoUrl}" target="_blank" class="image-area">
                            <img src="${data.image || 'https://via.placeholder.com/115x85?text=News'}" alt="News Image" class="news-img" onerror="this.src='https://via.placeholder.com/115x85?text=News'">
                            <div class="video-overlay">
                                <div class="play-icon">▶</div>
                            </div>
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
        console.error("डेटा लोड करने में समस्या आई: ", error);
        newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">डेटा लोड करने में त्रुटि हुई। कृपया नेटवर्क जांचें।</div>`;
    }
}

// ==========================================
// 6. न्यू लाइव सर्च और ऑटो शो/हाइड इंजन
// ==========================================
if (searchInput && resultsContainer) {
    // सर्च बार पर टैप / क्लिक करने पर (अगर खाली नहीं है तो ऑन करें)
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() !== "") {
            resultsContainer.classList.remove('hidden');
        }
    });

    // सर्च बार से बाहर क्लिक करने पर (ऑटोमैटिक ऑफ करें)
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            resultsContainer.classList.add('hidden');
        }, 250); // 250ms का डिले ताकि आइटम क्लिक काम कर सके
    });

    // टाइप करने पर लाइव सर्च (टाइटल, लोकेशन और टॉपिक से मैच)
    searchInput.addEventListener('input', async (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        
        if (searchText === "") {
            resultsContainer.classList.add('hidden');
            resultsContainer.innerHTML = "";
            return;
        }

        try {
            const querySnapshot = await getDocs(collection(db, "news_feeds"));
            let matchesFound = false;
            resultsContainer.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const title = data.title || '';
                const location = data.location || '';
                const description = data.description || '';

                // सर्च फिल्टर चेकिंग
                if (title.toLowerCase().includes(searchText) || 
                    location.toLowerCase().includes(searchText) || 
                    description.toLowerCase().includes(searchText)) {
                    
                    matchesFound = true;

                    const searchItem = document.createElement('div');
                    searchItem.className = 'search-item-card';
                    searchItem.innerHTML = `
                        <div class="search-item-info">
                            <span class="search-item-meta">📍 ${location || 'लोकल'}</span>
                            <h4>${title}</h4>
                        </div>
                    `;

                    // सर्च रिजल्ट की खबर पर क्लिक करने का इवेंट
                    searchItem.addEventListener('click', () => {
                        if(data.videoUrl) {
                            window.open(data.videoUrl, '_blank');
                        }
                        searchInput.value = "";
                        resultsContainer.classList.add('hidden');
                    });

                    resultsContainer.appendChild(searchItem);
                }
            });

            if (matchesFound) {
                resultsContainer.classList.remove('hidden');
            } else {
                resultsContainer.classList.remove('hidden');
                resultsContainer.innerHTML = `<p style="color: #888; text-align: center; font-size: 13px; padding: 10px;">कोई खबर नहीं मिली...</p>`;
            }

        } catch (err) {
            console.error("सर्च एरर: ", err);
        }
    });
}

// 7. शेयर बटन फंक्शनलिटी
window.shareNews = function(title, url) {
    if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(err => console.log(err));
    } else {
        navigator.clipboard.writeText(url);
        alert("वीडियो लिंक कॉपी कर दिया गया है!");
    }
};

// 8. टॉप कैटेगरी/लोकेशन टैब क्लिक इवेंट्स
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-item.active');
        if (activeTab) activeTab.classList.remove('active');
        tab.classList.add('active');
        fetchNews(tab.innerText.trim());
    });
});

// 9. बॉटम नेविगेशन इवेंट्स
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) activeNav.classList.remove('active');
        item.classList.add('active');
        
        const itemText = item.innerText.trim();
        if(itemText.includes('वीडियो')) {
            fetchNews('वीडियो');
        } else if(itemText.includes('होम')) {
            const activeTab = document.querySelector('.tab-item.active');
            if (activeTab) activeTab.classList.remove('active');
            if (tabs[0]) tabs[0].classList.add('active');
            fetchNews('टॉप न्यूज़');
        }
    });
});

// डिफ़ॉल्ट लोडिंग
document.addEventListener('DOMContentLoaded', () => {
    fetchNews('टॉप न्यूज़');
});
