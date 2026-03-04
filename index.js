const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");

// ===== ENV VALIDATION =====
const REQUIRED_ENV = ["TELEGRAM_TOKEN", "GROQ_API_KEY", "HF_API_KEY"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ===== INIT =====
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

const sessions = new Map();
const SESSION_TIMEOUT = 5 * 60 * 1000;
const startTime = Date.now();

// ===== RENDER HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("StainAI is operational.");
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ===== UTILITIES =====
function formatUptime(ms) {
  const s = Math.floor((ms / 1000) % 60);
  const m = Math.floor((ms / (1000 * 60)) % 60);
  const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
  return `${h}h ${m}m ${s}s`;
}

// ===== GROQ PRIMARY ENGINE =====
async function queryGroq(message) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: message }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty Groq response");

    return content;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ===== HUGGING FACE BACKUP ENGINE =====
async function queryHuggingFace(message) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      { inputs: message },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const generated = response.data?.[0]?.generated_text;
    if (!generated) throw new Error("Empty HF response");

    return `_Response generated via secondary AI engine._\n\n${generated}`;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ===== FAILOVER CONTROLLER =====
async function generateAIResponse(message) {
  try {
    return await queryGroq(message);
  } catch (primaryError) {
    console.error("Groq failed:", primaryError.message);

    try {
      return await queryHuggingFace(message);
    } catch (secondaryError) {
      console.error("HuggingFace failed:", secondaryError.message);
      return "AI services are temporarily unavailable. Please try again shortly.";
    }
  }
}

// ===== START =====
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendPhoto(
    chatId,
    "https://i.ibb.co/cSQVfxp5/d3e716fb89edd137dc750918ccfe22e8.jpg"
  );

  const text = `
*StainAI – Integrated AI System*

Welcome to a professionally engineered AI platform.

Available Commands:
• /ai – Activate AI session
• /ping – System diagnostics
• /dev – Development team
• /support – Direct support

Built for reliability. Designed for intelligence.
`;

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
});

// ===== AI SESSION START =====
bot.onText(/\/ai/, (msg) => {
  sessions.set(msg.from.id, Date.now());

  bot.sendMessage(
    msg.chat.id,
    "_AI session activated._\nSession expires after 5 minutes of inactivity.\nUse /cancelsession to close manually.",
    { parse_mode: "Markdown" }
  );
});

// ===== CANCEL SESSION =====
bot.onText(/\/cancelsession/, (msg) => {
  if (sessions.has(msg.from.id)) {
    sessions.delete(msg.from.id);
    bot.sendMessage(msg.chat.id, "AI session closed successfully.");
  } else {
    bot.sendMessage(msg.chat.id, "No active AI session found.");
  }
});

// ===== SUPPORT =====
bot.onText(/\/support/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Reach out to StainAI directly via Telegram: @heisevanss"
  );
});

// ===== DEV =====
bot.onText(/\/dev/, async (msg) => {
  await bot.sendPhoto(
    msg.chat.id,
    "https://i.postimg.cc/VNW476yJ/4d59188bad5eb3f3043447cbb97076c8.jpg"
  );

  const text = `
*Contact the Owner & Development Team of StainAI*

🤖 *Main Developer*  
Ken  
https://linktr.ee/iamevanss  

🧠 *Co-Developer*  
Ted  
https://wa.me/2349033047066
`;

  bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
});

// ===== PING =====
bot.onText(/\/ping/, async (msg) => {
  const uptime = formatUptime(Date.now() - startTime);
  const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  const text = `
*StainAI System Diagnostics*

⚡ Uptime: ${uptime}
⚡ Memory Usage: ${memory} MB

_"Precision. Reliability. Intelligence."_
_"Systems built with discipline endure."_
`;

  await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });

  await bot.sendPhoto(
    msg.chat.id,
    "https://i.postimg.cc/zBSmF57x/81906eeacfe1812228578eaa0689d050.jpg"
  );
});

// ===== AI MESSAGE HANDLER =====
bot.on("message", async (msg) => {
  const userId = msg.from.id;
  if (!sessions.has(userId)) return;
  if (!msg.text || msg.text.startsWith("/")) return;

  const lastActive = sessions.get(userId);

  if (Date.now() - lastActive > SESSION_TIMEOUT) {
    sessions.delete(userId);
    bot.sendMessage(
      msg.chat.id,
      "Session expired due to inactivity. Please use /ai to start again."
    );
    return;
  }

  sessions.set(userId, Date.now());

  try {
    const response = await generateAIResponse(msg.text);
    bot.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(err.message);
    bot.sendMessage(msg.chat.id, "AI request failed.");
  }
});

// ===== GLOBAL ERROR HANDLING =====
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});