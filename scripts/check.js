'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
for (const folder of ['api', 'js', 'scripts']) {
  for (const file of fs.readdirSync(folder).filter(file => file.endsWith('.js'))) {
    execFileSync(process.execPath, ['--check', path.join(folder, file)], { stdio: 'inherit' });
  }
}
const html = fs.readFileSync('index.html', 'utf8');
for (const [, file] of html.matchAll(/(?:src|href)="((?:js|css)\/[^"?#]+)"/g)) {
  if (!fs.existsSync(file)) throw new Error('Missing asset: ' + file);
}
// Only public portfolio assets belong in the static deployment output.
fs.mkdirSync('dist', { recursive: true });
for (const entry of ['index.html', 'css', 'js', 'assets', 'pages']) {
  fs.cpSync(entry, path.join('dist', entry), { recursive: true });
}
console.log('Syntax and asset checks passed. Static portfolio built in dist/; Vercel deploys api/github.js separately.');
