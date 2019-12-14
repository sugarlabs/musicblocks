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

            // assume 4/4 time, 32 divisions bc smallest note is 1/32
            // key is C by default
            add('<measure number="1"> <attributes> <divisions>32</divisions> <key> <fifths>0</fifths> </key> <time> <beats>4</beats> <beat-type>4</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>')
            for(var i = 0; i < data.length; i++) {
                var type = data[i][1][0];
                console.log("type is "+type);
                if(ignore.indexOf(type) !== -1) {
                    console.log("continuing");
                    continue;
                }
                // todo: fill with rests, support more than one measure
                // Parse note
                if(type === 'newnote') {
                    console.log("found newnote at pos i");
                    add('<note>')
                    
                    var num = data[i+2][1][1].value;
                    var denom = data[i+3][1][1].value;

                    console.log("num is "+num);
                    console.log('denom is '+denom);
                    
                    var pitch = data[i+6][1][1].value;
                    var octave = data[i+7][1][1].value;

                    console.log("pitch is "+pitch);
                    console.log("octave is "+octave);
                    add('<pitch>')
                        add('<step>' + letters[pitches.indexOf(pitch)] + '</step>')
                        add('<octave>' + octave + '</octave>');
                    add('</pitch>')

                    add('<duration>' + (32/denom) * num + '</duration>')
                    
                    add('</note>')
                }


                
            }
            add('</measure>')
        add('</part>')
    add('</score-partwise>')


    return res;
}
