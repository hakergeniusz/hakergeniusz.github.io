/* ============================================================
   hakergeniusz.github.io - interactions and live data
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const icons = () => { if (window.lucide) window.lucide.createIcons(); };

/* ---------------- theme + true-dark easter egg ---------------- */
const root = document.documentElement;
const themeToggle = $('#themeToggle');
const HEATMAPS = {
  light: 'assets/token-heatmap-light.svg',
  dark: 'assets/token-heatmap-dark.svg',
  'true-dark': 'assets/token-heatmap-true-dark.svg'
};

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem('hgz-theme', theme);
  $('#heatmap').src = HEATMAPS[theme] || HEATMAPS.light;
  themeToggle?.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  if (themeToggle) themeToggle.innerHTML = `<i data-lucide="${theme === 'light' ? 'moon' : 'sun'}"></i>`;
  icons();
}

const savedTheme = localStorage.getItem('hgz-theme');
setTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

let holdTimer = null;
let longPressFired = false;

function startHold() {
  longPressFired = false;
  holdTimer = setTimeout(() => {
    longPressFired = true;
    setTheme('true-dark');
    showToast('TRUE DARK MODE');
  }, 3000);
}
function cancelHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
}

themeToggle?.addEventListener('pointerdown', (event) => {
  if (event.button === 0 || event.button === undefined) startHold();
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => themeToggle?.addEventListener(evt, cancelHold));
themeToggle?.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) startHold();
});
themeToggle?.addEventListener('keyup', (event) => {
  if (event.key === 'Enter' || event.key === ' ') cancelHold();
});
themeToggle?.addEventListener('click', () => {
  if (longPressFired) { longPressFired = false; return; }
  setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
});

const trueDarkOverlay = $('#trueDarkOverlay');
window.addEventListener('pointermove', (event) => {
  trueDarkOverlay?.style.setProperty('--mx', `${event.clientX}px`);
  trueDarkOverlay?.style.setProperty('--my', `${event.clientY}px`);
}, { passive: true });

/* ---------------- toast + copy handles ---------------- */
const toast = $('#toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ---------------- avatar poof easter egg ---------------- */
const avatarZone = $('#avatarZone');
const avatar = $('#avatar');

if (avatarZone && avatar) {
  let avatarBusy = false;

  function toggleAvatar() {
    if (avatarBusy) return;

    if (avatar.classList.contains('is-gone')) {
      avatar.classList.remove('is-gone');
      avatar.classList.add('is-returning');
      avatarBusy = true;
      setTimeout(() => { avatar.classList.remove('is-returning'); avatarBusy = false; }, 400);
      return;
    }

    avatarBusy = true;
    avatar.classList.add('is-bursting');

    for (let i = 0; i < 18; i += 1) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const distance = 70 + Math.random() * 90;
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      spark.style.setProperty('--dr', `${Math.random() * 360}deg`);
      if (i % 3 === 0) spark.style.background = 'var(--fg)';
      avatarZone.append(spark);
      setTimeout(() => spark.remove(), 750);
    }

    setTimeout(() => {
      avatar.classList.remove('is-bursting');
      avatar.classList.add('is-gone');
      avatarBusy = false;
      showToast('Poof! Click again to bring it back');
    }, 450);
  }

  avatarZone.addEventListener('click', toggleAvatar);
  avatarZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAvatar();
    }
  });
}

const DISCORD_PROFILE = 'https://discord.com/users/1257212645933580289';

$$('[data-copy]').forEach((btn) => btn.addEventListener('click', async (event) => {
  if (event.shiftKey) {
    window.open(DISCORD_PROFILE, '_blank', 'noopener,noreferrer');
    return;
  }
  const value = btn.dataset.copy;
  try {
    await navigator.clipboard.writeText(value);
    showToast(`Copied @${value}`);
  } catch (_) {
    showToast(`Discord: @${value}`);
  }
}));

