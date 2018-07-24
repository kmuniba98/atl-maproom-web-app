// Global variable definitions
var leftLong, rightLong, lowerLat, upperLat
var curBearing = 0
var curZoom = 1
var curCenter = [1,1]
var curGeoCoords, curActiveRectangle, curEndCenters
var leftCenter = {lng:-84.3880,lat:33.7490}
var rightCenter = {lng:-82.3880,lat:33.7490}
var rc, lc
var taxAssessmentEnabled = false;
var currentPoints = null;
var socket = io('http://maproom.lmc.gatech.edu:8080');
var projRatio = 0.5

mapboxgl.accessToken = 'pk.eyJ1IjoibW9kZXJubG92ZWxhY2UiLCJhIjoiY2pmY24zNzhmM2VmaTJ4cDRlNmVoa24wdCJ9.7GBTZc76YFp947kU7A14Gg';

/** Fires when the controller map is moved. Updates the
 *  current view by using current projector location
 *  calculate the exact position of the projector view
 *  within the rectangle view box.
 */
socket.on('pushMapUpdate', function(data) {
  console.log("Controller changed, updating map...");

  curCenter = data['center'];
  curZoom = data['zoom'];
  curBearing = data['bearing'];
  curGeoCoords = data['geoCoordinates'];
  curActiveRectangle = data['activeRectangle'];
  curEndCenters = data['endCenters']

  // Extract the leftmost and rightmost centers for the rectangle view
  leftCenter = curEndCenters.lc
  rightCenter = curEndCenters.rc

  // Current projector view is calculating as a gradient between the
  // left and right centers, depending on the projector position from the sensor
  projLat = leftCenter.lat + (projRatio * (rightCenter.lat - leftCenter.lat))
  projLong = leftCenter.lng + (projRatio * (rightCenter.lng - leftCenter.lng))

  // Updates the points in the table of tax assessment data if the layer is enabled
  if (taxAssessmentEnabled){
      currentPoints = map.queryRenderedFeatures({'layers':['Tax Assessment']});
      socket.emit("updateTable", map.queryRenderedFeatures({'layers':['Tax Assessment']}));
      console.log("length of query"); console.log(map.queryRenderedFeatures({'layers':['Tax Assessment']}));
  }
  // Performs the map movement to transition to the new position
  map.easeTo({center: {lng: projLong, lat:projLat}, zoom:(curZoom + 2.7), bearing:curBearing, duration:1000})
});

/** Fired when the sensor server publishes a measurement
 *  (happens about twice per second) and moves the projector
 *  view to reflect any change in position.
 */
socket.on('pushSensorUpdate', function(data) {

  // These two numbers are VERY important, they define the start
  // and end measurements between which the projector position is
  // linearly modeled.
  var start = 1770
  var end = 5080

  // Simple fraction of current position over total change
  projRatio = ((data.distance - start) / (end-start))

  // Calculate map center that aligns projector view with current area of
  // rectangle within view
  projLat = leftCenter.lat + (projRatio * (rightCenter.lat - leftCenter.lat))
  projLong = leftCenter.lng + (projRatio * (rightCenter.lng - leftCenter.lng))

  map.easeTo({center: {lng: projLong, lat:projLat}, zoom:(curZoom + 2.7), bearing:curBearing, duration:1000})

});

/** After receiving a request from the server,
 *  hides the corresponding map layer
 */
socket.on('pushHideLayer', function(data){
  var hiddenLayer = data['clickedLayer'];
  map.setLayoutProperty(hiddenLayer, 'visibility', 'none');
});

/** After receiving a request from the server,
 *  shows the corresponding map layer
 */
socket.on('pushShowLayer', function(data){
  var shownLayer = data['clickedLayer'];
  map.setLayoutProperty(shownLayer, 'visibility', 'visible');
});

/** Unused, previously used to change size of rectangle on controller
socket.on('pushChangeSize', function(data){
}); */

/** After receiving a request from the server,
 *  shows the tax assessment data layer
 */
socket.on('addTA', function(data){
  map.setLayoutProperty('Tax Assessment', 'visibility', 'visible');
  taxAssessmentEnabled = true;
});

/** After receiving a request from the server,
 *  hides the property tax assessment layer
 */
socket.on('removeTA', function(data){
  map.setLayoutProperty('Tax Assessment', 'visibility', 'none');
  taxAssessmentEnabled = false;
});

/** Removes specific tax asssessment highlight circle
 *  for one property tax assessment data point from the map
 */
socket.on("removeMarker", function(data){
  console.log("removing marker");
  console.log(data.removeMarker);
  console.log("current points");
  console.log(currentPoints);
//map.queryRenderedFeatures({'layers':['Tax Assessment']})[parseInt(data['removeMarker'])].properties.ID;
  var filter = ['match', ['get', 'ID'], -1, true, false];
  map.setFilter("place-highlight", filter);
});

/** Highlights a specific tax assessment property on the map
 *  with a yellow circle when a property is selected on
 *  the data table (table.js).
 */
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

// Defines the map container
var map = new mapboxgl.Map({
  container: 'map', // container id
  center: [-84.27173029708604, 33.76777287243536],
  style:'mapbox://styles/modernlovelace/cjjpqv3keic0y2rni1j6niy1k'
});

/** Provides logic to send nudge requests to the server
 *  when arrow keys are used to adjust the projector image.
 *  Emits the corresponding updates to the socket in order
 *  to update the image on the controller (and projector).
 */
map.on('load', function() {
    map.getCanvas().focus();

    map.getCanvas().addEventListener('keydown', function(e) {
        e.preventDefault();
        if (e.which === 38) { // Up arrow
          socket.emit('projNudge', {'direction': 'up'})
        } else if (e.which === 40) { // Down arrow
          socket.emit('projNudge', {'direction': 'down'})
        } else if (e.which === 37) { // Left arrow
          socket.emit('projNudge', {'direction': 'left'})
        } else if (e.which === 39) { // Right arrow
          socket.emit('projNudge', {'direction': 'right'})
        } else if (e.which === 68) { // A key
          socket.emit('projNudge', {'direction': 'ccw'})
        } else if (e.which === 65) { // D key
          socket.emit('projNudge', {'direction': 'cw'})
        } else if (e.which === 87) { // W key
          socket.emit('projNudge', {'direction': 'zoom_in'})
        } else if (e.which === 83) { // S key
          socket.emit('projNudge', {'direction': 'zoom_out'})
       }
    }, true);
});

/** Initializes map and adds data sources and
 *  layers to the map.
 */
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

// Disables interaction on the projector
map.boxZoom.disable();
map.scrollZoom.disable();
map.dragPan.disable();
map.dragRotate.disable();
map.keyboard.disable();
map.doubleClickZoom.disable();
map.touchZoomRotate.disable();
