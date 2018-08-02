// Global variable definitions
var leftLong, rightLong, lowerLat, upperLat
var curBearing = 0
var curZoom = 1
var curCenter = [1,1]
var curGeoCoords, curActiveRectangle, curEndCenters
var leftCenter = {lng:-84.3880,lat:33.7490}
var rightCenter = {lng:-82.3880,lat:33.7490}
var rc, lc
var propertyAssessmentEnabled = false;
var currentPoints = null;
var socket = io('http://maproom.lmc.gatech.edu:8080/');
var projRatio = 0.5

mapboxgl.accessToken = 'pk.eyJ1IjoiYXRsbWFwcm9vbSIsImEiOiJjamtiZzJ6dGIybTBkM3dwYXQ2c3lrMWs3In0.tJzsvakNHTk7G4iu73aP7g';

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

  // Performs the map movement to transition to the new position
  map.easeTo({center: {lng: projLong, lat:projLat}, zoom:(curZoom + 2.7), bearing:curBearing, duration:1000})
});

// Updates the points in the table of property assessment data if the layer is enabled
socket.on('getTableBounds', function(data) {
  if (propertyAssessmentEnabled){
    currentPoints = map.queryRenderedFeatures({'layers':['Property Assessment']});
    socket.emit("processTableData", map.queryRenderedFeatures({'layers':['Property Assessment']}));
  };
});

/** Fired when the sensor server publishes a measurement
 *  (happens about twice per second) and moves the projector
 *  view to reflect any change in position.
 */
