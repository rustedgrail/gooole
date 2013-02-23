(function() {
    MIDI.loadPlugin(function() { }, 'lib/MIDI.js/MIDI/soundfont/soundfont-ogg-guitar.js');
    var songInfoTemplate = Handlebars.compile(document.getElementById('songInfoTemplate').innerHTML);

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

    var playing = {};

    document.getElementById('submitKeyChange').addEventListener('click', updateNotes);
    document.body.addEventListener('keydown', function(e) {
        if (!playing[e.which]) {
            MIDI.noteOn(0, keyToNote[e.which], 127, 0);
            playing[e.which] = true;
        }
    });

    document.body.addEventListener('keyup', function(e) {
        MIDI.noteOff(0, keyToNote[e.which], 0);
        playing[e.which] = false;
    });

    var submit = document.getElementById('submitVote');
    console.log(submit);
    submit.addEventListener('click', function(e) {
        socks.publish({
            timesigover: document.getElementById('timesigover').value,
            timesigunder: document.getElementById('timesigunder').value,
            bpm: document.getElementById('bpm').value,
            measurelen: document.getElementById('measurelen').value
        })
    });

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
        var host = '192.168.1.157';
        var port = '8888';
        var uri = '';

        ws = new WebSocket("ws://" + host + ":" + port + uri);
        ws.onmessage = function(evt) {alert("message received: " + evt.data)};
        ws.onclose = function(evt) { alert("Connection close"); };
    }

  	function publish(message) {
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
