/*
Copyright (C) 2015 Sam Parkinson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

window.platform = {
    android: /Android/i.test(navigator.userAgent),
    FF:      /Firefox/i.test(navigator.userAgent),
    mobile:  /Mobi/i   .test(navigator.userAgent),
    tablet:  /Tablet/i .test(navigator.userAgent)
};

platform.androidWebkit = platform.android && !platform.FF;
platform.FFOS = platform.FF
            && (platform.mobile || platform.tablet)
            && !platform.android;
console.log('On platform: ', platform);


window.platformColor = {
    // header: platform.FF? '#00539F' : '#2196F3',
    // header: platform.FF? '#2584af' : '#2584af',  // 10B 5/8
    header: platform.FF? '#4da6ff' : '#4da6ff',
    aux: '#1a8cff',
    sub: '#8cc6ff',
    doHeaderShadow: !platform.FF,
    // background: platform.FF? '#00CAF2' : '#96D3F3'
    // background: platform.FF? '#92b5c8' : '#92b5c8' // 2.5B 7/4
    // ruleColor: '#e3e3e3', // 2.5B 9/0
    ruleColor: '#e2e2e2',
    // background: '#e8e8e8', // '#acd0e4'  // 2.5B 8/4
    background: '#f9f9f9', // '#acd0e4'  // 2.5B 8/4
    paletteBackground: '#ffffff',
    paletteText: '#666666',
    // selectorBackground: '#2584af',
    selectorBackground: '#8cc6ff',
    selectorSelected: '#1a8cff',
};

document.querySelector('meta[name=theme-color]')
        .content = platformColor.header;


function showButtonHighlight(x, y, r, event, scale, stage) {
    if (platform.FFOS) return {};
    return showMaterialHighlight(x, y, r, event, scale, stage);
};
