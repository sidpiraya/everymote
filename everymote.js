var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;

exports.init = init;
exports.next = next_song;
exports.previous = previous_song;
function init() {
    updatePageWithTrackDetails();

    player.observe(models.EVENT.CHANGE, function (e) {

	// Only update the page if the track changed
	if (e.data.curtrack == true) {
        	updatePageWithTrackDetails();
        }
    });
}
        

function next_song(){
	player.next();
}
function previous_song(){
	player.previous();
}
function updatePageWithTrackDetails() {
	var header = document.getElementById("header");
        var playerTrackInfo = player.track;
        
        if (playerTrackInfo == null) {
        	header.innerText = "Nothing playing!";
        } else {
        	var track = playerTrackInfo.data;
                header.innerHTML = track.name + " on the album " + track.album.name + " by " + track.album.artist.name + ".";
        }
}
