var leftLong, rightLong, lowerLat, upperLat
var curBearing = 0
var curZoom = 1
var curCenter = [1,1]
var curGeoCoords, curActiveRectangle, curEndCenters
var leftCenter = {lng:-84.3880,lat:33.7490}
var rightCenter = {lng:-82.3880,lat:33.7490}
var rc, lc
var TA = false;
var currentPoints = null;
var socket = io('http://maproom.lmc.gatech.edu:8080');
var projRatio = 0.5

mapboxgl.accessToken = 'pk.eyJ1IjoibW9kZXJubG92ZWxhY2UiLCJhIjoiY2pmY24zNzhmM2VmaTJ4cDRlNmVoa24wdCJ9.7GBTZc76YFp947kU7A14Gg';

socket.on('pushMapUpdate', function(data) {
  console.log("Controller changed, updating map...");

  curCenter = data['center'];
  curZoom = data['zoom'];
  curBearing = data['bearing'];
  curGeoCoords = data['geoCoordinates'];
  curActiveRectangle = data['activeRectangle'];
  curEndCenters = data['endCenters']

  leftCenter = curEndCenters.lc
  rightCenter = curEndCenters.rc

  projLat = leftCenter.lat + (projRatio * (rightCenter.lat - leftCenter.lat))
  projLong = leftCenter.lng + (projRatio * (rightCenter.lng - leftCenter.lng))

  console.log(curBearing + ", " + JSON.stringify(leftCenter) + ", " + JSON.stringify(rightCenter))


  if (TA){
      currentPoints = map.queryRenderedFeatures({'layers':['Tax Assessment']});
      socket.emit("updateTable", map.queryRenderedFeatures({'layers':['Tax Assessment']}));
      console.log("length of query"); console.log(map.queryRenderedFeatures({'layers':['Tax Assessment']}));
  }
    map.easeTo({center: {lng: projLong, lat:projLat}, zoom:(curZoom + 2.7), bearing:curBearing, duration:1000})
});

socket.on('pushSensorUpdate', function(data) {

  var start = 1770 //1840
  var end = 5080

  projRatio = ((data.distance - start) / (end-start))

  projLat = leftCenter.lat + (projRatio * (rightCenter.lat - leftCenter.lat))
  projLong = leftCenter.lng + (projRatio * (rightCenter.lng - leftCenter.lng))

  map.easeTo({center: {lng: projLong, lat:projLat}, zoom:(curZoom + 2.7), bearing:curBearing, duration:1000})

});

socket.on('pushHideLayer', function(data){
  var hiddenLayer = data['clickedLayer'];
  map.setLayoutProperty(hiddenLayer, 'visibility', 'none');
});

socket.on('pushShowLayer', function(data){
  var shownLayer = data['clickedLayer'];
  map.setLayoutProperty(shownLayer, 'visibility', 'visible');
});
socket.on('pushChangeSize', function(data){ // for toggleRectangle

});

socket.on('addTA', function(data){
  map.setLayoutProperty('Tax Assessment', 'visibility', 'visible');
  TA = true;
});

socket.on('removeTA', function(data){
  console.log("in removeTA");
  map.setLayoutProperty('Tax Assessment', 'visibility', 'none');
  TA = false;
});

socket.on("removeMarker", function(data){
  console.log("removing marker");
  console.log(data.removeMarker);
  console.log("current points");
  console.log(currentPoints);
//map.queryRenderedFeatures({'layers':['Tax Assessment']})[parseInt(data['removeMarker'])].properties.ID;
  var filter = ['match', ['get', 'ID'], -1, true, false];
  map.setFilter("place-highlight", filter);
});

