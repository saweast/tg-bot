require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getPlatform, getSingleUrlFromMessage } = require('./url-validator');
const { checkLimits, checkFileSize } = require('./limits');
const downloader = require('./downloader');
const { runInQueue } = require('./queue');

const BOT_TOKEN = config.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN in .env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const START_MESSAGE = [
  'Привіт! Я завантажую відео з:',
  '• YouTube Shorts',
  '• Instagram Reels',
  '• TikTok',
  '',
  'Ліміти: 50 MB, до 60 сек.',
  'Надішліть одне посилання в одному повідомленні — я завантажу відео і надішлю сюди.',
].join('\n');

const ONE_LINK_MESSAGE =
  'Надішліть одне посилання в одному повідомленні. Підтримуються: YouTube Shorts, Instagram Reels, TikTok.';

const UNSUPPORTED_MESSAGE =
  'Непідтримуване посилання. Підтримуються: YouTube Shorts, Instagram Reels, TikTok.';

bot.onText(/^\/start$/i, (msg) => {
  bot.sendMessage(msg.chat.id, START_MESSAGE);
});

const replyOpts = (msg) => ({ reply_to_message_id: msg.message_id });

const isGroupChat = (msg) =>
  msg.chat.type === 'group' || msg.chat.type === 'supergroup';

bot.on('message', (msg) => {
  const text = msg.text;
  if (!text || /^\/start$/i.test(text.trim())) return;

  const inGroup = isGroupChat(msg);

  const url = getSingleUrlFromMessage(text);
  if (!url) {
    if (!inGroup) {
      bot.sendMessage(msg.chat.id, ONE_LINK_MESSAGE );
    }
    return;
  }

  const platform = getPlatform(url);
  if (!platform ) {
    if (!inGroup) {
      bot.sendMessage(msg.chat.id, UNSUPPORTED_MESSAGE, replyOpts(msg));
    }
    return;
  }

  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, 'upload_video').catch(() => {});

  const runTask = (statusMsgId) => {
    const deleteStatus = async () => {
      if (statusMsgId) {
        await bot.deleteMessage(chatId, statusMsgId).catch(() => {});
      }
    };

    runInQueue(async () => {
      let filePath = null;
      try {
        const metadata = await downloader.getMetadata(url);
        const limitsResult = checkLimits(metadata);
        if (!limitsResult.ok) {
          if (!inGroup) {
            await deleteStatus();
            await bot.sendMessage(chatId, limitsResult.reason, replyOpts(msg));
          }
          return;
        }

        filePath = await downloader.download(url);
        const stat = await fs.promises.stat(filePath);
        const sizeCheck = checkFileSize(stat.size);
        if (!sizeCheck.ok) {
          await downloader.removeFile(filePath);
          if (!inGroup) {
            await deleteStatus();
            await bot.sendMessage(chatId, sizeCheck.reason, replyOpts(msg));
          }
          return;
        }

        await deleteStatus();
        await bot.sendVideo(chatId, filePath, replyOpts(msg));
      } catch (err) {
        if (!inGroup) {
          await deleteStatus();
          const message = err.message && err.message.startsWith('Не вдалося')
            ? err.message
            : 'Не вдалося завантажити відео. Перевірте посилання та доступність.';
          await bot.sendMessage(chatId, message, replyOpts(msg)).catch(() => {});
        }
      } finally {
        if (filePath) {
          await downloader.removeFile(filePath);
          const dir = path.dirname(filePath);
          try {
            const remaining = await fs.promises.readdir(dir);
            for (const f of remaining) await fs.promises.unlink(path.join(dir, f));
            await fs.promises.rmdir(dir);
          } catch {
            // ignore
          }
        }
      }
    });
  };

  if (inGroup) {
    runTask(null);
  } else {
    bot
      .sendMessage(chatId, 'Обробляю…', replyOpts(msg))
      .then((sent) => runTask(sent.message_id))
      .catch(() => runTask(null));
  }
});
