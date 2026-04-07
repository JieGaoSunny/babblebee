/* BabbleBee 古文磨耳朵 — Classical Bookshelf + Player */

const AUDIO_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/audio/';
const TEXT_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/texts/';

let books = [];
let currentBook = null;
let currentTrackIdx = 0;
let loopMode = 'single'; // single | list
let vinylOpen = false;
const audio = document.getElementById('audio');

const BOOK_COLORS = ['book-red','book-blue','book-green','book-brown','book-purple','book-black','book-teal','book-orange','book-navy','book-wine','book-forest','book-slate'];
function getBookColor(idx) { return BOOK_COLORS[idx % BOOK_COLORS.length]; }
function getCoverChar(title) {
  const c = title.replace(/[·「」《》（）\-\s]/g, '');
  return c.length <= 3 ? c : c.slice(0, 2);
}

const VINYL_BG = [
  'linear-gradient(135deg, #2C1810, #1a0f0a)',
  'linear-gradient(135deg, #654321, #3E2723)',
  'linear-gradient(135deg, #8B0000, #3d0000)',
  'linear-gradient(135deg, #1a1a2e, #0d0d1a)',
  'linear-gradient(135deg, #1b4332, #0a2e10)',
  'linear-gradient(135deg, #3c1518, #1a0a0c)',
  'linear-gradient(135deg, #4A3728, #2C1810)',
  'linear-gradient(135deg, #5f0f40, #3d0525)',
  'linear-gradient(135deg, #8B5A2B, #4A3728)',
  'linear-gradient(135deg, #3d405b, #1d1f2e)',
  'linear-gradient(135deg, #6b2737, #3a1520)',
  'linear-gradient(135deg, #0b3954, #051c2c)',
];

// --- Storage ---
function getPlayCount(t) { return parseInt(localStorage.getItem('pc:' + t) || '0'); }
function incPlayCount(t) { const c = getPlayCount(t) + 1; localStorage.setItem('pc:' + t, c); return c; }
function getBookTotalPlays(b) { return b.tracks.reduce((s, t) => s + getPlayCount(t), 0); }

function saveLastPlayed() {
  if (!currentBook) return;
  localStorage.setItem('lastBook', currentBook.id);
  localStorage.setItem('lastTrack', String(currentTrackIdx));
}
function getLastPlayed() {
  const bid = localStorage.getItem('lastBook');
  const tidx = parseInt(localStorage.getItem('lastTrack') || '0');
  return { bookId: bid, trackIdx: tidx };
}

