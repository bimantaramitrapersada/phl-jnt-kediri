function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function ambilLokasi() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error('GPS gagal: ' + err.message)),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

function resizeFotoFromFile(file, maxSize = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h *= maxSize/w; w = maxSize; }
        else if (h > maxSize) { w *= maxSize/h; h = maxSize; }
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          base64: canvas.toDataURL('image/jpeg', quality).split(',')[1],
          dataUrl: canvas.toDataURL('image/jpeg', quality)
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function captureFotoDenganMark(video, data) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const now = new Date();
  const tanggal = now.toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  const waktu = now.toLocaleTimeString('id-ID');
  const shiftEmoji = data.shift === 'PAGI' ? '🌅' : (data.shift === 'SORE' ? '🌇' : '🌙');
  const lines = [
    shiftEmoji + ' SHIFT ' + data.shift,
    '👤 ' + data.nama,
    '📅 ' + tanggal,
    '🕐 ' + waktu,
    '📏 ' + data.jarak + ' meter'
  ];
  const padding = 12;
  const lineHeight = 28;
  const boxHeight = (lines.length * lineHeight) + (padding * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
  const warnaShift = data.shift === 'PAGI' ? '#ffa500' : (data.shift === 'SORE' ? '#ff6b35' : '#4a4a8a');
  ctx.fillStyle = warnaShift;
  ctx.fillRect(0, canvas.height - boxHeight - 4, canvas.width, 4);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 19px Arial';
  ctx.textAlign = 'left';
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, canvas.height - boxHeight + padding + (i + 0.85) * lineHeight);
  });
  const maxSize = 800;
  let w = canvas.width, h = canvas.height;
  if (w > h && w > maxSize) { h *= maxSize/w; w = maxSize; }
  else if (h > maxSize) { w *= maxSize/h; h = maxSize; }
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = w; finalCanvas.height = h;
  finalCanvas.getContext('2d').drawImage(canvas, 0, 0, w, h);
  return {
    base64: finalCanvas.toDataURL('image/jpeg', 0.7).split(',')[1],
    dataUrl: finalCanvas.toDataURL('image/jpeg', 0.7)
  };
}

async function kirimKeServer(payload) {
  payload.token = CONFIG.SECRET_TOKEN;
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return await res.json();
}

function setInfo(el, text, type = '') {
  el.innerText = text;
  el.className = 'info-box ' + type;
  el.style.whiteSpace = 'pre-line';
}

function getLastNIK() { return localStorage.getItem('lastNIK') || ''; }
function saveLastNIK(nik) { try { localStorage.setItem('lastNIK', nik); } catch(e) {} }