const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const execFileAsync = promisify(execFile);

const YT_DLP = process.env.YT_DLP_PATH || 'yt-dlp';

const BASE_ARGS = [
  '--no-warnings',
  '--no-check-certificates',
  '--prefer-free-formats',
  '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; rv:131.0) Gecko/20100101 Firefox/131.0',
  // YouTube: android client often avoids 403 on fragment CDN; fewer concurrent fragments = less likely blocked
  '--extractor-args', 'youtube:player_client=android,web',
  '--concurrent-fragments', '1',
];

function getErrorOutput(err) {
  const out = [err.stderr, err.stdout, err.message].filter(Boolean).join('\n');
  return out || String(err);
}

/** Returns ['--cookies', path] if cookies file exists, else []. */
function getCookiesArgs() {
  const cookiesPath = config.getCookiesPath();
  return cookiesPath ? ['--cookies', cookiesPath] : [];
}

/**
 * Get video metadata (duration, filesize) via yt-dlp --dump-json.
 * @param {string} url
 * @returns {Promise<{ duration?: number; filesize?: number }>}
 */
async function getMetadata(url) {
  try {
    const { stdout } = await execFileAsync(YT_DLP, [
      ...BASE_ARGS,
      ...getCookiesArgs(),
      '--dump-json',
      '--no-download',
      url,
    ], { maxBuffer: 8 * 1024 * 1024 });
    const data = JSON.parse(stdout);
    return {
      duration: data.duration ?? undefined,
      filesize: data.filesize ?? data.filesize_approx ?? undefined,
    };
  } catch (err) {
    const msg = getErrorOutput(err);
    console.error('[yt-dlp getMetadata]', url, msg);
    if (/Private|unavailable|removed|blocked|region|geo|login|sign in/i.test(msg)) {
      throw new Error('Відео недоступне (приватне, видалене або обмежене). Спробуйте інше посилання.');
    }
    throw new Error('Не вдалося завантажити відео. Перевірте посилання та доступність.');
  }
}

/**
 * Download video to temp dir. Returns path to file.
 * @param {string} url
 * @returns {Promise<string>} Path to downloaded file
 */
async function download(url) {
  await fs.promises.mkdir(config.TEMP_DIR, { recursive: true });
  const subDir = path.join(config.TEMP_DIR, `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await fs.promises.mkdir(subDir, { recursive: true });
  const outTemplate = path.join(subDir, '%(id)s.%(ext)s');

  try {
    await execFileAsync(YT_DLP, [
      ...BASE_ARGS,
      ...getCookiesArgs(),
      '-f', 'best[ext=mp4]/best',
      '-o', outTemplate,
      '--no-playlist',
      url,
    ], { maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    const msg = getErrorOutput(err);
    console.error('[yt-dlp download]', url, msg);
    if (/Private|unavailable|removed|blocked|region|geo|login|sign in/i.test(msg)) {
      throw new Error('Відео недоступне (приватне, видалене або обмежене). Спробуйте інше посилання.');
    }
    throw new Error('Не вдалося завантажити відео. Перевірте посилання та доступність.');
  }

  const files = await fs.promises.readdir(subDir);
  const videoFile = files.find((f) => /\.(mp4|webm|mkv)$/i.test(f));
  if (!videoFile) throw new Error('Не вдалося завантажити відео. Перевірте посилання та доступність.');
  return path.join(subDir, videoFile);
}

/**
 * Delete file at path. Ignore errors.
 * @param {string} filePath
 */
async function removeFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // ignore
  }
}

module.exports = { getMetadata, download, removeFile };
