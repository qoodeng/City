import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const svgPath = path.resolve(__dirname, "../src/app/icon.svg");
const outPath = path.resolve(__dirname, "../build/icon.png");

const svg = fs.readFileSync(svgPath, "utf-8");

// Apple icon guidelines: artwork should sit within ~80% of the canvas,
// leaving padding so the dock running-indicator dot isn't covered.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
  });
  await page.setContent(
    `<html><body style="margin:0;padding:0;background:transparent;display:flex;align-items:center;justify-content:center;width:1024px;height:1024px">
      <div style="width:820px;height:820px">${svg}</div>
    </body></html>`
  );
  await page.screenshot({ path: outPath, omitBackground: true });
  await browser.close();
  console.log("Icon written to", outPath);
}

main();
