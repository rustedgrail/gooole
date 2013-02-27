(function() {
    MIDI.loadPlugin(function() {}, 'lib/MIDI.js/MIDI/soundfont/soundfont-ogg-guitar.js');

    var songInfoVote = Handlebars.compile(document.getElementById('songVoteTemplate').innerHTML);
    var recordingVote = Handlebars.compile(document.getElementById('recordingVoteTemplate').innerHTML);
    var currentTrackTempl = Handlebars.compile(document.getElementById('currentTrackTemplate').innerHTML);

    var songInfo = {
        measureslen: 8
        , timesigover: 7
        , timesigunder: 8
        , bpm: 246
    };

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

    var pubs = {}, notesPlayed = [], startTime = new Date().getTime(), playing = {}, currentTrack = [];

    document.getElementById('possibleVotes').addEventListener('click', playRecording);
    document.getElementById('voteControls').addEventListener('click', playCurrentTrack);
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

    var votedConfs = {};
    var confSubmit = document.getElementById('submitVote');
    confSubmit.addEventListener('click', function(e) {
        socks.send('publish', {
            timesigover: document.getElementById('timesigover').value,
            timesigunder: document.getElementById('timesigunder').value,
            bpm: document.getElementById('bpm').value,
            measurelen: document.getElementById('measurelen').value
        }, function(data){
            document.getElementById('possibleVotes').innerHTML = '';
            votedConfs = data.publication;
            for (pub in data.publication) {
                data.publication[pub].ws_id = pub;
                document.getElementById('possibleVotes').innerHTML += songInfoVote(data.publication[pub]);
            }
        });
        
        configVoteSubmit(function(data) {
            var winning_ws = data.publication.winner;
            songInfo = votedConfs[winning_ws];
            renderCurrentTrackTemplate();
            document.getElementById('possibleVotes').innerHTML = '';
        });
    });

    function configVoteSubmit(callback) {
        var submitConfigVote = document.getElementById('submitConfigVote');
        submitConfigVote.addEventListener('click', function(e) {
            var possible_votes = document.getElementById('possibleVotes');
            var radios = possible_votes.getElementsByTagName('input');
            for (var i=0; i < radios.length; ++i) {
                if (radios[i].checked === true) {
                    socks.send('vote', radios[i].value, callback);
                    break;
                }
            }
        });
    }

    function startPlaying() {
        notesPlayed = [];
        startTime = new Date().getTime();
    }

    function playback() {
        playbackAnyTrack(notesPlayed);
    }

    function playRecording(e) {
        var target = e.target;
        if (target.getAttribute('data-event')) {
            playbackAnyTrack(pubs[target.getAttribute('data-wsId')]);
        }
    }

    function playbackAnyTrack(notesPlayed) {
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

    function playCurrentTrack() {
        playbackAnyTrack(currentTrack);
    }

    function sendRecording() {
        socks.send('publish', notesPlayed, startVoteOnMusic);
    }

    function startVoteOnMusic(data) {
        pubs = data.publication;
        var span = document.getElementById('possibleVotes');
        span.innerHTML = '';
        for (key in pubs) {
            span.innerHTML += recordingVote({ws_id: key});
        }

        configVoteSubmit(function(data) {
            var winning_ws = data.publication.winner;
            currentTrack = currentTrack.concat(pubs[winning_ws]);
            renderCurrentTrackTemplate();
        });
    }

    function renderCurrentTrackTemplate() {
        songInfo.currentTrack = currentTrack.length
        document.getElementById('voteControls').innerHTML = currentTrackTempl(songInfo);
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
    var ws;
    var round=0;

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

    function send(event, message, callback) {
        socks.callback = callback;
        var message = {event: event, round: round, parameters: {message: message}}
        ws.send(JSON.stringify(message));
    }

	function close_conn() { ws.close(); }
	
	return {
	    init: init,
	    send: send,
	    close: close_conn
	}
}

socks = socketTown();
socks.init();
