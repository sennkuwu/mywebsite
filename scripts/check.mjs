import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync('dist/index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate IDs');
assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1, 'Exactly one h1 required');
let checked = 0;
for (const [, attribute, value] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
  if (/^(https?:|mailto:|data:)/.test(value)) continue;
  if (value.startsWith('#')) {
    assert(ids.includes(value.slice(1)), `Missing anchor: ${value}`);
  } else {
    assert(value.startsWith('/mywebsite/'), `Unexpected base path: ${value}`);
    assert(existsSync(`dist/${value.slice('/mywebsite/'.length)}`), `Missing ${attribute}: ${value}`);
  }
  checked++;
}
for (const required of ['rel="canonical"', 'property="og:url"', 'name="description"', 'name="twitter:card"', 'lang="zh-CN"', 'role="status"']) {
  assert(html.includes(required), `Missing metadata or accessibility attribute: ${required}`);
}
const schema = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(schema, 'Missing JSON-LD');
JSON.parse(schema[1]);
for (const file of ['404.html', 'robots.txt', 'sitemap.xml']) assert(existsSync(`dist/${file}`), `Missing ${file}`);
assert(!html.includes('data-lucide'), 'Unrendered legacy icons');
console.log(`Passed: ${checked} local references, unique IDs, heading, metadata, JSON-LD, and static files.`);
