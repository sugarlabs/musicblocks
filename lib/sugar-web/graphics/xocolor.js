define(function () {

    'use strict';

    var xocolor = {};

    xocolor.colors = [
        {
            stroke: '#B20008',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#B20008'
        },
        {
            stroke: '#E6000A',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#E6000A'
        },
        {
            stroke: '#FFADCE',
            fill: '#FF2B34'
        },
        {
            stroke: '#9A5200',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#9A5200'
        },
        {
            stroke: '#FF8F00',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#FF8F00'
        },
        {
            stroke: '#FFC169',
            fill: '#FF2B34'
        },
        {
            stroke: '#807500',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#807500'
        },
        {
            stroke: '#BE9E00',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#BE9E00'
        },
        {
            stroke: '#F8E800',
            fill: '#FF2B34'
        },
        {
            stroke: '#008009',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#008009'
        },
        {
            stroke: '#00B20D',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#00B20D'
        },
        {
            stroke: '#8BFF7A',
            fill: '#FF2B34'
        },
        {
            stroke: '#00588C',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#00588C'
        },
        {
            stroke: '#005FE4',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#005FE4'
        },
        {
            stroke: '#BCCDFF',
            fill: '#FF2B34'
        },
        {
            stroke: '#5E008C',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#5E008C'
        },
        {
            stroke: '#7F00BF',
            fill: '#FF2B34'
        },
        {
            stroke: '#FF2B34',
            fill: '#7F00BF'
        },
        {
            stroke: '#D1A3FF',
            fill: '#FF2B34'
        },
        {
            stroke: '#9A5200',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#9A5200'
        },
        {
            stroke: '#C97E00',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#C97E00'
        },
        {
            stroke: '#FFC169',
            fill: '#FF8F00'
        },
        {
            stroke: '#807500',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#807500'
        },
        {
            stroke: '#BE9E00',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#BE9E00'
        },
        {
            stroke: '#F8E800',
            fill: '#FF8F00'
        },
        {
            stroke: '#008009',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#008009'
        },
        {
            stroke: '#00B20D',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#00B20D'
        },
        {
            stroke: '#8BFF7A',
            fill: '#FF8F00'
        },
        {
            stroke: '#00588C',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#00588C'
        },
        {
            stroke: '#005FE4',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#005FE4'
        },
        {
            stroke: '#BCCDFF',
            fill: '#FF8F00'
        },
        {
            stroke: '#5E008C',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#5E008C'
        },
        {
            stroke: '#A700FF',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#A700FF'
        },
        {
            stroke: '#D1A3FF',
            fill: '#FF8F00'
        },
        {
            stroke: '#B20008',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#B20008'
        },
        {
            stroke: '#FF2B34',
            fill: '#FF8F00'
        },
        {
            stroke: '#FF8F00',
            fill: '#FF2B34'
        },
        {
            stroke: '#FFADCE',
            fill: '#FF8F00'
        },
        {
            stroke: '#807500',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#807500'
        },
        {
            stroke: '#BE9E00',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#BE9E00'
        },
        {
            stroke: '#FFFA00',
            fill: '#EDDE00'
        },
        {
            stroke: '#008009',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#008009'
        },
        {
            stroke: '#00EA11',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#00EA11'
        },
        {
            stroke: '#8BFF7A',
            fill: '#F8E800'
        },
        {
            stroke: '#00588C',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#00588C'
        },
        {
            stroke: '#00A0FF',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#00A0FF'
        },
        {
            stroke: '#BCCEFF',
            fill: '#F8E800'
        },
        {
            stroke: '#5E008C',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#5E008C'
        },
        {
            stroke: '#AC32FF',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#AC32FF'
        },
        {
            stroke: '#D1A3FF',
            fill: '#F8E800'
        },
        {
            stroke: '#B20008',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#B20008'
        },
        {
            stroke: '#FF2B34',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#FF2B34'
        },
        {
            stroke: '#FFADCE',
            fill: '#F8E800'
        },
        {
            stroke: '#9A5200',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#9A5200'
        },
        {
            stroke: '#FF8F00',
            fill: '#F8E800'
        },
        {
            stroke: '#F8E800',
            fill: '#FF8F00'
        },
        {
            stroke: '#FFC169',
            fill: '#F8E800'
        },
        {
            stroke: '#008009',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#008009'
        },
        {
            stroke: '#00B20D',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#00B20D'
        },
        {
            stroke: '#8BFF7A',
            fill: '#00EA11'
        },
        {
            stroke: '#00588C',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#00588C'
        },
        {
            stroke: '#005FE4',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#005FE4'
        },
        {
            stroke: '#BCCDFF',
            fill: '#00EA11'
        },
        {
            stroke: '#5E008C',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#5E008C'
        },
        {
            stroke: '#7F00BF',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#7F00BF'
        },
        {
            stroke: '#D1A3FF',
            fill: '#00EA11'
        },
        {
            stroke: '#B20008',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#B20008'
        },
        {
            stroke: '#FF2B34',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#FF2B34'
        },
        {
            stroke: '#FFADCE',
            fill: '#00EA11'
        },
        {
            stroke: '#9A5200',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#9A5200'
        },
        {
            stroke: '#FF8F00',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#FF8F00'
        },
        {
            stroke: '#FFC169',
            fill: '#00EA11'
        },
        {
            stroke: '#807500',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#807500'
        },
        {
            stroke: '#BE9E00',
            fill: '#00EA11'
        },
        {
            stroke: '#00EA11',
            fill: '#BE9E00'
        },
        {
            stroke: '#F8E800',
            fill: '#00EA11'
        },
        {
            stroke: '#00588C',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#00588C'
        },
        {
            stroke: '#005FE4',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#005FE4'
        },
        {
            stroke: '#BCCDFF',
            fill: '#00A0FF'
        },
        {
            stroke: '#5E008C',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#5E008C'
        },
        {
            stroke: '#9900E6',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#9900E6'
        },
        {
            stroke: '#D1A3FF',
            fill: '#00A0FF'
        },
        {
            stroke: '#B20008',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#B20008'
        },
        {
            stroke: '#FF2B34',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#FF2B34'
        },
        {
            stroke: '#FFADCE',
            fill: '#00A0FF'
        },
        {
            stroke: '#9A5200',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#9A5200'
        },
        {
            stroke: '#FF8F00',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#FF8F00'
        },
        {
            stroke: '#FFC169',
            fill: '#00A0FF'
        },
        {
            stroke: '#807500',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#807500'
        },
        {
            stroke: '#BE9E00',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#BE9E00'
        },
        {
            stroke: '#F8E800',
            fill: '#00A0FF'
        },
        {
            stroke: '#008009',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#008009'
        },
        {
            stroke: '#00B20D',
            fill: '#00A0FF'
        },
        {
            stroke: '#00A0FF',
            fill: '#00B20D'
        },
        {
            stroke: '#8BFF7A',
            fill: '#00A0FF'
        },
        {
            stroke: '#5E008C',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#5E008C'
        },
        {
            stroke: '#7F00BF',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#7F00BF'
        },
        {
            stroke: '#D1A3FF',
            fill: '#AC32FF'
        },
        {
            stroke: '#B20008',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#B20008'
        },
        {
            stroke: '#FF2B34',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#FF2B34'
        },
        {
            stroke: '#FFADCE',
            fill: '#AC32FF'
        },
        {
            stroke: '#9A5200',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#9A5200'
        },
        {
            stroke: '#FF8F00',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#FF8F00'
        },
        {
            stroke: '#FFC169',
            fill: '#AC32FF'
        },
        {
            stroke: '#807500',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#807500'
        },
        {
            stroke: '#BE9E00',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#BE9E00'
        },
        {
            stroke: '#F8E800',
            fill: '#AC32FF'
        },
        {
            stroke: '#008009',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#008009'
        },
        {
            stroke: '#00B20D',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#00B20D'
        },
        {
            stroke: '#8BFF7A',
            fill: '#AC32FF'
        },
        {
            stroke: '#00588C',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#00588C'
        },
        {
            stroke: '#005FE4',
            fill: '#AC32FF'
        },
        {
            stroke: '#AC32FF',
            fill: '#005FE4'
        },
        {
            stroke: '#BCCDFF',
            fill: '#AC32FF'
        }
    ];

    return xocolor;
});
