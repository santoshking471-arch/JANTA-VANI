// 1. Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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

// 4. डार्क/लाइट थीम लॉजिक
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', savedTheme);
themeToggle.innerText = savedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    themeToggle.innerText = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    localStorage.setItem('theme', newTheme);
});

// टाइमस्टैम्प को "X मिनट पहले" या "X घंटे पहले" में बदलने वाला लाइव फ़ंक्शन
function formatTimeAgo(timestamp) {
    if (!timestamp) return "अभी";
    
    // फायरबेस टाइमस्टैम्प को मिलीसेकंड में बदलें
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

// 5. Firestore से खबरें लोड करने का मुख्य फ़ंक्शन (Location और Live Time के साथ)
async function fetchNews(locationName = 'टॉप न्यूज़') {
    newsContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--sub-text);">समाचार लोड हो रहे हैं...</div>`;

    try {
        let newsQuery;
        const newsCollection = collection(db, "news_feeds");

        // अगर 'टॉप न्यूज़' या 'होम' है तो सारी खबरें दिखाओ, नहीं तो लोकेशन से फ़िल्टर करो
        if (locationName === 'टॉप न्यूज़' || locationName === 'होम') {
            newsQuery = query(newsCollection, orderBy("timestamp", "desc"));
        } else {
            newsQuery = query(newsCollection, where("location", "==", locationName), orderBy("timestamp", "desc"));
        }

        const querySnapshot = await getDocs(newsQuery);
        newsContainer.innerHTML = ''; 

        if (querySnapshot.empty) {
            newsContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--sub-text);">${locationName} में अभी कोई खबर नहीं है।</div>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // 1. लाइव टाइम कैलकुलेट करें
            const timeAgo = formatTimeAgo(data.timestamp);
            
            // 2. डेट फ़ॉर्मेट करें (जैसे: 21 मई)
            let formattedDate = "";
            if (data.timestamp) {
                const dateObj = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                formattedDate = dateObj.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });
            } else {
                formattedDate = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });
            }

            // आपके नए स्टाइलिश CSS के साथ परफेक्ट कार्ड रेंडरिंग
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
                            <img src="${data.image}" alt="News Image" class="news-img" onerror="this.src='https://via.placeholder.com/115x85?text=News'">
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
        newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">डेटा लोड करने में त्रुटि हुई। कृपया सुनिश्चित करें कि आपने Firestore में Composite Index बना लिया है।</div>`;
    }
}

// 6. शेयर बटन फंक्शनलिटी
window.shareNews = function(title, url) {
    if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(err => console.log(err));
    } else {
        navigator.clipboard.writeText(url);
        alert("वीडियो लिंक कॉपी कर दिया गया है!");
    }
};

// 7. टॉप कैटेगरी/लोकेशन टैब क्लिक इवेंट्स (सभी वर्किंग)
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelector('.tab-item.active').classList.remove('active');
        tab.classList.add('active');
        fetchNews(tab.innerText);
    });
});

// 8. बॉटम नेविगेशन इवेंट्स (सभी वर्किंग)
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');
        
        const itemText = item.innerText.trim();
        if(itemText.includes('वीडियो')) {
            fetchNews('वीडियो'); // वीडियो टैब के लिए
        } else if(itemText.includes('होम')) {
            // होम पर क्लिक होने पर टॉप टैब्स में से 'टॉप न्यूज़' को एक्टिव करें और डेटा लोड करें
            document.querySelector('.tab-item.active').classList.remove('active');
            tabs[0].classList.add('active');
            fetchNews('टॉप न्यूज़');
        }
    });
});

// डिफ़ॉल्ट लोडिंग
document.addEventListener('DOMContentLoaded', () => {
    fetchNews('टॉप न्यूज़');
});
