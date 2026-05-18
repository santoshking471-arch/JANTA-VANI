import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Setup
const GEMINI_API_KEY = "AIzaSyB6psrGiczfmEPMjVHqGgwul9x7w9k5T8E";
const CLIENT_ID = "945195325851-v4o2t53i84g60640isidvscv58798.apps.googleusercontent.com"; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
let videoFile = null;

// 2. Process Media (Device to Dashboard)
window.processMedia = async function(input) {
    const file = input.files[0];
    if (!file) return;
    videoFile = file;

    const player = document.getElementById('player');
    const dropText = document.getElementById('dropText');
    const status = document.getElementById('statusBar');

    // Show Preview
    player.src = URL.createObjectURL(file);
    player.style.display = 'block';
    dropText.style.display = 'none';

    status.style.display = 'block';
    status.innerText = "🤖 Gemini is analyzing the video content...";

    try {
        
        // 1. Model define karte waqt API version ko force karein (Stable v1 use karein)
// Gemini 3 Flash use karne ke liye
       const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash"
}, { apiVersion: "v1" }); // Ye doosra object dalna mandatory hai!





        
        // SEO Analysis
        const prompt = `Video name: "${file.name}". Provide: 1. Catchy YouTube Title, 2. Professional Description with hashtags, 3. 10 Viral Tags, 4. A visual description for an AI Thumbnail. Format: Title | Desc | Tags | ThumbPrompt`;
        
        const result = await model.generateContent(prompt);
        const parts = result.response.text().split('|');

        document.getElementById('aiTitle').value = parts[0].trim();
        document.getElementById('aiDesc').value = parts[1].trim();
        document.getElementById('aiTags').value = parts[2].trim();

        // 3. Fake Thumbnail Preview (Using an AI Image API)
        const thumbPrompt = parts[3] ? parts[3].trim() : file.name;
        document.getElementById('thumbPreview').style.backgroundImage = `url('https://pollinations.ai/p/${encodeURIComponent(thumbPrompt)}?width=1280&height=720&seed=42')`;
        document.getElementById('thumbPreview').innerText = "";

        status.innerText = "✅ Analysis Complete. System ready for upload.";
    } catch (err) {
    console.error(err);
    // Ye line tumhe batayegi ki error API se hai ya code se
    const debugMsg = `
        Error Type: ${err.name}
        Message: ${err.message}
        Status: ${err.status || "N/A"}
    `;
    alert("🚨 SYSTEM DEBUG:\n" + debugMsg);
    
    // Status bar update
    document.getElementById('statusBar').innerText = "❌ Connection Failed. Check Debug Alert.";
}

};

// 4. YouTube Upload Integration
window.finalSubmit = function() {
    if (!videoFile) return alert("Pehle video load karo, Santosh!");

    const status = document.getElementById('statusBar');
    status.innerText = "🔑 Connecting to YouTube API...";

    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/youtube.upload',
        callback: async (resp) => {
            if (resp.access_token) {
                await uploadToYouTube(resp.access_token);
            }
        },
    });
    tokenClient.requestAccessToken();
};

async function uploadToYouTube(token) {
    const status = document.getElementById('statusBar');
    status.innerText = "⏳ Uploading video... Please don't close the tab.";

    const title = document.getElementById('aiTitle').value;
    const desc = document.getElementById('aiDesc').value;
    const tags = document.getElementById('aiTags').value.split(',');

    const metadata = {
        snippet: { title, description: desc, tags, categoryId: '22' },
        status: { privacyStatus: 'public' }
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', videoFile);

    try {
        const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (data.id) {
            status.innerText = "🔥 Video uploaded successfully! ID: " + data.id;
            alert("Santosh bhai, video channel par live ho gayi! 😎");
        } else {
            throw new Error(data.error.message);
        }
    } catch (err) {
        alert("Upload Fail: " + err.message);
    }
}
