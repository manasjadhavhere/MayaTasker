import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, shiftDate, startOfWeek, nextOccurrence, makeTask, blankWorkspace, completeTask, validateWorkspace, safeUrl, validDate, demoWorkspace } from '../src/model.js';

test('date arithmetic stays on local calendar dates across year and DST boundaries', () => {
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDate('2026-03-08', 1), '2026-03-09');
  assert.equal(startOfWeek('2026-10-25'), '2026-10-19');
  assert.equal(localDate(new Date(2026, 9, 21, 0, 1)), '2026-10-21');
});
test('monthly repeats clamp to month end and retain the original day', () => {
  const task = makeTask({ due: '2026-01-31', cadence: 'monthly' });
  assert.equal(nextOccurrence(task), '2026-02-28');
  assert.equal(nextOccurrence({ ...task, due: '2026-02-28', anchorDay: 31 }), '2026-03-31');
  assert.equal(nextOccurrence({ ...task, due: '2028-01-31' }), '2028-02-29');
});
test('weekly and yearly repeats handle leap years', () => {
  assert.equal(nextOccurrence({ due: '2026-12-28', cadence: 'weekly' }), '2027-01-04');
  assert.equal(nextOccurrence({ due: '2028-02-29', cadence: 'yearly' }), '2029-02-28');
  assert.equal(nextOccurrence({ due: '2031-02-28', cadence: 'yearly', anchorDay: 29 }), '2032-02-29');
});
test('completion preserves evidence and creates a clean independent next occurrence', () => {
  const w = blankWorkspace('Test');
  w.tasks.push(makeTask({ title: 'Monthly report', cadence: 'monthly', due: '2026-01-31', repeat: true, links: ['https://example.com/brief'], spent: 25, subtasks: [{ id: 's1', text: 'Review', done: false }] }));
  const first = w.tasks[0];
  const next = completeTask(w, first.id, 'Published the report', ['https://example.com/report']);
  assert.equal(w.tasks.length, 2);
  assert.equal(first.status, 'completed');
  assert.equal(first.subtasks[0].done, true);
  assert.equal(first.completionNotes, 'Published the report');
  assert.deepEqual(first.completionLinks, ['https://example.com/report']);
  assert.equal(next.status, 'todo');
  assert.equal(next.due, '2026-02-28');
  assert.equal(next.subtasks[0].done, false);
  assert.equal(next.spent, 0);
  assert.equal(next.completionNotes, '');
  assert.notEqual(next.subtasks[0].id, first.subtasks[0].id);
  assert.deepEqual(next.links, first.links);
  assert.equal(completeTask(w, first.id), null);
  first.status = 'todo';
  assert.equal(completeTask(w, first.id), null, 'recompleting a reopened occurrence must not duplicate the next occurrence');
  assert.equal(w.tasks.length, 2);
  assert.equal(completeTask(w, next.id).due, '2026-03-31');
});
test('normal tasks complete without creating extra tasks; unknown IDs are safe', () => {
  const w = blankWorkspace('Test'); w.tasks.push(makeTask({ title: 'One-off', repeat: false }));
  assert.equal(completeTask(w, w.tasks[0].id), null);
  assert.equal(w.tasks.length, 1);
  assert.equal(completeTask(w, 'missing'), null);
});
test('backup roundtrip keeps task evidence, projects, dates, sessions, and settings', () => {
  const w = demoWorkspace('Test'); w.settings.theme = 'dark';
  const restored = validateWorkspace(JSON.parse(JSON.stringify(w)));
  assert.equal(restored.name, w.name);
  assert.equal(restored.tasks.length, w.tasks.length);
  assert.equal(restored.projects.length, w.projects.length);
  assert.equal(restored.sessions.length, w.sessions.length);
  assert.equal(restored.settings.theme, 'dark');
  assert.deepEqual(restored.tasks.map(t => t.id), w.tasks.map(t => t.id));
  assert.notEqual(restored.id, w.id, 'import must create a separate workspace');
});
test('backup validation rejects malformed data and duplicate IDs', () => {
  assert.throws(() => validateWorkspace({ name: 'Test', tasks: 'bad', projects: [] }));
  assert.throws(() => validateWorkspace({ name: '', tasks: [], projects: [] }));
  const w = blankWorkspace('Test'); const t = makeTask({ title: 'A task' }); w.tasks = [t, t];
  assert.throws(() => validateWorkspace(w), /duplicate/);
  w.tasks = [makeTask({ title: 'Malformed ID', id: '" onclick="alert(1)' })];
  assert.throws(() => validateWorkspace(w), /Invalid task/);
});
test('backup validation sanitizes links, settings, dates, and references', () => {
  const w = blankWorkspace('Test');
  w.tasks.push(makeTask({ title: 'Unsafe input', links: ['javascript:alert(1)', 'https://example.com'], projectId: 'missing', priority: 'fake', due: '2026-02-31', completedAt: 'invalid' }));
  w.settings.focusMinutes = 9999;
  const restored = validateWorkspace(w);
  assert.deepEqual(restored.tasks[0].links, ['https://example.com']);
  assert.equal(restored.tasks[0].projectId, '');
  assert.equal(restored.tasks[0].priority, 'medium');
  assert.equal(restored.tasks[0].due, '');
  assert.equal(restored.settings.focusMinutes, 120);
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('data:text/html,test'), null);
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2028-02-29'), true);
});
test('workspaces and subtasks are isolated', () => {
  const a = blankWorkspace('A'), b = blankWorkspace('B');
  a.tasks.push(makeTask({ title: 'Only A' })); a.settings.theme = 'dark';
  assert.equal(b.tasks.length, 0);
  assert.equal(b.settings.theme, 'light');
  assert.notEqual(a.id, b.id);
});
