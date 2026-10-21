export const CADENCES = ['daily', 'weekly', 'monthly', 'yearly'];
export const COLORS = ['#8b72df', '#57a997', '#df9c58', '#639ed5', '#d77fa2', '#8c98a9'];
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
  return { id: uid(), name, createdAt: new Date().toISOString(), tasks: [], projects: [], sessions: [], settings: { theme: 'light', focusMinutes: 25, reminders: false, dailyGoal: 5 } };
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
  result.settings = { ...result.settings, theme: ['light', 'dark', 'system'].includes(data.settings?.theme) ? data.settings.theme : 'light', focusMinutes: Math.min(120, Math.max(1, Number(data.settings?.focusMinutes) || 25)), dailyGoal: Math.min(100, Math.max(1, Number(data.settings?.dailyGoal) || 5)), reminders: !!data.settings?.reminders };
  return result;
}
export function demoWorkspace(name = 'Alex') {
  const w = blankWorkspace(name); w.demo = true;
  w.projects = [
    { id: uid(), name: 'Website redesign', description: 'A fresh digital home. Thoughtful, useful, and a little delightful.', color: COLORS[0], due: shiftDate(localDate(), 14) },
    { id: uid(), name: 'Personal growth', description: 'Make room for learning and the things that matter.', color: COLORS[1], due: '' },
    { id: uid(), name: 'Product launch', description: 'Bring the next big idea into the world.', color: COLORS[2], due: shiftDate(localDate(), 28) }
  ];
  const p = w.projects.map(p => p.id); const today = localDate();
  const specs = [
    ['Explore homepage directions', p[0], 'high', 'in-progress', today, '09:30', 'daily'],
    ['Read 20 pages of Atomic Habits', p[1], 'low', 'todo', today, '12:00', 'daily'],
    ['Review launch checklist', p[2], 'high', 'todo', today, '14:00', 'weekly'],
    ['Plan next week’s priorities', '', 'medium', 'todo', today, '16:30', 'weekly'],
    ['Build the component library', p[0], 'medium', 'todo', shiftDate(today, 1), '10:00', 'weekly'],
    ['Monthly reflection & reset', p[1], 'low', 'todo', shiftDate(today, 3), '', 'monthly'],
    ['Write the product story', p[2], 'medium', 'todo', shiftDate(today, 2), '11:00', 'weekly'],
    ['Set intentions for the year', p[1], 'medium', 'todo', shiftDate(today, 45), '', 'yearly'],
    ['Send design feedback', p[0], 'high', 'todo', shiftDate(today, -1), '', 'daily']
  ];
  w.tasks = specs.map(([title, projectId, priority, status, due, time, cadence]) => makeTask({ title, projectId, priority, status, due, time, cadence, repeat: title.startsWith('Read'), tags: title.startsWith('Explore') ? ['design'] : [], description: title.startsWith('Explore') ? 'Explore three visual directions for the new homepage. Keep the experience clear, warm, and easy to navigate.' : '', subtasks: title.startsWith('Explore') ? [{ id: uid(), text: 'Collect references', done: true }, { id: uid(), text: 'Sketch three concepts', done: false }, { id: uid(), text: 'Choose a direction', done: false }] : [] }));
  [2, 3, 1, 4, 2, 5, 2].forEach((count, day) => {
    for (let i = 0; i < count; i++) w.tasks.push(makeTask({ title: ['Organize inspiration board', 'Review weekly goals', 'Update project notes', 'Clear the inbox', 'Morning planning'][i % 5], projectId: p[(i + day) % 3], status: 'completed', due: shiftDate(today, day - 6), completedAt: dateAt(shiftDate(today, day - 6)).toISOString(), completionNotes: 'Wrapped up and ready for the next step.', spent: 25 }));
  });
  w.sessions = [{ at: new Date().toISOString(), minutes: 25, taskId: '' }, { at: new Date().toISOString(), minutes: 50, taskId: '' }];
  return w;
}
