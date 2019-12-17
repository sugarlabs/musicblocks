    processMxmlNotes = function(data) {
    data = JSON.parse(data);
    var res = '';

    add = function(str) {
        res += str + '\n';
    }


    // temp until i get more things sorted out
    ignore = ['start', 'hidden', 'vspace'];
    pitches = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti', 'da'];
    letters = 'CDEFGAB';

    // Header
    add('<?xml version=\'1.0\' encoding=\'UTF-8\'?>')
    add('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">');
    add('<score-partwise version=\"3.1\">')
        add('<part-list>');
            add('<score-part id="P1">');
                add('<part-name>Music</part-name>');
            add('</score-part>');
        add('</part-list>');

        add('<part id="P1">')

            var currentMeasure = 1;
            // assume 4/4 time, 32 divisions bc smallest note is 1/32
            // key is C by default
            add('<measure number="1"> <attributes> <divisions>32</divisions> <key> <fifths>0</fifths> </key> <time> <beats>4</beats> <beat-type>4</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>')
            var currentMeasureLen = 0;
            var divPerBeat = 32;
            var divPerMeasure = divPerBeat*4;
            for(var i = 0; i < data.length; i++) {
                var type = data[i][1][0];
                if(ignore.indexOf(type) !== -1) {
                    continue;
                }
                // todo: fill with rests, support more than one measure
                // Parse note
                if(type === 'newnote') {
                    var num = data[i+2][1][1].value;
                    var denom = data[i+3][1][1].value;
                    
                    var num4 = num*(4/denom);
                    var denom4 = 4;

                    if(currentMeasureLen+(num4*divPerBeat) > divPerMeasure) {
                        currentMeasureLen = 0;
                        add('</measure>')
                        currentMeasure++;
                        add('<measure number=\"' + currentMeasure + '\">')
                    } else {
                        currentMeasureLen += num4*divPerBeat;
                    }


                    add('<note>')
                    var pitch = data[i+6][1][1].value;
                    var octave = data[i+7][1][1].value;

                    var alter;
                    
                    console.log(pitch[pitch.length-1] === '\ud834');

                    if(pitch[pitch.length-1] === '\u266d') {
                        alter = -1; // flat
                    } else if(pitch[pitch.length-1] === '\u266F') {
                        alter = 1; // sharp
                    } else if(pitch[pitch.length-2] + pitch[pitch.length-1] === '\uD834\uDD2B') {
                        alter = -2; // double flat
                    } else if(pitch[pitch.length-2] + pitch[pitch.length-1] === '\uD834\uDD2A') {
                        alter = 2; // double sharp
                    } else {
                        alter = 0; // no accidental
                    }
                    
                    if(alter !== 0) {
                        var newPitch = '';
                        alphabet = 'abcdefghijklmnopqrstuvwxyz';
                        for(var j = 0; j < pitch.length; j++) {
                            if(alphabet.includes(pitch[j])) newPitch += pitch[j];
                        }
                        pitch = newPitch;
                    }

                    add('<pitch>')
                        add('<step>' + letters[pitches.indexOf(pitch)] + '</step>')
                        add('<octave>' + octave + '</octave>');
                        add('<alter> ' + alter + ' </alter>');
                    add('</pitch>')
                    

                    // convert to 4/4 time

                    add('<duration>' + num4*divPerBeat + '</duration>')                    
                    add('</note>')
                }
            }

            add('</measure>')
            
        add('</part>')
    add('</score-partwise>')


    return res;
}
