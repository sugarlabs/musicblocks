var SAMPLES_MANIFEST = {
    "voice": [
        {"name": "violin", "data_name": "violin"},
        {"name": "cello", "data_name": "cello"},
        {"name": "flute", "data_name": "flute"},
        {"name": "guitar", "data_name": "guitar"},
        {"name": "basse", "data_name": "basse"}
    ],
    "drum": [
        {"name": "bottle", "data_name": "bottle"},
        {"name": "clap", "data_name": "clap"},
        {"name": "darbuka drum", "data_name": "darbuka"},
        {"name": "hi hat", "data_name": "hihat"},
        {"name": "splash", "data_name": "splash"},
        {"name": "bubbles", "data_name": "bubbles"},
        {"name": "cow bell", "data_name": "cowbell"},
        {"name": "dog", "data_name": "dog"},
        {"name": "kick drum", "data_name": "kick"},
        {"name": "tom tom", "data_name": "tom"},
        {"name": "cat", "data_name": "cat"},
        {"name": "crash", "data_name": "crash"},
        {"name": "duck", "data_name": "duck"},
        {"name": "ride bell", "data_name": "ridebell"},
        {"name": "triangle bell", "data_name": "triangle"},
        {"name": "chine", "data_name": "chine"},
        {"name": "cricket", "data_name": "cricket"},
        {"name": "finger cymbals", "data_name": "fingercymbal"},
        {"name": "slap", "data_name": "slap"},
        {"name": "clang", "data_name": "clang"},
        {"name": "cup drum", "data_name": "cup"},
        {"name": "floor tom tom", "data_name": "floortom"},
        {"name": "snare drum", "data_name": "snare"}
    ]
}

var SOUNDSAMPLESDEFINES = [];

for (var type in SAMPLES_MANIFEST) {
    if (SAMPLES_MANIFEST.hasOwnProperty(type)) {
        for (var sample in SAMPLES_MANIFEST[type]){
            if (SAMPLES_MANIFEST[type].hasOwnProperty(sample)){
                var req = "samples/"+SAMPLES_MANIFEST[type][sample].data_name;
                SOUNDSAMPLESDEFINES.push(req);
            }
        }
    }
}
console.log(SOUNDSAMPLESDEFINES);