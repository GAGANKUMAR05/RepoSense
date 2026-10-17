const API = window.REPOSENSE_API || `${window.location.origin}/api`;
const state = { user: null, repositories: [], current: null, files: [], source: 'github', authMode: 'login', chat: [] };
const $ = (id) => document.getElementById(id);
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const short = (value = '') => value.length > 28 ? `${value.slice(0, 26)}…` : value;

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: 'include', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
function toast(message) { const node = $('toast'); node.textContent = message; node.classList.remove('hidden'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.add('hidden'), 3200); }
function showModal(id) { $(id).classList.remove('hidden'); }
function hideModal(id) { $(id).classList.add('hidden'); }
function setError(id, message) { $(id).textContent = message; $(id).classList.toggle('hidden', !message); }
function initials(name = '?') { return name.trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'; }

async function loadMe() {
  api('/health').then(({ aiConfigured }) => {
    $('metric-ai').textContent = aiConfigured ? 'Connected' : 'Set up';
    $('metric-ai-caption').textContent = aiConfigured ? 'AI answers are enabled' : 'Add an API key to enable answers';
  }).catch(() => {});
  try {
    const { user } = await api('/auth/me');
    state.user = user;
    $('user-name').textContent = user.username;
    $('user-email').textContent = user.email;
    $('user-avatar').textContent = initials(user.username);
    $('top-avatar').textContent = initials(user.username);
    $('account-action').textContent = '↗';
    await loadRepositories();
  } catch {
    state.user = null;
    $('user-name').textContent = 'Guest';
    $('user-email').textContent = 'Sign in to get started';
    $('user-avatar').textContent = '?';
    $('top-avatar').textContent = '?';
    renderRepositories();
  }
}
async function loadRepositories() {
  if (!state.user) return;
  const data = await api('/repository/getAll');
  state.repositories = data.repositories || [];
  renderRepositories();
}
function renderRepositories() {
  const repos = state.repositories;
  $('project-count').textContent = repos.length;
  $('metric-projects').textContent = repos.length;
  $('metric-files').textContent = repos.reduce((sum, repo) => sum + (repo.fileCount || 0), 0).toLocaleString();
  $('repository-heading-count').textContent = repos.length;
  $('repository-grid').innerHTML = repos.map((repo) => `<article class="repository-card" data-open="${esc(repo._id)}"><div class="card-top"><div class="repo-monogram">${esc(initials(repo.name).slice(0, 2))}</div><span class="card-status ${esc((repo.status || '').toLowerCase())}">${esc(repo.status || 'READY')}</span></div><h3>${esc(repo.name)}</h3><p>${esc(repo.description || 'No description yet')}</p><div class="card-footer"><span>${(repo.fileCount || 0).toLocaleString()} files indexed</span><span class="card-arrow">Open workspace →</span></div></article>`).join('');
  $('project-list').innerHTML = repos.length ? repos.slice(0, 10).map((repo) => `<button class="project-nav ${state.current?._id === repo._id ? 'selected' : ''}" data-open="${esc(repo._id)}"><span class="repo-dot"></span><span>${esc(repo.name)}</span></button>`).join('') : '<div class="empty-list">Your projects will appear here.</div>';
  $('empty-state').classList.toggle('hidden', repos.length > 0);
  $('repository-grid').classList.toggle('hidden', repos.length === 0);
}

function openCreate() {
  if (!state.user) { openAuth('login'); toast('Sign in before adding a repository.'); return; }
  $('repo-name-input').value = '';
  $('repo-description-input').value = '';
  $('github-url-input').value = '';
  $('zip-file-input').value = '';
  $('zip-filename').textContent = 'Choose a ZIP archive';
  setError('modal-error', '');
  setSource('github');
  showModal('modal-backdrop');
  $('repo-name-input').focus();
}
function setSource(source) {
  state.source = source;
  document.querySelectorAll('.source-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.source === source));
  $('github-source').classList.toggle('hidden', source !== 'github');
  $('zip-source').classList.toggle('hidden', source !== 'zip');
}
async function createRepository() {
  const button = $('create-repository-button');
  const name = $('repo-name-input').value.trim();
  const description = $('repo-description-input').value.trim();
  if (!name) return setError('modal-error', 'Give your repository a name first.');
  if (state.source === 'github' && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?(?:\.git)?$/i.test($('github-url-input').value.trim())) return setError('modal-error', 'Enter a public GitHub URL, such as https://github.com/owner/project.');
  if (state.source === 'zip' && !$('zip-file-input').files[0]) return setError('modal-error', 'Choose a ZIP archive to upload.');
  button.disabled = true; button.innerHTML = 'Creating and indexing…'; setError('modal-error', '');
  try {
    const { repo } = await api('/repository/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) });
    let result;
    if (state.source === 'github') {
      const url = $('github-url-input').value.trim();
      if (!url) throw new Error('Enter a public GitHub repository URL.');
      result = await api(`/repository/github/${repo._id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
    } else {
      const file = $('zip-file-input').files[0];
      if (!file) throw new Error('Choose a ZIP archive to upload.');
      const form = new FormData(); form.append('repository', file);
      result = await api(`/repository/upload/${repo._id}`, { method: 'POST', body: form });
    }
    hideModal('modal-backdrop');
    toast(`Indexed ${result.totalFiles} source files.`);
    await loadRepositories();
    const created = state.repositories.find(item => item._id === repo._id) || result.repo || repo;
    await openRepository(created);
  } catch (error) {
    setError('modal-error', error.message);
    if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('duplicate')) await loadRepositories();
  } finally { button.disabled = false; button.innerHTML = 'Create and index repository <span>→</span>'; }
}

async function openRepository(repo) {
  state.current = typeof repo === 'string' ? state.repositories.find(item => item._id === repo) : repo;
  if (!state.current) return;
  state.chat = [];
  $('dashboard-view').classList.add('hidden'); $('repository-view').classList.remove('hidden');
  $('breadcrumb-current').textContent = state.current.name;
  $('repo-title').textContent = state.current.name;
  $('repo-description').textContent = state.current.description || 'No description provided.';
  $('repo-file-count').textContent = state.current.fileCount || 0;
  $('context-name').textContent = short(state.current.name);
  $('context-files').textContent = `${state.current.fileCount || 0} files indexed`;
  $('repo-source').textContent = state.current.status === 'READY' ? 'Repository context is ready' : 'Indexing is incomplete';
  $('repo-updated').textContent = state.current.updatedAt ? new Date(state.current.updatedAt).toLocaleDateString() : 'Just now';
  $('repo-status').textContent = state.current.status || 'READY';
  $('repo-status').className = `repo-status-pill ${(state.current.status || '').toLowerCase()}`;
  $('chat-messages').innerHTML = welcomeMarkup();
  try {
    const data = await api(`/repository/${state.current._id}/files`);
    state.files = data.files || [];
    renderFiles();
  } catch (error) { state.files = []; renderFiles(); toast(error.message); }
  renderRepositories();
}
function welcomeMarkup() { return `<div class="assistant-welcome"><div class="assistant-glyph">✳</div><h3>What would you like to know?</h3><p>Ask how something works, track down a bug, or explore an approach in this codebase.</p><div class="suggestion-list"><button class="suggestion">How is this project structured?</button><button class="suggestion">Where should I start reading?</button><button class="suggestion">What are the main dependencies?</button></div></div>`; }
function renderFiles() {
  $('popular-files').innerHTML = state.files.slice(0, 7).map(file => fileRow(file)).join('') || '<div class="file-empty">No indexed files yet.</div>';
  $('all-files-list').innerHTML = state.files.map(file => fileRow(file, true)).join('') || '<div class="file-empty">No indexed files yet.</div>';
  $('files-title').textContent = `Indexed files (${state.files.length})`;
}
function fileRow(file, full = false) {
  const icon = (file.language || '·').slice(0, 2).toUpperCase();
  return `<div class="file-row"><span class="file-icon">${esc(icon)}</span><span class="file-path" title="${esc(file.path)}">${esc(full ? file.path : short(file.path))}</span></div>`;
}

function appendMessage(role, text, citations = []) {
  const container = $('chat-messages');
  container.querySelector('.assistant-welcome')?.remove();
  const article = document.createElement('div');
  article.className = `message ${role}`;
  const content = document.createElement('div'); content.textContent = text;
  article.append(content);
  if (role === 'assistant' && citations.length) {
    const list = document.createElement('div'); list.className = 'citations';
    citations.forEach((item) => { const tag = document.createElement('span'); tag.className = 'citation'; tag.textContent = item.path; list.append(tag); });
    article.append(list);
  }
  container.append(article); container.scrollTop = container.scrollHeight;
}
async function askQuestion(question) {
  const trimmed = question.trim();
  if (!trimmed || !state.current) return;
  if (!state.user) { appendMessage('assistant', 'Sign in to ask questions about this repository.'); openAuth('login'); return; }
  appendMessage('user', trimmed);
  $('question-input').value = '';
  const button = $('ask-button'); button.disabled = true; button.innerHTML = 'Thinking…';
  const pending = document.createElement('div'); pending.className = 'message assistant'; pending.textContent = 'Looking through your repository…'; $('chat-messages').append(pending);
  try {
    const data = await api(`/repository/${state.current._id}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: trimmed }) });
    pending.remove(); appendMessage('assistant', data.answer, data.citations);
  } catch (error) { pending.remove(); appendMessage('assistant', error.message); }
  finally { button.disabled = false; button.innerHTML = 'Ask <span>↗</span>'; }
}

function openAuth(mode = 'login') {
  state.authMode = mode; const register = mode === 'register';
  $('auth-title').textContent = register ? 'Create your account.' : 'Welcome back.';
  $('auth-description').textContent = register ? 'Create a private workspace for your codebases.' : 'Sign in to access your repositories.';
  $('auth-username-wrap').classList.toggle('hidden', !register);
  $('auth-submit').innerHTML = `${register ? 'Create account' : 'Sign in'} <span>→</span>`;
  $('auth-toggle').textContent = register ? 'Already have an account? Sign in' : 'New here? Create an account';
  $('auth-password').autocomplete = register ? 'new-password' : 'current-password';
  setError('auth-error', ''); showModal('auth-backdrop');
}
async function submitAuth() {
  const register = state.authMode === 'register';
  const body = { email: $('auth-email').value.trim(), password: $('auth-password').value };
  if (register) body.username = $('auth-username').value.trim();
  const button = $('auth-submit'); button.disabled = true;
  try {
    await api(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    hideModal('auth-backdrop'); await loadMe(); toast(register ? 'Your workspace is ready.' : 'Welcome back.');
  } catch (error) { setError('auth-error', error.message); }
  finally { button.disabled = false; }
}
async function accountAction() {
  if (!state.user) return openAuth('login');
  try { await api('/auth/logout'); state.user = null; state.repositories = []; state.current = null; $('repository-view').classList.add('hidden'); $('dashboard-view').classList.remove('hidden'); await loadMe(); toast('You are signed out.'); }
  catch (error) { toast(error.message); }
}

$('new-project').addEventListener('click', openCreate); $('add-project-small').addEventListener('click', openCreate); $('empty-add').addEventListener('click', openCreate);
$('create-repository-button').addEventListener('click', createRepository); $('refresh-projects').addEventListener('click', () => loadRepositories().then(() => toast('Repositories refreshed.')).catch(e => toast(e.message)));
document.querySelectorAll('.source-tab').forEach(tab => tab.addEventListener('click', () => setSource(tab.dataset.source)));
$('zip-file-input').addEventListener('change', (event) => { $('zip-filename').textContent = event.target.files[0]?.name || 'Choose a ZIP archive'; });
$('modal-close').addEventListener('click', () => hideModal('modal-backdrop')); $('auth-close').addEventListener('click', () => hideModal('auth-backdrop')); $('files-close').addEventListener('click', () => hideModal('files-backdrop'));
['modal-backdrop', 'auth-backdrop', 'files-backdrop'].forEach(id => $(id).addEventListener('click', (event) => { if (event.target.id === id) hideModal(id); }));
$('account-action').addEventListener('click', accountAction); $('top-avatar').addEventListener('click', accountAction);
$('auth-toggle').addEventListener('click', () => openAuth(state.authMode === 'login' ? 'register' : 'login')); $('auth-submit').addEventListener('click', submitAuth);
['auth-email', 'auth-password', 'auth-username'].forEach(id => $(id).addEventListener('keydown', event => { if (event.key === 'Enter') submitAuth(); }));
document.addEventListener('click', event => { const card = event.target.closest('[data-open]'); if (card) openRepository(card.dataset.open); const suggestion = event.target.closest('.suggestion'); if (suggestion) askQuestion(suggestion.textContent); });
$('back-dashboard').addEventListener('click', () => { $('repository-view').classList.add('hidden'); $('dashboard-view').classList.remove('hidden'); $('breadcrumb-current').textContent = 'Projects'; });
$('question-form').addEventListener('submit', event => { event.preventDefault(); askQuestion($('question-input').value); });
$('question-input').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('question-form').requestSubmit(); } });
$('clear-chat').addEventListener('click', () => { $('chat-messages').innerHTML = welcomeMarkup(); });
$('show-files').addEventListener('click', () => { $('file-search').value = ''; renderFiles(); showModal('files-backdrop'); }); $('repo-files-button').addEventListener('click', () => { $('file-search').value = ''; renderFiles(); showModal('files-backdrop'); });
$('file-search').addEventListener('input', event => { const query = event.target.value.toLowerCase(); $('all-files-list').innerHTML = state.files.filter(file => file.path.toLowerCase().includes(query)).map(file => fileRow(file, true)).join('') || '<div class="file-empty">No matching files.</div>'; });
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (state.current) $('question-input').focus(); else openCreate(); } if (event.key === 'Escape') ['modal-backdrop', 'auth-backdrop', 'files-backdrop'].forEach(hideModal); });
loadMe().catch(error => toast(error.message));
