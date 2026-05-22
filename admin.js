// 1. Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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

// 3. सुरक्षा लॉगिन क्रेडेंशियल्स
const ADMIN_EMAIL = "santoshking471@gmail.com";
const ADMIN_PASS = "JANTAVANI@112";

// 4. HTML DOM Elements
const loginBox = document.getElementById('loginBox');
const dashboardBox = document.getElementById('dashboardBox');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const uploadSection = document.getElementById('uploadSection');
const manageSection = document.getElementById('manageSection');
const btnUploadNav = document.getElementById('btnUploadNav');
const btnManageNav = document.getElementById('btnManageNav');
const logoutBtn = document.getElementById('logoutBtn');

const newsForm = document.getElementById('newsForm');
const statusMsg = document.getElementById('statusMsg');
const publishBtn = document.getElementById('publishBtn');

// 5. लॉगिन चेक लॉजिक
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
        loginBox.classList.add('hidden');
        dashboardBox.classList.remove('hidden');
        loadDashboardStats();
    } else {
        loginError.innerText = "❌ गलत ईमेल या पासवर्ड! केवल संतोष भाई ही एक्सेस कर सकते हैं।";
    }
});

// 6. लॉगआउट लॉजिक
logoutBtn.addEventListener('click', () => {
    dashboardBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
    loginForm.reset();
    loginError.innerText = "";
});

// 7. नैविगेशन / टैब स्विचिंग लॉजिक (Upload vs Manage)
btnUploadNav.addEventListener('click', () => {
    btnUploadNav.classList.add('active');
    btnManageNav.classList.remove('active');
    uploadSection.classList.remove('hidden');
    manageSection.classList.add('hidden');
});

btnManageNav.addEventListener('click', () => {
    btnManageNav.classList.add('active');
    btnUploadNav.classList.remove('active');
    manageSection.classList.remove('hidden');
    uploadSection.classList.add('hidden');
});

// 8. डैशबोर्ड स्टैटिस्टिक्स (Total Posts और Views काउंट)
async function loadDashboardStats() {
    try {
        // फायरबेस से कुल पोस्ट की संख्या निकालना
        const querySnapshot = await getDocs(collection(db, "news_feeds"));
        document.getElementById('totalPosts').innerText = `${querySnapshot.size} खबरें लाइव हैं`;
        
        // लोकल विजिटर काउंटर (Total Views)
        let fakeViews = localStorage.getItem('total_janta_views') || Math.floor(Math.random() * 500) + 1200;
        fakeViews = parseInt(fakeViews) + 1;
        localStorage.setItem('total_janta_views', fakeViews);
        document.getElementById('totalViews').innerText = `${fakeViews.toLocaleString('hi-IN')} यूज़र्स`;
    } catch (err) {
        console.error("डेटा गणना में एरर: ", err);
    }
}

// 9. नई न्यूज़ पोस्ट अपलोड लॉजिक
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    publishBtn.disabled = true;
    publishBtn.innerText = "अपलोड हो रहा है...";
    statusMsg.innerText = "";

    const title = document.getElementById('newsTitle').value.trim();
    const description = document.getElementById('newsDesc').value.trim();
    const location = document.getElementById('newsLocation').value;
    const videoUrl = document.getElementById('videoUrl').value.trim();

    try {
        // "news_feeds" कलेक्शन में डेटा जोड़ना (location और category दोनों फ़ील्ड्स के साथ)
        await addDoc(collection(db, "news_feeds"), {
            title: title,
            description: description,
            location: location,
            category: location, 
            videoUrl: videoUrl,
            timestamp: serverTimestamp() // सर्वर लाइव टाइमस्टैम्प
        });

        statusMsg.className = "msg success-text";
        statusMsg.innerText = "✅ खबर तुरंत लाइव ऐप पर भेज दी गई है!";
        newsForm.reset();
        
        // अपलोड होने के बाद डैशबोर्ड के आंकड़े तुरंत रिफ्रेश करें
        loadDashboardStats();
    } catch (error) {
        console.error("अपलोड एरर: ", error);
        statusMsg.className = "msg error-text";
        statusMsg.innerText = "❌ एरर: फायरबेस में डेटा अपलोड नहीं हो सका।";
    } finally {
        publishBtn.disabled = false;
        publishBtn.innerText = "🚀 खबर लाइव पब्लिश करें";
    }
});
