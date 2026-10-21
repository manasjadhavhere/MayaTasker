import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await Promise.all(['index.html', 'favicon.svg'].map(file => copyFile(file, `dist/${file}`)));
await cp('src', 'dist/src', { recursive: true });
console.log('Maya Tasker built to dist/. No runtime dependencies or environment variables required.');
