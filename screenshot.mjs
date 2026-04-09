import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, 'temporary screenshots');

// Ensure directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Get next screenshot number
function getNextScreenshotNumber() {
  const files = fs.readdirSync(screenshotsDir);
  const screenshotFiles = files.filter((f) => f.startsWith('screenshot-') && f.endsWith('.png'));

  if (screenshotFiles.length === 0) {
    return 1;
  }

  const numbers = screenshotFiles.map((f) => {
    const match = f.match(/^screenshot-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });

  return Math.max(...numbers) + 1;
}

// Main function
async function takeScreenshot() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('✗ Usage: node screenshot.mjs <url> [label]');
    console.error('✗ Example: node screenshot.mjs http://localhost:3000');
    console.error('✗ Example with label: node screenshot.mjs http://localhost:3000 my-feature');
    process.exit(1);
  }

  const url = args[0];
  const label = args[1] || '';

  const screenshotNumber = getNextScreenshotNumber();
  const filename = label ? `screenshot-${screenshotNumber}-${label}.png` : `screenshot-${screenshotNumber}.png`;
  const filepath = path.join(screenshotsDir, filename);

  console.log(`📸 Capturing screenshot from ${url}...`);

  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`✓ Screenshot saved to ./temporary screenshots/${filename}`);
  } catch (error) {
    console.error(`✗ Error taking screenshot: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
