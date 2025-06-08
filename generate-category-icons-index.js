// Polyfill __dirname for ES modules
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync, writeFileSync } from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO = 'souravshrestha/paymint-assets';
const ICONS_DIR = join(__dirname, 'category-icons');
const OUTPUT_FILE = join(ICONS_DIR, 'index.json');

function fetchLatestCommitSHA(branch = 'main') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/commits/${branch}`,
      headers: { 'User-Agent': 'node.js' }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.sha);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function getCategoryIcons(commitSha) {
  const BASE_URL = `https://cdn.jsdelivr.net/gh/${REPO}@${commitSha}/category-icons`;
  const categories = readdirSync(ICONS_DIR).filter(f =>
    statSync(join(ICONS_DIR, f)).isDirectory()
  );

  const index = {};
  categories.forEach(category => {
    const files = readdirSync(join(ICONS_DIR, category))
      .filter(f => f.endsWith('.png'))
      .sort((a, b) => {
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.localeCompare(b);
      });
    index[category] = files.map(f => `${BASE_URL}/${category}/${f}`);
  });
  return index;
}

async function main() {
  const commitSha = await fetchLatestCommitSHA();
  const index = getCategoryIcons(commitSha);
  writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log('index.json generated at', OUTPUT_FILE, 'using commit', commitSha);
}

main();