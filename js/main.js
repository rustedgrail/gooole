(function() {
    MIDI.loadPlugin(function() {}, 'lib/MIDI.js/MIDI/soundfont/soundfont-ogg-guitar.js');

    var songInfoTemplate = Handlebars.compile(document.getElementById('songInfoTemplate').innerHTML);
    var songInfoVote = Handlebars.compile(document.getElementById('songVoteTemplate').innerHTML);

    var songInfo = {
        measures: 8
        , instrument: 'spoons'
        , timeSig: '7/8'
        , bpm: 246
    };

    if (false) {
        document.getElementById('voteControls').innerHTML = songInfoTemplate(songInfo);
    }

    var keyToNote = {
        65: 24 //A, C1
        , 87: 25 //W, C#1
        , 83: 26 //S, D1
        , 69: 27 //E, D#1
        , 68: 28 //D, E1
        , 70: 29 //F, F1
        , 84: 30 //T, F#1
        , 71: 31 //G, G1
        , 89: 32 //Y, G#1 
        , 72: 33 //H, A1
        , 85: 34 //U, A#1 
        , 74: 35 //J, B1 
        , 75: 36 //K, C2 
    };

    var notesPlayed = [], startTime = new Date().getTime(), playing = {};

    document.getElementById('submitKeyChange').addEventListener('click', updateNotes);
    document.getElementById('startPlaying').addEventListener('click', startPlaying);
    document.getElementById('playback').addEventListener('click', playback);
    document.getElementById('sendRecording').addEventListener('click', sendRecording);
    document.body.addEventListener('keydown', function(e) {
        if (!playing[e.which]) {
            MIDI.noteOn(0, keyToNote[e.which], 127, 0);
            playing[e.which] = true;
            notesPlayed.push({
                on: true
                , channel: 0
                , note: keyToNote[e.which]
                , velocity: 127
                , delay: (new Date().getTime() - startTime) / 1000
            });
        }
    });

    document.body.addEventListener('keyup', function(e) {
        MIDI.noteOff(0, keyToNote[e.which], 0);
        playing[e.which] = false;
        notesPlayed.push({
            on: false
            , channel: 0
            , note: keyToNote[e.which]
            , delay: (new Date().getTime() - startTime) / 1000
        });
    });

    var confSubmit = document.getElementById('submitVote');
    confSubmit.addEventListener('click', function(e) {
        socks.publish({
            timesigover: document.getElementById('timesigover').value,
            timesigunder: document.getElementById('timesigunder').value,
            bpm: document.getElementById('bpm').value,
            measurelen: document.getElementById('measurelen').value
        }, function(data){
            document.getElementById('possibleVotes').innerHTML = '';
            for (var i=0 ; i < data.publication.length; ++i) {
                document.getElementById('possibleVotes').innerHTML += songInfoVote(data.publication[i]);
            }
            configVoteSubmit();
        });
    });
    
    function configVoteSubmit() {
        var submitConfigVote = document.getElementById('submitConfigVote');
        submitConfigVote.addEventListener('click', function(e) {
            var possible_votes = document.getElementById('possibleVotes');
            var radios = possible_votes.getElementsByTagName('input');
            for (var i=0; i < radios.length; ++i) {
                if (radios[i].checked === true) {
                    socks.publish({ws_id: radios[i].value}, function(data) {});
                }
            }
        });            
    }
    
    function startPlaying() {
        notesPlayed = [];
        startTime = new Date().getTime();
    }

    function playback() {
        notesPlayed.forEach(function(note) {
            console.log(note);
            if (note.on) {
                MIDI.noteOn(note.channel, note.note, note.velocity, note.delay);
            }
            else {
                MIDI.noteOff(note.channel, note.note, note.delay);
            }
        });
    }

    function sendRecording() {
        socks.publish(notesPlayed, alert);
    }

    function updateNotes() {
        var keys, beginnerMode = document.getElementById('beginnerMode').checked;
        var rootNote = (+ document.getElementById('rootNote').value);
        var majorKey = !!document.getElementById('modeSelect').value;
        var octaveOffset = 12 * document.getElementById('octave').value;

        if (beginnerMode) {
            keys = [65, 83, 68, 70, 71, 72, 74, 75];
            if (majorKey) {
                notes = [0, 2, 4, 5, 7, 9, 11, 12];
            }
            else {
                notes = [0, 2, 3, 5, 7, 8, 10, 12];
            }
        }
        else {
            keys = [65, 87, 83, 69, 68, 70, 84, 71, 89, 72, 85, 74, 75];
        }

        keyToNote = {};

        keys.forEach(function(key, index) {
            var offset = beginnerMode ? notes[index] : index
            keyToNote[key] = rootNote + offset + octaveOffset;
        });
    }
}());

function socketTown() {
    function init() {
        var host = 'localhost';
        var port = '8888';
        var uri = '';

        ws = new WebSocket("ws://" + host + ":" + port + uri);
        ws.onmessage = function(evt) {
            alert("message received: " + evt.data);
            if (socks.callback) { socks.callback(JSON.parse(evt.data)); }
        };
        ws.onclose = function(evt) { alert("Connection close"); };
    }

  	function publish(message, callback) {
  	    socks.callback = callback;
		var message = { 'event': 'publish', 'parameters': {'message': message} }
		ws.send(JSON.stringify(message));
	}
	function close_conn() { ws.close(); }
	
	return {
	    init: init,
	    publish: publish,
	    close: close_conn
	}
}

socks = socketTown();
socks.init();
