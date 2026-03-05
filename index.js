const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const app = express();
app.get("/", (req, res) => res.send("StainAI Running"));
app.listen(process.env.PORT || 3000);

const SESSION_TIMEOUT = Number(process.env.SESSION_TIMEOUT) || 300000;
let sessions = {};

const startImage = "https://i.ibb.co/cSQVfxp5/d3e716fb89edd137dc750918ccfe22e8.jpg";
const pingImage = "https://i.postimg.cc/zBSmF57x/81906eeacfe1812228578eaa0689d050.jpg";
const devImage = "https://i.postimg.cc/VNW476yJ/4d59188bad5eb3f3043447cbb97076c8.jpg";

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const caption = `🤖 *Welcome to StainAI.*

An integrated artificial intelligence assistant designed to help you generate ideas, answer questions, and solve problems efficiently.

Use the buttons below to navigate through available commands.

⚡ Intelligent assistance at your fingertips.`;

  bot.sendPhoto(chatId, startImage, {
    caption,
    parse_mode: "Markdown",
    reply_markup: {
      keyboard: [["/ai", "/ping"], ["/dev", "/support"]],
      resize_keyboard: true,
    },
  });
});

bot.onText(/\/ping/, (msg) => {
  const chatId = msg.chat.id;
  const caption = `📡 *StainAI System Status*

✅ Bot Status: Online  
⚡ Response Time: Fast  
🧠 AI Systems: Operational  

"Progress begins with curiosity and discipline."`;

  bot.sendPhoto(chatId, pingImage, { caption, parse_mode: "Markdown" });
});

bot.onText(/\/dev/, (msg) => {
  const chatId = msg.chat.id;
  const caption = `👨‍💻 *StainAI Development Team*

Main Developer  
Ken  
https://linktr.ee/iamevanss  

Co-Developer  
Ted  
https://wa.me/2349033047066`;

  bot.sendPhoto(chatId, devImage, { caption, parse_mode: "Markdown" });
});

bot.onText(/\/support/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `🛠 *Support*

For assistance or inquiries regarding StainAI, please contact:

@heisevanss`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/ai/, (msg) => {
  const chatId = msg.chat.id;
  sessions[chatId] = { active: true, last: Date.now() };

  bot.sendMessage(
    chatId,
    `🧠 *AI Session Activated.*

You can now send messages and receive intelligent responses.

This session will automatically close after 5 minutes of inactivity.

Use /cancelsession to close it manually.`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/cancelsession/, (msg) => {
  const chatId = msg.chat.id;
  delete sessions[chatId];

  bot.sendMessage(
    chatId,
    `⚠️ *AI Session Closed.*

You may start a new session anytime using /ai`,
    { parse_mode: "Markdown" }
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!sessions[chatId]) return;
  if (text.startsWith("/")) return;

  if (Date.now() - sessions[chatId].last > SESSION_TIMEOUT) {
    delete sessions[chatId];
    bot.sendMessage(chatId, "⚠️ Session expired. Start again with /ai", {
      parse_mode: "Markdown",
    });
    return;
  }

  sessions[chatId].last = Date.now();
  let reply = null;

  try {
    // Groq
    const groq = await axios.post(
      "https://api.groq.com/v1/completions",
      {
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: text }],
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_KEY}` } }
    );
    reply = groq.data.choices[0].message.content;
  } catch (e1) {
    try {
      // Google Gemini
      const gemini = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`,
        { contents: [{ parts: [{ text }] }] }
      );
      reply = gemini.data.candidates[0].content.parts[0].text;
    } catch (e2) {
      try {
        // TogetherAI
        const together = await axios.post(
          "https://api.together.xyz/v1/chat/completions",
          { model: "mistralai/Mistral-7B-Instruct-v0.1", messages: [{ role: "user", content: text }] },
          { headers: { Authorization: `Bearer ${process.env.TOGETHER_KEY}` } }
        );
        reply = together.data.choices[0].message.content;
      } catch (e3) {
        try {
          // HuggingFace
          const hf = await axios.post(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
            { inputs: text },
            { headers: { Authorization: `Bearer ${process.env.HF_KEY}` } }
          );
          reply = hf.data?.generated_text || "AI services are temporarily unavailable. Please try again shortly.";
        } catch (e4) {
          reply = "AI services are temporarily unavailable. Please try again shortly.";
        }
      }
    }
  }

  bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });
});
Main Developer  
Ken  
https://linktr.ee/iamevanss  

Co-Developer  
Ted  
https://wa.me/2349033047066`

bot.sendPhoto(chatId,devImage,{
caption,
parse_mode:"Markdown"
})

})

bot.onText(/\/support/, (msg)=>{

const chatId = msg.chat.id

bot.sendMessage(chatId,
`🛠 *Support*

For assistance or inquiries regarding StainAI, please contact:

@heisevanss`,
{parse_mode:"Markdown"})

})

bot.onText(/\/ai/, (msg)=>{

const chatId = msg.chat.id

sessions[chatId]={
active:true,
last:Date.now()
}

bot.sendMessage(chatId,
`🧠 *AI Session Activated.*

You can now send messages and receive intelligent responses.

This session will automatically close after 5 minutes of inactivity.

Use /cancelsession to close it manually.`,
{parse_mode:"Markdown"})

})

bot.onText(/\/cancelsession/, (msg)=>{

const chatId = msg.chat.id

delete sessions[chatId]

bot.sendMessage(chatId,
`⚠️ *AI Session Closed.*

You may start a new session anytime using /ai`,
{parse_mode:"Markdown"})

})

bot.on("message", async (msg)=>{

const chatId = msg.chat.id
const text = msg.text

if(!sessions[chatId]) return
if(text.startsWith("/")) return

if(Date.now()-sessions[chatId].last > SESSION_TIMEOUT){

delete sessions[chatId]

bot.sendMessage(chatId,"⚠️ Session expired. Start again with /ai")
return
}

sessions[chatId].last = Date.now()

let reply = null

try{

const groq = await axios.post(
"https://api.groq.com/openai/v1/chat/completions",
{
model:"llama3-70b-8192",
messages:[{role:"user",content:text}]
},
{
headers:{
Authorization:`Bearer ${process.env.GROQ_KEY}`
}
})

reply = groq.data.choices[0].message.content

}catch(e){

try{

const gemini = await axios.post(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`,
{
contents:[{parts:[{text:text}]}]
})

reply = gemini.data.candidates[0].content.parts[0].text

}catch(e){

try{

const together = await axios.post(
"https://api.together.xyz/v1/completions",
{
model:"mistralai/Mistral-7B-Instruct-v0.1",
prompt:text,
max_tokens:500
},
{
headers:{
Authorization:`Bearer ${process.env.TOGETHER_KEY}`
}
})

reply = together.data.choices[0].text

}catch(e){

try{

const hf = await axios.post(
"https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
{text:text},
{
headers:{
Authorization:`Bearer ${process.env.HF_KEY}`
}
})

reply = JSON.stringify(hf.data)

}catch(e){

reply = "AI services are temporarily unavailable. Please try again shortly."

}

}

}

}

bot.sendMessage(chatId,reply)

})
