processMxmlNotes = function(data) {
    data = JSON.parse(data);
    var res = '';
    
    newln = function() {
        res += '\n';
    }
    // Header
    res += '<?xml version=\'1.0\' encoding=\'UTF-8\'?>'
    newln();
    res += '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">';

    return res;
}
