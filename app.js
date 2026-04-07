/* BabbleBee 🐝 - NetEase Cloud Style App */

const AUDIO_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/audio/';
const TEXT_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/texts/';

let books = [];
let currentBook = null;
let currentTrackIdx = 0;
let loopMode = 'single';
let activeTab = '全部';
let vinylOpen = false;
const audio = document.getElementById('audio');

const COVER_TOTAL = 12;
function getCoverClass(idx) { return 'cv-' + ((idx % COVER_TOTAL) + 1); }

// Get the first 1-2 chars of title for cover display
function getCoverChar(title) {
  // Remove punctuation marks, get first 2 chars
  const clean = title.replace(/[·「」《》（）\s]/g, '');
  return clean.length <= 2 ? clean : clean.slice(0, 2);
}

const BANNER_BG = ['bg-1','bg-2','bg-3','bg-4','bg-5','bg-6'];

const VINYL_BG_COLORS = [
  'linear-gradient(135deg, #2c3e50, #1a1a2e)',
  'linear-gradient(135deg, #1a3a2a, #0d1f1a)',
  'linear-gradient(135deg, #3e2723, #1a120e)',
  'linear-gradient(135deg, #1a237e, #0d1440)',
  'linear-gradient(135deg, #4a148c, #1a0533)',
  'linear-gradient(135deg, #004d40, #00251a)',
  'linear-gradient(135deg, #37474f, #1a2327)',
  'linear-gradient(135deg, #4e342e, #1b0c08)',
  'linear-gradient(135deg, #283593, #0d1440)',
  'linear-gradient(135deg, #1b5e20, #0a2e10)',
  'linear-gradient(135deg, #880e4f, #3d0525)',
  'linear-gradient(135deg, #bf360c, #5c1a06)',
];

// --- Storage ---
function getPlayCount(t) { return parseInt(localStorage.getItem('pc:' + t) || '0'); }
function incPlayCount(t) { const c = getPlayCount(t) + 1; localStorage.setItem('pc:' + t, c); return c; }
function getBookTotalPlays(b) { return b.tracks.reduce((s, t) => s + getPlayCount(t), 0); }

// --- Init ---
async function init() {
  books = await (await fetch('books.json')).json();
  renderBanner();
  renderTabs();
  renderBookList();
  window.addEventListener('hashchange', handleHash);
  handleHash();
}

function handleHash() {
  const hash = location.hash.slice(1);
  if (hash.startsWith('book/')) {
    const b = books.find(x => x.id === hash.slice(5));
    if (b) showBook(b);
  } else goHome();
}

// --- Banner ---
function renderBanner() {
  const featured = books.filter(b => b.recommended);
  document.getElementById('banner-scroll').innerHTML = featured.map((b, i) => `
    <div class="banner-card ${BANNER_BG[i % BANNER_BG.length]}" onclick="location.hash='book/${b.id}'">
      <div>
        <div class="banner-title">${b.title}</div>
        <div class="banner-desc">${b.desc}</div>
      </div>
      <span class="banner-tracks">${b.tracks.length}篇</span>
    </div>
  `).join('');
}

// --- Tabs ---
function renderTabs() {
  const cats = ['全部', ...new Set(books.map(b => b.category))];
  document.getElementById('tabs').innerHTML = cats.map(c =>
    `<button class="tab${c === activeTab ? ' active' : ''}" onclick="switchTab('${c}')">${c}</button>`
  ).join('');
}
function switchTab(c) { activeTab = c; renderTabs(); renderBookList(); }

// --- Book List ---
function renderBookList() {
  let filtered;
  if (activeTab === '全部') filtered = books;
  else filtered = books.filter(b => b.category === activeTab);

  document.getElementById('book-list').innerHTML = filtered.map(b => {
    const gi = books.indexOf(b);
    const total = getBookTotalPlays(b);
    const badge = total > 0 ? `<span class="book-play-badge">▶ ${total}</span>` : '';
    return `
      <div class="book-row" onclick="location.hash='book/${b.id}'">
        <div class="book-cover-sm ${getCoverClass(gi)}">
          <span class="cover-char">${getCoverChar(b.title)}</span>
        </div>
        <div class="book-meta">
          <div class="book-meta-title">${b.title}</div>
          <div class="book-meta-desc">${b.desc}</div>
          <div class="book-meta-stats">
            <span>${b.tracks.length}篇</span>
            ${badge}
          </div>
        </div>
        <span class="book-row-arrow">›</span>
      </div>`;
  }).join('');
}

