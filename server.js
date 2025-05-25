// server.js with CORS middleware fix and root test endpoint
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');

const app = express();

// ✅ Ensure CORS is enabled
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

const COOKIES_PATH = path.resolve(__dirname, 'cookies.json');

async function loadCookies(page) {
  try {
    const cookies = JSON.parse(await fs.readFile(COOKIES_PATH, 'utf8'));
    await page.setCookie(...cookies);
    console.log('✅ Cookies loaded');
  } catch {
    console.log('⚠️ No saved cookies found');
  }
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log('✅ Cookies saved');
}

// 🔍 Root endpoint for testing
app.get('/', (req, res) => {
  res.send('✅ Backend is live');
});

// 🔍 Optional test endpoint to verify CORS headers
app.get('/test-cors', (req, res) => {
  res.send('🧪 CORS is working!');
});

app.get('/login', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://substack.com/sign-in');
    console.log('Please log in manually. The browser will close in 60 seconds.');
    await new Promise(resolve => setTimeout(resolve, 60000));
    await saveCookies(page);
    await browser.close();
    res.send('Login saved. You can now close this tab and use the scheduler.');
  } catch (err) {
    res.status(500).send('Login failed: ' + err.message);
  }
});

app.post('/post-note', async (req, res) => {
  const { id, content, imageUrl } = req.body;
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
