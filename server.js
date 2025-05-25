// server.js

// ✅ Set Puppeteer cache path to persist across build/runtime
process.env.PUPPETEER_CACHE_DIR = '/opt/render/project/src/.puppeteer_cache';

const fsExtra = require('fs-extra');
// Ensure the persistent cache directory exists
fsExtra.ensureDirSync('/opt/render/project/src/.puppeteer_cache');
fsExtra.ensureDirSync('/tmp/puppeteer-tmp');
fsExtra.ensureDirSync('/tmp/puppeteer-tmp/puppeteer_dev_chr');

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');

const app = express();

// ✅ Proper CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '1mb' }));

const COOKIES_PATH = process.env.RENDER
  ? '/etc/secrets/cookies.json'
  : path.resolve(__dirname, 'cookies.json');

async function loadCookies(page) {
  try {
    const cookies = JSON.parse(await fs.readFile(COOKIES_PATH, 'utf8'));
    await page.setCookie(...cookies);
    console.log('✅ Cookies loaded');
  } catch (err) {
    console.error('⚠️ Error loading cookies:', err.message);
    throw err;
  }
}

async function saveCookies(page) {
  try {
    const cookies = await page.cookies();
    await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log('✅ Cookies saved');
  } catch (err) {
    console.error('⚠️ Error saving cookies:', err.message);
  }
}

// ✅ Improved browser launch configuration for Render
async function launchBrowser() {
  const chromePath = '/opt/render/project/src/.puppeteer_cache/chrome/linux-136.0.7103.94/chrome-linux64/chrome';
  
  return await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
}

app.get('/', (req, res) => {
  res.send('✅ Backend is live');
});

app.get('/login', async (req, res) => {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://substack.com/sign-in');
    await new Promise(resolve => setTimeout(resolve, 60000));
    await saveCookies(page);
    res.send('Login cookies saved.');
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Login failed: ' + err.message);
  } finally {
    if (browser) await browser.close();
  }
});

app.post('/post-note', async (req, res) => {
  const { id, content, imageUrl } = req.body;
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.goto('https://substack.com');
    await loadCookies(page);
    await page.goto('https://substack.com/notes/post');
    await page.waitForSelector('[data-testid="note-composer"]');
    await page.type('[data-testid="note-composer"]', content);
    if (imageUrl) {
      await page.type('[data-testid="note-composer"]', '\n' + imageUrl);
    }
    await page.click('[data-testid="post-note-button"]');
    await page.waitForSelector('[data-testid="note-posted"]', { timeout: 5000 });
    res.json({ success: true });
  } catch (err) {
    console.error('Post error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
