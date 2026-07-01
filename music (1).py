import discord
from discord.ext import commands
import yt_dlp as youtube_dl

# --- الإعدادات ---
PREFIX = 'ش ' 
intents = discord.Intents.all()
bot = commands.Bot(command_prefix=PREFIX, intents=intents)

# إعدادات الصوت النقي (High Quality)
ytdl_format_options = {
    'format': 'bestaudio/best',
    'noplaylist': True,
    'quiet': True,
    'extractaudio': True,
    'audioformat': 'mp3',
}
ytdl = youtube_dl.YoutubeDL(ytdl_format_options)

# --- لوحة التحكم الكاملة ---
class MusicControls(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="▶️ استئناف", style=discord.ButtonStyle.danger, custom_id="play")
    async def play(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild.voice_client and interaction.guild.voice_client.is_paused():
            interaction.guild.voice_client.resume()
            await interaction.response.send_message("تم استئناف التشغيل", ephemeral=True)

    @discord.ui.button(label="⏸️ توقف", style=discord.ButtonStyle.danger, custom_id="pause")
    async def pause(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild.voice_client and interaction.guild.voice_client.is_playing():
            interaction.guild.voice_client.pause()
            await interaction.response.send_message("تم الإيقاف المؤقت", ephemeral=True)

    @discord.ui.button(label="⏹️ إنهاء", style=discord.ButtonStyle.danger, custom_id="stop")
    async def stop(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild.voice_client:
            interaction.guild.voice_client.stop()
            await interaction.response.send_message("تم إيقاف الأغنية", ephemeral=True)

    @discord.ui.button(label="⏭️ سكب", style=discord.ButtonStyle.danger, custom_id="skip")
    async def skip(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild.voice_client:
            interaction.guild.voice_client.stop()
            await interaction.response.send_message("تم سكب الأغنية", ephemeral=True)

# --- التشغيل ---
@bot.event
async def on_ready():
    bot.add_view(MusicControls())
    print(f'البوت {bot.user} جاهز! استعمل الاختصار "ش تشغيل"')

@bot.command(name='تشغيل')
async def تشغيل(ctx, *, search):
    if not ctx.author.voice:
        return await ctx.send("لازم تدخل قناة صوتية!")
    
    channel = ctx.author.voice.channel
    voice_client = ctx.guild.voice_client
    
    if not voice_client:
        voice_client = await channel.connect()
    elif voice_client.channel != channel:
        await voice_client.move_to(channel)
    
    await ctx.send(f"🔍 جاري البحث: {search}...")
    
    data = ytdl.extract_info(f"ytsearch:{search}", download=False)
    song_info = data['entries'][0]
    song_url = song_info['url']
    
    ffmpeg_options = {
        'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
        'options': '-vn'
    }
    
    voice_client.stop()
    source = discord.PCMVolumeTransformer(discord.FFmpegPCMAudio(song_url, **ffmpeg_options))
    voice_client.play(source)
    await ctx.send(f"🎵 جاري التشغيل: {song_info['title']}", view=MusicControls())

# ضع التوكن هنا
bot.run('')
