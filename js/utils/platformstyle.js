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
    blockText: '#282828',
    paletteColors: {
	'widgets': ['#7CD622', '#57AD02', '#77C428'],
	'pitch': ['#7CD622', '#57AD02', '#77C428'],
	'rhythm': ['#FE994F', '#E86B0E', '#FF8B2D'],
	'meter': ['#FE994F', '#E86B0E', '#FF8B2D'],
	'tone': ['#3EDCDD', '#1DBCBD', '#25C3C0', '#47E0DB'],
	'intervals': ['#7CD622', '#57AD02', '#77C428'],
	'volume': ['#3EDCDD', '#1DBCBD', '#25C3C0', '#47E0DB'],
	'drum': ['#3EDCDD', '#1DBCBD', '#25C3C0', '#47E0DB'],
	'mouse': ['#92A9FF', '#5370DC', '#728FF9'],
	'pen': ['#92A9FF', '#5370DC', '#728FF9'],
	'boxes': ['#FFBF00', '#DAAF30', '#DAA926', '#F6C444'],
	'action': ['#FFBF00', '#DAAF30', '#DAA926', '#F6C444'],
	'media': ['#FF664B', 'EA4326', '#FF5942'],
	'number': ['#FF6EA1', '#FF2C76', '#FF5293'],
	'boolean': ['#D97DF5', '#B653D3', '#C96DF3'],
	'flow': ['#D98A43', '#B7651A', '#D68136'],
	'sensors': ['#FF664B', 'EA4326', '#FF5942'],
	'extras': ['#C4C4C4', '#A0A0A0', '#B0B0B0'],
	'myblocks': ['#C4C4C4', '#A0A0A0', '#B0B0B0'],
	'heap': ['#D98A43', '#B7651A', '#D68136'],
	'mice': ['#92A9FF', '#5370DC', '#728FF9']
    },
    // header: platform.FF? '#00539F' : '#2196F3',
    // header: platform.FF? '#2584af' : '#2584af',  // 10B 5/8
    header: platform.FF? '#4DA6FF' : '#4DA6FF',
    aux: '#1A8CFF',
    sub: '#8CC6FF',
    doHeaderShadow: !platform.FF,
    // background: platform.FF? '#00CAF2' : '#96D3F3'
    // background: platform.FF? '#92b5c8' : '#92b5c8' // 2.5B 7/4
    // ruleColor: '#e3e3e3', // 2.5B 9/0
    rule: '#E2E2E2',
    ruleColor: '#E2E2E2',
    trashColor: '#C0C0C0',
    trashBorder: '#808080',
    trashActive: '#FF0000',
    // background: '#E8E8E8', // '#ACD0E4'  // 2.5B 8/4
    background: '#F9F9F9', // '#ACD0E4'  // 2.5B 8/4
    paletteSelected: '#F3F3F3',
    paletteBackground: '#FFFFFF',
    paletteText: '#666666',
    // selectorBackground: '#2584AF',
    selectorBackground: '#8CC6FF',
    selectorSelected: '#1A8CFF',
};

document.querySelector('meta[name=theme-color]')
        .content = platformColor.header;


function showButtonHighlight(x, y, r, event, scale, stage) {
    if (platform.FFOS) return {};
    return showMaterialHighlight(x, y, r, event, scale, stage);
};
