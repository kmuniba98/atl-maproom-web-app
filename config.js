'use strict';

const LAYERS = 'mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7';
const ACCESS_TOKEN = 'pk.eyJ1IjoiY2Zwb2xhY2siLCJhIjoiY2ppb3RlMXBiMGRjdzN2dDk3eWI2cmVkbyJ9.amywF3L9CAgcjl3GeFHb4g';
const STYLE_URL = `https://a.tiles.mapbox.com/v4/${LAYERS}/{z}/{x}/{y}.vector.pbf?access_token=${ACCESS_TOKEN}`;

module.exports = {
    SERVER_PORT: 3000,
    STYLE: {
        'version': 8,
        'name': 'Empty',
        'sources': {
            'mapbox': {
                'type': 'vector',
                'maxzoom': 15,
                'tiles': [
                    STYLE_URL
                ]
            }
        },
        'layers': [
            {
                'id': 'background',
                'type': 'background',
                'paint': {
                    'background-color': 'white'
                }
            },
            {
                'id': 'water',
                'type': 'fill',
                'source': 'mapbox',
                'source-layer': 'water',
                'paint': {
                    'fill-color': 'blue'
                }
            }
        ]
    }
};
