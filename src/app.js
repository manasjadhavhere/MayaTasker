import { CADENCES, COLORS, ACCENTS, normalizeName, getOrCreateWorkspace, uid, localDate, dateAt, shiftDate, startOfWeek, completeTask, makeTask, safeUrl, validateWorkspace } from './model.js';

const $ = (s, root = document) => root.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  check: '<path d="m5 12 4 4L19 6"/>', circle: '<circle cx="12" cy="12" r="9"/>', tasks: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 1 1 2-2m2 1h3m-8 6 1 1 2-2m2 1h3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h1m3 0h1m3 0h1"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  chart: '<path d="M4 3v18h17M9 16v-5m5 5V6m5 10V9"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>', down: '<path d="m6 9 6 6 6-6"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/>', settings: '<path d="m9 3-.5 3-2 1-3-.5L2 10l2.5 2v2L2 16l1.5 3.5 3-.5 2 1L9 23h6l.5-3 2-1 3 .5L22 16l-2.5-2v-2L22 10l-1.5-3.5-3 .5-2-1L15 3Z" transform="translate(0 -1) scale(1 .94)"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-11 12h2"/>', more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  filter: '<path d="M4 7h16M7 12h10m-7 5h4"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>', board: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="14" rx="1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>', link: '<path d="m10 13 4-4m-6 6-2 2a3.5 3.5 0 0 1-5-5l5-5a3.5 3.5 0 0 1 5 0m2 0 2-2a3.5 3.5 0 0 1 5 5l-5 5a3.5 3.5 0 0 1-5 0" transform="translate(1 1)"/>',
  note: '<path d="M14 3H5v18h14V8Z"/><path d="M14 3v6h5M8 13h8m-8 4h5"/>', flag: '<path d="M5 22V3c5-4 9 4 15 0v11c-6 4-10-4-15 0"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>', edit: '<path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  play: '<path d="m8 4 13 8-13 8Z"/>', pause: '<path d="M8 4v16M16 4v16"/>', reset: '<path d="M4 9a8 8 0 1 1 0 6m0-12v6h6"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>', leaf: '<path d="M20 3C4 0 0 15 10 19c8 3 12-6 10-16ZM5 21 16 9"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01"/>', logout: '<path d="M9 4H3v16h6m5-13 5 5-5 5m-7-5h12"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', coffee: '<path d="M4 8h12v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Zm12 1h2a3 3 0 0 1 0 6h-2M7 2v3m4-3v3"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.circle}</svg>`;
const logo = '<span class="brand-mark"><svg viewBox="0 0 32 32" fill="none"><path d="M6 24V10l10 10L26 10v14" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="7" r="2" fill="currentColor"/></svg></span>';
const STORAGE = 'maya-tasker:v1';
let db = { version: 1, activeId: '', workspaces: [] };
let storageError = '';
try { const saved = JSON.parse(localStorage.getItem(STORAGE)); if (saved?.version === 1 && Array.isArray(saved.workspaces) && saved.workspaces.length <= 5) { const workspaces = saved.workspaces.filter(w => !w.demo).map(w => ({ ...validateWorkspace(w), id: typeof w.id === 'string' && /^[a-z0-9_-]{1,80}$/i.test(w.id) ? w.id : uid() })); db = { version: 1, activeId: '', workspaces }; } } catch { storageError = 'Saved data could not be read. Import a backup from Settings, or create a new workspace.'; }
let w = null;
let view = 'dashboard', projectView = '', layout = 'list', dashboardTab = 'today';
let filters = { q: '', cadence: 'all', project: 'all', priority: 'all', status: 'open', sort: 'due' };
let analyticsPeriod = 'week', analyticsProject = 'all';
let calendarDate = localDate(), selectedDate = localDate();
let timer = { running: false, remaining: (w?.settings.focusMinutes || 25) * 60, end: 0, taskId: '', mode: 'focus', duration: w?.settings.focusMinutes || 25 };
let modalReturnFocus = null, undoAction = null, toastTimeout;
let transient = false;
let renderedDay = localDate();

