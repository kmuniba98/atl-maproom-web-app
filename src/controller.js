
var socket = io('http://maproom.lmc.gatech.edu:8080/');

// global variables
var activeRectangle = document.getElementById("longRect");
var rectWidth = 800;
var rectHeight = 200;
var TA = false;

socket.on('pushSensorUpdate', function(data) {
  console.log("New sensor reading: " + data.distance)
})

socket.on('projNudge', function(data) {

  direction = data.direction
  var deltaDistance = 1;
  var deltaDegrees = 1;
  var deltaZoom = 0.03

  if (direction === 'up') {
      map.panBy([0, -deltaDistance]);
  } else if (direction === 'down') {
      map.panBy([0, deltaDistance]);
  } else if (direction === 'left') {
      map.panBy([-deltaDistance, 0]);
  } else if (direction === 'right') {
      map.panBy([deltaDistance, 0]);
  } else if (direction === 'ccw') {
      map.easeTo({bearing: map.getBearing() - deltaDegrees});
  } else if (direction === 'cw') {
      map.easeTo({bearing: map.getBearing() + deltaDegrees});
  } else if (direction === 'zoom_in') {
      map.easeTo({zoom: map.getZoom() + deltaZoom});
  } else if (direction === 'zoom_out') {
      map.easeTo({zoom: map.getZoom() - deltaZoom});
  }
});

mapboxgl.accessToken = 'pk.eyJ1IjoibW9kZXJubG92ZWxhY2UiLCJhIjoiY2pmY24zNzhmM2VmaTJ4cDRlNmVoa24wdCJ9.7GBTZc76YFp947kU7A14Gg';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/modernlovelace/cjjpqv3keic0y2rni1j6niy1k',
    zoom: 12,
    bearing: 0,
    center: [-84.3951, 33.7634],
    interactive: true
});

/**
 * the x & y coordinates of a single point
 * @typedef {Object} Point
 * @property {number} x - the x coordinate
 * @property {number} y - the y coordinate
 */

/**
 * the Point of each corner of a box
 * @typedef {Object} PixelCoordinates
 * @property {Object} ur - Point of upper right corner
 * @property {Object} ul - Point of upper left corner
 * @property {Object} br - Point of bottom right corner
 * @property {Object} bl - Point of bottom left corner
 */

/**
 * returns the PixelCoordinates of the selection box
 * @return {PixelCoordinates}
 *         the x & y coordinates of each corner of the selection box
 */

function getPixelCoordinates(){
  // get width & height from current rectangle
  width = rectWidth;
  height = rectHeight;
  // get map center in pixel coordinates
  var center = map.project(map.getCenter());
  // calculate pixel coordinates of corners
  var ur = {"x":(center.x + width/2), "y":(center.y - height/2)}; // upper right
  var ul = {"x":(center.x - width/2), "y":(center.y - height/2)}; // upper left
  var br = {"x":(center.x + width/2), "y":(center.y + height/2)}; // bottom right
  var bl = {"x":(center.x - width/2), "y":(center.y + height/2)}; // bottom left
  // return an json of pixel coordinates
  return {"ur":ur, "ul":ul, "br":br, "bl":bl};
}

/**
 * the lng & lat coordinates of a single point
 * @typedef {Object} GeoPoint
 * @property {number} lng - the lng coordinate
 * @property {number} lat - the lat coordinate
 */

/**
 * the GeoPoint of each corner of a box
 * @typedef {Object} GeoCoordinates
 * @property {Object} ur - GeoPoint of upper right corner
 * @property {Object} ul - GeoPoint of upper left corner
 * @property {Object} br - GeoPoint of bottom right corner
 * @property {Object} bl - GeoPoint of bottom left corner
 */

 /**
  * returns the GeoCoordinates of the selection box
  * @return {GeoCoordinates}
  *         the lng & lat coordinates of each corner of the selection box
  */

function getGeoCoordinates(){
  // grab pixel coordinates from helper method
  var pixelCoordinates = getPixelCoordinates();
  // unproject to geographic coordinates
  var ur = map.unproject(pixelCoordinates.ur);
  var ul = map.unproject(pixelCoordinates.ul);
  var br = map.unproject(pixelCoordinates.br);
  var bl = map.unproject(pixelCoordinates.bl);
  // return a json of geographic coordinates
  return {"ur":ur, "ul":ul, "br":br, "bl":bl};
}