// --- Book Detail ---
function showBook(book) {
  currentBook = book;
  document.getElementById('page-home').classList.remove('active');
  document.getElementById('page-book').classList.add('active');

  const gi = books.indexOf(book);
  const total = getBookTotalPlays(book);

  document.getElementById('detail-header').innerHTML = `
    <button class="detail-back" onclick="goHome()">← 返回</button>
    <div class="detail-cover-wrap">
      <div class="detail-cover ${getCoverClass(gi)}">
        <span class="cover-char">${getCoverChar(book.title)}</span>
      </div>
      <div class="detail-info">
        <div class="detail-title">${book.title}</div>
        <div class="detail-desc">${book.desc}</div>
        <div class="detail-stats">
          <span>📄 ${book.tracks.length}篇</span>
          <span>🎧 ${total}次</span>
        </div>
      </div>
    </div>`;

  document.getElementById('detail-actions').innerHTML = `
    <button class="action-btn action-btn-primary" onclick="playTrack(0)">▶ 全部播放</button>
    ${book.pdf ? `<button class="action-btn action-btn-ghost" onclick="togglePdf()">📖 原文</button>` : ''}
  `;

  document.getElementById('detail-tracks').innerHTML = `
    <div class="track-header">
      <span>共 ${book.tracks.length} 首</span>
      <button onclick="toggleLoop()" id="btn-loop" style="background:none;border:none;font-size:16px;cursor:pointer">🔂</button>
    </div>
    <ul class="track-list">${
    book.tracks.map((t, i) => {
      const name = t.replace(/\.mp3$/i, '').replace(/^\d+-/, '');
      const plays = getPlayCount(t);
      const badge = plays > 0 ? `<span class="track-plays">×${plays}</span>` : '';
      return `<li class="track-item" data-idx="${i}" onclick="playTrack(${i})">
        <span class="track-num">${i + 1}</span>
        <span class="track-name">${name}</span>${badge}</li>`;
    }).join('')
  }</ul>`;

  document.getElementById('book-pdf').innerHTML = book.pdf
    ? `<div id="pdf-container" style="display:none"><iframe src="${TEXT_BASE}${encodeURIComponent(book.pdf)}"></iframe></div>`
    : '';
}

function togglePdf() {
  const c = document.getElementById('pdf-container');
  if (c) c.style.display = c.style.display === 'none' ? 'block' : 'none';
}

function goHome() {
  location.hash = '';
  document.getElementById('page-book').classList.remove('active');
  document.getElementById('page-home').classList.add('active');
  renderBookList();
}

// --- Player ---
function playTrack(idx) {
  if (!currentBook) return;
  currentTrackIdx = idx;
  const t = currentBook.tracks[idx];
  audio.src = AUDIO_BASE + encodeURIComponent(t);
  audio.play();
  
  const name = t.replace(/\.mp3$/i, '').replace(/^\d+-/, '');
  
  // Mini player
  const bar = document.getElementById('player-bar');
  bar.classList.remove('hidden');
  document.getElementById('player-title').textContent = name;
  updatePlayerCount();
  
  // Mini cover
  const gi = books.indexOf(currentBook);
  const mc = document.getElementById('mini-cover');
  mc.className = 'mini-cover ' + getCoverClass(gi);
  mc.textContent = getCoverChar(currentBook.title);
  
  // Highlight playing track
  document.querySelectorAll('.track-item').forEach(el => el.classList.remove('playing'));
  const item = document.querySelector(`.track-item[data-idx="${idx}"]`);
  if (item) { item.classList.add('playing'); item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  
  // Media Session
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: name, artist: 'BabbleBee 巴波蜂', album: currentBook.title });
    navigator.mediaSession.setActionHandler('previoustrack', playerPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playerNext);
  }
  
  if (vinylOpen) { updateVinylInfo(); updateVinylDisc(); }
}