function save() {
  db.activeId = w?.id || '';
  try { localStorage.setItem(STORAGE, JSON.stringify(db)); transient = false; }
  catch { transient = true; toast('Storage is full or unavailable. Export a backup now; these changes are only in memory.', 'warning'); }
}
function setTheme() {
  const preference = w?.settings.theme || 'light';
  const resolved = preference === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preference;
  const root = document.documentElement, accent = ACCENTS.find(a => a.id === w?.settings.accent) || ACCENTS[0];
  root.dataset.theme = resolved;
  root.dataset.accent = accent.id;
  root.style.setProperty('--accent', accent[resolved]);
  root.style.setProperty('--accent-hover', `color-mix(in srgb, ${accent[resolved]} 88%, ${resolved === 'dark' ? 'white' : 'black'})`);
  root.style.setProperty('--accent-light', `color-mix(in srgb, ${accent[resolved]} ${resolved === 'dark' ? 16 : 11}%, var(--surface))`);
  root.style.setProperty('--on-accent', resolved === 'dark' ? '#17181e' : '#ffffff');
  $('meta[name="theme-color"]').content = accent[resolved];
}
function toast(message, type = '', undo = null) {
  clearTimeout(toastTimeout); undoAction = undo;
  $('#toast-root').innerHTML = `<div class="toast ${type}">${icon(type === 'warning' ? 'bell' : 'check')}<span>${esc(message)}</span>${undo ? '<button data-action="undo">Undo</button>' : ''}<button class="icon-button" data-action="dismiss-toast" aria-label="Dismiss notification">${icon('close')}</button></div>`;
  toastTimeout = setTimeout(() => { $('#toast-root').innerHTML = ''; undoAction = null; }, undo ? 10000 : 6500);
}
function fmt(value, options = { month: 'short', day: 'numeric' }) { return value ? dateAt(value).toLocaleDateString(undefined, options) : 'No date'; }
function relative(value) { const today = localDate(); return !value ? 'No date' : value === today ? 'Today' : value === shiftDate(today, 1) ? 'Tomorrow' : value === shiftDate(today, -1) ? 'Yesterday' : fmt(value); }
const openTasks = () => w.tasks.filter(t => t.status !== 'completed');
const project = id => w.projects.find(p => p.id === id);
const projectLabel = id => { const p = project(id); return p ? `<span class="project-label"><i style="--color:${p.color}"></i>${esc(p.name)}</span>` : '<span class="muted">Personal</span>'; };
const isLate = t => t.status !== 'completed' && t.due && t.due < localDate();
const doneToday = () => w.tasks.filter(t => t.status === 'completed' && t.completedAt && localDate(t.completedAt) === localDate()).length;
function matches(t) {
  return (!filters.q || `${t.title} ${t.description} ${t.tags.join(' ')} ${project(t.projectId)?.name || ''}`.toLowerCase().includes(filters.q.toLowerCase())) && (filters.cadence === 'all' || t.cadence === filters.cadence) && (filters.project === 'all' || (filters.project === 'personal' ? !t.projectId : t.projectId === filters.project)) && (filters.priority === 'all' || t.priority === filters.priority);
}
function sorted(tasks) {
  return [...tasks].sort((a, b) => filters.sort === 'priority' ? ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority) : filters.sort === 'created' ? b.createdAt.localeCompare(a.createdAt) : filters.sort === 'title' ? a.title.localeCompare(b.title) : (a.due || '9999').localeCompare(b.due || '9999') || (a.time || '99').localeCompare(b.time || '99'));
}
function header(title, subtitle, actions = '') { return `<div class="page-heading"><div><div class="eyebrow">YOUR SPACE TO MAKE THINGS HAPPEN</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`; }
function empty(title, text, action = 'new-task', label = 'Create a task', symbol = 'leaf') { return `<div class="empty-state"><span>${icon(symbol)}</span><h3>${title}</h3><p>${text}</p>${action ? `<button class="button secondary" data-action="${action}">${icon('plus')}${label}</button>` : ''}</div>`; }
function taskRow(t, compact = false) {
  const subDone = t.subtasks.filter(s => s.done).length;
  return `<div class="task-row ${t.status === 'completed' ? 'is-done' : ''}" data-task="${t.id}" draggable="true">
    <button class="task-check ${t.status === 'completed' ? 'checked' : t.status === 'in-progress' ? 'started' : ''}" data-action="toggle-task" data-id="${t.id}" aria-label="${t.status === 'completed' ? 'Reopen' : 'Complete'} ${esc(t.title)}">${t.status === 'completed' ? icon('check') : ''}</button>
    <button class="task-main" data-action="edit-task" data-id="${t.id}"><span class="task-title">${esc(t.title)}${t.repeat ? icon('repeat') : ''}</span><span class="task-secondary">${projectLabel(t.projectId)}${t.subtasks.length ? `<span>${icon('tasks')}${subDone}/${t.subtasks.length}</span>` : ''}${t.links.length || t.completionLinks.length ? `<span>${icon('link')}${t.links.length + t.completionLinks.length}</span>` : ''}</span></button>
    ${!compact ? `<span class="cadence-pill">${esc(t.cadence)}</span>` : ''}<span class="priority ${t.priority}"><i></i>${t.priority}</span>
    <span class="task-due ${isLate(t) ? 'overdue' : ''}">${icon('calendar')}${relative(t.due)}</span>
    <button class="icon-button row-more" data-action="edit-task" data-id="${t.id}" aria-label="Edit ${esc(t.title)}">${icon('more')}</button></div>`;
}
function activityChart(days = 7, pId = 'all') {
  const values = Array.from({ length: days }, (_, i) => { const date = shiftDate(localDate(), i - days + 1); return { date, count: w.tasks.filter(t => t.status === 'completed' && t.completedAt && localDate(t.completedAt) === date && (pId === 'all' || t.projectId === pId)).length }; });
  const max = Math.max(4, ...values.map(v => v.count));
  return `<div class="bar-chart" role="img" aria-label="Completed tasks: ${values.map(v => `${fmt(v.date)}: ${v.count}`).join(', ')}"><div class="chart-y">${[max, Math.round(max * .75), Math.round(max / 2), Math.round(max * .25), 0].map(n => `<span>${n}</span>`).join('')}</div><div class="chart-plot"><div class="chart-grid"><i></i><i></i><i></i><i></i><i></i></div><div class="chart-bars">${values.map(v => `<div class="bar-column"><div class="bar-track"><div class="bar ${v.date === localDate() ? 'today' : ''}" style="height:${v.count / max * 100}%" title="${fmt(v.date)}: ${v.count} completed"><span>${v.count}</span></div></div><span class="bar-label ${v.date === localDate() ? 'accent-text' : ''}">${days <= 7 ? fmt(v.date, { weekday: 'short' }) : dateAt(v.date).getDate()}</span></div>`).join('')}</div></div></div>`;
}
function sidebar() {
  const nav = [['dashboard', 'grid', 'Overview'], ['tasks', 'tasks', 'My tasks'], ['calendar', 'calendar', 'Planner'], ['projects', 'folder', 'Projects'], ['analytics', 'chart', 'Insights'], ['completed', 'check', 'Completed']];
  return `<aside class="sidebar"><button class="brand" data-action="nav" data-view="dashboard">${logo}<span>Maya<span class="brand-light">Tasker</span><small>A LITTLE MORE ORGANIZED.</small></span></button>
    <button class="workspace-switch" data-action="profiles"><span class="workspace-icon">${esc(w.name.slice(0, 1).toUpperCase())}</span><span><strong>${esc(w.name)}’s workspace</strong><small>Personal workspace</small></span>${icon('down')}</button>
    <div class="nav-label">WORKSPACE</div><nav aria-label="Main navigation">${nav.map(([v, i, label]) => `<button class="nav-item ${view === v && !projectView ? 'active' : ''}" data-action="nav" data-view="${v}">${icon(i)}<span>${label}</span>${v === 'tasks' ? `<b>${openTasks().length}</b>` : ''}${v === 'completed' ? '<span class="nav-dot"></span>' : ''}</button>`).join('')}</nav>
    <div class="nav-label projects-label">MY PROJECTS<button class="icon-button" data-action="new-project" aria-label="Add project">${icon('plus')}</button></div><div class="project-nav">${w.projects.slice(0, 7).map(p => `<button class="nav-item ${projectView === p.id ? 'active' : ''}" data-action="project-view" data-id="${p.id}"><i class="project-dot" style="--color:${p.color}"></i><span>${esc(p.name)}</span><small>${w.tasks.filter(t => t.projectId === p.id && t.status !== 'completed').length}</small></button>`).join('')}${!w.projects.length ? '<p class="sidebar-hint">Give your ideas a place to grow.</p>' : ''}</div>
    <div class="sidebar-bottom"><div class="calm-card">${icon('spark')}<strong>Small steps. Real progress.</strong><p>A little focus today goes a long way.</p><button data-action="nav" data-view="focus">Start a focus session ${icon('arrow')}</button></div><button class="nav-item ${view === 'settings' ? 'active' : ''}" data-action="nav" data-view="settings">${icon('settings')}<span>Settings & backup</span></button><div class="sidebar-footer"><button data-action="help">${icon('help')} Help & shortcuts</button><span>v1.0</span></div></div></aside>`;
}
function render() {
  renderedDay = localDate();
  setTheme();
  if (!w) { $('#app').innerHTML = '<div class="welcome-background"></div>'; showWelcome(); return; }
  const pageNames = { dashboard: 'Overview', tasks: 'My tasks', calendar: 'Planner', projects: 'Projects', analytics: 'Insights', completed: 'Completed', settings: 'Settings', focus: 'Focus room' };
  $('#app').innerHTML = `${sidebar()}<div class="main-shell"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" data-action="mobile-menu" aria-label="Toggle navigation">${icon('menu')}</button><span>Workspace</span>${icon('chevron')}<strong>${esc(projectView ? project(projectView)?.name : pageNames[view])}</strong></div><div class="topbar-actions"><button class="search-trigger" data-action="search" aria-label="Search workspace">${icon('search')}<span>Search anything...</span><kbd>Ctrl K</kbd></button><span class="topbar-divider"></span><button class="icon-button theme-toggle" data-action="theme" aria-label="Toggle light or dark theme">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button><button class="icon-button notification-button" data-action="notifications" aria-label="View due tasks">${icon('bell')}${openTasks().some(t => t.due && t.due <= localDate()) ? '<i></i>' : ''}</button><button class="avatar" data-action="profiles" aria-label="Switch workspace">${esc(w.name.slice(0, 2).toUpperCase())}</button></div></header>
    <main id="main-content">${transient ? '<div class="storage-banner">Browser storage is unavailable. Export your workspace to keep your changes.</div>' : ''}${renderPage()}</main><footer class="page-footer"><span>${icon('leaf')} A little progress, every day.</span><span>Saved on this browser <i></i> Maya Tasker</span></footer></div>${timer.running && view !== 'focus' ? `<button class="floating-timer" data-action="nav" data-view="focus">${icon('clock')}<span id="mini-timer">${timerText()}</span> Focus session</button>` : ''}`;
  if (view === 'focus') updateTimerUI();
}
function renderPage() {
  if (projectView) return tasksPage(projectView);
  return ({ dashboard: dashboard, tasks: tasksPage, calendar: calendarPage, projects: projectsPage, analytics: analyticsPage, completed: completedPage, settings: settingsPage, focus: focusPage }[view] || dashboard)();
}
function dashboard() {
  const hour = new Date().getHours(); const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = localDate(), due = openTasks().filter(t => t.due === today).length, done = doneToday(), late = openTasks().filter(isLate).length;
  const completed = w.tasks.filter(t => t.status === 'completed').length;
  let tasks = openTasks().filter(t => dashboardTab === 'today' ? t.due === today : dashboardTab === 'upcoming' ? t.due > today : isLate(t));
  const sessionMinutes = w.sessions.filter(s => localDate(s.at) === today).reduce((n, s) => n + s.minutes, 0);
  return `${header(`${greeting}, ${esc(w.name.split(' ')[0])} <span class="greeting-sun">${icon('sun')}</span>`, `Let’s make room for what matters. You have <strong>${due} ${due === 1 ? 'task' : 'tasks'}</strong> on your list today.`, `<span class="date-label">${icon('calendar')}${fmt(today, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span><button class="button primary" data-action="new-task">${icon('plus')}New task</button>`)}
    <section class="stats-grid" aria-label="Task overview">${[
      ['tasks', 'Total tasks', w.tasks.length, `${openTasks().length} still in the making`, 'purple', 'tasks'],
      ['check', 'Completed', completed, `${done} completed today`, 'green', 'completed'],
      ['clock', 'Pending', openTasks().length, late ? `${late} ${late === 1 ? 'task needs' : 'tasks need'} a little attention` : 'You’re right on track', 'orange', 'tasks'],
      ['folder', 'Active projects', w.projects.filter(p => w.tasks.some(t => t.projectId === p.id && t.status !== 'completed')).length, `${w.projects.length} projects in your workspace`, 'blue', 'projects']
    ].map(([i, label, value, sub, color, dest]) => `<button class="stat-card" data-action="nav" data-view="${dest}"><div class="stat-label">${label}<span class="stat-icon ${color}">${icon(i)}</span></div><div class="stat-number">${value}<span>${icon('arrow')}</span></div><div class="stat-caption ${color}">${icon(label === 'Completed' ? 'check' : label === 'Pending' && late ? 'clock' : 'circle')}${sub}</div></button>`).join('')}</section>
    <div class="dashboard-upper"><section class="panel activity-panel"><div class="panel-heading"><div><h2>Activity overview <span class="quiet-badge">Last 7 days</span></h2><p>A little consistency makes a big difference.</p></div><button class="text-button" data-action="nav" data-view="analytics">View insights ${icon('arrow')}</button></div><div class="chart-legend"><i></i>Completed tasks</div>${activityChart()}</section>
    <section class="panel goal-panel"><div class="panel-heading"><div><h2>Your daily rhythm</h2><p>One thing at a time. You’ve got this.</p></div>${icon('spark')}</div><div class="goal-ring" style="--progress:${Math.min(100, done / w.settings.dailyGoal * 100)}%"><div><strong>${done}<span> / ${w.settings.dailyGoal}</span></strong><small>tasks completed</small></div></div><div class="goal-caption">${done >= w.settings.dailyGoal ? 'Daily goal, beautifully done.' : `${Math.max(0, w.settings.dailyGoal - done)} more to reach your daily goal`}</div><div class="rhythm-footer"><span>${icon('clock')}<strong>${sessionMinutes} min</strong> focused today</span><button data-action="nav" data-view="focus">Let’s focus ${icon('arrow')}</button></div></section></div>
    <div class="dashboard-lower"><section class="panel today-panel"><div class="panel-heading"><div><h2>Your tasks <span class="number-badge">${tasks.length}</span></h2><p>A clear plan for a calmer mind.</p></div><button class="text-button" data-action="nav" data-view="tasks">View all ${icon('arrow')}</button></div><div class="task-tabs"><div role="tablist" aria-label="Dashboard tasks">${[['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue']].map(([key, label]) => `<button role="tab" aria-selected="${dashboardTab === key}" class="${dashboardTab === key ? 'selected' : ''}" data-action="dashboard-tab" data-value="${key}">${label}${key === 'overdue' && late ? `<span>${late}</span>` : ''}</button>`).join('')}</div><button class="icon-button" data-action="new-task" aria-label="Add a task">${icon('plus')}</button></div><div class="task-list">${tasks.length ? sorted(tasks).slice(0, 5).map(t => taskRow(t, true)).join('') : empty(dashboardTab === 'today' ? 'A little breathing room' : 'All clear here', dashboardTab === 'today' ? 'Add something meaningful to your day.' : 'Your tasks will appear here as you plan.')}</div><button class="add-task-row" data-action="new-task">${icon('plus')}Add a new task<kbd>N</kbd></button></section>
    <section class="panel project-overview"><div class="panel-heading"><div><h2>Projects at a glance</h2><p>Big ideas, small steps.</p></div><button class="icon-button" data-action="new-project" aria-label="New project">${icon('plus')}</button></div>${w.projects.length ? w.projects.slice(0, 3).map(p => projectSummary(p)).join('') : empty('Make space for an idea', 'Group related tasks into a project.', 'new-project', 'Create project', 'folder')}<button class="all-projects" data-action="nav" data-view="projects">All projects ${icon('arrow')}</button></section></div>`;
}
function projectSummary(p) {
  const tasks = w.tasks.filter(t => t.projectId === p.id), done = tasks.filter(t => t.status === 'completed').length, percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  return `<button class="project-summary" data-action="project-view" data-id="${p.id}"><span class="project-summary-title"><i style="--color:${p.color}">${icon('folder')}</i><strong>${esc(p.name)}</strong>${icon('chevron')}</span><span class="project-progress-label"><span>${done} of ${tasks.length} tasks</span><strong>${percent}%</strong></span><span class="progress-track"><i style="width:${percent}%;background:${p.color}"></i></span></button>`;
}
function filterControls(completed = false) {
  return `<div class="task-toolbar"><div class="cadence-tabs" role="tablist" aria-label="Task cadence">${['all', ...CADENCES].map(c => `<button role="tab" aria-selected="${filters.cadence === c}" data-action="cadence" data-value="${c}" class="${filters.cadence === c ? 'selected' : ''}">${c === 'all' ? 'All tasks' : c[0].toUpperCase() + c.slice(1)}</button>`).join('')}</div><div class="toolbar-right"><button class="button secondary small ${filters.priority !== 'all' || filters.project !== 'all' || filters.q || (!completed && filters.status !== 'open') ? 'has-filter' : ''}" data-action="filters">${icon('filter')}Filter</button>${!completed ? `<div class="view-switch" aria-label="Task layout"><button data-action="layout" data-value="list" class="${layout === 'list' ? 'selected' : ''}" aria-label="List view">${icon('list')}</button><button data-action="layout" data-value="board" class="${layout === 'board' ? 'selected' : ''}" aria-label="Board view">${icon('board')}</button></div>` : ''}</div></div>${filters.q || filters.project !== 'all' || filters.priority !== 'all' ? `<div class="active-filters"><span>Showing filtered results${filters.q ? ` for “${esc(filters.q)}”` : ''}</span><button data-action="clear-filters">Clear filters ${icon('close')}</button></div>` : ''}`;
}
function tasksPage(pId = '') {
  const p = pId ? project(pId) : null;
  let tasks = w.tasks.filter(t => (!pId || t.projectId === pId) && matches(t) && (filters.status === 'all' || filters.status === 'open' ? filters.status === 'all' || t.status !== 'completed' : t.status === filters.status));
  tasks = sorted(tasks);
  const headingActions = `${p ? `<button class="button secondary" data-action="edit-project" data-id="${p.id}">${icon('edit')}Edit project</button>` : ''}<button class="button primary" data-action="new-task">${icon('plus')}New task</button>`;
  return `${header(p ? esc(p.name) : 'A place for every task.', p ? esc(p.description || 'Turn this project into a series of small, achievable steps.') : 'Capture it, plan it, and give yourself space to focus.', headingActions)}${p ? `<div class="project-detail-stats">${projectSummary(p)}<span>${p.due ? `Project target: ${fmt(p.due)}` : 'No target date set'}</span></div>` : ''}${filterControls()}${tasks.length ? layout === 'board' ? boardView(tasks) : `<section class="panel full-task-panel"><div class="list-header"><span>Task name <small>${tasks.length}</small></span><span>Cadence</span><span>Priority</span><span>Due date</span><span></span></div>${tasks.map(t => taskRow(t)).join('')}<button class="add-task-row" data-action="new-task">${icon('plus')}Add a new task<kbd>N</kbd></button></section>` : `<section class="panel">${empty('A fresh space for your next step', 'Create a task or adjust your filters to see more.')}</section>`}`;
}
function boardView(tasks) {
  return `<div class="kanban">${[['todo', 'To do', 'muted'], ['in-progress', 'In progress', 'purple'], ['completed', 'Completed', 'green']].map(([status, name, color]) => `<section class="kanban-column" data-drop-status="${status}"><h2><i class="status-dot ${color}"></i>${name}<span>${tasks.filter(t => t.status === status).length}</span><button class="icon-button" data-action="new-task" data-status="${status}" aria-label="Add ${name.toLowerCase()} task">${icon('plus')}</button></h2><div class="kanban-cards">${tasks.filter(t => t.status === status).map(t => `<article class="kanban-card" draggable="true" data-task="${t.id}"><div class="card-top">${projectLabel(t.projectId)}<button class="icon-button" data-action="edit-task" data-id="${t.id}" aria-label="Edit task">${icon('more')}</button></div><button class="card-title" data-action="edit-task" data-id="${t.id}">${esc(t.title)}</button>${t.description ? `<p>${esc(t.description.slice(0, 100))}</p>` : ''}<div class="card-tags"><span class="priority ${t.priority}"><i></i>${t.priority}</span><span class="cadence-pill">${t.cadence}</span></div><div class="card-bottom"><span class="${isLate(t) ? 'overdue' : ''}">${icon('calendar')}${relative(t.due)}</span><button class="task-check ${status === 'completed' ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}" aria-label="${status === 'completed' ? 'Reopen' : 'Complete'} task">${status === 'completed' ? icon('check') : ''}</button></div></article>`).join('') || '<div class="drop-placeholder">Drag a task here<br><small>or use its status field</small></div>'}</div></section>`).join('')}</div>`;
}
function projectsPage() {
  return `${header('Big ideas start here.', 'A home for every project. A little progress on each.', '<button class="button primary" data-action="new-project">' + icon('plus') + 'New project</button>')}<div class="project-grid">${w.projects.map(p => { const tasks = w.tasks.filter(t => t.projectId === p.id), done = tasks.filter(t => t.status === 'completed').length; return `<article class="panel project-card"><div class="project-card-top"><span class="project-emblem" style="--color:${p.color}">${icon('folder')}</span><button class="icon-button" data-action="edit-project" data-id="${p.id}" aria-label="Edit ${esc(p.name)}">${icon('more')}</button></div><button class="project-card-name" data-action="project-view" data-id="${p.id}">${esc(p.name)}</button><p>${esc(p.description || 'Your next great idea has a home.')}</p><div class="project-card-count"><span>${done} completed</span><span>${tasks.length - done} pending</span></div><div class="progress-track"><i style="width:${tasks.length ? done / tasks.length * 100 : 0}%;background:${p.color}"></i></div><div class="project-card-footer"><span>${icon('calendar')}${p.due ? fmt(p.due) : 'At your own pace'}</span><button class="text-button" data-action="project-view" data-id="${p.id}">Open project ${icon('arrow')}</button></div></article>`; }).join('')}<button class="new-project-card" data-action="new-project"><span>${icon('plus')}</span><strong>Make room for an idea</strong><p>Create a new project</p></button></div>`;
}
function calendarPage() {
  const date = dateAt(calendarDate), first = localDate(new Date(date.getFullYear(), date.getMonth(), 1, 12)), start = startOfWeek(first), month = date.getMonth();
  const selected = sorted(w.tasks.filter(t => t.due === selectedDate));
  return `${header('A little perspective.', 'See what’s ahead. Make space for what matters.', '<button class="button primary" data-action="new-task">' + icon('plus') + 'Schedule task</button>')}<div class="planner-layout"><section class="panel calendar-panel"><div class="calendar-toolbar"><h2>${fmt(calendarDate, { month: 'long', year: 'numeric' })}</h2><div><button class="button secondary small" data-action="calendar-today">Today</button><button class="icon-button previous" data-action="calendar-prev" aria-label="Previous month">${icon('chevron')}</button><button class="icon-button" data-action="calendar-next" aria-label="Next month">${icon('chevron')}</button></div></div><div class="calendar-weekdays">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span>${d}</span>`).join('')}</div><div class="calendar-grid">${Array.from({ length: 42 }, (_, i) => { const day = shiftDate(start, i), ts = w.tasks.filter(t => t.due === day); return `<div class="calendar-day ${dateAt(day).getMonth() !== month ? 'other-month' : ''} ${day === localDate() ? 'is-today' : ''} ${day === selectedDate ? 'selected-day' : ''}" data-drop-date="${day}"><button class="day-number" data-action="select-date" data-value="${day}" aria-label="View ${fmt(day, { dateStyle: 'full' })}">${dateAt(day).getDate()}</button>${ts.slice(0, 3).map(t => `<button draggable="true" data-task="${t.id}" data-action="edit-task" data-id="${t.id}" class="calendar-event ${t.status === 'completed' ? 'event-done' : ''}" style="--color:${project(t.projectId)?.color || COLORS[0]}">${t.time ? `<span>${t.time}</span>` : ''}${esc(t.title)}</button>`).join('')}${ts.length > 3 ? `<button class="calendar-more" data-action="select-date" data-value="${day}">+${ts.length - 3} more</button>` : ''}</div>`; }).join('')}</div><div class="calendar-hint">${icon('calendar')}Drag tasks to reschedule, or edit a task’s due date.</div></section><aside class="panel day-agenda"><div class="panel-heading"><div><span class="eyebrow">YOUR DAY AT A GLANCE</span><h2>${fmt(selectedDate, { weekday: 'long' })}</h2><p>${fmt(selectedDate, { month: 'long', day: 'numeric' })}</p></div><button class="icon-button" data-action="new-task" data-date="${selectedDate}" aria-label="Schedule on selected date">${icon('plus')}</button></div>${selected.length ? selected.map(t => `<button class="agenda-task ${t.status === 'completed' ? 'agenda-done' : ''}" data-action="edit-task" data-id="${t.id}"><span class="agenda-time">${t.time || 'Anytime'}</span><span class="agenda-task-body" style="--color:${project(t.projectId)?.color || COLORS[0]}"><strong>${esc(t.title)}</strong>${projectLabel(t.projectId)}<small>${t.status === 'completed' ? 'Completed' : t.status === 'in-progress' ? 'In progress' : 'To do'}</small></span></button>`).join('') : empty('Room to breathe', 'Nothing scheduled for this day.', '', '', 'sun')}</aside></div>`;
}
function analyticsPage() {
  const today = localDate(), from = analyticsPeriod === 'day' ? today : analyticsPeriod === 'week' ? shiftDate(today, -6) : analyticsPeriod === 'month' ? shiftDate(today, -29) : shiftDate(today, -364);
  const scoped = w.tasks.filter(t => analyticsProject === 'all' || t.projectId === analyticsProject);
  const done = scoped.filter(t => t.status === 'completed' && t.completedAt && localDate(t.completedAt) >= from && localDate(t.completedAt) <= today);
  const planned = scoped.filter(t => t.due && t.due >= from && t.due <= today);
  const plannedDone = planned.filter(t => t.status === 'completed').length;
  const pending = planned.filter(t => t.status !== 'completed').length, rate = planned.length ? Math.round(plannedDone / planned.length * 100) : 0;
  const minutes = w.sessions.filter(s => localDate(s.at) >= from && (analyticsProject === 'all' || scoped.some(t => t.id === s.taskId))).reduce((sum, s) => sum + s.minutes, 0);
  const totals = CADENCES.map(c => { const ts = scoped.filter(t => t.cadence === c && t.due && t.due >= from && t.due <= today); return { c, done: ts.filter(t => t.status === 'completed').length, pending: ts.filter(t => t.status !== 'completed').length }; });
  return `${header('See how far you’ve come.', 'A thoughtful look at your effort, focus, and everyday wins.', `<select id="analytics-project" aria-label="Insights project"><option value="all">All projects</option>${w.projects.map(p => `<option value="${p.id}" ${analyticsProject === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`)}<div class="insight-period">${[['day', 'Today'], ['week', 'Last 7 days'], ['month', 'Last 30 days'], ['year', 'Last 365 days']].map(([key, label]) => `<button class="${analyticsPeriod === key ? 'selected' : ''}" data-action="analytics-period" data-value="${key}">${label}</button>`).join('')}<span>${fmt(from, { month: 'short', day: 'numeric', year: 'numeric' })} – ${fmt(today, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><section class="stats-grid">${[['check', 'Tasks completed', done.length, 'green'], ['clock', 'Pending in period', pending, 'orange'], ['target', 'Completion rate', rate + '%', 'purple'], ['coffee', 'Focus time', minutes + 'm', 'blue']].map(([i, name, value, color]) => `<div class="stat-card"><div class="stat-label">${name}<span class="stat-icon ${color}">${icon(i)}</span></div><div class="stat-number">${value}</div><div class="stat-caption">${name === 'Completion rate' ? 'Of tasks due in this period' : name === 'Tasks completed' ? 'By actual completion date' : name === 'Focus time' ? 'Completed focus sessions' : 'Tasks due in this period'}</div></div>`).join('')}</section><div class="insights-grid"><section class="panel"><div class="panel-heading"><div><h2>Completion activity</h2><p>${analyticsPeriod === 'year' ? 'Monthly completions in the selected period.' : 'Your completed tasks, day by day.'}</p></div><span class="legend-dot">Completed</span></div>${analyticsPeriod === 'year' ? monthlyChart(analyticsProject) : activityChart(analyticsPeriod === 'day' ? 1 : analyticsPeriod === 'month' ? 30 : 7, analyticsProject)}</section><section class="panel cadence-breakdown"><div class="panel-heading"><div><h2>Your planning rhythm</h2><p>Tasks due in the selected period.</p></div></div>${totals.map(({ c, done, pending }, i) => `<div class="breakdown-row"><div><span>${c[0].toUpperCase() + c.slice(1)}</span><strong>${done}<small> / ${done + pending}</small></strong></div><span class="progress-track"><i style="width:${done + pending ? done / (done + pending) * 100 : 0}%;background:${COLORS[i]}"></i></span><small>${done} completed · ${pending} pending</small></div>`).join('')}</section></div><section class="panel project-insights"><div class="panel-heading"><div><h2>Project progress</h2><p>Across your workspace, for the selected period.</p></div></div><div class="insights-table"><div class="insights-table-header"><span>Project</span><span>Completed</span><span>Pending</span><span>Progress</span></div>${[...w.projects, { id: '', name: 'Personal', color: COLORS[5] }].filter(p => analyticsProject === 'all' || p.id === analyticsProject).map(p => { const ts = planned.filter(t => t.projectId === p.id), d = ts.filter(t => t.status === 'completed').length; return `<div><span><i class="project-dot" style="--color:${p.color}"></i>${esc(p.name)}</span><strong>${d}</strong><span>${ts.length - d}</span><span class="table-progress"><span class="progress-track"><i style="width:${ts.length ? d / ts.length * 100 : 0}%;background:${p.color}"></i></span>${ts.length ? Math.round(d / ts.length * 100) : 0}%</span></div>`; }).join('')}</div></section>`;
}
function monthlyChart(pId) {
  const today = new Date();
  const from = shiftDate(localDate(), -364);
  const firstMonth = dateAt(from), months = (today.getFullYear() - firstMonth.getFullYear()) * 12 + today.getMonth() - firstMonth.getMonth() + 1;
  const data = Array.from({ length: months }, (_, i) => { const d = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1, 12); const key = localDate(d).slice(0, 7); return { label: d.toLocaleDateString(undefined, { month: 'short' }), n: w.tasks.filter(t => t.status === 'completed' && t.completedAt && localDate(t.completedAt) >= from && localDate(t.completedAt) <= localDate() && localDate(t.completedAt).startsWith(key) && (pId === 'all' || t.projectId === pId)).length }; });
  const max = Math.max(1, ...data.map(d => d.n));
  return `<div class="monthly-chart" role="img" aria-label="${data.map(d => `${d.label}: ${d.n}`).join(', ')}">${data.map(d => `<div><span>${d.n}</span><i style="height:${Math.max(2, d.n / max * 160)}px"></i><small>${d.label}</small></div>`).join('')}</div>`;
}
function completedPage() {
  const tasks = w.tasks.filter(t => t.status === 'completed' && matches(t)).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  const dates = [...new Set(tasks.map(t => t.completedAt ? localDate(t.completedAt) : ''))];
  return `${header('Look at you, making progress.', 'Every finished task is a small win. Keep the story of your work.', '<button class="button secondary" data-action="export-csv">' + icon('download') + 'Export completed</button>')}${filterControls(true)}${tasks.length ? dates.map(date => `<section class="panel completed-group"><h2>${date ? `${relative(date)} <small>${fmt(date, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</small>` : 'Completed tasks'}</h2>${tasks.filter(t => (t.completedAt ? localDate(t.completedAt) : '') === date).map(t => `<div>${taskRow(t)}${t.completionNotes || t.completionLinks.length ? `<div class="completion-evidence">${t.completionNotes ? `<p>${icon('note')}${esc(t.completionNotes)}</p>` : ''}${t.completionLinks.map(l => `<a href="${esc(safeUrl(l) || '#')}" target="_blank" rel="noopener noreferrer">${icon('link')}${esc(l)}</a>`).join('')}</div>` : ''}</div>`).join('')}</section>`).join('') : `<section class="panel">${empty('Your wins will live here', 'Complete a task and add a note or link to remember the work.', '', '', 'check')}</section>`}`;
}
function settingsPage() {
  return `${header('Make this space yours.', 'The little details that help you work your way.')}<div class="settings-grid"><section class="panel settings-panel"><h2>${icon('settings')}Your preferences</h2><form id="settings-form"><label>Workspace name<input name="name" value="${esc(w.name)}" required maxlength="40" autocomplete="given-name" /></label><label>Appearance<select name="theme">${[['light', 'Light — a fresh start'], ['dark', 'Dark — a quieter space'], ['system', 'Follow device settings']].map(([v, label]) => `<option value="${v}" ${w.settings.theme === v ? 'selected' : ''}>${label}</option>`).join('')}</select></label><fieldset class="accent-fieldset"><legend>Theme color</legend><div class="accent-picker">${ACCENTS.map(a => `<label class="accent-option" style="--swatch:${a.light}"><input type="radio" name="accent" value="${a.id}" ${w.settings.accent === a.id ? 'checked' : ''} aria-label="${a.name} theme color" /><span class="accent-option-body"><i>${icon('check')}</i><span>${a.name}</span></span></label>`).join('')}</div><p class="field-hint">Your color is saved for this workspace and works in light and dark mode.</p></fieldset><div class="form-row"><label>Daily task goal<input type="number" name="dailyGoal" min="1" max="100" value="${w.settings.dailyGoal}" required /></label><label>Focus session (minutes)<input type="number" name="focusMinutes" min="1" max="120" value="${w.settings.focusMinutes}" required /></label></div><label class="checkbox-label"><input type="checkbox" name="reminders" ${w.settings.reminders ? 'checked' : ''} />Show in-app reminders for scheduled tasks</label><p class="field-hint">Reminders appear while Maya Tasker is open. Dates and times follow your device’s local timezone.</p><button class="button primary" type="submit">Save preferences</button></form></section><div><section class="panel settings-panel"><h2>${icon('download')}Your data, in your hands</h2><p>Tasks are stored on this browser and device. Export regularly to keep a backup or move your workspace.</p><div class="backup-buttons"><button class="button secondary" data-action="export">${icon('download')}Export workspace (.json)</button><button class="button secondary" data-action="import">${icon('upload')}Import backup</button><button class="button secondary" data-action="export-csv">${icon('list')}Export completed (.csv)</button></div><div class="info-note">${icon('folder')}Import creates a new workspace so your current work stays safe. Up to 5 workspaces are supported.</div></section><section class="panel settings-panel profile-settings"><h2>${icon('tasks')}People & workspaces</h2><p>Name-based workspaces keep everyone’s plans separate on this browser. They don’t provide password protection or shared project access.</p><button class="button secondary" data-action="profiles">Manage workspaces ${icon('arrow')}</button></section><section class="panel danger-panel"><div><h3>Delete this workspace</h3><p>Permanently remove ${esc(w.name)}’s tasks and projects from this browser.</p></div><button class="button danger" data-action="delete-workspace">Delete</button></section></div></div><input type="file" id="import-file" accept=".json,application/json" hidden />`;
}
function focusPage() {
  return `${header('One thing at a time.', 'Take a breath. Find your focus. The rest can wait.')}<section class="panel focus-room"><div class="focus-decoration">${icon(timer.mode === 'break' ? 'coffee' : 'leaf')}</div><div class="focus-mode"><button data-action="focus-mode" data-value="focus" class="${timer.mode === 'focus' ? 'selected' : ''}">Focus</button><button data-action="focus-mode" data-value="break" class="${timer.mode === 'break' ? 'selected' : ''}">Short break</button></div><h2 id="focus-time" aria-live="off">${timerText()}</h2><p id="focus-message">${timer.running ? 'A little focus goes a long way.' : 'A quiet moment to do meaningful work.'}</p><label class="focus-task-label">WHAT ARE YOU WORKING ON?<select id="focus-task" ${timer.running ? 'disabled' : ''}><option value="">An open focus session</option>${openTasks().map(t => `<option value="${t.id}" ${timer.taskId === t.id ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></label><div class="focus-controls"><button class="icon-button" data-action="reset-timer" aria-label="Reset timer">${icon('reset')}</button><button class="button primary focus-start" data-action="toggle-timer">${icon(timer.running ? 'pause' : 'play')}<span id="timer-button-label">${timer.running ? 'Pause session' : 'Start session'}</span></button><button class="icon-button" data-action="focus-settings" aria-label="Set focus duration">${icon('settings')}</button></div><div class="focus-note">${icon('coffee')} ${timer.mode === 'focus' ? 'When you’re done, take a little break. You’ve earned it.' : 'Rest your eyes, stretch a little, come back refreshed.'}</div></section>`;
}
function timerText() { return `${String(Math.floor(timer.remaining / 60)).padStart(2, '0')}:${String(timer.remaining % 60).padStart(2, '0')}`; }
function updateTimerUI() { if ($('#focus-time')) $('#focus-time').textContent = timerText(); if ($('#mini-timer')) $('#mini-timer').textContent = timerText(); document.title = timer.running ? `${timerText()} · Maya Tasker` : 'Maya Tasker — A little more organized.'; }
function modal(content, cls = '', locked = false) {
  modalReturnFocus = document.activeElement;
  $('#modal-root').innerHTML = `<dialog class="modal ${cls}" aria-labelledby="modal-title">${!locked ? `<button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button>` : ''}${content}</dialog>`;
  const d = $('dialog'); d.showModal();
  d.addEventListener('cancel', e => { if (locked) e.preventDefault(); else { e.preventDefault(); closeModal(); } });
  d.addEventListener('click', e => { if (e.target === d && !locked) { const rect = d.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeModal(); } });
  setTimeout(() => ($('input:not([type="hidden"]),textarea,select', d) || $('button', d))?.focus(), 0);
}
function closeModal() { $('dialog')?.close(); $('#modal-root').innerHTML = ''; if (modalReturnFocus?.isConnected) modalReturnFocus.focus(); }
function showWelcome() {
  modal(`<div class="welcome-art"><div class="welcome-brand">${logo}<strong>Maya Tasker</strong></div><div class="welcome-art-body"><span class="welcome-spark">✳</span><h2>A little less chaos.<br>A little more clarity.</h2><p>Your ideas, your plans, your everyday wins.<br>All in one thoughtful space.</p><div class="welcome-mini-card">${icon('check')} Make time for what matters <span>✓</span></div><div class="welcome-mini-card second">${icon('leaf')} One small step, every day</div></div><small>BUILT FOR YOUR OWN KIND OF PRODUCTIVE.</small></div><div class="welcome-form"><span class="eyebrow">WELCOME TO YOUR NEXT CHAPTER</span><h1 id="modal-title">Hello, you.</h1><p>Enter your name to pick up where you left off.<br>New here? Your workspace starts fresh.</p>${storageError ? `<p class="form-error">${esc(storageError)}</p>` : ''}<form id="welcome-form"><label>Your name<input name="name" placeholder="Enter your name" maxlength="40" required autocomplete="given-name" /></label><div id="form-error" class="form-error" role="alert"></div><button class="button primary" type="submit">Open my workspace ${icon('arrow')}</button></form><p class="welcome-privacy">${icon('folder')}Saved in your browser. No sign-up, no setup.<br>Separate workspaces for up to 5 people.</p></div>`, 'welcome-modal', true);
}
function taskModal(id = '', defaults = {}) {
  const t = id ? w.tasks.find(t => t.id === id) : makeTask({ projectId: projectView || '', due: defaults.date || localDate(), status: defaults.status === 'in-progress' ? 'in-progress' : 'todo' });
  if (!t) return;
  modal(`<div class="modal-heading"><span class="eyebrow">${id ? 'MAKE IT YOURS' : 'ONE SMALL STEP'}</span><h2 id="modal-title">${id ? 'Task details' : 'What’s on your mind?'}</h2><p>${t.status === 'completed' ? 'A little record of a job well done.' : 'Give your next step a little clarity.'}</p></div><form id="task-form" data-id="${id}"><label>Task name<input name="title" value="${esc(t.title)}" placeholder="What would you like to get done?" maxlength="200" required /></label><label>Notes & description<textarea name="description" rows="3" placeholder="A few details, ideas, or things to remember…" maxlength="10000">${esc(t.description)}</textarea></label><div class="form-row"><label>Project<select name="projectId"><option value="">Personal · no project</option>${w.projects.map(p => `<option value="${p.id}" ${t.projectId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><label>Priority<select name="priority">${['low', 'medium', 'high'].map(v => `<option ${t.priority === v ? 'selected' : ''} value="${v}">${v[0].toUpperCase() + v.slice(1)} priority</option>`).join('')}</select></label></div><div class="form-row three"><label>Due date<input type="date" name="due" value="${t.due}" min="1900-01-01" max="9999-12-31" /></label><label>Time (optional)<input type="time" name="time" value="${t.time}" /></label><label>Planning cadence<select name="cadence">${CADENCES.map(c => `<option value="${c}" ${t.cadence === c ? 'selected' : ''}>${c[0].toUpperCase() + c.slice(1)}</option>`).join('')}</select></label></div><div class="form-row"><label>Status<select name="status"><option value="todo" ${t.status === 'todo' ? 'selected' : ''}>To do</option><option value="in-progress" ${t.status === 'in-progress' ? 'selected' : ''}>In progress</option><option value="completed" ${t.status === 'completed' ? 'selected' : ''}>Completed</option></select></label><label>Tags <span class="optional">comma separated</span><input name="tags" value="${esc(t.tags.join(', '))}" placeholder="design, personal" maxlength="400" /></label></div><label class="checkbox-label"><input type="checkbox" name="repeat" ${t.repeat ? 'checked' : ''} />Repeat this task after completion</label><p class="field-hint">Uses your planning cadence to create the next occurrence. Your completed record stays in your history.</p><div class="detail-section"><label>Subtasks</label><div id="subtask-list">${t.subtasks.map(s => subtaskInput(s)).join('')}</div><button class="text-button" type="button" data-action="add-subtask">${icon('plus')}Add a small step</button></div><label>Reference links <span class="optional">one per line</span><textarea name="links" rows="2" placeholder="https://…">${esc(t.links.join('\n'))}</textarea></label>${t.status === 'completed' ? `<div class="completion-edit"><label>Completion notes<textarea name="completionNotes" rows="3" maxlength="10000">${esc(t.completionNotes)}</textarea></label><label>Completion links <span class="optional">one per line</span><textarea name="completionLinks" rows="2">${esc(t.completionLinks.join('\n'))}</textarea></label><p class="field-hint">Completed ${t.completedAt ? new Date(t.completedAt).toLocaleString() : ''}${t.spent ? ` · ${t.spent} minutes focused` : ''}</p></div>` : ''}<div class="form-error" id="form-error" role="alert"></div><div class="modal-footer">${id ? `<button type="button" class="icon-button danger-text" data-action="delete-task" data-id="${id}" aria-label="Delete task">${icon('trash')}</button><button type="button" class="text-button" data-action="duplicate-task" data-id="${id}">Duplicate</button>` : '<span></span>'}<div><button class="button secondary" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">${id ? 'Save changes' : 'Create task'}${icon('arrow')}</button></div></div></form>`, 'task-modal');
}
function subtaskInput(s = { id: uid(), text: '', done: false }) { return `<div class="subtask-input" data-subtask="${s.id}"><input type="checkbox" class="subtask-done" ${s.done ? 'checked' : ''} aria-label="Subtask complete" /><input class="subtask-text" value="${esc(s.text)}" placeholder="One small step…" maxlength="300" aria-label="Subtask name" /><button type="button" class="icon-button" data-action="remove-subtask" aria-label="Remove subtask">${icon('close')}</button></div>`; }
function parseLinks(value) { const values = value.split('\n').map(l => l.trim()).filter(Boolean); if (values.some(l => !safeUrl(l))) throw new Error('Please use full http:// or https:// links, one per line.'); if (values.length > 20) throw new Error('Please use up to 20 links.'); return values.map(safeUrl); }
function completionModal(id) {
  const t = w.tasks.find(t => t.id === id); if (!t || t.status === 'completed') return;
  modal(`<div class="completion-celebration">${icon('check')}</div><div class="modal-heading"><span class="eyebrow">ANOTHER LITTLE WIN</span><h2 id="modal-title">Ready to call it done?</h2><p>${esc(t.title)}</p></div><form id="completion-form" data-id="${id}"><label>Leave a little record <span class="optional">optional</span><textarea name="notes" rows="4" placeholder="What did you finish? Any learnings or next steps?" maxlength="10000">${esc(t.completionNotes)}</textarea></label><label>Links to your work <span class="optional">optional · one per line</span><textarea name="links" rows="3" placeholder="https://…">${esc(t.completionLinks.join('\n'))}</textarea></label>${t.subtasks.some(s => !s.done) ? '<p class="info-note">Completing this task also checks off its remaining subtasks.</p>' : ''}${t.repeat ? `<p class="info-note">${icon('repeat')}A new ${t.cadence} occurrence will be added automatically.</p>` : ''}<div id="form-error" class="form-error" role="alert"></div><div class="modal-footer"><span></span><div><button type="button" class="button secondary" data-action="close-modal">Keep working</button><button class="button primary" type="submit">${icon('check')}Mark as completed</button></div></div></form>`, 'completion-modal');
}
function projectModal(id = '') {
  const p = project(id) || { name: '', description: '', color: COLORS[w.projects.length % COLORS.length], due: '' };
  modal(`<div class="modal-heading"><span class="eyebrow">A HOME FOR YOUR IDEAS</span><h2 id="modal-title">${id ? 'Edit project' : 'Start something good.'}</h2><p>Group the little steps into something bigger.</p></div><form id="project-form" data-id="${id}"><label>Project name<input name="name" value="${esc(p.name)}" maxlength="80" placeholder="e.g. My next big idea" required /></label><label>What’s this project about?<textarea name="description" rows="3" maxlength="1000" placeholder="A little context for your future self…">${esc(p.description)}</textarea></label><label>Target date <span class="optional">optional</span><input type="date" name="due" value="${p.due || ''}" min="1900-01-01" max="9999-12-31" /></label><label>Project color</label><div class="color-picker">${COLORS.map(c => `<label style="--color:${c}"><input type="radio" name="color" value="${c}" ${c === p.color ? 'checked' : ''} aria-label="${c}"/><span>${icon('check')}</span></label>`).join('')}</div><div id="form-error" class="form-error" role="alert"></div><div class="modal-footer">${id ? `<button class="text-button danger-text" type="button" data-action="delete-project" data-id="${id}">${icon('trash')}Delete project</button>` : '<span></span>'}<div><button class="button secondary" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">${id ? 'Save project' : 'Create project'}${icon('arrow')}</button></div></div></form>`);
}
function profilesModal() {
  modal(`<div class="modal-heading"><span class="eyebrow">EVERYONE’S OWN LITTLE SPACE</span><h2 id="modal-title">Your workspaces</h2><p>Choose a name to pick up where you left off.</p></div><div class="profile-list">${db.workspaces.map(p => `<button data-action="switch-profile" data-id="${p.id}"><span class="avatar">${esc(p.name.slice(0, 2).toUpperCase())}</span><span><strong>${esc(p.name)}</strong><small>${p.tasks.length} tasks · ${p.projects.length} projects</small></span>${p.id === w.id ? '<span class="profile-current">Current</span>' : icon('arrow')}</button>`).join('')}</div><form id="profile-form"><label>Open a workspace by name<input name="name" placeholder="Enter a new or existing name" maxlength="40" required /></label><div id="form-error" class="form-error" role="alert"></div><button class="button primary" type="submit">Open workspace ${icon('arrow')}</button></form><button class="text-button return-to-welcome" data-action="enter-name">${icon('logout')}Return to the name screen</button><p class="field-hint">Workspaces are local to this browser. Names are for organization and don’t act as secure sign-in.</p>`);
}
function filtersModal() {
  modal(`<div class="modal-heading"><h2 id="modal-title">Find your next step.</h2><p>A few filters for a clearer view.</p></div><form id="filter-form"><label>Search tasks<input name="q" value="${esc(filters.q)}" placeholder="Task, note, tag, or project…" /></label><div class="form-row"><label>Project<select name="project"><option value="all">All projects</option><option value="personal" ${filters.project === 'personal' ? 'selected' : ''}>Personal</option>${w.projects.map(p => `<option value="${p.id}" ${filters.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><label>Priority<select name="priority">${['all', 'high', 'medium', 'low'].map(v => `<option value="${v}" ${filters.priority === v ? 'selected' : ''}>${v === 'all' ? 'All priorities' : v}</option>`).join('')}</select></label></div>${view !== 'completed' ? `<label>Status<select name="status">${[['open', 'All open tasks'], ['all', 'Every status'], ['todo', 'To do'], ['in-progress', 'In progress'], ['completed', 'Completed']].map(([v, n]) => `<option value="${v}" ${filters.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}<label>Sort by<select name="sort">${[['due', 'Due date'], ['priority', 'Priority'], ['created', 'Newest first'], ['title', 'Task name']].map(([v, n]) => `<option value="${v}" ${filters.sort === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label><div class="modal-footer"><button type="button" class="text-button" data-action="clear-filters">Reset filters</button><button class="button primary" type="submit">Apply filters</button></div></form>`);
}
function searchModal() {
  modal(`<div class="search-modal-header">${icon('search')}<input id="global-search" placeholder="Search tasks, projects, notes…" autocomplete="off" aria-label="Search workspace" /></div><h2 id="modal-title" class="visually-hidden">Search workspace</h2><div id="search-results"><div class="search-intro">A little clarity is a search away.<small>Search across all statuses, projects, notes, and tags.</small></div></div><div class="search-footer"><kbd>Esc</kbd> to close <span><kbd>N</kbd> creates a new task outside search</span></div>`, 'search-modal');
}
function searchResults(query) {
  if (!query.trim()) { $('#search-results').innerHTML = '<div class="search-intro">Type to find a task or project.</div>'; return; }
  const q = query.toLowerCase();
  const tasks = w.tasks.filter(t => `${t.title} ${t.description} ${t.tags.join(' ')} ${t.completionNotes}`.toLowerCase().includes(q)).slice(0, 12);
  const projects = w.projects.filter(p => `${p.name} ${p.description}`.toLowerCase().includes(q)).slice(0, 5);
  $('#search-results').innerHTML = `${projects.length ? '<div class="search-section-label">PROJECTS</div>' + projects.map(p => `<button class="search-result" data-action="project-view" data-id="${p.id}">${icon('folder')}<span><strong>${esc(p.name)}</strong><small>Project</small></span>${icon('arrow')}</button>`).join('') : ''}${tasks.length ? '<div class="search-section-label">TASKS</div>' + tasks.map(t => `<button class="search-result" data-action="edit-task" data-id="${t.id}">${icon(t.status === 'completed' ? 'check' : 'circle')}<span><strong>${esc(t.title)}</strong><small>${esc(project(t.projectId)?.name || 'Personal')} · ${t.status === 'completed' ? 'Completed' : relative(t.due)}</small></span>${icon('arrow')}</button>`).join('') : ''}${!tasks.length && !projects.length ? empty('Nothing found just yet', 'Try another word or search for a project.', '', '', 'search') : ''}`;
}
function confirmModal(title, description, action, id = '', requireName = false) {
  modal(`<div class="modal-heading"><span class="eyebrow">A MOMENT TO DOUBLE-CHECK</span><h2 id="modal-title">${title}</h2><p>${description}</p></div>${requireName ? `<label>Type your workspace name to confirm<input id="delete-confirmation" placeholder="${esc(w.name)}" autocomplete="off" /></label>` : ''}<div class="modal-footer"><span></span><div><button class="button secondary" data-action="close-modal">Cancel</button><button class="button danger" data-action="${action}" data-id="${id}">Delete ${requireName ? 'workspace' : 'project'}</button></div></div>`);
}
function activate(next) {
  clearTimeout(toastTimeout); undoAction = null; $('#toast-root').innerHTML = '';
  if (timer.running || timer.remaining < timer.duration * 60) toast('Your focus timer was reset when switching workspaces.');
  timer = { running: false, remaining: next.settings.focusMinutes * 60, end: 0, taskId: '', mode: 'focus', duration: next.settings.focusMinutes };
  w = next; view = 'dashboard'; projectView = ''; filters = { q: '', cadence: 'all', project: 'all', priority: 'all', status: 'open', sort: 'due' }; analyticsProject = 'all'; save(); closeModal(); render(); updateTimerUI();
}
function enterWorkspace(name) {
  const { workspace, created } = getOrCreateWorkspace(db.workspaces, name);
  activate(workspace);
  toast(created ? `Welcome, ${workspace.name}. Your fresh workspace is ready.` : `Welcome back, ${workspace.name}. Pick up where you left off.`);
}
function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportWorkspace() { download(JSON.stringify({ format: 'maya-tasker', version: 1, exportedAt: new Date().toISOString(), workspace: w }, null, 2), `maya-tasker-${w.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${localDate()}.json`, 'application/json'); toast('Workspace backup exported. Keep it somewhere safe.'); }
function csvExport() {
  const cell = s => { const value = String(s ?? ''); return '"' + (/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""') + '"'; };
  const rows = [['Task', 'Project', 'Cadence', 'Priority', 'Due date', 'Completed at', 'Notes', 'Links', 'Focus minutes'], ...w.tasks.filter(t => t.status === 'completed').map(t => [t.title, project(t.projectId)?.name || 'Personal', t.cadence, t.priority, t.due, t.completedAt, t.completionNotes, t.completionLinks.join(' | '), t.spent])];
  download('\ufeff' + rows.map(r => r.map(cell).join(',')).join('\r\n'), `maya-completed-${localDate()}.csv`, 'text/csv;charset=utf-8'); toast('Completed tasks exported.');
}

document.addEventListener('submit', e => {
  const form = e.target; if (!(form instanceof HTMLFormElement)) return; e.preventDefault();
  const data = new FormData(form), val = name => String(data.get(name) || '').trim();
  try {
    if (form.id === 'welcome-form' || form.id === 'profile-form') { enterWorkspace(val('name')); return; }
    if (form.id === 'task-form') {
      const id = form.dataset.id, existing = w.tasks.find(t => t.id === id), status = val('status');
      if (!val('title')) throw new Error('Give your task a name first.');
      const fields = { title: val('title'), description: val('description'), projectId: val('projectId'), priority: val('priority'), due: val('due'), time: val('time'), cadence: val('cadence'), repeat: data.has('repeat'), tags: val('tags').split(',').map(s => s.trim()).filter(Boolean).slice(0, 20), links: parseLinks(val('links')), subtasks: [...form.querySelectorAll('.subtask-input')].map(row => ({ id: row.dataset.subtask, text: $('.subtask-text', row).value.trim(), done: $('.subtask-done', row).checked })).filter(s => s.text) };
      if (fields.repeat && !fields.due) throw new Error('Add a due date so the next occurrence can be scheduled.');
      if (!existing || fields.due !== existing.due || fields.cadence !== existing.cadence) fields.anchorDay = fields.due ? dateAt(fields.due).getDate() : undefined;
      if (existing?.status === 'completed') { fields.completionNotes = val('completionNotes'); fields.completionLinks = parseLinks(val('completionLinks')); }
      const task = existing || makeTask(); Object.assign(task, fields); if (!existing) w.tasks.push(task);
      const needsComplete = status === 'completed' && task.status !== 'completed';
      if (!needsComplete) { if (task.status === 'completed' && status !== 'completed') task.completedAt = null; task.status = status; }
      save(); closeModal(); render(); if (needsComplete) completionModal(task.id); else toast(existing ? 'Task updated. A little clearer.' : 'Task added. One step closer.'); return;
    }
    if (form.id === 'completion-form') {
      const id = form.dataset.id, task = w.tasks.find(t => t.id === id), links = parseLinks(val('links'));
      const snapshot = structuredClone(task); const next = completeTask(w, id, val('notes'), links);
      save(); closeModal(); render(); toast(next ? 'Task completed. Its next occurrence is ready.' : 'A little win, well earned. Task completed!', '', () => { const index = w.tasks.findIndex(t => t.id === id); if (index >= 0) w.tasks[index] = snapshot; if (next) w.tasks = w.tasks.filter(t => t.id !== next.id); save(); render(); }); return;
    }
    if (form.id === 'project-form') {
      if (!val('name')) throw new Error('Give your project a name.');
      const id = form.dataset.id, fields = { name: val('name'), description: val('description'), color: val('color') || COLORS[0], due: val('due') };
      if (id) Object.assign(project(id), fields); else w.projects.push({ id: uid(), ...fields });
      save(); closeModal(); render(); toast(id ? 'Project updated.' : 'A new home for your ideas. Project created.'); return;
    }
    if (form.id === 'filter-form') { for (const key of ['q', 'project', 'priority', 'sort']) filters[key] = val(key); if (data.has('status')) filters.status = val('status'); closeModal(); render(); return; }
    if (form.id === 'settings-form') {
      if (!val('name')) throw new Error('Enter a workspace name.');
      if (db.workspaces.some(p => p.id !== w.id && normalizeName(p.name).toLocaleLowerCase() === normalizeName(val('name')).toLocaleLowerCase())) throw new Error('Another workspace already uses that name.');
      w.name = normalizeName(val('name')); Object.assign(w.settings, { theme: val('theme'), accent: ACCENTS.some(a => a.id === val('accent')) ? val('accent') : 'violet', dailyGoal: Number(val('dailyGoal')), focusMinutes: Number(val('focusMinutes')), reminders: data.has('reminders') });
      if (!timer.running && timer.mode === 'focus') { timer.duration = w.settings.focusMinutes; timer.remaining = timer.duration * 60; }
      save(); render(); toast('Your preferences are saved. Make yourself at home.'); return;
    }
    if (form.id === 'duration-form') { const n = Number(val('minutes')); timer.duration = n; timer.remaining = n * 60; timer.running = false; closeModal(); render(); return; }
  } catch (err) { const el = $('#form-error', form); if (el) el.textContent = err.message; else toast(err.message, 'warning'); }
});

document.addEventListener('click', e => {
  if (document.body.classList.contains('nav-open') && !e.target.closest('.sidebar,[data-action="mobile-menu"]')) document.body.classList.remove('nav-open');
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  const action = btn.dataset.action, id = btn.dataset.id, value = btn.dataset.value;
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'dismiss-toast') { $('#toast-root').innerHTML = ''; return; }
  if (action === 'undo') { const undo = undoAction; undoAction = null; $('#toast-root').innerHTML = ''; if (undo) undo(); return; }
  if (!w) return;
  if (action === 'nav') { view = btn.dataset.view; projectView = ''; if (view === 'tasks') filters.status = 'open'; closeModal(); render(); window.scrollTo({ top: 0 }); }
  else if (action === 'project-view') { view = 'tasks'; projectView = id; filters = { ...filters, q: '', project: 'all', cadence: 'all', status: 'all' }; closeModal(); render(); }
  else if (action === 'new-task') taskModal('', { date: btn.dataset.date, status: btn.dataset.status });
  else if (action === 'edit-task') taskModal(id);
  else if (action === 'new-project') projectModal();
  else if (action === 'edit-project') projectModal(id);
  else if (action === 'toggle-task') {
    const task = w.tasks.find(t => t.id === id);
    if (task.status === 'completed') { task.status = 'todo'; task.completedAt = null; save(); render(); toast('Task reopened. Ready when you are.'); } else completionModal(id);
  }
  else if (action === 'add-subtask') { if (document.querySelectorAll('.subtask-input').length >= 100) return toast('Up to 100 subtasks per task.', 'warning'); $('#subtask-list').insertAdjacentHTML('beforeend', subtaskInput()); $('#subtask-list').lastElementChild.querySelector('.subtask-text').focus(); }
  else if (action === 'remove-subtask') btn.closest('.subtask-input').remove();
  else if (action === 'delete-task') { const task = w.tasks.find(t => t.id === id); w.tasks = w.tasks.filter(t => t.id !== id); save(); closeModal(); render(); toast('Task deleted.', '', () => { w.tasks.push(task); save(); render(); }); }
  else if (action === 'duplicate-task') { const source = w.tasks.find(t => t.id === id); const copy = makeTask({ ...structuredClone(source), id: uid(), title: source.title + ' (copy)', status: 'todo', completedAt: null, completionNotes: '', completionLinks: [], spent: 0, repeat: false, createdAt: new Date().toISOString(), subtasks: source.subtasks.map(s => ({ ...s, id: uid(), done: false })) }); w.tasks.push(copy); save(); closeModal(); render(); taskModal(copy.id); toast('Task duplicated.'); }
  else if (action === 'dashboard-tab') { dashboardTab = value; render(); }
  else if (action === 'cadence') { filters.cadence = value; render(); }
  else if (action === 'layout') { layout = value; if (value === 'board') filters.status = 'all'; render(); }
  else if (action === 'filters') filtersModal();
  else if (action === 'clear-filters') { filters = { q: '', cadence: 'all', project: 'all', priority: 'all', status: 'open', sort: 'due' }; closeModal(); render(); }
  else if (action === 'theme') { w.settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; save(); render(); }
  else if (action === 'profiles') profilesModal();
  else if (action === 'enter-name') { timer.running = false; w = null; clearTimeout(toastTimeout); $('#toast-root').innerHTML = ''; closeModal(); document.body.classList.remove('nav-open'); save(); render(); updateTimerUI(); }
  else if (action === 'switch-profile') activate(db.workspaces.find(p => p.id === id));
  else if (action === 'search') searchModal();
  else if (action === 'notifications') { const ts = sorted(openTasks().filter(t => t.due && t.due <= localDate())); modal(`<div class="modal-heading"><span class="eyebrow">A GENTLE NUDGE</span><h2 id="modal-title">On your radar</h2><p>${ts.length ? 'Today’s tasks and a few that need a little attention.' : 'All caught up. Take a little breath.'}</p></div>${ts.length ? ts.map(t => `<button class="search-result" data-action="edit-task" data-id="${t.id}">${icon(isLate(t) ? 'clock' : 'calendar')}<span><strong>${esc(t.title)}</strong><small class="${isLate(t) ? 'overdue' : ''}">${relative(t.due)}${t.time ? ' · ' + t.time : ''}</small></span>${icon('arrow')}</button>`).join('') : empty('Nothing needs your attention', 'You’re right on track.', '', '', 'check')}`); }
  else if (action === 'calendar-prev' || action === 'calendar-next') { const d = dateAt(calendarDate); calendarDate = localDate(new Date(d.getFullYear(), d.getMonth() + (action === 'calendar-next' ? 1 : -1), 1, 12)); render(); }
  else if (action === 'calendar-today') { calendarDate = selectedDate = localDate(); render(); }
  else if (action === 'select-date') { selectedDate = value; render(); }
  else if (action === 'analytics-period') { analyticsPeriod = value; render(); }
  else if (action === 'export') exportWorkspace();
  else if (action === 'export-csv') csvExport();
  else if (action === 'import') $('#import-file').click();
  else if (action === 'delete-project') confirmModal('Delete this project?', `The project “${esc(project(id).name)}” will be removed. Its tasks and completion history will move to Personal.`, 'confirm-delete-project', id);
  else if (action === 'confirm-delete-project') { w.projects = w.projects.filter(p => p.id !== id); w.tasks.filter(t => t.projectId === id).forEach(t => t.projectId = ''); if (projectView === id) { projectView = ''; view = 'projects'; } if (filters.project === id) filters.project = 'all'; if (analyticsProject === id) analyticsProject = 'all'; save(); closeModal(); render(); toast('Project deleted. Its tasks are now in Personal.'); }
  else if (action === 'delete-workspace') confirmModal('Delete your workspace?', 'This permanently removes its tasks, projects, and focus history from this browser. Export a backup in Settings first if you want to keep a copy.', 'confirm-delete-workspace', '', true);
  else if (action === 'confirm-delete-workspace') { if ($('#delete-confirmation').value.trim() !== w.name) return toast('Enter your workspace name exactly to confirm.', 'warning'); db.workspaces = db.workspaces.filter(p => p.id !== w.id); timer.running = false; w = null; closeModal(); save(); render(); toast('Workspace deleted.'); }
  else if (action === 'toggle-timer') { if (timer.running) { timer.remaining = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000)); timer.running = false; } else { if (timer.remaining <= 0) timer.remaining = timer.duration * 60; timer.running = true; timer.end = Date.now() + timer.remaining * 1000; } render(); updateTimerUI(); }
  else if (action === 'reset-timer') { timer.running = false; timer.remaining = timer.duration * 60; render(); updateTimerUI(); }
  else if (action === 'focus-mode') { if (timer.running) return toast('Pause your session before changing focus mode.', 'warning'); timer.mode = value; timer.duration = value === 'break' ? 5 : w.settings.focusMinutes; timer.remaining = timer.duration * 60; render(); }
  else if (action === 'focus-settings') { if (timer.running) return toast('Pause your session to change its duration.', 'warning'); modal(`<div class="modal-heading"><h2 id="modal-title">Find your rhythm.</h2><p>Choose a duration for this session.</p></div><form id="duration-form"><label>Minutes<input type="number" name="minutes" min="1" max="120" required value="${timer.duration}" /></label><div class="modal-footer"><span></span><button class="button primary" type="submit">Set duration</button></div></form>`); }
  else if (action === 'mobile-menu') document.body.classList.toggle('nav-open');
  else if (action === 'help') modal(`<div class="modal-heading"><span class="eyebrow">A FEW HELPFUL THINGS</span><h2 id="modal-title">Make yourself at home.</h2><p>Your quick guide to Maya Tasker.</p></div><div class="help-content"><div><kbd>N</kbd><span>Create a new task</span></div><div><kbd>Ctrl / ⌘ K</kbd><span>Search your workspace</span></div><div><kbd>F</kbd><span>Open the focus room</span></div><div><kbd>?</kbd><span>Show this guide</span></div><div><kbd>Esc</kbd><span>Close a dialog</span></div><h3>Plan your way</h3><p>Cadence groups tasks by daily, weekly, monthly, or yearly plans. Turn on repeat to automatically create the next occurrence when you finish a task.</p><h3>Keep the story of your work</h3><p>Click a task’s circle to complete it. Add notes or links before you finish. Everything stays in Completed, where you can reopen tasks or export your history.</p><h3>A space for everyone</h3><p>Click your workspace name to switch people. Each workspace is stored separately in this browser, without password protection or cross-device sync. Export backups from Settings.</p><h3>A little focus</h3><p>Focus sessions keep running as you navigate within the app. Keep the browser tab open; closing or refreshing resets the timer. Finished sessions are saved to your insights.</p></div>`);
  if (['nav', 'project-view'].includes(action)) document.body.classList.remove('nav-open');
});

document.addEventListener('input', e => { if (e.target.id === 'global-search') searchResults(e.target.value); });
document.addEventListener('change', async e => {
  if (e.target.id === 'analytics-project') { analyticsProject = e.target.value; render(); }
  if (e.target.id === 'focus-task') timer.taskId = e.target.value;
  if (e.target.id === 'import-file' && e.target.files[0]) {
    try {
      const file = e.target.files[0]; if (file.size > 15 * 1024 * 1024) throw new Error('This file is too large. Use a backup under 15 MB.');
      if (db.workspaces.length >= 5) throw new Error('All 5 workspace slots are in use. Export and delete one before importing.');
      const data = JSON.parse(await file.text()); if (data.format !== 'maya-tasker' || data.version !== 1) throw new Error('Choose a Maya Tasker JSON workspace backup.');
      const next = validateWorkspace(data.workspace); let name = next.name, n = 2; while (db.workspaces.some(w => w.name.toLowerCase() === name.toLowerCase())) name = `${next.name.slice(0, 30)} (${n++})`; next.name = name; db.workspaces.push(next); activate(next); toast('Backup imported into its own workspace. Welcome back.');
    } catch (err) { toast(err.message || 'This backup could not be read.', 'warning'); e.target.value = ''; }
  }
});
document.addEventListener('keydown', e => {
  if (!w) return;
  if (e.key === 'Escape') document.body.classList.remove('nav-open');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchModal(); return; }
  if (e.target.closest('input,textarea,select,[contenteditable="true"]') || $('dialog')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.toLowerCase() === 'n') { e.preventDefault(); taskModal(); }
  if (e.key.toLowerCase() === 'f') { view = 'focus'; projectView = ''; render(); }
  if (e.key === '?') $('[data-action="help"]').click();
});
let draggedId = '';
document.addEventListener('dragstart', e => { const task = e.target.closest('[data-task]'); if (!task) return; draggedId = task.dataset.task; e.dataTransfer.setData('text/plain', draggedId); e.dataTransfer.effectAllowed = 'move'; });
document.addEventListener('dragover', e => { const target = e.target.closest('[data-drop-date],[data-drop-status]'); if (!target || !draggedId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; target.classList.add('drag-over'); });
document.addEventListener('dragleave', e => { const target = e.target.closest('[data-drop-date],[data-drop-status]'); if (target && !target.contains(e.relatedTarget)) target.classList.remove('drag-over'); });
document.addEventListener('dragend', () => { draggedId = ''; document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); });
document.addEventListener('drop', e => {
  const target = e.target.closest('[data-drop-date],[data-drop-status]'); if (!target || !draggedId) return; e.preventDefault();
  const t = w.tasks.find(t => t.id === draggedId); draggedId = ''; if (!t) return;
  if (target.dataset.dropDate) { t.due = target.dataset.dropDate; t.anchorDay = dateAt(t.due).getDate(); save(); render(); toast(`Task moved to ${fmt(t.due)}.`); }
  else if (target.dataset.dropStatus === 'completed' && t.status !== 'completed') { target.classList.remove('drag-over'); completionModal(t.id); }
  else { t.status = target.dataset.dropStatus; if (t.status !== 'completed') t.completedAt = null; save(); render(); }
});
setInterval(() => {
  if (!timer.running || !w) return;
  timer.remaining = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000)); updateTimerUI();
  if (timer.remaining === 0) {
    timer.running = false;
    if (timer.mode === 'focus') { w.sessions.push({ at: new Date().toISOString(), minutes: timer.duration, taskId: timer.taskId }); const t = w.tasks.find(t => t.id === timer.taskId); if (t) t.spent += timer.duration; save(); }
    render(); updateTimerUI(); toast(timer.mode === 'focus' ? 'Session complete. A little progress, beautifully done. Time for a break.' : 'Break complete. Ready for a fresh start?');
  }
}, 500);
const reminded = new Set();
setInterval(() => {
  if (w && localDate() !== renderedDay) render();
  if (!w?.settings.reminders) return;
  const now = new Date(), date = localDate(now), time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  openTasks().filter(t => t.due === date && t.time && t.time <= time).forEach(t => { const key = `${w.id}:${t.id}:${date}:${t.time}`; if (!reminded.has(key)) { reminded.add(key); toast(`A gentle nudge: ${t.title} is scheduled for ${t.time}.`); } });
}, 30000);
window.addEventListener('storage', e => { if (e.key === STORAGE) { if (e.newValue === JSON.stringify(db)) return; modal(`<div class="modal-heading"><h2 id="modal-title">Your workspace changed.</h2><p>Maya Tasker was updated in another tab. Reload to use the latest saved version and avoid overwriting it.</p></div><button class="button primary" id="reload-app">Reload workspace</button>`, '', true); $('#reload-app').onclick = () => location.reload(); } });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (w?.settings.theme === 'system') setTheme(); });
render();
