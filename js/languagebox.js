// Copyright (c) 2018 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA



//A dropdown for selecting language
function LanguageBox () {
    var language = localStorage.languagePreference;
    this._message = null;
    this._container = null;
    var myDiv = docById('languageDiv');
    this._scale = 1;

    this.setMessage = function (message) {
        this._message = message;
        return this;
    };

    this.enUS_onclick=function(){
        language='en-US';
    };

    this.enUK_onclick=function(){
        language='en-UK';
    };

    this.ja_onclick=function(){
        language='ja';
    };

    this.kana_onclick=function(){
        language='kana';
    };

    this.es_onclick=function(){
        language='es';
    };

    this.zhCN_onclick=function(){
        language='zh-CN';
    };

    this.th_onclick=function(){
        language='th';
    };

    this.hi_onclick=function(){
        language='hi';
    };

    this.ibo_onclick=function(){
        language='ibo';
    };

    this.ar_onclick=function(){
        language='ar';
    };

    this.he_onclick=function(){
        language='he';
    };

    this.ayc_onclick=function(){
        language='ayc';
    };

    this.gug_onclick=function(){
        language='gug';
    };

    if (language == undefined || language === ''||language==='en-US'||language==='en-UK') {
        language = 'en';
    };

    this.hide=function(){

        const MSG = {
            'default': _('Refresh your browser to change your language preference.'),
            'en': 'Refresh your browser to change your language preference.',
            'ja': '言語を変更するにはブラウザを再起動する必要があります。',
            'kana': 'げんごを へんこうするには ブラウザを さいきどうする ひつようが あります。',
            'es': 'Actualice su navegador para cambiar su preferencia de idioma.',
            'zh-CN': '刷新浏览器以更改您的语言偏好',
            'th': 'รีเฟรชเบราเซอร์เพื่อเปลี่ยนการตั้งค่าภาษาของคุณ',
            'hi': 'अपनी भाषा की वरीयता बदलने के लिए अपना ब्राउज़र ताज़ा करें',
            'ibo': 'Mee ka nchọgharị gị gbanwee mmasị asụsụ gị.',
            'ar': 'حدث المتصفح لتغيير تفضيلات اللغة.',
            'he': 'רענן את הדפדפן כדי לשנות את העדפת השפה שלך.',
            'ayc': 'Actualice su navegador para cambiar su preferencia de idioma.',
            'gug': 'Actualice su navegador para cambiar su preferencia de idioma.',
        };
            
        console.log(MSG[language]);
        this._message(MSG[language]);
    };

    this.createdropdown=function(){

        const LANGS = [
            ['English (US)', 'en-US'],
            ['English (UK)', 'en-UK'],
            ['español', 'es'],
            ['日本語', 'ja'],
            ['にほんご', 'kana'],
            ['中文', 'zh-CN'],
            ['ภาษาไทย', 'th'],
            ['aymara', 'ayc'],
            ['guarani', 'gug'],
            ['हिंदी', 'hi'],
            ['igbo', 'ibo'],
            ['عربى', 'ar'],
            ['עִברִית', 'he'],
        ];
        
        var myDiv = docById('languageDiv');
        var selectOpt = '';

        var selected = localStorage.languagePreference;

        console.log(selected);
        if (selected == undefined || selected === '' || selected === 'en') {
            selected = 'en-US';
        }

        selectOpt += '<p>';
        for (var i = 0; i < LANGS.length; i++) {
            if (LANGS[i][1] === selected) {
                console.log('found selected: ' + LANGS[i][1]);
                selectOpt += '<p><input type="radio" id="lang' + i + '" name="languageName" checked="checked" value="' + LANGS[i][1] + '"/>' + LANGS[i][0] + '</br>'
            } else {
                selectOpt += '<p><input type="radio" id="lang' + i + '" name="languageName" value="' + LANGS[i][1] + '"/>' + LANGS[i][0] + '</br>'
            }
        }
        selectOpt += '</p>';

        myDiv.style.display = 'inline';
        myDiv.style.position = 'absolute';
        console.log(this._container.x + ' ' + this._container.y);
        myDiv.style.top = this._scale * (this._container.y + 60) + 'px';
        myDiv.style.left = this._scale * (this._container.x + 10) + 'px';
        myDiv.style.visibility = 'visible';
        myDiv.innerHTML = selectOpt;

        for (var i = 0; i < LANGS.length; i++) {
            var radioButton = docById('lang' + i);
            radioButton.onclick = function (event) {
                var elem = event.target;
                var n = Number(elem.id.replace('lang', ''));
                console.log('resetting language preference to ' + LANGS[n][1]);
                localStorage.setItem('languagePreference', LANGS[n][1]);
                localStorage.setItem('kanaPreference', null);
            };
        }
    };
};