/* ---------------- repos: snapshot + live GitHub API ---------------- */
const FEATURED_REPOS = [
  { name: 'rustfetch', description: 'Fastfetch- and hyfetch-inspired Rust system info tool', language: 'Rust', stars: 0, forks: 0, flag: 'Pinned' },
  { name: 'discord-bot', description: 'Yet Another Shitty Made Discord Bot', language: 'Python', stars: 2, forks: 2, flag: 'Pinned' },
  { name: 'griffel', description: 'A distraction-free Markdown editor for Linux, written in Rust', language: 'Rust', stars: 1, forks: 0, flag: 'Pinned' },
  { name: 'freecam', description: 'Freecam - control your camera separately from your player. A Horizon native mod ported from the Minecraft Freecam mod', language: 'Rust', stars: 1, forks: 1, flag: 'Pinned' },
  { name: 'pi-rs', description: 'Rust rewrite of the Pi coding-agent harness (earendil-works/pi)', language: 'Rust', stars: 0, forks: 0, flag: 'Pinned' },
  { name: 'emoxidize', description: 'Single-instance GTK4 emoji picker - clean-room Rust implementation of Emojify', language: 'Rust', stars: 0, forks: 0, flag: 'Pinned' },
  { name: 'sakura-temple-wgpu', description: 'Grand Sakura Valley: native Rust + wgpu 30/WGSL voxel diorama with GPU petals and PCF shadows', language: 'Rust', stars: 0, forks: 0, flag: 'Featured' },
  { name: 'Frame', description: 'Independent keyboard-driven media player - GTK4/libadwaita rewrite of Cine with libmpv', language: 'Rust', stars: 0, forks: 0 },
  { name: 'radix', description: 'Clean-room black-box rewrite of GNOME Calculator in Rust/GTK4', language: 'Rust', stars: 0, forks: 0 },
  { name: 'hashcheck', description: 'Check hashes for your files - GTK4/libadwaita app in Rust', language: 'Rust', stars: 0, forks: 0 },
  { name: 'tiles', description: 'The classic 2048 puzzle, built with GTK4 and libadwaita in Rust', language: 'Rust', stars: 0, forks: 0 },
  { name: 'pi-gui', description: 'Native GTK4/libadwaita GUI front-end for the pi agent', language: 'Rust', stars: 0, forks: 0 },
  { name: 'fullbright', description: 'Native Horizon mod that toggles full brightness in-game with a rebindable key', language: 'Rust', stars: 0, forks: 0 },
  { name: 'png-to-webp-screenshot-converter', description: 'Rust tool and systemd service converting screenshots to WebP', language: 'Rust', stars: 0, forks: 0 },
  { name: 'baritone-helper', description: 'Helper utility for Baritone', language: 'Rust', stars: 0, forks: 0 },
  { name: 'trash-cli-rs', description: 'Move files or folders to Trash instead of rm, for all platforms', language: 'Rust', stars: 0, forks: 0, flag: 'Fork' },
  { name: 'arbor', description: 'Arbor - see where your disk space grows: clean-room Rust/GTK4 disk usage analyzer', language: 'Rust', stars: 0, forks: 0 },
  { name: 'statview', description: 'Small Rust statistics viewer', language: 'Rust', stars: 0, forks: 0 },
  { name: 'no_chat_reports', description: 'Rust utility for chat reports', language: 'Rust', stars: 0, forks: 0 },
  { name: 'nofall-gpl-port', description: 'GPL port of the NoFall mod', language: 'Rust', stars: 0, forks: 0 },
  { name: 'nohunger-gpl-port', description: 'GPL port of the NoHunger mod', language: 'Rust', stars: 0, forks: 0 },
  { name: 'pi-markdown-extras', description: 'Pi extension: GitHub-style markdown alerts, headings and task checkboxes', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-timer', description: 'A timer extension for Pi', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-guardrails', description: 'Guardrails extension for Pi', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-cord', description: 'Chat with your Pi coding agent from Discord or Telegram with streaming replies', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-subagents', description: 'Subagents for Pi - run isolated child agents in parallel', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-token-usage', description: 'Global token and cost accounting for pi, with a per-model breakdown', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-sandbox', description: 'Optional bubblewrap isolation for pi bash tool calls', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-ssh', description: "Run pi coding agent's tools on a remote machine over SSH", language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-title', description: 'Auto-titles pi coding agent sessions with a cheap nested model call', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-tmux', description: 'tmux integration for the pi coding agent', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-zsh', description: 'Pi extension: bash tool runs zsh with your real .zshrc loaded', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'discord-tracker', description: 'A Discord bot for tracking various events', language: 'Python', stars: 0, forks: 0 },
  { name: 'gphotos-storage-saver', description: 'Merge Google Takeout metadata and convert JPEGs to efficient formats', language: 'Python', stars: 0, forks: 0 },
  { name: 'pi-rdp-computer-use', description: 'Pi extension: computer use over RDP (headless screenshots and input)', language: 'Python', stars: 0, forks: 0 },
  { name: 'bad-apple-keyboard', description: 'Bad Apple keyboard animation', language: 'Python', stars: 0, forks: 0 },
  { name: 'fly', description: 'Python utility project', language: 'Python', stars: 0, forks: 0 },
  { name: 'portal_interact', description: 'Python portal interaction scripts', language: 'Python', stars: 0, forks: 0 },
  { name: 'pingfix', description: 'Python ping fixer', language: 'Python', stars: 0, forks: 0 },
  { name: 'homebrew-rustfetch', description: 'Homebrew tap for rustfetch', language: 'Ruby', stars: 0, forks: 0 }
];

let repos = FEATURED_REPOS.slice();
const state = { search: '', lang: 'all', sort: 'featured', showAll: false };
const VISIBLE_COUNT = 12;

function langClass(language) {
  return (language || 'other').toLowerCase().replace(/[^a-z]/g, '');
}

function makeRepoCard(repo) {
  const card = document.createElement('a');
  card.className = 'repo';
  card.href = `https://github.com/hakergeniusz/${encodeURIComponent(repo.name)}`;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const top = document.createElement('div');
  top.className = 'repo-top';
  const name = document.createElement('div');
  name.className = 'repo-name';
  name.innerHTML = '<i data-lucide="book-open"></i>';
  name.append(document.createTextNode(repo.name));
  const visibility = document.createElement('span');
  visibility.className = 'visibility';
  visibility.textContent = 'public';
  top.append(name, visibility);

  const desc = document.createElement('p');
  desc.textContent = repo.description || 'No description yet.';

  const meta = document.createElement('div');
  meta.className = 'repo-meta';
  const lang = document.createElement('span');
  lang.innerHTML = `<i class="lang-dot ${langClass(repo.language)}"></i>`;
  lang.append(document.createTextNode(repo.language || 'Other'));
  const stars = document.createElement('span');
  stars.innerHTML = '<i data-lucide="star"></i>';
  stars.append(document.createTextNode(String(repo.stars || 0)));
  const forks = document.createElement('span');
  forks.innerHTML = '<i data-lucide="git-fork"></i>';
  forks.append(document.createTextNode(String(repo.forks || 0)));
  meta.append(lang, stars, forks);
  if (repo.flag) {
    const flag = document.createElement('span');
    flag.className = 'flag';
    flag.textContent = repo.flag.toUpperCase();
    meta.append(flag);
  }

  card.append(top, desc, meta);
  return card;
}

function renderRepos() {
  const grid = $('#repoGrid');
  let list = repos.filter((repo) => {
    const matchesLang = state.lang === 'all' || repo.language === state.lang;
    const haystack = `${repo.name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase();
    return matchesLang && haystack.includes(state.search);
  });

  if (state.sort === 'stars') list.sort((a, b) => b.stars - a.stars);
  if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

  const shown = state.showAll ? list : list.slice(0, VISIBLE_COUNT);
  grid.replaceChildren(...shown.map(makeRepoCard));
  if (!shown.length) {
    const empty = document.createElement('p');
    empty.className = 'loading';
    empty.textContent = 'No repos match those filters.';
    grid.append(empty);
  }
  $('#showMore').hidden = list.length <= VISIBLE_COUNT;
  $('#showMore').textContent = state.showAll ? 'Show less' : `Show more repos (${list.length})`;
  icons();
}

async function loadLiveRepos() {
  try {
    const res = await fetch('https://api.github.com/users/hakergeniusz/repos?per_page=100&sort=updated');
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const live = await res.json();
    const byName = new Map(live.map((r) => [r.name, r]));
    repos = repos.map((repo) => {
      const l = byName.get(repo.name);
      if (!l) return repo;
      return {
        ...repo,
        description: l.description || repo.description,
        language: l.language || repo.language,
        stars: l.stargazers_count ?? repo.stars,
        forks: l.forks_count ?? repo.forks
      };
    });
    $('#statRepos').textContent = String(live.length);
    const badge = $('#badgeRepos');
    if (badge) badge.lastChild.textContent = ` ${live.length} public repos`;
  } catch (err) {
    console.info('Using built-in repo snapshot:', err.message);
  }
  renderRepos();
}

$('#repoSearch').addEventListener('input', (e) => { state.search = e.target.value.toLowerCase(); renderRepos(); });
$('#repoSort').addEventListener('change', (e) => { state.sort = e.target.value; renderRepos(); });
$$('.filter').forEach((btn) => btn.addEventListener('click', () => {
  $$('.filter').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  state.lang = btn.dataset.lang;
  renderRepos();
}));
$('#showMore').addEventListener('click', () => { state.showAll = !state.showAll; renderRepos(); });

loadLiveRepos();

/* ---------------- token stats from the displayed SVG graph ---------------- */
async function loadTokenStats() {
  const file = HEATMAPS[root.dataset.theme] || HEATMAPS.light;
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    const title = text.match(/([\d.]+[BMT]) tokens over (\d+) days/i);
    if (title) {
      $('#statTokens').textContent = title[1];
      $('#burnTotals').textContent = `${title[1]} total - ${title[2]} active days`;
      $('#statStreak')?.setAttribute('title', `${title[2]} active days tracked`);
    }
    const requests = text.match(/([\d,]+)\s+requests\s*·\s*tracking since/i);
    if (requests) $('#statRequests').textContent = requests[1];
    $('#heatmapStatus').textContent = 'Brutalist edition - live data from GitHub';
  } catch (_) {
    // Snapshot values stay in place when offline or blocked by CORS.
  }
}
loadTokenStats();

/* ---------------- LOC contributed (generated by scripts/count-loc.py) ---------------- */
async function loadLocStats() {
  try {
    const res = await fetch('assets/loc-data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const added = data.totalAdded || 0;
    $('#statLoc').textContent = added >= 1000000 ? `${(added / 1000000).toFixed(2)}M` : added.toLocaleString();
    $('#statLoc').title = `${added.toLocaleString()} lines added, ${(data.totalDeleted || 0).toLocaleString()} deleted across ${data.repos || 0} repos (commit code frequency, generated ${data.generatedAt || 'n/a'})`;
  } catch (_) {
    $('#statLoc').textContent = '--';
    $('#statLoc').title = 'Run scripts/count-loc.py to generate this number';
  }
}
loadLocStats();

icons();
