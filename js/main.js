(function() {
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

    MIDI.loadPlugin(function() { },
    'lib/MIDI.js/MIDI/soundfont/soundfont-ogg-guitar.js');
}());
