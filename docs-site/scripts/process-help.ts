/**
 * process-help.ts
 *
 * Processes RailSim II help documentation from the vendor submodule:
 * - Converts Shift_JIS → UTF-8
 * - Modernizes HTML (HTML5 doctype, charset meta)
 * - Injects an "unofficial mirror" banner
 * - Adds modern CSS overrides
 * - Copies static assets (images, CSS)
 *
 * Original help documents: Copyright (C) 2003-2009 インターネット停留所
 * Licensed under LGPL v2.1 — see vendor/railsim2/Distribution/jp/RailSim2/COPYING.txt
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { resolve, extname } from "node:path";
import iconv from "iconv-lite";

const HELP_SRC = resolve(
  import.meta.dirname,
  "../../vendor/railsim2/Distribution/jp/RailSim2/Help"
);
const PAGES_OUT = resolve(import.meta.dirname, "../pages");

const BANNER_CSS = `
.rs2-unofficial-banner {
  position: sticky;
  top: 0;
  z-index: 9999;
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 10px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  border-bottom: 3px solid #ff8000;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.rs2-unofficial-banner .rs2-badge {
  background: #ff8000;
  color: #fff;
  font-weight: bold;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
  text-decoration: none;
  flex-shrink: 0;
}
.rs2-unofficial-banner a {
  color: #64b5f6;
  text-decoration: underline;
}
.rs2-unofficial-banner a:hover {
  color: #90caf9;
  background: transparent;
}
.rs2-unofficial-banner .rs2-banner-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
}
`.trim();

const BANNER_HTML = `
<div class="rs2-unofficial-banner">
  <span class="rs2-badge">UNOFFICIAL</span>
  <span>
    このページは RailSim II ヘルプドキュメントの非公式ミラーです。
  </span>
  <span class="rs2-banner-links">
    <a href="https://github.com/aizentranza/railsim2" target="_blank" rel="noopener">原本 (GitHub)</a>
    <a href="https://github.com/lollipop-onl/vscode-railsim-grammer" target="_blank" rel="noopener">VS Code 拡張</a>
  </span>
</div>
`.trim();

function readShiftJIS(filePath: string): string {
  const buf = readFileSync(filePath);
  return iconv.decode(buf, "shift_jis");
}

function processHtml(html: string): string {
  // 1. Replace doctype with HTML5
  html = html.replace(
    /<!DOCTYPE[^>]*>/i,
    "<!DOCTYPE html>"
  );

  // 2. Update charset meta to UTF-8
  html = html.replace(
    /<meta\s+http-equiv="Content-Type"\s+content="text\/html;\s*charset=shift_jis"\s*>/i,
    '<meta charset="UTF-8">'
  );

  // 3. Inject banner CSS into <head>
  html = html.replace(
    /<\/head>/i,
    `<style>${BANNER_CSS}</style>\n</head>`
  );

  // 4. Inject banner HTML after <body>
  html = html.replace(
    /<body>/i,
    `<body>\n${BANNER_HTML}`
  );

  // 5. Fix malformed HTML entities (e.g. &nbsp without semicolon)
  html = html.replace(/&(nbsp|amp|lt|gt|quot)([^;])/g, "&$1;$2");

  // 6. Fix links to ../index.html (parent distribution page — not part of Help)
  html = html.replace(
    /href="\.\.\/index\.html"/g,
    'href="https://github.com/aizentranza/railsim2/tree/master/Distribution/jp/RailSim2" target="_blank" rel="noopener"'
  );

  return html;
}

function main() {
  mkdirSync(PAGES_OUT, { recursive: true });

  const files = readdirSync(HELP_SRC);
  let htmlCount = 0;
  let assetCount = 0;

  for (const file of files) {
    const srcPath = resolve(HELP_SRC, file);
    const destPath = resolve(PAGES_OUT, file);
    const ext = extname(file).toLowerCase();

    if (ext === ".html") {
      const raw = readShiftJIS(srcPath);
      const processed = processHtml(raw);
      writeFileSync(destPath, processed, "utf-8");
      htmlCount++;
    } else if ([".css", ".png", ".jpg", ".gif", ".ico"].includes(ext)) {
      // For CSS, also convert encoding
      if (ext === ".css") {
        const raw = readShiftJIS(srcPath);
        writeFileSync(destPath, raw, "utf-8");
      } else {
        copyFileSync(srcPath, destPath);
      }
      assetCount++;
    }
  }

  console.log(
    `Processed ${htmlCount} HTML files and ${assetCount} assets → ${PAGES_OUT}`
  );
}

main();
