export const CADENCES = ['daily', 'weekly', 'monthly', 'yearly'];
export const COLORS = ['#8b72df', '#57a997', '#df9c58', '#639ed5', '#d77fa2', '#8c98a9'];
export const ACCENTS = [
  { id: 'violet', name: 'Violet', light: '#8266d7', dark: '#ad91f7' },
  { id: 'blue', name: 'Ocean', light: '#3974c8', dark: '#87b5fa' },
  { id: 'teal', name: 'Teal', light: '#227f82', dark: '#70cbc9' },
  { id: 'green', name: 'Forest', light: '#39815c', dark: '#88c99f' },
  { id: 'rose', name: 'Rose', light: '#b54f79', dark: '#ed9ebc' },
  { id: 'amber', name: 'Amber', light: '#97651d', dark: '#e4bd77' },
  { id: 'orange', name: 'Sunset', light: '#b75b35', dark: '#efa681' },
  { id: 'slate', name: 'Graphite', light: '#596a83', dark: '#a9bad3' },
];
export const normalizeName = name => String(name || '').trim().replace(/\s+/g, ' ');
export function getOrCreateWorkspace(workspaces, input) {
  const name = normalizeName(input);
  if (!name) throw new Error('Please enter your name to open your workspace.');
  if (name.length > 40) throw new Error('Use a name with 40 characters or fewer.');
  const existing = workspaces.find(w => normalizeName(w.name).toLocaleLowerCase() === name.toLocaleLowerCase());
  if (existing) return { workspace: existing, created: false };
  if (workspaces.length >= 5) throw new Error('All 5 workspace slots are in use. Enter an existing name, or export and delete a workspace in Settings.');
  const workspace = blankWorkspace(name);
  workspaces.push(workspace);
  return { workspace, created: true };
}
export const uid = () => globalThis.crypto.randomUUID();
export function localDate(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function dateAt(value) { return new Date(`${value}T12:00:00`); }
export function shiftDate(value, days) { const d = dateAt(value); d.setDate(d.getDate() + days); return localDate(d); }
export function startOfWeek(value) { const d = dateAt(value); return shiftDate(value, -((d.getDay() + 6) % 7)); }
export function nextOccurrence(task) {
  const value = task.due || localDate();
  if (task.cadence === 'daily') return shiftDate(value, 1);
  if (task.cadence === 'weekly') return shiftDate(value, 7);
  const d = dateAt(value);
  const day = task.anchorDay || d.getDate();
  const month = d.getMonth() + (task.cadence === 'monthly' ? 1 : 0);
  const year = d.getFullYear() + (task.cadence === 'yearly' ? 1 : 0);
  const last = new Date(year, month + 1, 0).getDate();
  return localDate(new Date(year, month, Math.min(day, last), 12));
}
export function completeTask(workspace, id, notes = '', links = []) {
  const task = workspace.tasks.find(t => t.id === id);
  if (!task || task.status === 'completed') return null;
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.completionNotes = notes;
  task.completionLinks = links;
  task.subtasks = task.subtasks.map(s => ({ ...s, done: true }));
  if (!task.repeat) return null;
  const due = nextOccurrence(task), seriesId = task.seriesId || task.id;
  if (workspace.tasks.some(t => t.id !== task.id && t.seriesId === seriesId && t.due === due)) return null;
  const next = { ...structuredClone(task), id: uid(), due, anchorDay: task.anchorDay || dateAt(task.due || localDate()).getDate(), status: 'todo', completedAt: null, completionNotes: '', completionLinks: [], createdAt: new Date().toISOString(), spent: 0, subtasks: task.subtasks.map(s => ({ ...s, id: uid(), done: false })), seriesId };
  workspace.tasks.push(next);
  return next;
}
export function blankWorkspace(name) {
  return { id: uid(), name: normalizeName(name), createdAt: new Date().toISOString(), tasks: [], projects: [], sessions: [], settings: { theme: 'light', accent: 'violet', focusMinutes: 25, reminders: false, dailyGoal: 5 } };
}
export function makeTask(data = {}) {
  return { id: uid(), title: '', description: '', projectId: '', due: localDate(), time: '', cadence: 'daily', repeat: false, priority: 'medium', status: 'todo', tags: [], subtasks: [], links: [], completionLinks: [], completionNotes: '', spent: 0, createdAt: new Date().toISOString(), completedAt: null, ...data };
}
export function safeUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(dateAt(value).getTime()) && localDate(dateAt(value)) === value; }
export function validateWorkspace(data) {
  if (!data || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 40 || !Array.isArray(data.tasks) || !Array.isArray(data.projects) || data.tasks.length > 20000 || data.projects.length > 1000) throw new Error('This is not a valid Maya Tasker backup.');
  const result = blankWorkspace(data.name.trim());
  if (!Number.isNaN(Date.parse(data.createdAt))) result.createdAt = data.createdAt;
  result.projects = data.projects.map(p => {
    if (typeof p.id !== 'string' || !/^[a-z0-9_-]{1,80}$/i.test(p.id) || typeof p.name !== 'string' || !p.name.trim()) throw new Error('Invalid project in backup.');
    return { id: p.id, name: p.name.slice(0, 80), description: String(p.description || '').slice(0, 1000), color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : COLORS[0], due: validDate(p.due) ? p.due : '' };
  });
  const projectIds = new Set(result.projects.map(p => p.id));
  result.tasks = data.tasks.map(t => {
    if (typeof t.id !== 'string' || !/^[a-z0-9_-]{1,80}$/i.test(t.id) || typeof t.title !== 'string' || !t.title.trim()) throw new Error('Invalid task in backup.');
    return makeTask({ id: t.id, title: t.title.slice(0, 200), description: String(t.description || '').slice(0, 10000), projectId: projectIds.has(t.projectId) ? t.projectId : '', due: validDate(t.due) ? t.due : '', time: /^([01]\d|2[0-3]):[0-5]\d$/.test(t.time) ? t.time : '', cadence: CADENCES.includes(t.cadence) ? t.cadence : 'daily', repeat: !!t.repeat, priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium', status: ['todo', 'in-progress', 'completed'].includes(t.status) ? t.status : 'todo', tags: Array.isArray(t.tags) ? t.tags.filter(s => typeof s === 'string').slice(0, 20) : [], subtasks: Array.isArray(t.subtasks) ? t.subtasks.slice(0, 100).map(s => ({ id: uid(), text: String(s.text || '').slice(0, 300), done: !!s.done })) : [], links: Array.isArray(t.links) ? t.links.filter(safeUrl).slice(0, 20) : [], completionLinks: Array.isArray(t.completionLinks) ? t.completionLinks.filter(safeUrl).slice(0, 20) : [], completionNotes: String(t.completionNotes || '').slice(0, 10000), spent: Math.max(0, Number(t.spent) || 0), completedAt: t.status === 'completed' && !Number.isNaN(Date.parse(t.completedAt)) ? t.completedAt : t.status === 'completed' ? new Date().toISOString() : null, createdAt: !Number.isNaN(Date.parse(t.createdAt)) ? t.createdAt : new Date().toISOString(), anchorDay: Number.isInteger(t.anchorDay) && t.anchorDay >= 1 && t.anchorDay <= 31 ? t.anchorDay : undefined, seriesId: typeof t.seriesId === 'string' ? t.seriesId : undefined });
  });
  if (new Set(result.tasks.map(t => t.id)).size !== result.tasks.length || projectIds.size !== result.projects.length) throw new Error('Backup contains duplicate records.');
  result.sessions = Array.isArray(data.sessions) ? data.sessions.filter(s => s && !Number.isNaN(Date.parse(s.at)) && Number.isFinite(s.minutes) && s.minutes > 0).map(s => ({ at: s.at, minutes: s.minutes, taskId: typeof s.taskId === 'string' ? s.taskId : '' })) : [];
  result.settings = { ...result.settings, theme: ['light', 'dark', 'system'].includes(data.settings?.theme) ? data.settings.theme : 'light', accent: ACCENTS.some(a => a.id === data.settings?.accent) ? data.settings.accent : 'violet', focusMinutes: Math.min(120, Math.max(1, Number(data.settings?.focusMinutes) || 25)), dailyGoal: Math.min(100, Math.max(1, Number(data.settings?.dailyGoal) || 5)), reminders: !!data.settings?.reminders };
  return result;
}
