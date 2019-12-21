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
            var currMeasure = 1;
            add('<measure number="1"> <attributes> <divisions>32</divisions> <key> <fifths>0</fifths> </key> <time> <beats>4</beats> <beat-type>4</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>')
            indent++;
                var divisionsLeft = 32;
                console.log("logo notation staging is");
                console.log(logo.notationStaging);
                var notes = logo.notationStaging[0];

                console.log(notes);
                var cnter = 0;
                console.log(notes.length);

                for(var i = 0; i < notes.length; i += 1) {
                    // obj = [note, duration, dotCount, tupletValue, roundDown, insideChord, staccato]
                    var obj = notes[i];
                    if(['tie', 'begin slur', 'end slur'].includes(obj)) {
                        continue;
                    }
                    // cnter++;
                    // if(cnter > 10) break;
                    console.log(obj);

                    console.log("i is "+i)

                    // // We only add </chord> tag to the non-first elements in a chord
                    var isChordNote = false;
                    for(var p of obj[0]) {
                        console.log("pitch is " + obj[0][0]);
                        console.log("type of duration note is "+obj[1]);
                        console.log("number of dots is "+obj[2]);

                        var dur = 32/obj[1];
                        for(var j = 0; j < obj[2]; j++) dur += dur/2;

                        if(divisionsLeft < dur && !isChordNote) {
                            add('</measure>')
                            currMeasure++;
                            add('<measure number=\"' + currMeasure + '\"> ');
                            divisionsLeft = 32;
                        } else if(!isChordNote){
                            divisionsLeft -= dur;
                        }
    
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
                            add('<notations>')
                            indent++;
                                add('<articulations>');
                                indent++;
                                    if(obj[6]) {
                                        add('<staccato placement=\"below\"/>');
                                    }
                                    indent--;
                                add('</articulations>');
                                indent--;
                            if(notes[i-1] === 'begin slur') {
                                indent++;
                                    add('<slur type=\"start\"/>');
                                    indent--;
                            }
                            if(notes[i+1] === 'end slur') {
                                indent++;
                                    add('<slur type="\stop\"/>')
                                    indent--;
                            }
                            add('</notations>');

                            add('<pitch>')
                            indent++;
                                add('<step>' + p[0] + '</step>');
                                add('<octave>' + p[p.length-1] + '</octave>');
                                if(alter != 0)
                                    add('<alter>' + alter + '</alter>');
                                indent--;
                            add('</pitch>');
    
                            add('<duration>'+ dur + '</duration>');
                            if(notes[i+1] === 'tie') {
                                add('<tie type=\"start\"/>');
                            } else if(notes[i-1] === 'tie') {
                                add('<tie type=\"end\"/>');
                            }
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
