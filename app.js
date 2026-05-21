// 1. Firebase कॉन्फ़िगरेशन (अपने Firebase Console से क्रेडेंशियल्स बदलें)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase इनिशियलाइज करें
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. DOM एलिमेंट्स
const newsContainer = document.getElementById('newsContainer');
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const tabs = document.querySelectorAll('.tab-item');
const navItems = document.querySelectorAll('.nav-item');

// 3. डार्क/लाइट थीम लॉजिक (यूज़र की चॉइस सेव रहेगी)
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', savedTheme);
themeToggle.innerText = savedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    themeToggle.innerText = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    localStorage.setItem('theme', newTheme); // लोकल स्टोरेज में सेव करें
});

// 4. Firebase से डेटा लोड करने का मुख्य फ़ंक्शन
async function fetchNews(categoryName = 'टॉप न्यूज़') {
    // लोड होते समय यूज़र को 'लोडिंग...' दिखे
    newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--sub-text);">समाचार लोड हो रहे हैं...</div>`;

    try {
        let newsQuery;
        const newsCollection = collection(db, "news_feeds");

        // अगर 'टॉप न्यूज़' है तो सारी खबरें दिखाओ, नहीं तो कैटेगरी के हिसाब से फ़िल्टर करो
        if (categoryName === 'टॉप न्यूज़') {
            newsQuery = query(newsCollection, orderBy("timestamp", "desc"));
        } else {
            newsQuery = query(newsCollection, where("category", "==", categoryName), orderBy("timestamp", "desc"));
        }

        const querySnapshot = await getDocs(newsQuery);
        newsContainer.innerHTML = ''; // लोडिंग टेक्स्ट हटाएं

        if (querySnapshot.empty) {
            newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--sub-text);">इस कैटेगरी में कोई खबर नहीं है।</div>`;
            return;
        }

        // हर खबर के लिए कार्ड जनरेट करें
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
        newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">डेटा लोड करने में त्रुटि हुई। कृपया फायरबेस सेटिंग्स जांचें।</div>`;
    }
}

// 5. शेयर बटन वर्किंग लॉजिक
window.shareNews = function(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(err => console.log(err));
    } else {
        // अगर ब्राउज़र वेब शेयर सपोर्ट नहीं करता तो लिंक कॉपी कर लें
        navigator.clipboard.writeText(url);
        alert("वीडियो लिंक कॉपी कर दिया गया है!");
    }
};

// 6. टॉप कैटेगरी टैब्स क्लिक वर्किंग
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelector('.tab-item.active').classList.remove('active');
        tab.classList.add('active');
        
        // क्लिक की गई कैटेगरी का डेटा फायरबेस से लाएं
        const selectedCategory = tab.innerText;
        fetchNews(selectedCategory);
    });
});

// 7. बॉटम नेविगेशन टैब्स क्लिक वर्किंग
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');
        
        // होम या वीडियो पर क्लिक करने का एक्शन यहाँ हैंडल कर सकते हैं
        if(item.innerText.includes('वीडियो')) {
            fetchNews('वीडियो'); // स्पेशल वीडियो टैब फ़िल्टर
        } else if(item.innerText.includes('होम')) {
            fetchNews('टॉप न्यूज़');
        }
    });
});

// पहली बार पेज लोड होने पर 'टॉप न्यूज़' लोड करें
document.addEventListener('DOMContentLoaded', () => {
    fetchNews('टॉप न्यूज़');
});
