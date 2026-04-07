/* BabbleBee 🐝 — Minimal Slate Design */

const AUDIO_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/audio/';
const TEXT_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/texts/';

// SVG icon helpers (Lucide-style)
const SVG = {
  play: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  pause: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  playLg: '<svg class="icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  pauseLg: '<svg class="icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  skipFwd: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
  skipBack: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>',
  repeat: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  repeat1: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="15" font-size="8" fill="currentColor" stroke="none" text-anchor="middle">1</text></svg>',
  list: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  arrowLeft: '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  playCircle: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
  fileText: '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  headphones: '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  chevronRight: '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
};

let books = [];
let currentBook = null;
let currentTrackIdx = 0;
let loopMode = 'single'; // single | list
let activeTab = '全部';
let vinylOpen = false;
const audio = document.getElementById('audio');

const COVER_TOTAL = 12;
function getCoverClass(idx) { return 'cv-' + ((idx % COVER_TOTAL) + 1); }
function getCoverChar(title) {
  const clean = title.replace(/[·「」《》（）\s]/g, '');
  return clean.length <= 2 ? clean : clean.slice(0, 2);
}

const BANNER_BG = ['bg-1','bg-2','bg-3','bg-4','bg-5','bg-6'];

const VINYL_BG_COLORS = [
  'linear-gradient(135deg, #171C26, #2D3748)',
  'linear-gradient(135deg, #1A2634, #3D4F5F)',
  'linear-gradient(135deg, #1E272E, #485460)',
  'linear-gradient(135deg, #2C3E50, #4A6274)',
  'linear-gradient(135deg, #1C2833, #34495E)',
  'linear-gradient(135deg, #283747, #5D6D7E)',
  'linear-gradient(135deg, #1A202C, #4A5568)',
  'linear-gradient(135deg, #2D3748, #718096)',
  'linear-gradient(135deg, #171C26, #4A5568)',
  'linear-gradient(135deg, #1A2634, #576574)',
  'linear-gradient(135deg, #2C3A47, #6C7689)',
  'linear-gradient(135deg, #1E272E, #515A5A)',
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
  const filtered = activeTab === '全部' ? books : books.filter(b => b.category === activeTab);
  document.getElementById('book-list').innerHTML = filtered.map(b => {
    const gi = books.indexOf(b);
    const total = getBookTotalPlays(b);
    const badge = total > 0 ? `<span class="book-play-badge">${SVG.headphones} ${total}</span>` : '';
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
        <span class="book-row-arrow">${SVG.chevronRight}</span>
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
    <button class="detail-back" onclick="goHome()">${SVG.arrowLeft} 返回</button>
    <div class="detail-cover-wrap">
      <div class="detail-cover ${getCoverClass(gi)}">
        <span class="cover-char">${getCoverChar(book.title)}</span>
      </div>
      <div class="detail-info">
        <div class="detail-title">${book.title}</div>
        <div class="detail-desc">${book.desc}</div>
        <div class="detail-stats">
          <span>${SVG.fileText} ${book.tracks.length}篇</span>
          <span>${SVG.headphones} ${total}次</span>
        </div>
      </div>
    </div>`;

  document.getElementById('detail-actions').innerHTML = `
    <button class="action-btn action-btn-primary" onclick="playTrack(0)">${SVG.playCircle} 全部播放</button>
    ${book.pdf ? `<button class="action-btn action-btn-ghost" onclick="togglePdf()">${SVG.fileText} 原文</button>` : ''}
  `;

  const loopIcon = loopMode === 'single' ? SVG.repeat1 : SVG.repeat;
  document.getElementById('detail-tracks').innerHTML = `
    <div class="track-header">
      <span>共 ${book.tracks.length} 首</span>
      <button onclick="toggleLoop()" id="btn-loop" style="background:none;border:none;cursor:pointer;display:flex;align-items:center">${loopIcon}</button>
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
  const bar = document.getElementById('player-bar');
  bar.classList.remove('hidden');
  document.getElementById('player-title').textContent = name;
  updatePlayerCount();
  
  const gi = books.indexOf(currentBook);
  const mc = document.getElementById('mini-cover');
  mc.className = 'mini-cover ' + getCoverClass(gi);
  mc.textContent = getCoverChar(currentBook.title);
  
  document.querySelectorAll('.track-item').forEach(el => el.classList.remove('playing'));
  const item = document.querySelector(`.track-item[data-idx="${idx}"]`);
  if (item) { item.classList.add('playing'); item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: name, artist: 'BabbleBee 巴波蜂', album: currentBook.title });
    navigator.mediaSession.setActionHandler('previoustrack', playerPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playerNext);
  }
  
  if (vinylOpen) { updateVinylInfo(); updateVinylDisc(); }
}

function playerToggle() { audio.paused ? audio.play() : audio.pause(); }
function playerPrev() { if (currentBook) playTrack((currentTrackIdx - 1 + currentBook.tracks.length) % currentBook.tracks.length); }
function playerNext() { if (currentBook) playTrack((currentTrackIdx + 1) % currentBook.tracks.length); }

function toggleLoop() {
  loopMode = loopMode === 'single' ? 'list' : 'single';
  const icon = loopMode === 'single' ? SVG.repeat1 : SVG.repeat;
  const btn = document.getElementById('btn-loop');
  if (btn) btn.innerHTML = icon;
  const vb = document.getElementById('vinyl-btn-loop');
  if (vb) vb.innerHTML = icon;
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

function closeVinyl() { vinylOpen = false; document.getElementById('vinyl-player').classList.add('hidden'); }
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
  if (!audio.paused) { disc.classList.add('spinning'); arm.classList.add('on-disc'); }
  else { disc.classList.remove('spinning'); arm.classList.remove('on-disc'); }
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + (Math.floor(s % 60) < 10 ? '0' : '') + Math.floor(s % 60);
}

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

function syncPlayState() {
  const playing = !audio.paused;
  document.getElementById('btn-play').innerHTML = playing ? SVG.pause : SVG.play;
  const vb = document.getElementById('vinyl-btn-play');
  if (vb) vb.innerHTML = playing ? SVG.pauseLg : SVG.playLg;
  updateVinylDisc();
}
audio.addEventListener('play', syncPlayState);
audio.addEventListener('pause', syncPlayState);

init();
