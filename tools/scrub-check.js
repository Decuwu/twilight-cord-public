// Scans a folder for anything that must never be published: tokens, API keys, personal Windows paths, filled-in secrets in config.json.
// Usage: node tools/scrub-check.js <folder>      Exit code 1 = found something (do not publish).
const fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || '.');
const RULES = [
  [/github_pat_[A-Za-z0-9_]{20,}/, 'GitHub fine-grained token'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/sk-ant-[A-Za-z0-9_-]{10,}/, 'Anthropic API key'],
  [/\bsk-[A-Za-z0-9]{32,}/, 'API key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS key'],
  [/[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/, 'Discord token shape'],
  [/[A-Za-z]:\\Users\\(?!<|%|\$|\{|USERNAME|You\b|User\b|Public\b)[A-Za-z0-9_.-]+/i, 'personal Windows path'],
  [/DS-[W]/, 'personal PC name'],
];
const SKIP = new Set(['.git', 'node_modules', 'dist']);
const BAD_FILES = /(^|\/)(settings\.json|twilight-memory\.md|safe\.flag|reports\/.*|dev\/.*|_backup\/.*|_to_delete\/.*|.*\.(exe|zip|tgz|orig|bak))$/;
const problems = [];
const walk = d => {
  for (const n of fs.readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const f = path.join(d, n), rel = path.relative(root, f).split(path.sep).join('/');
    if (fs.statSync(f).isDirectory()) { walk(f); continue; }
    if (BAD_FILES.test(rel)) problems.push(`${rel}: file must not be published`);
    let text; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => { for (const [re, what] of RULES) if (re.test(line)) problems.push(`${rel}:${i + 1}: ${what}`); });
  }
};
walk(root);
// config.json must have empty secrets
try {
  const c = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
  for (const k of Object.keys(c)) if (/token|key|secret|password/i.test(k) && k !== 'debugKey' && c[k]) problems.push(`config.json: "${k}" is not empty`);
} catch (e) { problems.push('config.json: ' + e.message); }
if (problems.length) { console.log('SCRUB FAILED:\n' + problems.map(p => '  ' + p).join('\n')); process.exit(1); }
console.log('scrub ok: no tokens, keys, personal paths or private files found in ' + root);
