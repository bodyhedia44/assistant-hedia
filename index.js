const discord = require("discord.js")
const ytdl=require("ytdl-core")
//const ytdl = require('ytdl-core-discord');
const client = new discord.Client()


client.login(process.env.TOKEN)


client.once('ready',()=>{
    console.log('ready')
})


const prefix = '^'
const queue = new Map();



client.on('message',async(msg)=>{
    if (!msg.content.startsWith(prefix) || msg.author.bot ) return;
    
    const args = msg.content.slice(prefix.length).split(/ * /)
    //console.log(args)
    
    const command = args.shift().toLowerCase()

    const serverQueue = queue.get(msg.guild.id);
    const voiceChannel = msg.member.voice.channel;
    
    if (command == 'info') {
        msg.channel.send("this server has "+msg.guild.memberCount+" members")
        //console.log(args[0])
    }
    else if (command == 'kick') {
        if (!msg.member.hasPermission("BAN_MEMBERS")) return msg.channel.send("Invalid Permissions")
        let User = msg.guild.member(msg.mentions.users.first())
        if (!User) return msg.channel.send("Invalid User")
        //if (User.hasPermission("BAN_MEMBERS")) return msg.reply("Invalid Permissions")
        let banReason = args.join(" ").slice(22);
        if (!banReason) {
          banReason = "None"
        }
        
       // User.ban({reason: banReason})
       msg.guild.member(User).kick("")
       msg.channel.send("User Kicked")
    }
    else if (command == 'ban') {
        if (!msg.member.hasPermission("BAN_MEMBERS")) return msg.channel.send("Invalid Permissions")
        let User = msg.guild.member(msg.mentions.users.first())
        if (!User) return msg.channel.send("Invalid User")
        //if (User.hasPermission("BAN_MEMBERS")) return msg.reply("Invalid Permissions")
        let banReason = args.join(" ").slice(22);
        if (!banReason) {
          banReason = "None"
        }
        msg.guild.member(User).ban("")
        msg.channel.send("User Baned")
    }
    else if (command == "play"){
          msg.member.voice.channel.join().then( async(connection) =>{
          await connection.play(ytdl(args[0], { quality: 'highestaudio' }))
          })
        // try {
        //   var connection = voicechannel.join()
        // } catch (error) {
        //   console.log(error)
        // }
        // const dispatcher=  (await connection) .play(await ytdl(args[0],{filter: 
        //   "audioonly"}))
        // .on("finish",() =>{ 
        //   voicechannel.leave()
        // }).on('error',(err)=>{
        //   console.log(err)
        // })
        // dispatcher.setVolumeLogarithmic(5 / 5)
            // execute(msg, serverQueue);
            // return;
        } 
        else if (command == 'skip' ) {
            skip(msg, serverQueue);
            return;
    }
        else if (command == 'stop') {
            stop(msg, serverQueue);
            return;
        
    }
    else if(command=="help"){
        msg.channel.send("^info for details about server \n ^kick @user && ^ban @user for admins \n ^play link && ^skip && ^stop for music ")
    }
    else{
        msg.channel.send("invalid command")
    }

})
client.on("guildMemberAdd",(user=>{
    console.log(user.displayName)
    const channel=client.channels.cache.get("680400718251032586");
    channel.send('Hello '+user.displayName)
}))

async function execute(message, serverQueue) {
    const args = message.content.split(" ");
    console.log(args)
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
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
        //return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  
  function skip(msg, serverQueue) {
    if (!msg.member.voice.channel)
      return msg.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return msg.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
  }
}
  function stop(msg, serverQueue) {
    if (!msg.member.voice.channel)
      return msg.channel.send(
        "You have to be in a voice channel to stop the music!"
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
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }
  



  