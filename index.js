const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const colors = require("colors");
const fs = require("fs");
const os = require('os');
const { performance } = require('perf_hooks');


const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", //Chrome.exe path
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  webVersionCache: { 
        type: 'remote', 
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2403.2.html'
    },
  ffmpeg: "./ffmpeg.exe",
  authStrategy: new LocalAuth({ clientId: "client" }),
});
const config = require("./config/config.json");

client.on("qr", (qr) => {
  console.log(
    `────────────────── ▼ Please scan the QR code ▼ ──────────────────`.brightCyan
  );
  qrcode.generate(qr, { small: true });
});


const getCurrentTime = () => moment().tz(config.timezone).format("HH:mm:ss");


client.on("ready", () => {
  console.clear();
  const asciiText = "./config/ascii.txt";
  fs.readFile(asciiText, "utf-8", (err, data) => {
    if (err) {
      console.log(`[⚠️][${getCurrentTime()}] Ascii text not found!`.brightRed);
      console.log(`[🆙][${getCurrentTime()}] ${config.botname} is Ready!`.brightCyan);
    } else {
      console.log(data.brightCyan);
      console.log(`[🆙][${getCurrentTime()}] ${config.botname} is Ready!`.brightCyan
      );
    }
  });
});

client.on("message", async (message) => {
  const isGroups = message.from.endsWith("@g.us") ? true : false;
  if ((isGroups && config.allowgroupchat) || !isGroups) {
    

    //==========================================
    // [help] Send bot command list
    //==========================================
    if (message.body == `${config.prefix}help`) {
      if (config.log) console.log(`[📄][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} requesting a command list.`);
      const commandList = 
`╭─❏ *🤖 RexBot Command Menu*
│
│ 💟 *${config.prefix}sticker*
│   ↳ _Convert image/video/gif to sticker_
│   ↳ Send a media with ${config.prefix}sticker
│   ↳ _Max video length is 5 seconds_
│
│ 🖼️ *${config.prefix}s2img*
│   ↳ _Convert sticker to image_  
│   ↳ _Use by replying to a sticker_
│
│ 👥 *${config.prefix}groupinfo*
│   ↳ _Show group details_
│
│ 📷 *${config.prefix}pp @user*
│   ↳ _Fetch profile picture of mentioned user_
│
│ 🎲 *${config.prefix}dice*
│   ↳ _Roll a dice!_
│
│ 📊 *${config.prefix}status*
│   ↳ _Fetch system status_
│
╰────────────❏`;
      client.sendMessage(message.from, commandList, {quotedMessageId: message.id._serialized});
      if (config.log) console.log(`[✅][${getCurrentTime()}] Command list sent!`);
    }


    //==========================================
    // [ping] Ping bot
    //==========================================
    if (message.body === `${config.prefix}ping`) {
      const start = performance.now();
      if (config.log) console.log(`[🏓][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} used ping.`);

      //const sentMsg = await client.sendMessage(message.from, '🏓 *Pinging...*');

      const end = performance.now();

      const ping = (end - start).toFixed(2);

      await client.sendMessage(message.from,
        `🏓 *Pong! ${ping} ms*`//,
        //{ quotedMessageId: sentMsg.id._serialized }
      );
      if (config.log) console.log(`[✅][${getCurrentTime()}] Pinged ${ping} ms`);
    }





    //==========================================
    // [status] Get bot/os status
    //==========================================
    if (message.body === `${config.prefix}status`) {
      if (config.log) console.log(`[📊][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} requested system status.`);

      // 🧠 Uptime dalam format jam-menit-detik
      const uptimeSeconds = process.uptime();
      const uptime = new Date(uptimeSeconds * 1000).toISOString().substr(11, 8);

      // 🧠 Total dan sisa memory
      const totalMem = os.totalmem() / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024;
      const usedMem = totalMem - freeMem;

      // 🧠 CPU usage snapshot
      const cpus = os.cpus();
      const cpuModel = cpus[0].model;
      const cpuCores = cpus.length;

      let statusMessage = `──────────────────────────\n`;
      statusMessage += `🖥️ *System Status*\n`;
      statusMessage += `──────────────────────────\n`;
      statusMessage += `📈 *CPU:* ${cpuModel}\n`;
      statusMessage += `⚙️ *Cores:* ${cpuCores}\n`;
      statusMessage += `🧠 *RAM:* ${usedMem.toFixed(2)} MB / ${totalMem.toFixed(2)} MB\n`;
      statusMessage += `⏱️ *Uptime:* ${uptime}\n`;
      statusMessage += `📦 *Node.js:* ${process.version}\n`;
      statusMessage += `🧭 *Platform:* ${os.platform()} ${os.arch()}\n`;
      statusMessage += `──────────────────────────`;

      await client.sendMessage(message.from, statusMessage);
    }


    


    //==========================================
    // [s2img] Get tagged user photo profile
    //==========================================
    if (message.body.startsWith(`${config.prefix}pp`)) {
    const mentionedUsers = message.mentionedIds;
    if (config.log) console.log(`[📄][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} requesting @${mentionedUsers.brightYellow} photo profile.`);

      if (!mentionedUsers.length) {
        if (config.log) console.log(`[⚠️] Failed to get photo profile. No user mentioned.`);
        return client.sendMessage(
          message.from,
`╭───❏ ⚠️ *Failed!*
│ Please tag a user
│ Example: ${config.prefix}pp @user
╰────────────❏`,
          {quotedMessageId: message.id._serialized}
        );
      }

      const targetId = mentionedUsers[0]; // Get the first mentioned user

      try {
        const url = await client.getProfilePicUrl(targetId);

        if (!url) {
          if (config.log) console.log(`[⚠️][${getCurrentTime()}] Failed to get @${targetId.replace('@c.us', '').brightYellow} photo profile. It might be hidden due to privacy settings.`);
          return client.sendMessage(
            message.from,
`╭───❏ ⚠️ *Failed!*
│ Failed to get @${targetId.replace('@c.us', '')} photo profile.
│ It might be hidden due to privacy settings.
╰────────────❏`,
           {quotedMessageId: message.id._serialized}
           );
          }

          const media = await MessageMedia.fromUrl(url);

          await client.sendMessage(message.from, media, {
            caption: `╰[📸] Profile picture of @${targetId.replace('@c.us', '')}`,
            mentions: [targetId],
          });

          if (config.log) console.log(`[✅][${getCurrentTime()}] @${mentionedUsers.brightYellow} photo profile sent!`);

      } catch (err) {
          if (config.log) console.log(`[❌][${getCurrentTime()}] ${err}`);
          client.sendMessage(
            message.from,
`╭───❏ ❌ *Error!*
│ Failed to fetch profile picture.
╰────────────❏`,
            {quotedMessageId: message.id._serialized}
          );
      }
    }





    //==========================================
    // [groupinfo] Get group info
    //==========================================
    if (message.body === `${config.prefix}groupinfo`) {
      if (config.log) console.log(`[📄] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} requesting a group info.`);
      if (!message.from.endsWith('@g.us')) {
        if (config.log) console.log(`[⚠️][${getCurrentTime()}] Failed to retrieve group information. This command can only be used in group chats.`);
        return client.sendMessage(
          message.from,
`╭───❏ ⚠️ *Failed!*
│ This command is for group chats only.
╰────────────❏`,
            {quotedMessageId: message.id._serialized}
        );   
      }

      const chat = await message.getChat();

      
      const groupPictUrl = await client.getProfilePicUrl(chat.id._serialized);
      

      let groupInfo = `──────────────────────────\n`;
      groupInfo += `📄 *GROUP INFO*\n`
      groupInfo += `──────────────────────────\n`
      groupInfo += `🆔 *Name:*\n ⤷ ${chat.name}\n\n`;
      groupInfo += `👥 *Participants:*\n ⤷ ${chat.participants.length}\n\n`;
      groupInfo += `👑 *Owner:*\n ⤷ ${chat.owner ? chat.owner.user : 'Unknown'}\n\n`;
      groupInfo += `🕒 *Created At:*\n ⤷ ${moment(chat.createdAt).tz(config.timezone).format('dddd, MMMM D YYYY, HH:mm')}\n\n`;
      groupInfo += `📝 *Description:*\n ⤷ ${chat.description || '-'}\n\n`;
      groupInfo += `──────────────────────────\n`

      if(groupPictUrl) {
        const groupPict = await MessageMedia.fromUrl(groupPictUrl);
        await client.sendMessage(message.from, groupPict, { caption: groupInfo, quotedMessageId: message.id._serialized });
        if (config.log) console.log(`[✅][${getCurrentTime()}] Group info sent!`);
      } else {
        await client.sendMessage(message.from, groupInfo, { quotedMessageId: message.id._serialized });
        if (config.log) console.log(`[✅][${getCurrentTime()}] Group info sent!`);
      }
      
    }





    //==========================================
    // [sticker] Sticker maker
    //==========================================
    if (
      message._data.caption &&
      message._data.caption.trim() === `${config.prefix}sticker`
    ) {
      if (
        message.type === "image" ||
        message.type === "video" ||
        message.type === "gif"
      ) {
        if (config.log) console.log(`[📄][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} requesting a sticker.`);

        try {
          const media = await message.downloadMedia();
          await client.sendMessage(message.from, media, {
            sendMediaAsSticker: true,
            stickerName: config.botname,
            stickerAuthor: config.author,
            quotedMessageId: message.id._serialized
          });

          if (config.log) console.log(`[✅][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} Sticker sent!`);
        } catch (err) {
          client.sendMessage(
          message.from,
`╭───❏ ❌ *Error!*
│ Could not convert media to sticker.
╰────────────❏`,
          {quotedMessageId: message.id._serialized}
          );
          if (config.log) console.log(`[❌][${getCurrentTime()}] ${err}`);
        }
      }
    } 
    




    //==========================================
    // [s2img] Sticker to image
    //==========================================
    if (
      message.body === `${config.prefix}s2img` &&
      message.hasQuotedMsg
    ) {
      const quotedMsg = await message.getQuotedMessage();
      if (quotedMsg.hasMedia && quotedMsg.type === "sticker") {
        if (config.log) console.log(`[📄][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} requesting a sticker to image.`);
        
        try {
          const media = await quotedMsg.downloadMedia();
          client.sendMessage(message.from, media, {quotedMessageId: message.id._serialized})
          if (config.log) console.log(`[✅][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} Sticker to image sent!`);
        } catch (err) {
          client.sendMessage(
          message.from,
`╭───❏ ❌ *Error!*
│ Could not convert sticker to image.
╰────────────❏`,
          {quotedMessageId: message.id._serialized}
          );
          if (config.log) console.log(`[❌][${getCurrentTime()}] ${err}`);
        }
      } else {
        if (config.log) console.log(`[⚠️][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} used .s2img without replying to sticker.`);
        client.sendMessage(
          message.from,
`╭───❏ ⚠️ *Failed!*
│ Please reply to a sticker.
╰────────────❏`,
          {quotedMessageId: message.id._serialized}
        );
      }
    }

    //==========================================
    // [dice] Roll a dice
    //==========================================
    if (message.body === `${config.prefix}dice`) {
      const diceResult = Math.floor(Math.random() * 6) + 1; // Angka 1-6
      const diceEmoji = ['⚀','⚁','⚂','⚃','⚄','⚅'][diceResult - 1];

      if (config.log) console.log(`[🎲][${getCurrentTime()}] ${message.from.replace(/@c\.us|@g\.us/, '').brightYellow} rolled a dice: ${diceResult}`);

      const response = 
`╭─❏ 🎲 *Dice Rolled!*
│ You got: ${diceResult} ${diceEmoji}
╰────────────❏`;

      client.sendMessage(message.from, response, { quotedMessageId: message.id._serialized });
    }
      

      // Read chat
    else {
      client.getChatById(message.id.remote).then(async (chat) => {
        await chat.sendSeen();
      });
    }
  }
});

client.initialize();
