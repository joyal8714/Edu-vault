// frontend/js/admin.js (Final Robust Version)

document.addEventListener('DOMContentLoaded', () => {
    // Initial data loading
    fetchVideos();
    fetchUsers();

    // Event Listeners
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleVideoUpload);
    }
    
    const startBtn = document.getElementById('startStreamBtn');
    const stopBtn = document.getElementById('stopStreamBtn');

    if (startBtn) {
        startBtn.addEventListener('click', startLiveStream);
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', stopLiveStream);
    }
});

// --- State Management ---
let hls;
let isStreamRunning = false;

// --- Live Streaming Functions ---

async function startLiveStream() {
    if (isStreamRunning) {
        alert('Stream is already active. Please stop it before starting a new one.');
        return;
    }
    
    const token = localStorage.getItem('token');
    const liveVideo = document.getElementById('liveVideo');
    console.log('Attempting to start stream on server...');

    try {
        const res = await fetch('/api/admin/start', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await res.json();
        if (!res.ok) {
            if (res.status === 400) isStreamRunning = true;
            throw new Error(data.message);
        }
        
        console.log('Server confirmed stream start. Initializing player...');
        isStreamRunning = true;
        liveVideo.style.display = 'block';

        // Wait before loading stream
        setTimeout(() => {
            const streamUrl = '/hls/stream.m3u8';
            
            if (hls) hls.destroy();

            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(liveVideo);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    liveVideo.play().catch(e => console.error("Autoplay prevented:", e));
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS.js Error:', data);
                    if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                        console.log("Retrying manifest load...");
                        setTimeout(() => hls.loadSource(streamUrl), 2000);
                    }
                });
            } else if (liveVideo.canPlayType('application/vnd.apple.mpegurl')) {
                liveVideo.src = streamUrl;
                liveVideo.addEventListener('canplay', () => liveVideo.play());
            }
        }, 3000);

    } catch (err) {
        console.error('Error in startLiveStream:', err);
        alert('Error: ' + err.message);
    }
}

async function stopLiveStream() {
    const token = localStorage.getItem('token');
    const liveVideo = document.getElementById('liveVideo');
    console.log('Attempting to stop stream on server...');

    try {
        const res = await fetch('/api/admin/stop', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        console.log('Server confirmed stream stop.');
        alert(data.message);
        
        if (hls) hls.destroy();
        liveVideo.pause();
        liveVideo.src = '';
        liveVideo.style.display = 'none';
        isStreamRunning = false;

    } catch (err) {
        console.error('Error in stopLiveStream:', err);
        alert('Error: ' + err.message);
    }
}

// --- Video Upload Function ---
async function handleVideoUpload(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const uploadBtn = e.target.querySelector('button[type="submit"]');
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading... ⏳";

    const formData = new FormData(e.target);

    try {
        const res = await fetch('http://localhost:5000/api/admin/upload-video', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        alert(data.message);

        // Wait for Cloudinary upload delay
        setTimeout(() => fetchVideos(), 3000);

    } catch (err) {
        console.error("Upload failed:", err);
        alert("Video upload failed. Please try again.");
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload";
        e.target.reset();
    }
}

// --- Logout ---
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// --- Fetch Videos ---
async function fetchVideos() {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/admin/all-videos', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    const container = document.getElementById('videoList');
    container.innerHTML = '';

    data.videos.forEach(v => {
        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = `
            <h3>${v.title}</h3>
            <p>${v.description}</p>
            <p><b>Video ID:</b> ${v.id}</p>
            <video width="400" controls>
                <source src="${v.file_path}" type="video/mp4">
            </video>
            <button class="delete-btn" data-id="${v.id}">🗑️ Delete</button>
        `;
        container.appendChild(div);
    });

    addDeleteButtonListeners();
}

// --- Add Delete Button Listeners ---
function addDeleteButtonListeners() {
    const token = localStorage.getItem('token');
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this video?')) {
                const res = await fetch(`http://localhost:5000/api/admin/delete-video/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                alert(data.message);
                fetchVideos();
                fetchUsers();
            }
        });
    });
}

// --- Fetch Users ---
async function fetchUsers() {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const container = document.getElementById('userList');
    container.innerHTML = '';

    // Fetch videos for dropdown
    const videosRes = await fetch('http://localhost:5000/api/admin/all-videos', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const videosData = await videosRes.json();

    data.users.forEach(u => {
        const div = document.createElement('div');
        div.classList.add('card');

        const options = videosData.videos.map(v => `<option value="${v.id}">${v.title}</option>`).join('');
        div.innerHTML = `
            <p><b>ID:</b> ${u.id} | <b>Name:</b> ${u.name} | <b>Email:</b> ${u.email}</p>
            <select id="videoSelect-${u.id}">
                <option value="">Select Video</option>
                ${options}
            </select>
            <button class="grant-btn" data-id="${u.id}">Grant Access</button>
            <button class="delete-btn remove-btn" data-id="${u.id}">Remove Access</button>
        `;
        container.appendChild(div);
    });

    addAccessButtonListeners();
}

// --- Add Access Button Listeners ---
function addAccessButtonListeners() {
    const token = localStorage.getItem('token');

    // Grant Access
    document.querySelectorAll('.grant-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.dataset.id;
            const videoId = document.getElementById(`videoSelect-${userId}`).value;
            if (!videoId) return alert('Please select a video!');
            
            const res = await fetch('http://localhost:5000/api/admin/grant-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId, video_id: videoId })
            });
            const data = await res.json();
            alert(data.message);
        });
    });

    // Remove Access
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.dataset.id;
            const videoId = document.getElementById(`videoSelect-${userId}`).value;
            if (!videoId) return alert('Please select a video to remove access!');
            if (!confirm('Are you sure you want to remove this video access for this user?')) return;

            const res = await fetch('http://localhost:5000/api/admin/remove-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId, video_id: videoId })
            });
            const data = await res.json();
            alert(data.message);
        });
    });
}
 