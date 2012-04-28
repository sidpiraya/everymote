//var sp = getSpotifyApi(1);
//var models = sp.require('sp://import/scripts/api/models');
var player;// = models.player;
var spThing;

var setupConnection = function(){
    var server = 'thing.everymote.com',
    port = '80';

    var connectThing = function(thing){
        console.log(thing);
        var socket = io.connect('http://' + server + ':' + port + '/thing',
                {"force new connection":true 
                        ,'reconnect': true
                        ,'reconnection delay': 500
                        ,'max reconnection attempts': 10});
        
       
        socket.on('connect', function () {
                console.log('connected');
                socket.emit('setup', thing.settings);
                thing.socket = socket;
        }).on('doAction', function (action) {
                console.log(action);
                thing.handleAction(action);
        }).on('connect_failed', function () {
                console.log('error:' + socket );
        }).on('disconnect', function () {
                console.log('disconnected');
        }).on('reconnect', function () {
               console.log('reconnect');
             
        });
    };

    var build = function (spThing){

        spThing.settings = { 
                    "name":"Spotify " +localStorage.getItem("name"),
                    "id":"28",
                    "functions":  [{"button":"Previous"},{"button":"Play/Pause"},{"button":"Next"}],
                    "iconType": "jukeBox",
                    "info":getTrackInfo()
            };      
        spThing.updateTrack = function(){
            if(spThing.socket){
               updateEverymoteWithTrackDetails(spThing);
            }
        };
          spThing.handleAction = function(action){
            if(action === "Next"){
                if(canPlayNext()){
                    next_song();
                }
            }else if(action === "Previous"){
                if(canPlayPrevious()){
                   previous_song(); 
                } 
            }else if(action === "Play/Pause"){
                playPause_song();
                
            }
          };
       return spThing;
    };

    var spThing = build({});
    connectThing(spThing);
    return spThing;
};

var getTrackInfo = function(){
    var playerTrackInfo = player.track;
    if (playerTrackInfo === null) {
       return "Nothing playing!";
    } else {
        var track = playerTrackInfo.data;
        var album = track.album;
        return track.name + " by " + track.album.artist.name;         
    }
}

var updateEverymoteWithTrackDetails = function(spThing){
    spThing.socket.emit('updateInfo',getTrackInfo());
}

var canPlayNext = function(){
    return player.canPlayNext;
}

var canPlayPrevious = function(){
    return player.canPlayPrevious;
}

var next_song = function(){
	player.next();
}
var previous_song = function(){
	player.previous(true);
}

var playPause_song = function(){
    player.playing = !player.playing;
}

var updatePageWithTrackDetails = function() {
	var header = document.getElementById("header");
        var playerTrackInfo = player.track;
        
        if (playerTrackInfo == null) {
        	header.innerText = "Nothing playing!";
        } else {
        	var track = playerTrackInfo.data;
                header.innerHTML = "<img src='"+track.album.cover +"'/ > " +   track.name + " on the album " + track.album.name + " by " + track.album.artist.name + ".";
      }


}

var setUpPlayQueue = function(){

}

var updateName = function(){
    spThing.settings.name="Spotify " +localStorage.getItem("name");
    spThing.socket.emit('setup', spThing.settings);
}


var init = function(models) {
    player = models.player;
    spThing = setupConnection();
    updatePageWithTrackDetails(spThing);
   
    player.observe(models.EVENT.CHANGE, function (e) {

        // Only update the page if the track changed
        if (e.data.curtrack == true) {
                updatePageWithTrackDetails();
                spThing.updateTrack();
            }
    });
    

}

exports.init = init;
exports.next = next_song;
exports.previous = previous_song;
exports.updateName = updateName;

