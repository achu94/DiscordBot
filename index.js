const Discord = require("discord.js"); // Discord API
const { prefix, token } = require("./config.json"); // Prefix ve Token.
const ytdl = require("ytdl-core"); // YouTube oynatma.
const kamyonStr = require("./kamyon.json"); // Kamyon arkasi.
const { NovelCovid } = require('novelcovid');  //Corona


const client = new Discord.Client();
const track = new NovelCovid();

const queue = new Map();

async function coronaWorld(){
    var data = await track.all();
    console.log(data);
    return data;
}

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);
    // Music Commands.
  if (message.content.startsWith(`${prefix}oynat`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}atla`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}dur`)) {
    stop(message, serverQueue);
    return;
  } else if(message.content.startsWith(`${prefix}kamyon`)){ // Kamyon
     
    var kamyon_output = kamyon_arkasi();
    return message.channel.send(kamyon_output);

} else if (message.content.startsWith(`${prefix}corona`)){

    var data = await coronaWorld()
    var data_output = JSON.stringify(`Dünya => ${data["cases"]} Bügün => ${data["todayCases"]} => ölü ${data["deaths"]} => Bügün ölenler => ${data["todayDeaths"]} `);
    
    const corona_outpu = { 
        color : '0099ff',
        title : 'Dünya',
        fields : 
                { name: JSON.stringify(data[0]),  value: JSON.stringify(data["cases"]),
                 name: JSON.stringify(data[1]),  value: JSON.stringify(data["todayCases"]),
                 name: JSON.stringify(data[2]),  value: JSON.stringify(data["deaths"]),
                 name: JSON.stringify(data[3]),  value: JSON.stringify(data["todayDeaths"]),
                 name: JSON.stringify(data[4]),  value: JSON.stringify(data["recovered"]),
                 name: JSON.stringify(data[5]),  value: JSON.stringify(data["active"]),
                 name: JSON.stringify(data[6]),  value: JSON.stringify(data["critical"]),
                 name: JSON.stringify(data[7]),  value: JSON.stringify(data["casesPerOneMillion"]),
                 name: JSON.stringify(data[8]),  value: JSON.stringify(data["deathsPerOneMillion"]),
                 name: JSON.stringify(data[9]),  value: JSON.stringify(data["tests"]),
                 name: JSON.stringify(data[10]), value: JSON.stringify(data["testsPerOneMillion"]),
                 name: JSON.stringify(data[11]), value: JSON.stringify(data["affectedCountries"]),
                },
    };
    message.channel.send(data_output);   

    
    
}  
  else {
    message.channel.send("Geçerli bir komut girmeniz gerekiyor!");
  } 

});




function kamyon_arkasi(){
    var kamyonArr = [];
    for (var x in kamyonStr){
        kamyonArr.push(x);
    }
    var rndKamyonString = kamyonArr[Math.floor(Math.random() * kamyonArr.length)];
    return kamyonStr[rndKamyonString];
}
















async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Müzik açmak için ses kanalında olmanız gerekiyor!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Ses kanalınıza katılmak ve konuşmak için izinlere ihtiyacım var!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} kuyruğa eklendi!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Müziği durdurmak için ses kanalında olmalısınız!"
    );
  if (!serverQueue)
    return message.channel.send("Atlayabileceğim bir şarkı yok!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Müziği durdurmak için ses kanalında olmalısınız!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Müzik başlıyor: **${song.title}**`);
}

client.login(token);