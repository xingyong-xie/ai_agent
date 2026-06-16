import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { join } from 'path';

const excalidrawPath = '/Users/xiexingyong/ai_agent/Reading/源泉-人物关系图.excalidraw';
const outputPath = '/Users/xiexingyong/ai_agent/Reading/源泉-人物关系图.png';
const data = JSON.parse(readFileSync(excalidrawPath, 'utf-8'));
const elementsJson = JSON.stringify(data.elements);
const appStateJson = JSON.stringify(data.appState);

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=1270, height=730"></head>
<body style="margin:0;background:#ffffff;display:flex;justify-content:center;align-items:center;min-height:100vh;">
<div id="root" style="width:1270px;height:730px;"></div>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.js"></script>
<script>
const elements = ${elementsJson};
const appState = ${appStateJson};
const ExcalidrawLib = window.ExcalidrawLib;
ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ExcalidrawLib.Excalidraw, {
    initialData: { elements, appState: { ...appState, viewBackgroundColor: '#ffffff' } },
    viewModeEnabled: true,
    zenModeEnabled: true,
    theme: 'light',
  })
);
</script>
</body>
</html>`;

const htmlPath = '/tmp/render-excalidraw.html';
import { writeFileSync } from 'fs';
writeFileSync(htmlPath, html);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1270, height: 730 });

// Load the page with the diagram
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });

// Wait for the excalidraw canvas to render
await page.waitForTimeout(3000);

// Take screenshot
await page.screenshot({ path: outputPath, fullPage: false });
await browser.close();

console.log('✅ PNG saved to:', outputPath);