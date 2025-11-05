const token = localStorage.getItem('token');

// Upload video
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

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

    // 🕒 Wait 3 seconds before refreshing (Cloudinary needs short time)
    setTimeout(() => {
      fetchVideos();
    }, 3000);

  } catch (err) {
    console.error("Upload failed:", err);
    alert("Video upload failed. Please try again.");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload";
    e.target.reset(); // optional: clear form after upload
  }
});



function logout() {
  localStorage.removeItem('token'); // remove JWT token
  window.location.href = 'login.html'; // redirect back to login page
}

// Fetch videos
async function fetchVideos() {
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

  // Delete handler
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

// ✅ Fetch users with Grant + Remove access
async function fetchUsers() {
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

    let options = videosData.videos.map(v => `<option value="${v.id}">${v.title}</option>`).join('');
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

  // Grant access
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




  // ✅ Remove access
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

fetchVideos();
fetchUsers();