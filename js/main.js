(function() {
    MIDI.loadPlugin(function() {}, 'lib/MIDI.js/MIDI/soundfont/soundfont-ogg-guitar.js');

    var songInfoVote = Handlebars.compile(document.getElementById('songVoteTemplate').innerHTML);
    var recordingVote = Handlebars.compile(document.getElementById('recordingVoteTemplate').innerHTML);
    var currentTrackTempl = Handlebars.compile(document.getElementById('currentTrackTemplate').innerHTML);

    var songInfo = {
        measurelen: 4
        , timesigover: 4
        , timesigunder: 4
        , bpm: 120
    };

    var soundChangeKeys = {
        90: octaveUp
        , 88: octaveDown
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

    var events = {
        playRecording: playRecording
        , startPlaying: startCountdown
        , submitKeyChange: updateNotes
        , playback: playback
        , sendRecording: sendRecording
        , playCurrentTrack: playCurrentTrack
        , submitVote: submitVote
        , freePlay: freePlay
    };

    var pubs = {}
    , notesPlayed = []
    , startTime = new Date().getTime()
    , playing = {}
    , currentTrack = []
    , freePlayMode = false;

    document.body.addEventListener('click', function(e) {
        var event = e.target.getAttribute('data-event');
        if (event && typeof events[event] === 'function') {
            events[event](e)
        }
    });

    document.body.addEventListener('keydown', function(e) {
        if (typeof soundChangeKeys[e.which] === 'function') {
            soundChangeKeys[e.which]();
            return;
        }

        var can_play = freePlayMode || (currentlyRecording && !playing[e.which]);
        if (can_play) {
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

    document.getElementById('countdownVideo').addEventListener('ended', startPlaying);
    document.getElementById('beginnerMode').addEventListener('change', beginnerMode);

    function freePlay(e) {
        freePlayMode = e.target.checked;
        document.getElementById('startPlaying').disabled = freePlayMode;
        document.getElementById('playback').disabled = freePlayMode;
        document.getElementById('sendRecording').disabled = freePlayMode;
    }

    function beginnerMode(e) {
        var mode = document.getElementById('modeSelect');
        mode.disabled = !e.target.checked;
    }

    var votedConfs = {};
    var currentlyRecording = false;

    function startCountdown() {
            var video = document.getElementById('countdownVideo');
            video.load();
            video.playbackRate = songInfo.bpm / 60;
            video.style.display = 'inline';
            video.play();
        }

    function submitVote(e) {
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

        configVoteSubmit(timeSigVoteCallback);
    }

    function timeSigVoteCallback(data) {
	var winning_ws = data.publication.winner;
	songInfo = votedConfs[winning_ws];
	renderCurrentTrackTemplate();
	document.getElementById('possibleVotes').innerHTML = 'To start next track, please press "Start Recording"';
    }

    function musicVoteCallback(data) {
	var winning_ws = data.publication.winner;
	currentTrack = currentTrack.concat(pubs[winning_ws]);
	renderCurrentTrackTemplate();
	document.getElementById('possibleVotes').innerHTML = 'To start next track, please press "Start Recording"';
    }

    function configVoteSubmit(callback) {
        events.submitConfigVote = function(e) {
            var possible_votes = document.getElementById('possibleVotes');
            var radios = possible_votes.getElementsByTagName('input');
            for (var i=0; i < radios.length; ++i) {
                if (radios[i].checked === true) {
                    socks.send('vote', radios[i].value, callback);
                    break;
                }
            }
        }
    }

    window.startPlaying = startPlaying;
    function startPlaying() {
        document.getElementById('countdownVideo').style.display = 'none';
        if (document.getElementById('metronome').checked) {
            try {
                createMetronome();
            }
            catch (e) {
                alert('Your browser does now support web audio');
            }
        }
        initializeRecording();
    }

    function initializeRecording() {
        currentlyRecording = true;
        notesPlayed = [];
        startTime = new Date().getTime();

        var numBeats = songInfo.measurelen * songInfo.timesigover
        var trackLength = numBeats  / songInfo.bpm * 60 * 1000;
        var recording = document.getElementById('recordingCircle');
        recording.style.display = 'inline-block';

        document.getElementById('freePlayBox').disabled = true;
        playCurrentTrack(); /* Playback while recording */

        setTimeout(function() {
            recording.style.display = 'none';
            currentlyRecording = false;
            document.getElementById('freePlayBox').disabled = false;
        }, trackLength);
    }

    function createMetronome(numBeats) {
        var i, offset, osc, audio = new webkitAudioContext()
        var secsPerBeat = (1 / (songInfo.bpm / 60));
        var numBeats = songInfo.measurelen * songInfo.timesigover

        for(i = 0; numBeats > i; i++) {
            offset = (i * secsPerBeat);
            osc = audio.createOscillator();
            osc.connect(audio.destination);
            osc.frequency.value = 440.0;
            osc.noteOn(audio.currentTime + offset);
            osc.noteOff(audio.currentTime + offset + .05);
        }
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

        var trackLength = songInfo.measurelen * songInfo.timesigover / songInfo.bpm;
        trackLength = trackLength * 60 * 1000;

        var loop = document.getElementById('loop');
        if (loop && loop.checked) {
            setTimeout(playCurrentTrack, trackLength);
        }
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

        configVoteSubmit(musicVoteCallback);
    }

    function renderCurrentTrackTemplate() {
        songInfo.currentTrack = currentTrack.length
        document.getElementById('voteControls').innerHTML = currentTrackTempl(songInfo);
    }

    function octaveUp() {
        var octaveControl = document.getElementById('octave');
        var currentOctave = octaveControl.value;
        octaveControl.value = Math.min(7, (+ currentOctave) + 1);
        updateNotes();
    }

    function octaveDown() {
        var octaveControl = document.getElementById('octave');
        var currentOctave = octaveControl.value;
        octaveControl.value = Math.max(1, (+ currentOctave) - 1);
        updateNotes();
    }

    function updateNotes() {
        var keys, beginnerMode = document.getElementById('beginnerMode').checked;
        var rootNote = (+ document.getElementById('rootNote').value);
        var majorKey = !!document.getElementById('modeSelect').value;
        var octaveOffset = 12 * (+ document.getElementById('octave').value);

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

