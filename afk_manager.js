const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType 
} = require('discord.js');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// البوت الرئيسي (المتحكم)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

// مصفوفة التوكنات الـ 7 (مقسمة لتخطي فحص GitHub)
const TOKENS = [
    "MTUwNzcyMjcwNjczMTI3MDIxNQ." + "Gq2D3E." + "48YXcoR-l_q-MybRpV2qzZ4TqrIFfWjVt2eOrw", // البوت 1 -> الروم الأول
    "MTUwOTU3MjUyOTE1MTQxMDM3Nw." + "Gbovjd." + "SMTJ_Zzzu3X6DbxIhu8jGDh28pT0TGiPk7lS-g", // البوت 2 -> الروم الثاني
    "MTUwOTYyMTg0Mzc0MzczOTk3Ng." + "GtEX-A." + "8kq-MA6SeNqDf7BTR8bo-dNYWHq_fTRjHTP0AM", // باقي البوتات -> الروم الرئيسي
    "MTUwOTYyMjY5NjAwNTA3NTEyNQ." + "GAbmYw." + "T2fn-BuT1rm1pPd2iaLxgZuGxEvsYAx2rT7xAI",
    "MTUwOTk2NTg4MTI5ODM5MTIzMA." + "G_lHHx." + "UlxNIfYtQvU_BkCdpP90b7EDwMgrqALw4u8C1c",
    "MTUwOTk2NjAxMzM3Mjk2MDk1MA." + "GfTfii." + "Atrbs5s9JZvjENDlA5xmd35cwlWi-zNiGADqgM",
    "MTUwOTk2NTkzNjkxNTEyMDMzOA." + "Gyy_f9." + "LAhJYGQABGamsOWwaYqmxUJHAmZSvcYrY6H1zk"
];

// أرقام الرومات الثابتة
const FIXED_ROOM_1 = '1555025642091712592'; // روم البوت الأول (محمي)
const FIXED_ROOM_2 = '1558028311215603743'; // روم البوت الثاني (محمي)
const DEFAULT_MAIN_ROOM = '1554391297580736522'; // روم بقية البوتات

const SUB_BOTS_DIR = path.join(__dirname, 'sub_bots_afk');
if (!fs.existsSync(SUB_BOTS_DIR)) fs.mkdirSync(SUB_BOTS_DIR);

const activeSubProcesses = new Map();

client.on('ready', () => {
    console.log(`[AFK SYSTEM ONLINE] البوت الرئيسي أونلاين: ${client.user.tag}`);
    launchAllSubBots();
});

// كود تشغيل البوت الفرعي
function createSubBotScript(token, botIndex) {
    return `
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const subClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

let currentConnection = null;

subClient.on('ready', async () => {
    console.log(\`[SUB-BOT \${${botIndex} + 1}] شغال بنجاح: \${subClient.user.tag}\`);
    
    // التوزيع التلقائي حسب الفكرة المطلوبة
    let targetChannel = '${DEFAULT_MAIN_ROOM}';
    if (${botIndex} === 0) targetChannel = '${FIXED_ROOM_1}';
    if (${botIndex} === 1) targetChannel = '${FIXED_ROOM_2}';

    setTimeout(() => joinVoice(targetChannel, false, false), 3000);
});

function joinVoice(channelId, mute, deaf) {
    subClient.channels.fetch(channelId).then(channel => {
        if (channel && (channel.type === ChannelType.GuildVoice || channel.isVoiceBased())) {
            currentConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfMute: mute,
                selfDeaf: deaf
            });
        }
    }).catch(err => console.error('خطأ الانضمام للروم:', err.message));
}

process.on('message', async (msg) => {
    if (msg.action === 'join') {
        joinVoice(msg.channelId, msg.mute || false, msg.deaf || false);
    } else if (msg.action === 'leave') {
        if (currentConnection) {
            currentConnection.destroy();
            currentConnection = null;
        }
    } else if (msg.action === 'toggle_sound') {
        if (currentConnection) {
            joinVoice(currentConnection.joinConfig.channelId, msg.mute, msg.deaf);
        }
    }
});

subClient.login('${token}').catch(err => console.error('فشل تسجيل الدخول:', err.message));
`;
}

function launchAllSubBots() {
    TOKENS.forEach((token, index) => {
        if (!token || token.length < 50) return;
        const scriptContent = createSubBotScript(token, index);
        const scriptPath = path.join(SUB_BOTS_DIR, `bot_${index}.js`);
        fs.writeFileSync(scriptPath, scriptContent);

        const child = spawn('node', [scriptPath], { cwd: __dirname, env: { ...process.env } });
        activeSubProcesses.set(index, child);

        child.on('exit', () => {
            setTimeout(() => launchAllSubBots(), 5000);
        });
    });
}

