/* BabbleBee 古文磨耳朵 — Classical Bookshelf + Player */

const AUDIO_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/audio/';
const TEXT_BASE = 'https://jiettsstorage.blob.core.windows.net/babblebee/texts/';

let books = [];
let currentBook = null;
let currentTrackIdx = 0;
let loopMode = 'single'; // single | list | chapter
const audio = document.getElementById('audio');

const BOOK_COLORS = ['book-red','book-blue','book-green','book-brown','book-purple','book-black','book-teal','book-orange','book-navy','book-wine','book-forest','book-slate'];
function getBookColor(idx) { return BOOK_COLORS[idx % BOOK_COLORS.length]; }
function getCoverChar(title) {
  const map = {
    '三字经':'三字经', '弟子规':'弟子规', '千字文':'千字文', '百家姓':'百家姓',
    '笠翁对韵·上':'笠翁上', '笠翁对韵·下':'笠翁下',
    '老子':'老子', '庄子':'庄子', '孙子兵法':'孙子兵法',
    '诗经':'诗经', '唐诗':'唐诗', '宋词':'宋词',
    '历代诗歌':'历代诗歌', '历代美文':'历代美文', '左传':'左传', '史记':'史记',
    'Princess 豌豆公主':'豌豆公主', 'Grandmother 祖母':'祖母',
    'Andersen 安徒生童话':'安徒生', 'An Ant 蚂蚁与鸽子':'蚂蚁鸽子',
    "Aesop's Fables":'伊索寓言', 'Peter Rabbit 彼得兔':'彼得兔',
    'Nursery Rhymes 英文儿歌':'英文儿歌',
    'Power Up':'PU',
  };
  if (map[title]) return map[title];
  const c = title.replace(/[·「」《》（）\-\s]/g, '');
  return c.length <= 4 ? c : c.slice(0, 4);
}
function getCoverSizeClass(title) {
  const len = getCoverChar(title).length;
  if (len >= 5) return 'chars-5';
  if (len >= 4) return 'chars-4';
  return '';
}

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
  return { bookId: localStorage.getItem('lastBook'), trackIdx: parseInt(localStorage.getItem('lastTrack') || '0') };
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

// --- Bookshelf (no expand, just books) ---
function renderBookshelf() {
  const catOrder = []; const catMap = {};
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
            <div class="book-cover ${getBookColor(gi)}"><h3 class="${getCoverSizeClass(b.title)}">${getCoverChar(b.title)}</h3></div>
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
  if (!book) { book = books.find(b => b.id === 'sanzijing') || books[0]; trackIdx = 0; }

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
    ${book.pdf ? `<button class="action-btn action-btn-ghost" onclick="togglePdfView()"><i class="ri-book-open-line"></i> 原文</button>` : ''}
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

  document.getElementById('book-pdf').innerHTML = '';
}

// --- Inline PDF Viewer ---
let pdfVisible = false;
function togglePdfView() {
  const container = document.getElementById('book-pdf');
  if (pdfVisible) {
    container.innerHTML = '';
    pdfVisible = false;
    return;
  }
  if (!currentBook || !currentBook.pdf) return;
  const url = TEXT_BASE + encodeURIComponent(currentBook.pdf);
  const viewerUrl = 'https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent(url);
  container.innerHTML = `
    <div class="pdf-viewer">
      <div class="pdf-header">
        <span>${currentBook.title} · 原文</span>
        <a href="${url}" target="_blank" class="pdf-open-btn" title="新窗口打开"><i class="ri-external-link-line"></i></a>
        <button onclick="togglePdfView()" class="pdf-close"><i class="ri-close-line"></i></button>
      </div>
      <iframe src="${viewerUrl}" class="pdf-iframe"></iframe>
    </div>`;
  pdfVisible = true;
  container.scrollIntoView({ behavior: 'smooth' });
}

function goHome() {
  location.hash = '';
  document.getElementById('page-book').classList.remove('active');
  document.getElementById('page-home').classList.add('active');
  pdfVisible = false;
  renderContinueCard();
}

// --- Player ---
let playerState = 'hidden'; // hidden | bar | mini | full
let playbackSpeed = 1.0;
const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

function playTrack(idx) {
  if (!currentBook) return;
  currentTrackIdx = idx;
  const t = currentBook.tracks[idx];
  audio.src = AUDIO_BASE + encodeURIComponent(t);
  audio.play();
  saveLastPlayed();

  const name = t.replace(/\.mp3$/i, '').replace(/^\d+-/, '');

  // Show bar player
  playerShowBar();

  // Update bar info
  document.getElementById('player-title').textContent = name;
  document.getElementById('player-book').textContent = currentBook.title;

  // Update bar cover
  const gi = books.indexOf(currentBook);
  const bc = document.getElementById('bar-cover');
  bc.className = 'bar-cover ' + getBookColor(gi);
  bc.textContent = getCoverChar(currentBook.title);

  // Update full player
  const fc = document.getElementById('full-cover');
  fc.className = 'full-cover ' + getBookColor(gi);
  fc.innerHTML = `<h3>${getCoverChar(currentBook.title)}</h3>`;
  document.getElementById('full-title').textContent = name;
  document.getElementById('full-book').textContent = currentBook.title;
  updatePlayerCount();

  // Highlight track
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
}