/**
 * the GeoPoint central to the right-most and left-most squares of a box
 * @typedef {Object} EndCenters
 * @property {Object} rc - GeoPoint of right center
 * @property {Object} lc - GeoPoint of left center
 */

/**
 * returns the EndCenters of the selection box
 * @return {EndCenters}
 *         the lng & lat coordinates of the right-most and left-most squares of the selection box
 */
function getEndCenters(){
  var height = rectHeight;
  // get upper right & upper left pixels
  var pixelCoordinates = getPixelCoordinates();
  var ur = pixelCoordinates.ur;
  var ul = pixelCoordinates.ul;
  // calculate pixel coordinates for right & left center
  var rcPixel = {"x":(ur.x - height/2), "y":(ur.y + height/2)};
  var lcPixel = {"x":(ul.x + height/2), "y":(ul.y + height/2)};
  var rc = map.unproject(rcPixel);
  var lc = map.unproject(lcPixel);
  // return a json of geographic coordinates
  return {"rc":rc, "lc":lc};
}

/**
 * toggle the size of selection rectangle between shortRect & longRect;
 * CURRENTLY UNUSED - to activate, remove "display:none;" in changeRect CSS
 */
function toggleRectangle() {
    var x = document.getElementById("shortRect");
    var y = document.getElementById("longRect");
    if (x.style.display === "none") { // turn short rectangle on
        x.style.display = "block";
        y.style.display = "none";
        activeRectangle = x;
        rectWidth = 900;
        rectHeight = 300;
    } else {                          // turn long rectangle on
        x.style.display = "none";
        y.style.display = "block";
        activeRectangle = y;
        rectWidth = 800;
        rectHeight = 200;
    }
}

document.getElementById('changeRect').addEventListener('click', function () {
  toggleRectangle();
  console.log("Sending rectangle change to server...")
  socket.emit('locUpdate', {'center': map.getCenter(), 'zoom': map.getZoom(),
                            'bearing':map.getBearing(), 'geoCoordinates':getGeoCoordinates(),
                            'activeRectangle':activeRectangle.id, 'endCenters':getEndCenters()})
});

/**
 * when button is clicked, all user interaction (pinch/drag) with map is
 * disabled to "lock" so map does not become disaligned while drawing
 */
document.getElementById('interactionButton').addEventListener('click', function(){
  map.boxZoom.disable();
  map.scrollZoom.disable();
  map.dragPan.disable();
  map.dragRotate.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();
});

/**
 * adds BeltLine and data layer sources from MapBox GL Studio
 * and then adds the layers to the map to be toggled
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
    // tax layer
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
            'line-width': 3,
            'line-color': "#32ffd9",
            'line-opacity': 0.8
        }
    });
});

/**
 * when the user interacts with the map (pinch/drag to move, zoom, or rotate)
 * all changes are emitted to the server to update the view in Projector
 */
map.on('moveend', function (e) {
      console.log("Sending move change to server...")
      socket.emit('mapUpdate', {'center': map.getCenter(), 'zoom': map.getZoom(),
                                'bearing':map.getBearing(), 'geoCoordinates':getGeoCoordinates(),
                                'activeRectangle':activeRectangle.id, 'endCenters':getEndCenters()})
});

// link layers to buttons
var toggleableLayerIds = [ 'Tax Assessment', 'Median Income Change', 'College Educated Change', 'White Occupants Change', 'MARTA' ];

for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];
    var link = document.createElement('a');
    link.href = '#';
    link.textContent = id;
    link.onclick = function (e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();
        if (!(clickedLayer===('Tax Assessment'))){
            var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
            if (visibility === 'visible') {
              map.setLayoutProperty(clickedLayer, 'visibility', 'none');
              socket.emit('hideLayer', {'clickedLayer':clickedLayer})
              this.className = '';
            } else {
              this.className = 'active';
              map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
              socket.emit('showLayer', {'clickedLayer':clickedLayer})
          };
        }else{
            if (TA){
                console.log("removing TA");
                socket.emit("removeTA", {'info':'none'});
                TA = false;
                this.className = "";
            }else{
                socket.emit("addTA", {'info':'none'});
                TA = true;
                this.className = 'active';
            }
        }
        console.log("Sending layer change to server...")
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}
