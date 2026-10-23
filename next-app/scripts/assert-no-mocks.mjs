import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..', 'src');

const FORBIDDEN_PATTERNS = [
  { pattern: /\bMOCK_[A-Z0-9_]+\b/, name: 'MOCK_* constant or variable' },
  { pattern: /vbridge_demo_user/, name: 'vbridge_demo_user cookie bypass' },
  { pattern: /simulatedRole/, name: 'simulatedRole persona switcher' },
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs']);

let violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!EXTENSIONS.has(ext)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const { pattern, name } of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(path.resolve(__dirname, '..'), fullPath),
              line: i + 1,
              content: line.trim(),
              reason: name,
            });
          }
        }
      }
    }
  }
}

console.log(`[CI Gating] Scanning ${srcDir} for forbidden demo / mock tokens...`);
scanDirectory(srcDir);

if (violations.length > 0) {
  console.error(`\n❌ FAILED: Found ${violations.length} forbidden mock / demo token(s) in src/:`);
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} [${v.reason}] => ${v.content}`);
  }
  process.exit(1);
}

console.log('✔ PASSED: Zero MOCK_ constants, demo cookies, or persona switchers found in src/.');
process.exit(0);