function playerToggle() {
  if (audio.paused) audio.play();
  else audio.pause();
}
function playerPrev() { if (currentBook) playTrack((currentTrackIdx - 1 + currentBook.tracks.length) % currentBook.tracks.length); }
function playerNext() { if (currentBook) playTrack((currentTrackIdx + 1) % currentBook.tracks.length); }

function toggleLoop() {
  loopMode = loopMode === 'single' ? 'list' : 'single';
  const icon = loopMode === 'single' ? '🔂' : '🔁';
  const btn = document.getElementById('btn-loop');
  if (btn) btn.textContent = icon;
  const vb = document.getElementById('vinyl-btn-loop');
  if (vb) vb.textContent = icon;
}

function updatePlayerCount() {
  if (!currentBook) return;
  const c = getPlayCount(currentBook.tracks[currentTrackIdx]);
  document.getElementById('player-count').textContent = c > 0 ? `已听${c}遍` : currentBook.title;
}

audio.addEventListener('ended', () => {
  const t = currentBook.tracks[currentTrackIdx];
  incPlayCount(t);
  updatePlayerCount();
  const items = document.querySelectorAll('.track-item');
  if (items[currentTrackIdx]) {
    let badge = items[currentTrackIdx].querySelector('.track-plays');
    if (!badge) { badge = document.createElement('span'); badge.className = 'track-plays'; items[currentTrackIdx].appendChild(badge); }
    badge.textContent = `×${getPlayCount(t)}`;
  }
  loopMode === 'single' ? (audio.currentTime = 0, audio.play()) : playerNext();
});

// --- Vinyl Player ---
function openVinyl() {
  if (!currentBook) return;
  vinylOpen = true;
  document.getElementById('vinyl-player').classList.remove('hidden');
  document.getElementById('vinyl-book-title').textContent = currentBook.title;
  document.getElementById('vinyl-book-sub').textContent = currentBook.desc;
  
  const gi = books.indexOf(currentBook);
  document.getElementById('vinyl-bg').style.background = VINYL_BG_COLORS[gi % VINYL_BG_COLORS.length];
  document.getElementById('vinyl-center').textContent = getCoverChar(currentBook.title);
  document.getElementById('vinyl-center').className = 'vinyl-center ' + getCoverClass(gi);
  
  updateVinylInfo();
  requestAnimationFrame(() => updateVinylDisc());
}

function closeVinyl() {
  vinylOpen = false;
  document.getElementById('vinyl-player').classList.add('hidden');
}

function showTrackList() { closeVinyl(); }

function updateVinylInfo() {
  if (!currentBook) return;
  const t = currentBook.tracks[currentTrackIdx];
  const name = t.replace(/\.mp3$/i, '').replace(/^\d+-/, '');
  document.getElementById('vinyl-track-name').textContent = name;
  const c = getPlayCount(t);
  document.getElementById('vinyl-track-count').textContent = c > 0 ? `已听 ${c} 遍` : '';
}

function updateVinylDisc() {
  const disc = document.getElementById('vinyl-disc');
  const arm = document.getElementById('vinyl-arm');
  if (!audio.paused) {
    disc.classList.add('spinning');
    arm.classList.add('on-disc');
  } else {
    disc.classList.remove('spinning');
    arm.classList.remove('on-disc');
  }
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// Time/progress sync
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progress-bar').value = pct;
    if (vinylOpen) {
      document.getElementById('vinyl-progress-bar').value = pct;
      document.getElementById('vinyl-time-cur').textContent = fmtTime(audio.currentTime);
      document.getElementById('vinyl-time-dur').textContent = fmtTime(audio.duration);
    }
  }
});

document.getElementById('vinyl-progress-bar').addEventListener('input', e => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});

// Sync play/pause UI
function syncPlayState() {
  const playing = !audio.paused;
  document.getElementById('btn-play').textContent = playing ? '⏸' : '▶';
  const vb = document.getElementById('vinyl-btn-play');
  if (vb) vb.textContent = playing ? '⏸' : '▶';
  updateVinylDisc();
}
audio.addEventListener('play', syncPlayState);
audio.addEventListener('pause', syncPlayState);

init();