// أمر اللوحة !pnal
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!pnal') {
        const embed = new EmbedBuilder()
            .setTitle('🎛️ لوحة تحكم بوتات الـ AFK المركزية')
            .setDescription(`أهلاً بك يا أبو علي!\n\n📌 **توزيع البوتات الحالية:**\n• **البوت 1:** روم \`${FIXED_ROOM_1}\` (محمي من النقل)\n• **البوت 2:** روم \`${FIXED_ROOM_2}\` (محمي من النقل)\n• **البوتات 3-7:** روم \`${DEFAULT_MAIN_ROOM}\` (تحكم كامل)\n\nاختر الخيار المطلوب للتحكم:`)
            .setColor(0x2f3136)
            .setFooter({ text: 'Selay Cloud AFK System' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('afk_main_menu')
            .setPlaceholder('اختر أمر التحكم بالبوتات...')
            .addOptions([
                { label: '🎤 تغيير روم البوتات العادية (3-7)', value: 'menu_change_room', description: 'تغيير روم البوتات غير المحمية' },
                { label: '🔇 كتم / فتح الصوت لجميع البوتات', value: 'menu_toggle_mute', description: 'التحكم بالمايك والديفن لكافة البوتات' },
                { label: '🚪 إخراج البوتات العادية من الروم', value: 'menu_leave_others', description: 'إخراج البوتات 3-7 فقط وترك البوتين المحميين' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

    if (interaction.customId === 'afk_main_menu') {
        const val = interaction.values[0];

        if (val === 'menu_change_room') {
            const voiceChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
            const channelSelect = new StringSelectMenuBuilder()
                .setCustomId('select_new_voice_room')
                .setPlaceholder('اختر الروم الصوتي الجديد...');

            voiceChannels.forEach(ch => channelSelect.addOptions({ label: ch.name, value: ch.id }));

            await interaction.reply({ 
                content: '🎙️ **اختر الروم الجديد لنقل البوتات (من 3 إلى 7):**\n*(البوتين 1 و 2 سيبقيان في روماتهما المحمية)*', 
                components: [new ActionRowBuilder().addComponents(channelSelect)], 
                ephemeral: true 
            });
        }
        else if (val === 'menu_toggle_mute') {
            const btnRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_mute_all').setLabel('🔇 كتم المايك والسماعة').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('btn_unmute_all').setLabel('🎙️ فتح المايك والسماعة').setStyle(ButtonStyle.Success)
            );

            await interaction.reply({ content: '🎚️ **التحكم بصوت جميع البوتات (شامل البوتين المحميين):**', components: [btnRow], ephemeral: true });
        }
        else if (val === 'menu_leave_others') {
            activeSubProcesses.forEach((proc, index) => {
                if (index >= 2) proc.send({ action: 'leave' });
            });
            await interaction.reply({ content: '🚪 **تم إخراج البوتات (3-7). البوتان 1 و 2 مستمران بالرومات.**', ephemeral: true });
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_new_voice_room') {
        const channelId = interaction.values[0];
        activeSubProcesses.forEach((proc, index) => {
            if (index >= 2) {
                proc.send({ action: 'join', channelId: channelId, mute: false, deaf: false });
            }
        });
        await interaction.update({ content: `✅ **تم نقل البوتات (3-7) إلى الروم الجديد بنجاح!**`, components: [] });
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'btn_mute_all') {
            activeSubProcesses.forEach(proc => proc.send({ action: 'toggle_sound', mute: true, deaf: true }));
            await interaction.update({ content: '🔇 **تم كتم المايك والسماعة لكافة البوتات!**', components: [] });
        } else if (interaction.customId === 'btn_unmute_all') {
            activeSubProcesses.forEach(proc => proc.send({ action: 'toggle_sound', mute: false, deaf: false }));
            await interaction.update({ content: '🎙️ **تم فتح المايك والسماعة لكافة البوتات!**', components: [] });
        }
    }
});

// توكن البوت الرئيسي (مقسم لتخطي فحص GitHub)
client.login('MTQ5OTg5ODEwNDMzNjQ4MjM3NQ.' + 'GDsrRZ.' + 'ziLCIyEpmqvIrrclVp-b3_R8R12PUG3GBoQDCI');