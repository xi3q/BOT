import discord
from discord.ext import commands
import yt_dlp as youtube_dl

# --- الإعدادات ---
PREFIX = 'ك ' # غير الحرف لكل بوت
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix=PREFIX, intents=intents)

# إعدادات المحرك (yt-dlp)
ytdl_format_options = {
    'format': 'bestaudio/best',
    'noplaylist': True,
    'quiet': True,
}
ytdl = youtube_dl.YoutubeDL(ytdl_format_options)

# --- كلاس الأزرار الخارق ---
class MusicControls(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="إيقاف مؤقت", style=discord.ButtonStyle.red, custom_id="pause")
    async def pause(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild.voice_client and interaction.guild.voice_client.is_playing():
            interaction.guild.voice_client.pause()
            await interaction.response.send_message("تم الإيقاف المؤقت ⏸️", ephemeral=True)
        else:
            await interaction.response.send_message("البوت مو ديعزف شي حالياً!", ephemeral=True)

    @discord.ui.button(label="استمرار", style=discord.ButtonStyle.green, custom_id="resume")
    async def resume(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild.voice_client and interaction.guild.voice_client.is_paused():
            interaction.guild.voice_client.resume()
            await interaction.response.send_message("تم الاستمرار ▶️", ephemeral=True)
        else:
            await interaction.response.send_message("البوت مو متوقف!", ephemeral=True)

# --- التشغيل ---
@bot.event
async def on_ready():
    bot.add_view(MusicControls())
    print(f'البوت {bot.user} جاهز للعمل!')

@bot.command(name='تشغيل')
async def تشغيل(ctx, *, search):
    if not ctx.author.voice:
        return await ctx.send("لازم تدخل قناة صوتية!")
    
    channel = ctx.author.voice.channel
    voice_client = ctx.guild.voice_client
    
    if not voice_client:
        voice_client = await channel.connect()
    
    await ctx.send(f"جاري البحث عن: {search} ...")
    
    # البحث
    loop = None 
    data = ytdl.extract_info(f"ytsearch:{search}", download=False)
    song_info = data['entries'][0]
    song_url = song_info['url']
    
    # إعدادات الصوت
    ffmpeg_options = {
        'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
        'options': '-vn'
    }
    
    # التشغيل
    voice_client.stop()
    voice_client.play(discord.FFmpegPCMAudio(song_url, **ffmpeg_options))
    await ctx.send(f"جاري تشغيل: {song_info['title']}", view=MusicControls())

@bot.command(name='س')
async def سكته(ctx):
    if ctx.guild.voice_client:
        ctx.guild.voice_client.stop()
        await ctx.send("تمت السكته! البوت باقي بالفويس 🔇")

bot.run('')
