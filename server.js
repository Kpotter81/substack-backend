const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

app.post('/post-note', async (req, res) => {
  const { content, imageUrl } = req.body;
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://substack.com/sign-in');
    console.log('Login manually, then press ENTER in terminal.');
    await new Promise(resolve => process.stdin.once('data', resolve));
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
