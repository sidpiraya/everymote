var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;

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
                    "name":"Spotify",
                    "id":"28",
                    "quickAction":{"button":"Next"},
                    "functions":  [{"button":"Next"},{"button":"Previous"}],
                    "iconType": "jukeBox"
            };      
                 
          spThing.handleAction = function(action){
            if(action === "Next"){
                next_song();
            }else if(action === "Previous"){
                previous_song();
            }
          };
       return spThing;
    };

    var spThing = build({});
    connectThing(spThing);

};

var next_song = function(){
	player.next();
}
var previous_song = function(){
	player.previous();
}

var updatePageWithTrackDetails = function() {
	var header = document.getElementById("header");
        var playerTrackInfo = player.track;
        
        if (playerTrackInfo == null) {
        	header.innerText = "Nothing playing!";
        } else {
        	var track = playerTrackInfo.data;
                header.innerHTML = track.name + " on the album " + track.album.name + " by " + track.album.artist.name + ".";
        }
}

var init = function() {
    updatePageWithTrackDetails();

    player.observe(models.EVENT.CHANGE, function (e) {

    // Only update the page if the track changed
    if (e.data.curtrack == true) {
            updatePageWithTrackDetails();
        }
    });
    setupConnection();

}

exports.init = init;
exports.next = next_song;
exports.previous = previous_song;