// --- Init ---
async function init() {
  books = await (await fetch('books.json')).json();
  renderBookshelf();
  renderContinueCard();
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

// --- Bookshelf ---
function renderBookshelf() {
  const catOrder = [];
  const catMap = {};
  books.forEach((b, i) => {
    if (!catMap[b.category]) { catMap[b.category] = []; catOrder.push(b.category); }
    catMap[b.category].push({ book: b, globalIdx: i });
  });

  document.getElementById('bookshelf-area').innerHTML = catOrder.map(cat => `
    <div class="shelf">
      <div class="shelf-label">${cat}</div>
      <div class="shelf-books">
        ${catMap[cat].map(({ book: b, globalIdx: gi }) => `
          <a class="book" onclick="location.hash='book/${b.id}';return false;" href="#">
            <div class="book-cover ${getBookColor(gi)}"><h3>${getCoverChar(b.title)}</h3></div>
          </a>
        `).join('')}
      </div>
      <div class="shelf-board"></div>
    </div>
  `).join('');
}

// --- Continue Listening Card ---
function renderContinueCard() {
  const card = document.getElementById('continue-card');
  let { bookId, trackIdx } = getLastPlayed();
  let book = bookId ? books.find(b => b.id === bookId) : null;

  // Default to 三字经 if no history
  if (!book) {
    book = books.find(b => b.id === 'sanzijing') || books[0];
    trackIdx = 0;
  }

  const gi = books.indexOf(book);
  const t = book.tracks[trackIdx] || book.tracks[0];
  const name = t.replace(/\.mp3$/i, '').replace(/^\d+-/, '');
  const plays = getBookTotalPlays(book);

  card.innerHTML = `
    <div class="continue-cover ${getBookColor(gi)}">
      <h3>${getCoverChar(book.title)}</h3>
    </div>
    <div class="continue-info">
      <div class="continue-label">继续收听</div>
      <div class="continue-title">${name}</div>
      <div class="continue-sub">${book.title}${plays > 0 ? ' · 已听' + plays + '遍' : ''}</div>
    </div>
    <div class="continue-play"><i class="ri-play-fill"></i></div>`;
  card.onclick = () => {
    currentBook = book;
    currentTrackIdx = trackIdx;
    location.hash = 'book/' + book.id;
    setTimeout(() => playTrack(trackIdx), 300);
  };
}

// --- Book Detail ---
function showBook(book) {
  currentBook = book;
  document.getElementById('page-home').classList.remove('active');
  document.getElementById('page-book').classList.add('active');

  const gi = books.indexOf(book);
  const total = getBookTotalPlays(book);

  document.getElementById('detail-header').innerHTML = `
    <button class="detail-back" onclick="goHome()"><i class="ri-arrow-left-s-line"></i> 返回书架</button>
    <div class="book-hero">
      <div class="detail-cover ${getBookColor(gi)}">
        <span class="cover-char">${getCoverChar(book.title)}</span>
      </div>
      <div class="detail-info">
        <div class="detail-title">${book.title}</div>
        <div class="detail-desc">${book.desc}</div>
        <div class="detail-stats">
          <div><div class="detail-stat-value">${book.tracks.length}</div><div class="detail-stat-label">篇章</div></div>
          <div><div class="detail-stat-value">${total}</div><div class="detail-stat-label">已听</div></div>
        </div>
      </div>
    </div>`;

  document.getElementById('detail-actions').innerHTML = `
    <button class="action-btn action-btn-primary" onclick="playTrack(0)">
      <i class="ri-play-circle-fill"></i> <span>全部播放</span>
    </button>
    ${book.pdf ? `<button class="action-btn action-btn-ghost" onclick="togglePdf()"><i class="ri-book-open-line"></i> 原文</button>` : ''}
  `;

  document.getElementById('detail-tracks').innerHTML = `
    <div class="chapters">
      <div class="track-header"><span>全部篇章</span><span>共 ${book.tracks.length} 首</span></div>
      <ul class="track-list">${
    book.tracks.map((t, i) => {
      const name = t.replace(/\.mp3$/i, '').replace(/^\d+-/, '');
      const plays = getPlayCount(t);
      const badge = plays > 0 ? `<span class="track-plays">×${plays}</span>` : '';
      return `<li class="track-item" data-idx="${i}" onclick="playTrack(${i})">
        <span class="track-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="track-name">${name}</span>${badge}
        <i class="ri-play-fill track-icon"></i></li>`;
    }).join('')
  }</ul></div>`;

  document.getElementById('book-pdf').innerHTML = book.pdf
    ? `<div id="pdf-container" style="display:none"><iframe src="${TEXT_BASE}${encodeURIComponent(book.pdf)}"></iframe></div>` : '';
}

function togglePdf() {
  const c = document.getElementById('pdf-container');
  if (c) c.style.display = c.style.display === 'none' ? 'block' : 'none';
}

function goHome() {
  location.hash = '';
  document.getElementById('page-book').classList.remove('active');
  document.getElementById('page-home').classList.add('active');
  renderContinueCard();
}

// --- Player ---
function playTrack(idx) {
  if (!currentBook) return;
  currentTrackIdx = idx;
  const t = currentBook.tracks[idx];
  audio.src = AUDIO_BASE + encodeURIComponent(t);
  audio.play();
  saveLastPlayed();
  
  const name = t.replace(/\.mp3$/i, '').replace(/^\d+-/, '');
  document.getElementById('player-bar').classList.remove('hidden');
  document.getElementById('player-title').textContent = name;
  document.getElementById('player-book').textContent = currentBook.title;
  updatePlayerCount();
  
  const gi = books.indexOf(currentBook);
  const mc = document.getElementById('mini-cover');
  mc.className = 'mini-cover ' + getBookColor(gi);
  mc.textContent = getCoverChar(currentBook.title);
  
  // Highlight
  document.querySelectorAll('.track-item').forEach(el => {
    el.classList.remove('playing');
    const icon = el.querySelector('.track-icon');
    if (icon) icon.className = 'ri-play-fill track-icon';
  });
  const item = document.querySelector(`.track-item[data-idx="${idx}"]`);
  if (item) {
    item.classList.add('playing');
    const icon = item.querySelector('.track-icon');
    if (icon) icon.className = 'ri-volume-up-fill track-icon';
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: name, artist: 'BabbleBee 古文磨耳朵', album: currentBook.title });
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
  const vb = document.getElementById('vinyl-btn-loop');
  if (vb) vb.innerHTML = `<i class="${loopMode === 'single' ? 'ri-repeat-one-line' : 'ri-repeat-line'}"></i>`;
  const mb = document.getElementById('mini-btn-loop');
  if (mb) mb.innerHTML = `<i class="${loopMode === 'single' ? 'ri-repeat-one-line' : 'ri-repeat-line'}"></i>`;
}

function updatePlayerCount() {
  if (!currentBook) return;
  const c = getPlayCount(currentBook.tracks[currentTrackIdx]);
  document.getElementById('player-count').textContent = c > 0 ? `已听${c}遍` : '';
}

audio.addEventListener('ended', () => {
  const t = currentBook.tracks[currentTrackIdx];
  incPlayCount(t);
  updatePlayerCount();
  saveLastPlayed();
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
  document.getElementById('vinyl-bg').style.background = VINYL_BG[gi % VINYL_BG.length];
  document.getElementById('vinyl-center').textContent = getCoverChar(currentBook.title);
  document.getElementById('vinyl-center').className = 'vinyl-center ' + getBookColor(gi);
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
  document.getElementById('btn-play').innerHTML = playing ? '<i class="ri-pause-fill"></i>' : '<i class="ri-play-fill"></i>';
  const vb = document.getElementById('vinyl-btn-play');
  if (vb) vb.innerHTML = playing ? '<i class="ri-pause-fill" style="font-size:28px"></i>' : '<i class="ri-play-fill" style="font-size:28px"></i>';
  updateVinylDisc();
}
audio.addEventListener('play', syncPlayState);
audio.addEventListener('pause', syncPlayState);

init();