// --- Player state transitions ---
function playerShowBar() {
  document.getElementById('player-bar').classList.remove('hidden');
  document.getElementById('player-fab').classList.add('hidden');
  document.getElementById('player-full').classList.add('hidden');
  playerState = 'bar';
}
function playerCollapse() {
  document.getElementById('player-bar').classList.add('hidden');
  document.getElementById('player-fab').classList.remove('hidden');
  document.getElementById('player-full').classList.add('hidden');
  playerState = 'mini';
}
function playerExpandBar() {
  playerShowBar();
}
function playerExpandFull() {
  document.getElementById('player-full').classList.remove('hidden');
  document.getElementById('player-bar').classList.add('hidden');
  document.getElementById('player-fab').classList.add('hidden');
  playerState = 'full';
  updateFullProgress();
}
function playerCollapseFull() {
  document.getElementById('player-full').classList.add('hidden');
  playerShowBar();
}

function playerToggle() { audio.paused ? audio.play() : audio.pause(); }
function playerPrev() { if (currentBook) playTrack((currentTrackIdx - 1 + currentBook.tracks.length) % currentBook.tracks.length); }
function playerNext() { if (currentBook) playTrack((currentTrackIdx + 1) % currentBook.tracks.length); }

function playerSeek(delta) {
  if (audio.duration) {
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  }
}

function toggleSpeed() {
  const ci = SPEEDS.indexOf(playbackSpeed);
  playbackSpeed = SPEEDS[(ci + 1) % SPEEDS.length];
  audio.playbackRate = playbackSpeed;
  document.getElementById('full-btn-speed').querySelector('.speed-label').textContent = playbackSpeed + 'x';
}

function toggleLoop() {
  const modes = ['chapter', 'single', 'list'];
  const labels = { chapter: '本章', single: '单曲', list: '顺序' };
  const icons = { chapter: 'ri-play-line', single: 'ri-repeat-one-line', list: 'ri-repeat-line' };
  const ci = modes.indexOf(loopMode);
  loopMode = modes[(ci + 1) % modes.length];
  // Update full player loop button
  const fb = document.getElementById('full-btn-loop');
  if (fb) {
    fb.querySelector('i').className = icons[loopMode];
    document.getElementById('full-loop-label').textContent = labels[loopMode];
  }
}

function updatePlayerCount() {
  if (!currentBook) return;
  const c = getPlayCount(currentBook.tracks[currentTrackIdx]);
  const el = document.getElementById('full-count');
  if (el) el.textContent = c > 0 ? `已听${c}遍` : '';
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
  if (loopMode === 'chapter') {
    audio.pause();
    syncPlayState();
  } else if (loopMode === 'single') {
    audio.currentTime = 0;
    audio.play();
  } else {
    playerNext();
  }
});

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + (Math.floor(s % 60) < 10 ? '0' : '') + Math.floor(s % 60);
}

function updateFullProgress() {
  if (!audio.duration) return;
  document.getElementById('full-time-cur').textContent = fmtTime(audio.currentTime);
  document.getElementById('full-time-dur').textContent = fmtTime(audio.duration);
  document.getElementById('full-progress-bar').value = (audio.currentTime / audio.duration) * 100;
}

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const pct = audio.currentTime / audio.duration;
    document.getElementById('progress-bar').value = pct * 100;
    if (playerState === 'full') updateFullProgress();
  }
});

document.getElementById('progress-bar').addEventListener('input', e => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});
document.getElementById('full-progress-bar').addEventListener('input', e => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});

function syncPlayState() {
  const playing = !audio.paused;
  const icon = playing ? '<i class="ri-pause-fill"></i>' : '<i class="ri-play-fill"></i>';
  document.getElementById('btn-play').innerHTML = icon;
  document.getElementById('btn-play-full').innerHTML = icon;
  // FAB animation
  const fab = document.getElementById('player-fab');
  if (playing) fab.classList.add('playing'); else fab.classList.remove('playing');
}
audio.addEventListener('play', syncPlayState);
audio.addEventListener('pause', syncPlayState);

// --- Swipe down to close full player ---
(function() {
  const full = document.getElementById('player-full');
  let startY = 0, dragging = false;
  full.addEventListener('touchstart', e => {
    // Don't intercept touches on interactive elements
    const tag = e.target.closest('button, input, a');
    if (tag) return;
    startY = e.touches[0].clientY; dragging = true;
  });
  full.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 80) { dragging = false; playerCollapseFull(); }
  });
  full.addEventListener('touchend', () => { dragging = false; });
})();

init();
