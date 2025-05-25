// server.js

const express = require('express');
const cors = require('cors');
process.env.PUPPETEER_CACHE_DIR = '/tmp/puppeteer-cache';
process.env.PUPPETEER_TMP_DIR = '/tmp/puppeteer-tmp';
const puppeteer = require('puppeteer-core');
const fs = require('fs/promises');
const path = require('path');

const app = express();

app.use(cors({ origin: '*' }));
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

app.get('/', (req, res) => {
  res.send('✅ Backend is live');
});

app.get('/login', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://substack.com/sign-in');
    await new Promise(resolve => setTimeout(resolve, 60000));
    await saveCookies(page);
    await browser.close();
    res.send('Login cookies saved.');
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Login failed: ' + err.message);
  }
});

app.post('/post-note', async (req, res) => {
  const { id, content, imageUrl } = req.body;
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
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
    await browser.close();
    res.json({ success: true });
  } catch (err) {
    console.error('Post error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
