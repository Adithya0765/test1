const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.join(root, 'public');

const EXCLUDED = new Set([
  '.git',
  '.vercel',
  'node_modules',
  '.venv',
  'public',
  'api',
  'tests',
  'Cloud Credit System',
  'Employee Portal',
  'Qaulium-studio Ide',
  'Qstudio landing Clone',
  '_qstudio_publish',
  '.env',
  '.env.example',
  '.env.local',
  '.env.vercel.example',
  'package-lock.json',
  'package.json',
  'vercel.json'
]);

function rmDirSafe(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  rmDirSafe(outDir);
  fs.mkdirSync(outDir, { recursive: true });

  for (const entry of fs.readdirSync(root)) {
    if (EXCLUDED.has(entry)) {
      continue;
    }

    copyRecursive(path.join(root, entry), path.join(outDir, entry));
  }

  console.log('Built root public directory for Vercel.');
}

main();
