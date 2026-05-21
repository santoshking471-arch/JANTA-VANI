// 1. Firebase SDK Imports (आपका क्रेडेंशियल वर्ज़न 12.13.0)
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

// Firebase और Firestore को इनिशियलाइज करें
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. HTML DOM Elements
const newsContainer = document.getElementById('newsContainer');
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const tabs = document.querySelectorAll('.tab-item');
const navItems = document.querySelectorAll('.nav-item');

// 4. डार्क/लाइट थीम लॉजिक (लोकल स्टोरेज सपोर्ट के साथ)
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

// 5. Firestore से खबरें लोड करने का वर्किंग फ़ंक्शन
async function fetchNews(categoryName = 'टॉप न्यूज़') {
    newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--sub-text);">समाचार लोड हो रहे हैं...</div>`;

    try {
        let newsQuery;
        const newsCollection = collection(db, "news_feeds");

        // कैटेगरी फ़िल्टर लॉजिक
        if (categoryName === 'टॉप न्यूज़') {
            newsQuery = query(newsCollection, orderBy("timestamp", "desc"));
        } else {
            newsQuery = query(newsCollection, where("category", "==", categoryName), orderBy("timestamp", "desc"));
        }

        const querySnapshot = await getDocs(newsQuery);
        newsContainer.innerHTML = ''; 

        if (querySnapshot.empty) {
            newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--sub-text);">इस कैटेगरी में कोई खबर नहीं है।</div>`;
            return;
        }

        // लूप चलाकर खबरें रेंडर करना
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            const cardHTML = `
                <article class="news-card">
                    <div class="card-body">
                        <div class="text-area">
                            <div class="live-status">● LIVE <span class="category">${data.category || 'न्यूज़'}</span></div>
                            <h2 class="news-title">${data.title}</h2>
                            <p class="news-meta">${data.time || 'अभी-अभी'} • ${data.description}</p>
                        </div>
                        <a href="${data.videoUrl}" target="_blank" class="image-area">
                            <img src="${data.image}" alt="News Image" class="news-img" onerror="this.src='https://via.placeholder.com/110x80?text=News'">
                            <div class="video-overlay">
                                <div class="play-icon">▶</div>
                            </div>
                        </a>
                    </div>
                    <div class="card-footer">
                        <span>${data.category} ❯</span>
                        <button class="share-btn" onclick="shareNews('${data.title}', '${data.videoUrl}')">🔗 शेयर</button>
                    </div>
                </article>
            `;
            newsContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

    } catch (error) {
        console.error("डेटा लोड करने में समस्या आई: ", error);
        newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">डेटा लोड करने में त्रुटि हुई। कृपया Firestore Rules जांचें।</div>`;
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

// 7. कैटेगरी टैब क्लिक इवेंट्स
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelector('.tab-item.active').classList.remove('active');
        tab.classList.add('active');
        fetchNews(tab.innerText);
    });
});

// 8. बॉटम नेविगेशन इवेंट्स
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');
        
        if(item.innerText.includes('वीडियो')) {
            fetchNews('वीडियो');
        } else if(item.innerText.includes('होम')) {
            fetchNews('टॉप न्यूज़');
        }
    });
});

// पेज लोड होते ही डिफ़ॉल्ट रूप से टॉप न्यूज़ लोड करें
document.addEventListener('DOMContentLoaded', () => {
    fetchNews('टॉप न्यूज़');
});
