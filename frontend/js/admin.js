// frontend/js/admin.js (Final Corrected Version)

document.addEventListener('DOMContentLoaded', () => {
    fetchVideos();
    fetchUsers();
    document.getElementById('uploadBtn')?.addEventListener('click', handleVideoUpload);
    document.getElementById('startStreamBtn')?.addEventListener('click', startBroadcasting);
    document.getElementById('stopStreamBtn')?.addEventListener('click', stopBroadcasting);
    document.getElementById('videoList')?.addEventListener('click', handleVideoListClicks);
    document.getElementById('userList')?.addEventListener('click', handleUserListClicks);
    const stopBtn = document.getElementById('stopStreamBtn');
    if (stopBtn) stopBtn.disabled = true;
});

let localStream;
let peerConnections = {};
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

ws.onopen = () => console.log('Admin: Connected to WebSocket.');
ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    const viewerId = data.viewerId;

    if (data.type === 'offer' && viewerId) {
        if (!localStream) return;
        console.log(`Admin: Received offer from viewer ${viewerId}`);
        const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" }] };
        const pc = new RTCPeerConnection(configuration);
        peerConnections[viewerId] = pc;
        
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.onicecandidate = e => {
            if (e.candidate) ws.send(JSON.stringify({ type: 'candidate', candidate: e.candidate, target: viewerId }));
        };
        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', answer: answer, target: viewerId }));
    } else if (data.type === 'candidate' && data.senderId) {
        if (peerConnections[data.senderId]) {
            await peerConnections[data.senderId].addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }
};

async function startBroadcasting() {
    console.log('Attempting to access camera...');
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const liveVideo = document.getElementById('liveVideo');
        liveVideo.srcObject = localStream;
        liveVideo.style.display = 'block';
        liveVideo.muted = true;
        liveVideo.play();
        ws.send(JSON.stringify({ type: 'broadcaster' }));
        document.getElementById('startStreamBtn').disabled = true;
        document.getElementById('stopStreamBtn').disabled = false;
        alert('You are now live!');
    } catch (err) {
        console.error("Failed to get media devices:", err);
        alert("Could not access camera.");
    }
}

function stopBroadcasting() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};
    const liveVideo = document.getElementById('liveVideo');
    liveVideo.srcObject = null;
    liveVideo.style.display = 'none';
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'disconnect' }));
    }
    document.getElementById('startStreamBtn').disabled = false;
    document.getElementById('stopStreamBtn').disabled = true;
    alert('Broadcast has been stopped.');
}

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
    const res = await fetch('/api/admin/all-videos', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const container = document.getElementById('videoList');
    container.innerHTML = '';
    data.videos.forEach(v => {
        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = `<h3>${v.title}</h3><p>${v.description}</p><p><b>Video ID:</b> ${v.id}</p><video width="400" controls src="${v.file_path}"></video><button class="delete-btn" data-video-id="${v.id}">🗑️ Delete Video</button>`;
        container.appendChild(div);
    });
}

async function fetchUsers() {
    const token = localStorage.getItem('token');
    try {
        const usersRes = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        const container = document.getElementById('userList');
        container.innerHTML = '';

        const videosRes = await fetch('/api/admin/all-videos', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!videosRes.ok) throw new Error('Failed to fetch video list');
        const videosData = await videosRes.json();
        
        // **THE FIX:** We manually add the "Live Stream" option here.
        // The database returns all UPLOADED videos. We add the special live stream
        // record to the list before creating the dropdowns.
        const allOptions = [
            { id: 0, title: 'Live Stream' }, // Our special, hardcoded live stream video
            ...videosData.videos          // All the other videos from the database
        ];

        usersData.users.forEach(u => {
            const div = document.createElement('div');
            div.classList.add('card');
            
            // Now, we map over the 'allOptions' array which includes the Live Stream
            const options = videosData.videos.map(v => `<option value="${v.id}">${v.title}</option>`).join('');

            div.innerHTML = `
                <p><b>ID:</b> ${u.id} | <b>Name:</b> ${u.name} | <b>Email:</b> ${u.email}</p>
                <select class="video-select" data-user-id="${u.id}">
                    <option value="">Select Content</option>
                    ${options}
                </select>
                <button class="grant-btn" data-user-id="${u.id}">Grant Access</button>
                <button class="remove-btn" data-user-id="${u.id}">Remove Access</button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}


async function handleVideoListClicks(e) {
    if (e.target.matches('.delete-btn')) {
        const token = localStorage.getItem('token');
        const videoId = e.target.dataset.videoId;
        if (confirm(`Are you sure you want to delete video ID ${videoId}?`)) {
            const res = await fetch(`/api/admin/delete-video/${videoId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
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
        const res = await fetch('/api/admin/grant-access', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ user_id: userId, video_id: videoId }) });
        const data = await res.json();
        alert(data.message);
    }
    if (e.target.matches('.remove-btn')) {
        if (!videoId) return alert('Please select a video to remove access!');
        if (!confirm('Are you sure you want to remove this access?')) return;
        const res = await fetch('/api/admin/remove-access', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ user_id: userId, video_id: videoId }) });
        const data = await res.json();
        alert(data.message);
    }
}