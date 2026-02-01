const PQueue = require('p-queue').default;

const queue = new PQueue({ concurrency: 2 });

/**
 * Run an async function in the download queue (max 2 concurrent).
 * @param {() => Promise<void>} fn
 * @returns {Promise<void>}
 */
function runInQueue(fn) {
  return queue.add(fn);
}

module.exports = { runInQueue };
