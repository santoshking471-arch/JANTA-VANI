// 1. Firebase SDK Imports (सभी आवश्यक टूल्स एक साथ इम्पोर्टेड)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
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
const auth = getAuth(app);

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
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (allowedEmails.includes(user.email.toLowerCase())) {
            if (dashboardBox) dashboardBox.classList.remove('hidden');
            loadDashboardStats();
        } else {
            forceLogout();
        }
    } else {
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

// 8. डैशबोर्ड स्टैटिस्टिक्स (Total Posts और REAL Views काउंट)
async function loadDashboardStats() {
    try {
        // फायरबेस Firestore के 'news_feeds' कलेक्शन से सारा डेटा लाना
        const querySnapshot = await getDocs(collection(db, "news_feeds"));
        
        // (A) कुल पोस्ट्स की संख्या सेट करना
        const totalPostsElem = document.getElementById('totalPosts');
        if (totalPostsElem) {
            totalPostsElem.innerText = `${querySnapshot.size} खबरें लाइव हैं`;
        }
        
        // (B) 🎯 REAL VIEWS COUNT: सभी न्यूज़ पोस्ट्स के व्यूज का टोटल जोड़ना
        let totalRealViews = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.views && typeof data.views === 'number') {
                totalRealViews += data.views;
            }
        });

        const totalViewsElem = document.getElementById('totalViews');
        if (totalViewsElem) {
            totalViewsElem.innerText = `${totalRealViews.toLocaleString('hi-IN')} यूज़र्स`;
        }

        // आंकड़े लोड होते ही नीचे लिस्ट को भी रेंडर करें
        loadManagePosts(querySnapshot);

    } catch (err) {
        console.error("डेटा गणना में एरर: ", err);
    }
}

// 🔄 नया फंक्शन: पोस्ट मैनेज करें सेक्शन में लाइव पोस्ट लिस्ट और डिलीट बटन दिखाना
function loadManagePosts(querySnapshot) {
    const manageSection = document.getElementById('manageSection');
    if (!manageSection) return;

    // पुराना डिफ़ॉल्ट टेक्स्ट साफ़ करके हेडिंग सेट करना
    manageSection.innerHTML = `<h2>सभी पोस्ट मैनेज करें</h2>`;

    if (querySnapshot.empty) {
        manageSection.innerHTML += `<p style="color: var(--sub-text); text-align: center; padding: 20px; font-size: 14px;">कोई पोस्ट नहीं मिली।</p>`;
        return;
    }

    // लिस्ट के लिए कंटेनर डिब्बा
    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '12px';
    listContainer.style.marginTop = '14px';

    querySnapshot.forEach((documentSnapshot) => {
        const post = documentSnapshot.data();
        const postId = documentSnapshot.id;

        const postRow = document.createElement('div');
        postRow.style.backgroundColor = '#0d0e12';
        postRow.style.border = '1px solid var(--border-color)';
        postRow.style.borderRadius = '10px';
        postRow.style.padding = '12px';
        postRow.style.display = 'flex';
        postRow.style.alignItems = 'center';
        postRow.style.justifyContent = 'space-between';
        postRow.style.gap = '10px';

        // स्लिम UI स्ट्रक्चर (मोबाइल स्क्रीन फ्रेंडली)
        postRow.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <h4 style="font-size: 14px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${post.title || 'बिना टाइटल की खबर'}</h4>
                <div style="display: flex; gap: 8px; font-size: 11px; color: var(--sub-text);">
                    <span style="color: var(--accent-color); font-weight:600;">${post.category || 'सामान्य'}</span>
                    <span>•</span>
                    <span>📍 ${post.location || 'लोकेशन नहीं है'}</span>
                    <span>•</span>
                    <span>👁️ ${post.views || 0}</span>
                </div>
            </div>
            <button class="delete-btn" data-id="${postId}" style="background: rgba(229, 57, 53, 0.1); border: 1px solid rgba(229, 57, 53, 0.4); color: var(--accent-color); padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; flex-shrink: 0;">
                डिलीट
            </button>
        `;

        listContainer.appendChild(postRow);
    });

    manageSection.appendChild(listContainer);

    // 🗑️ लाइव डिलीट करने का लॉजिक
    const deleteButtons = manageSection.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm("क्या आप सच में इस खबर को हमेशा के लिए डिलीट करना चाहते हैं?")) {
                try {
                    e.target.innerText = "हटा रहे...";
                    e.target.disabled = true;
                    
                    const docRef = doc(db, "news_feeds", id);
                    await deleteDoc(docRef);
                    
                    alert("✅ खबर सफलतापूर्वक हटा दी गई!");
                    loadDashboardStats(); // डैशबोर्ड और लिस्ट तुरंत री-लोड करें
                } catch (err) {
                    console.error("डिलीट करने में एरर: ", err);
                    alert("❌ डिलीट नहीं हो सका।");
                    e.target.innerText = "डिलीट";
                    e.target.disabled = false;
                }
            }
        });
    });
}

// 9. नई न्यूज़ पोस्ट अपलोड लॉजिक (कैटेगरी ड्रॉपडाउन और मैन्युअल लोकेशन के साथ)
if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        publishBtn.disabled = true;
        publishBtn.innerText = "अपलोड हो रहा है...";
        statusMsg.innerText = "";

        const title = document.getElementById('newsTitle').value.trim();
        const description = document.getElementById('newsDesc').value.trim();
        const location = document.getElementById('newsLocation').value.trim(); 
        const category = document.getElementById('newsCategory').value;         
        const imageUrl = document.getElementById('newsImageUrl').value.trim(); 
        const videoUrl = document.getElementById('videoUrl').value.trim();     

        try {
            await addDoc(collection(db, "news_feeds"), {
                title: title,
                description: description,
                location: location,    
                category: category,    
                image: imageUrl,       
                videoUrl: videoUrl,    
                views: 0,                   // 👁️ नई पोस्ट अपलोड होते ही डिफ़ॉल्ट 0 व्यूज सेट होंगे
                timestamp: serverTimestamp() 
            });

            statusMsg.className = "msg success-text";
            statusMsg.innerText = "✅ खबर तुरंत लाइव ऐप और वेबसाइट पर भेज दी गई है!";
            newsForm.reset();
            
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
