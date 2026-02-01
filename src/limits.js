const config = require('./config');

/**
 * Checks yt-dlp metadata against size and duration limits.
 * @param {{ duration?: number; filesize?: number }} metadata - From yt-dlp --dump-json
 * @returns {{ ok: boolean; reason?: string }}
 */
function checkLimits(metadata) {
  const maxDuration = config.MAX_DURATION_SEC;
  const maxBytes = config.MAX_FILE_SIZE_BYTES;

  if (metadata.duration != null) {
    const duration = Number(metadata.duration);
    if (!Number.isFinite(duration) || duration > maxDuration) {
      return {
        ok: false,
        reason: `Відео занадто довге (ліміт ${maxDuration} сек).`,
      };
    }
  }

  if (metadata.filesize != null) {
    const size = Number(metadata.filesize);
    if (Number.isFinite(size) && size > maxBytes) {
      return {
        ok: false,
        reason: `Файл занадто великий (ліміт ${Math.round(maxBytes / 1024 / 1024)} MB).`,
      };
    }
  }

  return { ok: true };
}

/**
 * Check file size after download (when yt-dlp didn't provide filesize).
 * @param {number} fileSizeBytes
 * @returns {{ ok: boolean; reason?: string }}
 */
function checkFileSize(fileSizeBytes) {
  if (fileSizeBytes > config.MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      reason: `Файл занадто великий (ліміт ${Math.round(config.MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB).`,
    };
  }
  return { ok: true };
}

module.exports = { checkLimits, checkFileSize };