socket.on("newMarker", function(data){
  console.log("adding marker");
  console.log(data.newMarker);
  console.log("current points");
  console.log(currentPoints[0]);
  var current = currentPoints[parseInt(data['newMarker'])];//map.queryRenderedFeatures({'layers':['Tax Assessment']})[parseInt(data['newMarker'])].properties.ID;
  var filter = ['match', ['get', 'ID'], current.properties.ID, true, false];
  map.setFilter("place-highlight", filter);


  document.getElementById("address").innerHTML = current.properties['SITUS'];
  document.getElementById("tenAssess").innerHTML = ("$" + current.properties['2010_assessment'].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
  document.getElementById("sevenAssess").innerHTML = ("$" + current.properties['2017_assessment'].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
  if (current.properties['assess_change'] < -100){
      document.getElementById("assess_change").innerHTML = "No Change"
  }else{
      document.getElementById("assess_change").innerHTML = (current.properties['assess_change'].toLocaleString() +"%");
  }
  document.getElementById("tenAppr").innerHTML = ("$" + current.properties['2010_appr'].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
  document.getElementById("sevenAppr").innerHTML = ("$" + current.properties['2017_appr'].toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
  if (current.properties['appr_change'] < -100){
      document.getElementById("appr_change").innerHTML = "No Change"
  }else{
      document.getElementById("appr_change").innerHTML = (current.properties['appr_change'] +"%");
  }

});


var map = new mapboxgl.Map({
  container: 'map', // container id
  center: [-84.27173029708604, 33.76777287243536],
  style:'mapbox://styles/modernlovelace/cjjpqv3keic0y2rni1j6niy1k'
});

var deltaDistance = 3;
var deltaDegrees = 1;

function easing(t) {
    return t * (2 - t);
}

map.on('load', function() {
    map.getCanvas().focus();

    map.getCanvas().addEventListener('keydown', function(e) {
        e.preventDefault();
        if (e.which === 38) { // up
          socket.emit('projNudge', {'direction': 'up'})
        } else if (e.which === 40) { // down
          socket.emit('projNudge', {'direction': 'down'})
        } else if (e.which === 37) { // left
          socket.emit('projNudge', {'direction': 'left'})
        } else if (e.which === 39) { // right
          socket.emit('projNudge', {'direction': 'right'})
        } else if (e.which === 68) { // rotate ccw
          socket.emit('projNudge', {'direction': 'ccw'})
        } else if (e.which === 65) { // rotate cw
          socket.emit('projNudge', {'direction': 'cw'})
        } else if (e.which === 87) { // zoom in
          socket.emit('projNudge', {'direction': 'zoom_in'})
        } else if (e.which === 83) { // zoom out
          socket.emit('projNudge', {'direction': 'zoom_out'})
       }
    }, true);
});

map.on('moveend', function (e) {
      socket.emit('projNudge', {'center': curCenter,
                                'bearing': curBearing})
});

map.on('load', function () {
    // beltline layer
    map.addSource('beltline', {
        type: 'vector',
        url: 'mapbox://modernlovelace.9bd0nhcf'
    });
    map.addLayer({
        'id': 'beltline',
        'type': 'line',
        'source': 'beltline',
        'source-layer': 'Beltline_Weave-a4j3wv',
        'layout': {
            'visibility': 'visible',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': 'yellow green',
            'line-width': 8
        }
    });
    // Change median income later
    map.addSource('ACS', {
        type: 'vector',
        url: 'mapbox://modernlovelace.3jq6hc6x'
    });
    map.addLayer({
        'id': 'Median Income Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-1ylp9s',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
              property:'P_C_M_I',
              stops: [
                [-100, '#00a4d1'],
                [0, '#fffcd6'],
                [100, '#e92f2f']
              ]
            },
            'fill-opacity': 0.5
        }
    });
    map.addLayer({
        'id': 'College Educated Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-1ylp9s',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
              property:'C_C_E_P',
              stops: [
                [-40, '#00a4d1'],
                [0, '#fffcd6'],
                [40, '#e92f2f']
              ]
            },
            'fill-opacity': 0.5
        }
    });
    map.addLayer({
        'id': 'White Occupants Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-1ylp9s',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
              property:'C_W_P__',
              stops: [
                [-30, '#00a4d1'],
                [0, '#fffcd6'],
                [30, '#e92f2f']
              ]
            },
            'fill-opacity': 0.5
        }
    });
    // tax layer
    map.addSource('Tax Assessment', {
        type: 'vector',
        url: 'mapbox://modernlovelace.byryezk5'
    });

    map.addLayer({
        'id': 'place-highlight',
        'type': 'circle',
        'source': 'Tax Assessment',
        'source-layer': 'AllPointsGeoJSON07-18-8huxq7',
        'paint': {
          'circle-color': '#FADA5E',
          'circle-radius': 20,
          'circle-opacity': .5,
        },
        'filter': ['==', 'ID', -1]
    });
    map.addLayer({
        'id': 'Tax Assessment',
        'type': 'circle',
        'source': 'Tax Assessment',
        'interactive': true,
        "layout": {
                  "text-font": "Open Sans Semibold, Arial Unicode MS Bold",
                  "text-offset": [0, 0.6],
                  "text-anchor": "top"
                },
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'circle-radius': 3,
            'circle-color': {
              "property":'appr_change',
              "stops": [
                [-105, '#C0C0C0'],
                [-100, '#00a4d1'],
                [0, '#fffcd6'],
                [100, '#e92f2f']
              ]
            },
            'circle-opacity': 1
        },
        'source-layer': 'AllPointsGeoJSON07-18-8huxq7'
    });
    // MARTA Buses and Rail (all one color)
    map.addSource('MARTA', {
        type: 'vector',
        url: 'mapbox://modernlovelace.6n51t4jo'
    });
    map.addLayer({
        'id': 'MARTA',
        'type': 'line',
        'source': 'MARTA',
        'source-layer': 'marta-8pkeb3',
        'layout': {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-width': 10,
            'line-color': "#32ffd9",
            'line-opacity': 0.15
        }
    });
});
map.boxZoom.disable();
map.scrollZoom.disable();
map.dragPan.disable();
map.dragRotate.disable();
map.keyboard.disable();
map.doubleClickZoom.disable();
map.touchZoomRotate.disable();
