// 1. Firebase SDK Imports (Auth और Firestore दोनों)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

// 2. आपका Firebase कॉन्फ़िगरेशन
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
const auth = getAuth(app); // Auth को इनिशियलाइज़ किया

// 3. सुरक्षा के लिए वाइटलिस्टेड ईमेल आईडी
const allowedEmails = [
    "santoshking471@gmail.com",
    "jantavaninewsnetwork307@gmail.com"
];

// 4. HTML DOM Elements
const dashboardBox = document.getElementById('dashboardBox');
const uploadSection = document.getElementById('uploadSection');
const manageSection = document.getElementById('manageSection');
const btnUploadNav = document.getElementById('btnUploadNav');
const btnManageNav = document.getElementById('btnManageNav');
const logoutBtn = document.getElementById('logoutBtn');

const newsForm = document.getElementById('newsForm');
const statusMsg = document.getElementById('statusMsg');
const publishBtn = document.getElementById('publishBtn');

// 5. 🔐 रियल-टाइम सुरक्षा लॉगिन चेक (Auth Guard)
// जो मिलीसेकंड का ग्लिच आ रहा था, उसे रोकने के लिए इसे पूरी तरह फिक्स कर दिया है
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (allowedEmails.includes(user.email.toLowerCase())) {
            // अगर सही एडमिन है, तो डैशबोर्ड दिखाओ और स्टैट्स लोड करो
            if (dashboardBox) dashboardBox.classList.remove('hidden');
            loadDashboardStats();
        } else {
            // अगर गलत ईमेल से लॉगिन किया है तो बाहर का रास्ता दिखाओ
            forceLogout();
        }
    } else {
        // अगर यूजर लॉगिन ही नहीं है, तो 1.2 सेकंड का होल्ड देकर टोकन चेक करने के बाद भगाओ (ताकि ग्लिच न हो)
        setTimeout(() => {
            if (!auth.currentUser) {
                window.location.href = "login.html";
            }
        }, 1200);
    }
});

// 6. लॉगआउट फंक्शनिटी
function forceLogout() {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((err) => {
        console.error("लॉगआउट में एरर: ", err);
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        forceLogout();
    });
}

// 7. नैविगेशन / टैब स्विचिंग लॉजिक (Upload vs Manage)
if (btnUploadNav && btnManageNav) {
    btnUploadNav.addEventListener('click', () => {
        btnUploadNav.classList.add('active');
        btnManageNav.classList.remove('active');
        if (uploadSection) uploadSection.classList.remove('hidden');
        if (manageSection) manageSection.classList.add('hidden');
    });

    btnManageNav.addEventListener('click', () => {
        btnManageNav.classList.add('active');
        btnUploadNav.classList.remove('active');
        if (manageSection) manageSection.classList.remove('hidden');
        if (uploadSection) uploadSection.classList.add('hidden');
    });
}

// 8. डैशबोर्ड स्टैटिस्टिक्स (Total Posts और Views काउंट)
async function loadDashboardStats() {
    try {
        // फायरबेस Firestore के 'news_feeds' कलेक्शन से कुल पोस्ट संख्या गिनना
        const querySnapshot = await getDocs(collection(db, "news_feeds"));
        const totalPostsElem = document.getElementById('totalPosts');
        if (totalPostsElem) {
            totalPostsElem.innerText = `${querySnapshot.size} खबरें लाइव हैं`;
        }
        
        // लोकल विजिटर काउंटर (Total Views)
        const totalViewsElem = document.getElementById('totalViews');
        if (totalViewsElem) {
            let fakeViews = localStorage.getItem('total_janta_views') || Math.floor(Math.random() * 500) + 1200;
            fakeViews = parseInt(fakeViews) + 1;
            localStorage.setItem('total_janta_views', fakeViews);
            totalViewsElem.innerText = `${fakeViews.toLocaleString('hi-IN')} यूज़र्स`;
        }
    } catch (err) {
        console.error("डेटा गणना में एरर: ", err);
    }
}

// 9. नई न्यूज़ पोस्ट अपलोड लॉजिक (कैटेगरी ड्रॉपडाउन और मैन्युअल लोकेशन के साथ)
if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        publishBtn.disabled = true;
        publishBtn.innerText = "अपलोड हो रहा है...";
        statusMsg.innerText = "";

        // HTML एलिमेंट्स से वैल्यू निकालना
        const title = document.getElementById('newsTitle').value.trim();
        const description = document.getElementById('newsDesc').value.trim();
        const location = document.getElementById('newsLocation').value.trim(); // मैन्युअल लोकेशन टाइप
        const category = document.getElementById('newsCategory').value;         // ड्रॉपडाउन से चुनी कैटेगरी
        const imageUrl = document.getElementById('newsImageUrl').value.trim(); 
        const videoUrl = document.getElementById('videoUrl').value.trim();     

        try {
            // 'news_feeds' कलेक्शन में डेटाबेस स्क्रीनशॉट के हूबहू नाम से फ़ील्ड्स ऐड करना
            await addDoc(collection(db, "news_feeds"), {
                title: title,
                description: description,
                location: location,    // घटना की जगह
                category: category,    // index.html का टैब नाम
                image: imageUrl,       // इमेज का यूआरएल लिंक
                videoUrl: videoUrl,    // यूट्यूब या वीडियो लिंक
                timestamp: serverTimestamp() // फायरबेस का लाइव सर्वर टाइमस्टैम्प
            });

            statusMsg.className = "msg success-text";
            statusMsg.innerText = "✅ खबर तुरंत लाइव ऐप और वेबसाइट पर भेज दी गई है!";
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
}