socket.on('pushSensorUpdate', function(data) {

  // These two numbers are VERY important, they define the start
  // and end measurements between which the projector position is
  // linearly modeled.
  var start = 2046
  var end = 4871

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
 *  shows the property assessment data layer
 */
socket.on('addTA', function(data){
  map.setLayoutProperty('Property Assessment', 'visibility', 'visible');
  propertyAssessmentEnabled = true;
});

/** After receiving a request from the server,
 *  hides the property property assessment layer
 */
socket.on('removeTA', function(data){
  map.setLayoutProperty('Property Assessment', 'visibility', 'none');
  propertyAssessmentEnabled = false;
});

/** Removes specific property asssessment highlight circle
 *  for one property property assessment data point from the map
 */
  socket.on("removeMarker", function(data){
    var filter = ['match', ['get', 'id'], -1, true, false];
    map.setFilter("place-highlight", filter);
  });

/** Highlights a specific property assessment property on the map
 *  with a yellow circle when a property is selected on
 *  the data table (table.js).
 */
socket.on("newMarker", function(data){
    var current = data.newMarker;
    var pt = currentPoints[parseInt(data['index'])].properties.id;
    var filter = ['match', ['get', 'id'], pt, true, false]
    map.setFilter("place-highlight", filter);

    document.getElementById("ID").innerHTML = current["0"];
    document.getElementById("Latitude").innerHTML = current["1"];
    document.getElementById("Longitude").innerHTML = current["2"];
    document.getElementById("ParcelID").innerHTML = current["3"];
    document.getElementById("Address_17").innerHTML = current["4"];
    document.getElementById("AssessChange").innerHTML = current["5"];
    document.getElementById("ApprChange").innerHTML = current["6"];
    document.getElementById("OBJECTID_17").innerHTML = current["7"];
    document.getElementById("TaxYear").innerHTML = current["8"];
    document.getElementById("Address_17").innerHTML = current["9"];
    document.getElementById("AddrNumber").innerHTML = current["10"];
    document.getElementById("AddrPreDir").innerHTML = current["11"];
    document.getElementById("AddrStreet").innerHTML = current["12"];
    document.getElementById("AddrSuffix").innerHTML = current["13"];
    document.getElementById("AddrPosDir").innerHTML = current["14"];
    document.getElementById("AddrUntTyp").innerHTML = current["15"];
    document.getElementById("AddrUnit").innerHTML = current["16"];
    document.getElementById("Owner").innerHTML = current["17"];
    document.getElementById("OwnerAddr1").innerHTML = current["18"];
    document.getElementById("OwnerAddr2").innerHTML = current["19"];
    document.getElementById("TaxDist").innerHTML = current["20"];
    document.getElementById("TotAssess").innerHTML = current["21"];
    document.getElementById("LandAssess").innerHTML = current["22"];
    document.getElementById("ImprAssess").innerHTML = current["23"];
    document.getElementById("TotAppr").innerHTML = current["24"];
    document.getElementById("LandAppr").innerHTML = current["25"];
    document.getElementById("ImprAppr").innerHTML = current["26"];
    document.getElementById("LUCode").innerHTML = current["27"];
    document.getElementById("ClassCode").innerHTML = current["28"];
    document.getElementById("ExCode").innerHTML = current["29"];
    document.getElementById("LivUnits").innerHTML = current["30"];
    document.getElementById("LandAcres").innerHTML = current["31"];
    document.getElementById("NbrHood").innerHTML = current["32"];
    document.getElementById("Subdiv").innerHTML = current["33"];
    document.getElementById("SubdivNum").innerHTML = current["34"];
    document.getElementById("SubdivLot").innerHTML = current["35"];
    document.getElementById("SubdivBlck").innerHTML = current["36"];
    document.getElementById("FeatureID").innerHTML = current["37"];
    document.getElementById("SHAPESTArea").innerHTML = current["38"];
    document.getElementById("SHAPESTLength").innerHTML = current["39"];
    document.getElementById("OBJECTID_10").innerHTML = current["40"];
    document.getElementById("DIGEST").innerHTML = current["41"];
    document.getElementById("SITUS").innerHTML = current["42"];
    document.getElementById("TAXPIN").innerHTML = current["43"];
    document.getElementById("ATRPIN").innerHTML = current["44"];
    document.getElementById("TAX_DISTR").innerHTML = current["45"];
    document.getElementById("OWNER1").innerHTML = current["46"];
    document.getElementById("OWNER2").innerHTML = current["47"];
    document.getElementById("ADD2").innerHTML = current["48"];
    document.getElementById("ADD3").innerHTML = current["49"];
    document.getElementById("ADD4").innerHTML = current["50"];
    document.getElementById("ADD5").innerHTML = current["51"];
    document.getElementById("LUC").innerHTML = current["52"];
    document.getElementById("NBHD").innerHTML = current["53"];
    document.getElementById("PROP_CLASS").innerHTML = current["54"];
    document.getElementById("CLASS").innerHTML = current["55"];
    document.getElementById("TOT_APPR").innerHTML = current["56"];
    document.getElementById("TOT_ASSESS").innerHTML = current["57"];
    document.getElementById("IMPR_APPR").innerHTML = current["58"];
    document.getElementById("LAND_APPR").innerHTML = current["59"];
    document.getElementById("FUL_EX_COD").innerHTML = current["60"];
    document.getElementById("VAL_ACRES").innerHTML = current["61"];
    document.getElementById("STRUCT_FLR").innerHTML = current["62"];
    document.getElementById("STRUCT_YR").innerHTML = current["63"];
    document.getElementById("TIEBACK").innerHTML = current["64"];
    document.getElementById("TAXYEAR").innerHTML = current["65"];
    document.getElementById("STATUS_COD").innerHTML = current["66"];
    document.getElementById("LIV_UNITS").innerHTML = current["67"];
    document.getElementById("PCODE").innerHTML = current["68"];
    document.getElementById("UNIT_NUM").innerHTML = current["69"];
    document.getElementById("GID").innerHTML = current["70"];
    document.getElementById("EXTVER").innerHTML = current["71"];
    document.getElementById("ShapeSTArea").innerHTML = current["72"];
    document.getElementById("ShapeSTLength").innerHTML = current["73"];

});

// Defines the map container
var map = new mapboxgl.Map({
  container: 'map', // container id
  center: [-84.27173029708604, 33.76777287243536],
  style:'mapbox://styles/atlmaproom/cjkbg9s6m8njm2roxkx8gprzj'
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
        url: 'mapbox://atlmaproom.9v2e99o9'
    });
    map.addLayer({
        'id': 'beltline',
        'type': 'line',
        'source': 'beltline',
        'source-layer': 'Beltline_Weave-9xlpb5',
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
        url: 'mapbox://atlmaproom.c97zkvti'
    });
    map.addLayer({
        'id': 'Median Income Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-53z777',
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
        'source-layer': 'merged2-53z777',
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
        'source-layer': 'merged2-53z777',
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
    // property assessment layer
    map.addSource('Property Assessment', {
        type: 'vector',
        url: 'mapbox://atlmaproom.0u47hnj3'
    });

    map.addLayer({
        'id': 'place-highlight',
        'type': 'circle',
        'source': 'Property Assessment',
        'source-layer': 'allPoints07-24-ah78d9',
        'paint': {
          'circle-color': '#FADA5E',
          'circle-radius': 20,
          'circle-opacity': .5,
        },
        'filter': ['==', 'ID', -1]
    });
    map.addLayer({
        'id': 'Property Assessment',
        'type': 'circle',
        'source': 'Property Assessment',
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
              "property":'asses_change',
              "stops": [
                [-105, '#C0C0C0'],
                [-100, '#00a4d1'],
                [0, '#fffcd6'],
                [100, '#e92f2f']
              ]
            },
            'circle-opacity': 1
        },
        'source-layer': 'allPoints07-24-ah78d9'
    });
    // MARTA Buses and Rail (all one color)
    map.addSource('MARTA', {
        type: 'vector',
        url: 'mapbox://atlmaproom.cxppjs0d'
    });
    map.addLayer({
        'id': 'MARTA',
        'type': 'line',
        'source': 'MARTA',
        'source-layer': 'marta-bi9p6y',
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
