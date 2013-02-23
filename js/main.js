(function() {
    keyToNote = {
        65: 21 //A
        , 87: 21 //W
        , 83: 21 //S
        , 69: 21 //E
        , 68: 21 //D
        , 82: 21 //R
        , 70: 21 //F
        , 84: 21 //T
        , 71: 21 //G
        , 89: 21 //Y
        , 72: 21 //H
        , 85: 21 //U
        , 74: 21 //J
        , 75: 21 //K
    };

    document.body.addEventListener('keydown', function(e) {
        if (!e.repeat){
            MIDI.noteOn(0, keyToNote[e.which], 127, 0);
        }
    });

    document.body.addEventListener('keyup', function(e) {
            MIDI.noteOff(0, keyToNote[e.which], 0);
    });

    MIDI.loadPlugin(function() {
        for (var i = 0; i < 100; i++) {
                var delay = i / 4;
                var note = MIDI.pianoKeyOffset + i;
                var velocity = 127;
        }
    }, 'lib/MIDI.js/MIDI/soundfont/soundfont-ogg-guitar.js');
}());
