const { Telegraf, Markup }= require( "telegraf" );
const dotenv = require("dotenv");
dotenv.config();
const express = require( "express" );
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot is running!"));

// Нужен только для Render — сам бот работает отдельно
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});


const token = process.env.BOT_TOKEN;
const admin = process.env.ADMIN_ID;

const bot = new Telegraf(token);

const userState = {};

const prices = {
"Website": "from $50",
"Telegram Bot": "from $30",
"Script": "from $10",
"Other": "negotiable"
};

bot.start(async (ctx) => {
const uid = ctx.from.id;

// If this is an admin → show the admin panel
if (String(uid) === String(admin)) {
return ctx.reply(
`Welcome, ${ctx.from.first_name}! 👑\n\n` +
`This is your *admin panel*. Here you can:\n` +
`• view requests\n` +
`• receive clients\n` +
`• manage the bot (in the future)`,
{ parse_mode: "Markdown" }
);
}

// If NOT an admin → regular menu
userState[uid] = {};

await ctx.reply(
"Hello! 👋\nWhich service are you interested in?", 
Markup.inlineKeyboard([ 
[Markup.button.callback("🌐 Website", "web")], 
[Markup.button.callback("🤖 Telegram-bot", "tgbot")], 
[Markup.button.callback("🧩 Script", "scripts")], 
[Markup.button.callback("✏️ Other", "other")], 
]) 
);
});


const serviceHandler = async(ctx, serviceName) => { 
const id = ctx.from.id; 

userState[id] = { 
service: serviceName, 
waiting: true, 
}; 

const price = prices[serviceName]; // <-- get the price

await ctx.editMessageText(
`You selected: *${serviceName}*\nPrice: *${price}*\n\nPlease describe your request 👇`,
{ parse_mode: "Markdown" }
);
};

bot.action("web", (ctx) => serviceHandler(ctx, "Website"));
bot.action("tgbot", (ctx) => serviceHandler(ctx, "Telegram Bot"));
bot.action("scripts", (ctx) => serviceHandler(ctx, "Script"));
bot.action("other", (ctx) => serviceHandler(ctx, "Other"));

bot.on("text", async (ctx) => {
const id = ctx.from.id;
const username = ctx.from.username;
const message = ctx.message.text;

if (!userState[id]?.waiting) {
return ctx.reply("Select a service via /start");
}

const service = userState[id].service;

// Send a request to the admin
await ctx.telegram.sendMessage(
admin,
`📩 New request!\n\n` +
`Service: ${service}\n` +
`From: @${username || "no username"} (ID: ${id})\n\n` +
`Description:\n${message}`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "💬 Write to the client",
url: `https://t.me/${username}`
}
]
]
}
}
);

// Reply to the user
await ctx.reply(
"Thank you! 🙌\nYour request has been sent!\nWe will contact you soon."
);

delete userState[id];
});

bot.launch();
console.log("Bot started!");
