require('dotenv').config();
var discord = require('discord.io');
var google = require('googleapis');
var request = require('request');
var fs = require('fs');
var messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));

var bot = new discord.Client({
  token: process.env.DISCORD_TOKEN,
  autorun: true
});

bot.on('ready', function(event) {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
  bot.setPresence({game:{name: "y0ur m0m"}});
  var iddleMessage = function() {
    var chance = Math.floor(Math.random() * 10) + 1;
    if(chance & 1){      
      get8Post(process.env.DISCORD_GENERAL_CHANNEL_ID);
    }else{
      bot.sendMessage({to: process.env.DISCORD_GENERAL_CHANNEL_ID, message: randomMessage(messages.iddle)});
    }
    var rand = Math.round(Math.random() * (500000 - 250000)) + 250000;
    setTimeout(iddleMessage, rand);
  }
  iddleMessage();  
});

bot.on('disconnect', (msg, code) => {
  if (code === 0) return console.error(msg);
  bot.connect();
});

bot.on("message", function (user, userID, channelID, message, rawEvent){
  if (message.substring(0, 3) == "ara"){
    var command = message.substring(4);

    switch(command){      
      case (command.match(/shitpost/) || {}).input: // shitpost
        get8Post(channelID);
        break;         
      case (command.match(/video/) || {}).input: //"can you send me a video?"
        getVideos(channelID);        
        break;
      case (command.match(/read/) || {}).input: //"can you give me something to read?":
        getArticle(channelID);
        break;
      case (command.match(/^say/) || {}).input: // say
        bot.sendMessage({to: channelID,message: aradiaTextConvert(command,true)});
        break;
      case (command.match(/what do you think/) || {}).input: // magic ball
        bot.sendMessage({to: channelID,message: randomMessage(messages.magic_ball)});
        break;        
      case "can you make me a sandwich?":
        bot.sendMessage({to: channelID,message: messages.error.NO});           
        break;
      case "post feet":
        bot.sendMessage({to: channelID,message: messages.iddle.EMOTE + ' ' + "https://i.imgur.com/k5y3LhF.png"});  
        break;
      case "help":
        bot.sendMessage({to: channelID,message: messages.help});  
        break;
      default:
        bot.sendMessage({to: channelID,message: randomMessage(messages.error)});   
        break;
    }

  }
});

function getVideos(channelID) {
  var service = google.youtube({version:'v3',auth: process.env.YOUTUBE_API});
  var random = randomStr(4);
  var comp2 = random.toUpperCase();
  var arr_urls = [];
  service.search.list({
    part: 'snippet',
    q: random,
    maxResults: 50,
    order: 'viewCount',
    safeSearch: 'none',
    type: 'video'
  }, function (err, data) {
    if (err) {
      console.error('Error: ' + err);
    }
    if (data) {
      if(data.items.length > 0){
        for (var i = 0, len = data.items.length; i < len; i++) {
          var comp1 = data.items[i].id.videoId.toUpperCase();
          if(comp1.indexOf(comp2)){
            var url = "https://www.youtube.com/watch?v="+data.items[i].id.videoId;
            arr_urls.push(url);
          }
        }
        if(arr_urls.length > 0){
          var item = arr_urls[Math.floor(Math.random()*arr_urls.length)];
          bot.sendMessage({
            to: channelID,
            message: randomMessage(messages.replies) + ' ' + item
          });          
        }else{
          // console.error('No results, searching again.');
          getVideos();          
        }
      }else{
        // console.error('No results, searching again.');
        getVideos();
      }
    }
  });
}

function getArticle(channelID){
  var url_query = "https://en.wikipedia.org//w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=1&prop=info&inprop=url";
  request(url_query, function (error, response, body) {
    var response = JSON.parse(body);
    var article_id = response.query.random[0].id;
    var url_query2 = "https://en.wikipedia.org/w/api.php?action=query&prop=info&pageids="+article_id+"&inprop=url&format=json";
    request(url_query2, function (error2, response2, body2) {
      var response = JSON.parse(body2);
      var url = response.query.pages[Object.keys( response.query.pages)[0]].fullurl;
      bot.sendMessage({
        to: channelID,
        message: randomMessage(messages.replies) + ' ' + url
      });      
    });
  });
}

function get8Post(channelID){
  request("https://8ch.net/homosuck/threads.json", function (error,responce,body) {
    var byPage = JSON.parse(body).slice(0);
    byPage.sort(function(a,b) {
      return a.page - b.page;
    });
    var page = byPage[Math.floor(Math.random()*byPage.length)];
    var thread = page.threads[Math.floor(Math.random()*page.threads.length)];
    var thread_url = "https://8ch.net/homosuck/res/"+thread.no+".json";
    request(thread_url, function (error,responce,thread_body) {
      if(error == null && !thread_body.includes("answer_404")){
        var thread_content = JSON.parse(thread_body);
        var post = thread_content.posts[Math.floor(Math.random()*thread_content.posts.length)];
        if((post.com.match(/&gt;&gt;/) || {}).input){
          get8Post(channelID);
        }else{
          var stripped = post.com.replace(/<(?:br|\/div|\/p)>/g, "\n").replace(/<.*?>/g, "");
          // var stripped = post.com.replace(/(<([^>]+)>)/ig,"");
          bot.sendMessage({to: channelID,message: aradiaTextConvert(stripped,false)});
        }
      }else{
        get8Post(channelID);
      }
    });
  });
}

function randomStr( length ) {    
  var str = "";
  for ( ; str.length < length; str += Math.random().toString( 36 ).substr( 2 ) );
  return str.substr( 0, length );
}

function randomMessage(obj){
  var keys = [];
  for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
          keys.push(prop);
      }
  }  
  return obj[keys[keys.length * Math.random() << 0]];
}

function aradiaTextConvert(text,say){
  var new_text = text.toLowerCase();
  if(say){
    new_text = new_text.replace("say","").replace(/o/g, "0").replace(/[^\w\s]/gi, '');
  }else{
    new_text = new_text.replace(/o/g, "0").replace(/[^\w\s*>:/.&,?()%$#]/gi, '');
  }
  return new_text;
}