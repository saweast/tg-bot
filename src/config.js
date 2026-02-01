require('dotenv').config();
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 50;
const MAX_DURATION_SEC = Number(process.env.MAX_DURATION_SEC) || 60;
const TEMP_DIR = process.env.TEMP_DIR || path.join(__dirname, 'temp');
/** Optional path to Netscape-format cookies file (e.g. for YouTube/Instagram). */
const COOKIES_FILE = process.env.COOKIES_FILE ? path.resolve(process.env.COOKIES_FILE) : null;

function getCookiesPath() {
  if (!COOKIES_FILE) return null;
  try {
    const stat = fs.statSync(COOKIES_FILE);
    return stat.isFile() && stat.size > 0 ? COOKIES_FILE : null;
  } catch {
    return null;
  }
}

module.exports = {
  BOT_TOKEN,
  MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_MB * 1024 * 1024,
  MAX_DURATION_SEC,
  TEMP_DIR,
  getCookiesPath,
};
