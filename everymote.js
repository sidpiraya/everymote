"use strict";
var m = sp.require("sp://import/scripts/api/models");
//var sp = getSpotifyApi(1);
//var models = sp.require('sp://import/scripts/api/models');
var player;// = models.player;
var spThing;
var _playlist,
    _models;

var getPlayList = function(calback){
    var nrOfTracks = _playlist.data.all().length;
    var tracks = [];

    _playlist.data.all().forEach(function(trackURI, index){
        m.Track.fromURI(trackURI, function(track){
            tracks.push(track.name.decodeForText());
            if(tracks.length === nrOfTracks){calback(tracks);};
        });
    });
};

var setupConnection = function(){

    if(true){
        var server = 'thing.everymote.com',
        port = '80';
   }else{
        var server = "localhost", 
        port = '1338'; 
    }

    var connectThing = function(thing){
        console.log(thing);
        var socket = io.connect('http://' + server + ':' + port + '/thing',
                {"force new connection":false 
                        ,'reconnect': true
                        ,'reconnection delay': 500
                        ,'max reconnection attempts': 10});
        
       
        socket.on('connect', function () {
                console.log('connected');
                socket.emit('setup', thing.settings);
                thing.socket = socket;
                updateEverymoteWithTrackDetails(spThing);

                getPlayList(function(tracks){console.log("first GetPlayLis"); console.dir(tracks);spThing.socket.emit('updateActionControlerState', {"id":"2", "curentState":tracks});});

              updateEverymoteWithPlayList(spThing);
        }).on('doAction', function (action) {
                console.log(action.id);
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
                    "actionControles":[
                                    {"type":"spotify-search", "name":"search", "id":"1"}
                                    ,{"type":"list", "name":"list", "id":"2", "curentState":""}]
                    ,"iconType": "spotifyL",
                    "info":getTrackInfo()
            };      
        spThing.updateTrack = function(){
            if(spThing.socket){
               updateEverymoteWithTrackDetails(spThing);
            }
        };
        spThing.updatePlayStatus = function(){
            if(spThing.socket){
               updateEverymoteWithPlayStatus(spThing);
            }
        };
          spThing.handleAction = function(action){
            if(action.id === "1"){
                console.log(action);
                _playlist.add(action.value);
                
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

var updateEverymoteWithPlayList = function(spThing){
    getPlayList(function(tracks){spThing.socket.emit('updateActionControlerState', {"id":"2", "curentState":tracks});});
    
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

var playTrack = function(play){
    player.playing = play;
}

var setVolume = function(v){
    console.log(player);
    player.volume = v;
}

var isPlaying = function(){
    return player.playing;
}


var updatePageWithTrackDetails = function() {
	var header = document.getElementById("header");
        var playerTrackInfo = player.track;
        
        if (playerTrackInfo == null) {
        	header.innerText = "Nothing playing!";
        } else {
        	var track = playerTrackInfo.data;
                header.innerHTML = "<img src='"+track.album.cover +"' width='300'/ > " +   track.name + " on the album " + track.album.name + " by " + track.album.artist.name + ".";

      }
}

var removeLastPlayed = function(priviusTrack){
    if(priviusTrack){
        _playlist.remove(priviusTrack);
    }
    
}
var setUpPlayQueue = function(){

}

var updateName = function(){
    spThing.settings.name="Spotify " +localStorage.getItem("name");
    spThing.socket.emit('setup', spThing.settings);
}

var handleLinks = function () {
    var urlLinks = _models.application.links;
   
    var links =  urlLinks.map(function(url){return new _models.Link(url);});
     console.log(links);
    if(links.length) {
        switch(links[0].type) {
            case "user":
                //socialInput(links[0].split(":")[2]);
                break;
            case 4:
                _playlist.add(links[0]);
                //socialInput(links[0].split(":")[2]);
                break;
            case 5:
                _models.Playlist.fromURI(links[0], function(playlistFromURI) {
                                console.log("Playlist loaded", playlistFromURI.name);
                                 for (var i =  0; i < playlistFromURI.tracks.length; i++) {
                                     _playlist.add(playlistFromURI.tracks[i]);
                                 };
                            });
                break;

            default:
                // Play the given item
                
                //player.play(models.Track.fromURI(links[0]));
                break;
        }       
    } 
}


var init = function(models, playlist) {
    var priviusTrack; 
    _models = models;
      console.log(_models.Link);
    player = models.player;
    spThing = setupConnection();
    _playlist = playlist;
    updatePageWithTrackDetails(spThing);
    models.application.observe(models.EVENT.LINKSCHANGED, handleLinks);
    player.observe(models.EVENT.CHANGE, function (e) {
        console.log(e);
        if (e.data.curtrack) {
                updatePageWithTrackDetails();
                spThing.updateTrack();
                removeLastPlayed(priviusTrack);
                updateEverymoteWithPlayList(spThing);
                priviusTrack = player.track;
            }
        else if (e.data.playstate) {
            spThing.updatePlayStatus();

        }

    });
    _playlist.observe(models.EVENT.ITEMS_ADDED, function (e) {
        updateEverymoteWithPlayList(spThing);
        if(!isPlaying()){
            player.play(_playlist.get(0), _playlist, 0);
        }
    });

   // spThing.updateTrack();
    //updateEverymoteWithPlayList(spThing);

}

exports.init = init;
exports.next = next_song;
exports.previous = previous_song;
exports.updateName = updateName;

