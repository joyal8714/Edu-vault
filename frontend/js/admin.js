// This is the single entry point for all JavaScript on the admin page.
document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Data Loading ---
    fetchVideos();
    fetchUsers();

    // --- Static Event Listeners ---
    document.getElementById('uploadBtn')?.addEventListener('click', handleVideoUpload);
    document.getElementById('startStreamBtn')?.addEventListener('click', startBrowserStream);
    document.getElementById('stopStreamBtn')?.addEventListener('click', stopBrowserStream);

    // --- Event Delegation for Dynamic Content ---
    document.getElementById('videoList')?.addEventListener('click', handleVideoListClicks);
    document.getElementById('userList')?.addEventListener('click', handleUserListClicks);
    
    // Disable the stop button initially
    const stopBtn = document.getElementById('stopStreamBtn');
    if(stopBtn) stopBtn.disabled = true;
});


// --- Global State ---
let localStream; // This will hold the stream from the admin's camera
let isStreamRunning = false;


// --- NEW Browser-Based Streaming Functions ---

async function startBrowserStream() {
    if (isStreamRunning) {
        alert('You are already streaming.');
        return;
    }

    const liveVideo = document.getElementById('liveVideo');
    console.log('Attempting to access your camera and microphone...');

    try {
        // 1. Ask the browser for permission to use the camera and microphone.
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
        });

        // 2. Show the admin their own camera feed in the video element.
        liveVideo.srcObject = localStream;
        liveVideo.style.display = 'block';
        liveVideo.muted = true; // Mute local playback to prevent audio feedback/echo
        liveVideo.play();

        alert("Camera and microphone are active. You would now connect to the media server.");
        console.log("Stream is active locally. In a full WebRTC implementation, you would now send this 'localStream' to the NodeMediaServer.");
        
        // --- THIS IS THE COMPLEX PART FOR A REAL APP ---
        // In a real application, you would now use a WebRTC library to create a peer
        // connection and send the `localStream` to your server's RTMP endpoint.
        // This part is highly complex and usually requires a dedicated WebRTC signaling server.
        
        isStreamRunning = true;
        document.getElementById('startStreamBtn').disabled = true;
        document.getElementById('stopStreamBtn').disabled = false;

    } catch (err) {
        console.error("Failed to get media devices:", err);
        alert("Could not access your camera/microphone. Please check permissions in your browser settings and ensure no other application is using the camera.");
    }
}

function stopBrowserStream() {
    if (!localStream) return;

    console.log('Stopping local camera stream...');
    // Stop all media tracks (this turns off the camera light).
    localStream.getTracks().forEach(track => track.stop());

    const liveVideo = document.getElementById('liveVideo');
    liveVideo.srcObject = null;
    liveVideo.style.display = 'none';
    
    // In a real WebRTC app, you would also close the peer connection to the server here.

    isStreamRunning = false;
    document.getElementById('startStreamBtn').disabled = false;
    document.getElementById('stopStreamBtn').disabled = true;
    alert('Stream has been stopped.');
}


// --- All other functions are now updated to use relative URLs and better practices ---

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function handleVideoUpload() {
    const token = localStorage.getItem('token');
    const uploadBtn = document.getElementById('uploadBtn');
    const form = document.getElementById('uploadForm');
    if (!form.checkValidity()) {
        return alert('Please fill out all fields and select a video file.');
    }
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading... ⏳";
    const formData = new FormData(form);
    try {
        const res = await fetch('/api/admin/upload-video', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert(data.message);
        setTimeout(() => {
            fetchVideos();
            fetchUsers();
        }, 3000);
    } catch (err) {
        console.error("Upload failed:", err);
        alert("Upload failed: " + err.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload";
        form.reset();
    }
}

async function fetchVideos() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/all-videos', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const container = document.getElementById('videoList');
    container.innerHTML = ''; // Clear previous list
    data.videos.forEach(v => {
        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = `
            <h3>${v.title}</h3>
            <p>${v.description}</p>
            <p><b>Video ID:</b> ${v.id}</p>
            <video width="400" controls src="${v.file_path}"></video>
            <button class="delete-btn" data-video-id="${v.id}">🗑️ Delete Video</button>
        `;
        container.appendChild(div);
    });
}

async function fetchUsers() {
    const token = localStorage.getItem('token');
    const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const usersData = await usersRes.json();
    const container = document.getElementById('userList');
    container.innerHTML = '';

    const videosRes = await fetch('/api/admin/all-videos', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const videosData = await videosRes.json();
    
    usersData.users.forEach(u => {
        const div = document.createElement('div');
        div.classList.add('card');
        const options = videosData.videos.map(v => `<option value="${v.id}">${v.title}</option>`).join('');
        div.innerHTML = `
            <p><b>ID:</b> ${u.id} | <b>Name:</b> ${u.name} | <b>Email:</b> ${u.email}</p>
            <select class="video-select" data-user-id="${u.id}">
                <option value="">Select Video</option>
                ${options}
            </select>
            <button class="grant-btn" data-user-id="${u.id}">Grant Access</button>
            <button class="remove-btn" data-user-id="${u.id}">Remove Access</button>
        `;
        container.appendChild(div);
    });
}


// --- Delegated Event Handlers ---

async function handleVideoListClicks(e) {
    if (e.target.matches('.delete-btn')) {
        const token = localStorage.getItem('token');
        const videoId = e.target.dataset.videoId;
        if (confirm(`Are you sure you want to delete video ID ${videoId}?`)) {
            const res = await fetch(`/api/admin/delete-video/${videoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message);
            fetchVideos();
            fetchUsers();
        }
    }
}

async function handleUserListClicks(e) {
    const token = localStorage.getItem('token');
    const userId = e.target.dataset.userId;
    if (!userId) return;

    const select = document.querySelector(`.video-select[data-user-id="${userId}"]`);
    const videoId = select?.value;

    if (e.target.matches('.grant-btn')) {
        if (!videoId) return alert('Please select a video to grant access!');
        const res = await fetch('/api/admin/grant-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId, video_id: videoId })
        });
        const data = await res.json();
        alert(data.message);
    }

    if (e.target.matches('.remove-btn')) {
        if (!videoId) return alert('Please select a video to remove access!');
        if (!confirm('Are you sure you want to remove this access?')) return;
        const res = await fetch('/api/admin/remove-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId, video_id: videoId })
        });
        const data = await res.json();
        alert(data.message);
    }
}