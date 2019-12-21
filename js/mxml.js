saveMxmlOutput = function(logo) {
    console.log("data is ");
    console.log(logo);

    console.log(logo.notationStaging);

    var res = "";
    var indent = 0;
    add = function(str) {
        for(var i = 0; i < indent; i++) {
            res += "    ";
        }
        res += str + '\n';
    }

    add('<?xml version=\'1.0\' encoding=\'UTF-8\'?>')
    add('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">');
    add('<score-partwise version=\"3.1\">')
    indent++;
        add('<part-list>');
        indent++;
            add('<score-part id="P1">');
            indent++;
                add('<part-name>Music</part-name>');
                indent--;
            add('</score-part>');
            indent--;
        add('</part-list>');

        add('<part id="P1">');
        indent++;

        // assume 4/4 time, 32 divisions bc smallest note is 1/32
        // key is C by default
            add('<measure number="1"> <attributes> <divisions>32</divisions> <key> <fifths>0</fifths> </key> <time> <beats>4</beats> <beat-type>4</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>')
            indent++;
                var divisionLeft = 32;
                console.log("logo notation staging is");
                console.log(logo.notationStaging);
                var notes = logo.notationStaging[0];

                console.log(notes);
                for(var obj of notes) {
                    console.log(obj);

                    // We only add </chord> tag to the non-first elements in a chord
                    var isChordNote = false;
                    for(var p of obj[0]) {
                        console.log("pitch is " + obj[0][0]);
                        console.log("type of duration note is "+obj[1]);
                        console.log("number of dots is "+obj[2]);
    
                        var alter;
    
                        if(p[1] === '\u266d') {
                            alter = -1; // flat
                        } else if(p[1] === '\u266F') {
                            alter = 1; // sharp
                        } else {
                            alter = 0; // no accidental
                        }
    
                        console.log("alter is "+alter)
                        
                        add('<note>');
                        indent++;
                            if(isChordNote) add('<chord/>');
                            add('<pitch>')
                            indent++;
                                add('<step>' + p[0] + '</step>');
                                add('<octave>' + p[p.length-1] + '</octave>');
                                if(alter != 0)
                                    add('<alter>' + alter + '</alter>');
                                indent--;
                            add('</pitch>');
                    
                        
                            var dur = 32/obj[1];
                            for(var i = 0; i < obj[2]; i++) dur += dur/2;
    
                            add('<duration>'+ dur + '</duration>');
                            indent--;
                        add('</note>')
                        isChordNote = true;
                    }
                }

                indent--;
            add('</measure>');
            indent--;
        add('</part>');
        indent--;
    add('</score-partwise>');

    return res;
}
