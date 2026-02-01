/**
 * Detects if URL is YouTube Shorts, Instagram Reels, or TikTok.
 * @param {string} url - Raw URL string
 * @returns {'youtube'|'instagram'|'tiktok'|null}
 */
function getPlatform(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  let normalized;
  try {
    if (!/^https?:\/\//i.test(trimmed)) normalized = `https://${trimmed}`;
    else normalized = trimmed;
    const u = new URL(normalized);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const pathname = u.pathname.toLowerCase();

    if (
      (host === 'youtube.com' || host === 'youtu.be') &&
      (pathname.startsWith('/shorts/') || pathname === '/' || pathname.startsWith('/watch'))
    ) {
      return 'youtube';
    }
    if (
      (host === 'instagram.com' || host === 'instagr.am') &&
      pathname.startsWith('/reel/')
    ) {
      return 'instagram';
    }
    if (
      host === 'tiktok.com' ||
      host === 'vm.tiktok.com' ||
      host === 'vt.tiktok.com'
    ) {
      if (pathname.includes('/video/') || pathname.length > 1) return 'tiktok';
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts exactly one URL from message text. Expects one link per message.
 * @param {string} text
 * @returns {string|null} Single URL or null if not exactly one URL
 */
function getSingleUrlFromMessage(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const urlLike = /https?:\/\/[^\s]+/gi;
  const matches = trimmed.match(urlLike) || [];
  const urls = [...new Set(matches.map((s) => s.replace(/[.,;:!?)]+$/, '')))];
  if (urls.length !== 1) return null;
  return urls[0];
}

module.exports = { getPlatform, getSingleUrlFromMessage };
