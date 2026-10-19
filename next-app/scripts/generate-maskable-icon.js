const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function generateMaskableIcon() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 512, height: 512 });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 512px; height: 512px; overflow: hidden; background: #0F172A; }
          .container {
            width: 512px;
            height: 512px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%);
            position: relative;
          }
          .glow {
            position: absolute;
            width: 320px;
            height: 320px;
            background: radial-gradient(circle, rgba(79, 70, 229, 0.35) 0%, rgba(99, 102, 241, 0) 70%);
            border-radius: 50%;
          }
          svg {
            position: relative;
            z-index: 10;
            width: 280px;
            height: 280px;
            filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45));
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="glow"></div>
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="vGrad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#818CF8" />
                <stop offset="50%" stop-color="#4F46E5" />
                <stop offset="100%" stop-color="#4338CA" />
              </linearGradient>
              <linearGradient id="bridgeGrad" x1="40" y1="120" x2="160" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#38BDF8" />
                <stop offset="100%" stop-color="#818CF8" />
              </linearGradient>
            </defs>
            <!-- Stylized 'V' -->
            <path d="M 35 45 L 85 160 C 92 175, 108 175, 115 160 L 165 45 C 168 38, 160 30, 150 33 L 132 38 C 127 39, 123 43, 121 48 L 100 115 L 79 48 C 77 43, 73 39, 68 38 L 50 33 C 40 30, 32 38, 35 45 Z" fill="url(#vGrad)" />
            <!-- Bridge Arch -->
            <path d="M 55 125 Q 100 85 145 125" stroke="url(#bridgeGrad)" stroke-width="12" stroke-linecap="round" fill="none" />
            <!-- Node circles -->
            <circle cx="55" cy="125" r="8" fill="#38BDF8" />
            <circle cx="100" cy="105" r="9" fill="#818CF8" />
            <circle cx="145" cy="125" r="8" fill="#A78BFA" />
          </svg>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  const outPath = path.resolve(__dirname, '../public/icon-maskable-512x512.png');
  await page.screenshot({ path: outPath, type: 'png' });
  console.log(`Generated maskable icon at: ${outPath}`);
  await browser.close();
}

generateMaskableIcon().catch(console.error);
