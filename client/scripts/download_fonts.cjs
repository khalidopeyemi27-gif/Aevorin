const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');

// Ensure directories exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontUrls = {
  'Inter-Variable.woff2': 'https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-variable-full-normal.woff2',
  'SourceSerif4-Regular.woff2': 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff2',
  'SourceSerif4-Bold.woff2': 'https://cdn.jsdelivr.net/npm/@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2',
  'EBGaramond-Regular.woff2': 'https://cdn.jsdelivr.net/npm/@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2',
  'CrimsonPro-Regular.woff2': 'https://cdn.jsdelivr.net/npm/@fontsource/crimson-pro/files/crimson-pro-latin-400-normal.woff2'
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  console.log('Downloading offline fonts from jsdelivr NPM mirror...');
  for (const [filename, url] of Object.entries(fontUrls)) {
    const dest = path.join(fontsDir, filename);
    try {
      console.log(`Downloading ${filename} from ${url}...`);
      await downloadFile(url, dest);
      console.log(`✓ Saved ${filename}`);
    } catch (err) {
      console.error(`✗ Failed to download ${filename}:`, err.message);
    }
  }
  console.log('Fonts downloading complete.');
}

run();
