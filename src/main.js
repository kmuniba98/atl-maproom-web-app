// Define server and plugins
var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http');
var bodyParser = require('body-parser');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Main server runs on this port, will be used by other scripts
server.listen(8080);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/** The following methods provide GET functionality for
*** the server, simplifying file locations for other scripts. */
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/html/index.html');
});
app.get('/controller.html', function(req, res){
  res.sendFile(__dirname + '/html/controller.html');
});
app.get('/projector.html', function(req, res){
  res.sendFile(__dirname + '/html/projector.html');
});
app.get('/table.html', function(req, res){
  res.sendFile(__dirname + '/html/table.html');
});
app.get('/controller.js', function(req, res){
  res.sendFile(__dirname + '/controller.js');
});
app.get('/projector.js', function(req, res){
  res.sendFile(__dirname + '/projector.js');
});
app.get('/table.js', function(req, res){
  res.sendFile(__dirname + '/table.js');
});

/**
 * Handles logic for all incoming socket events, when
 * connection is received from projector and controller.
 *
 * @listens socket connection
 */
io.on('connection', function (socket) {

  // Fired when map is updated on controller
  socket.on('mapUpdate', function (data) {
    console.log("Map updated, pushing...");

    console.log(data.center)
    console.log(data.zoom)

    socket.broadcast.emit('pushMapUpdate', data)
  });

  // Fired when tax assessment layer is added from controller
  socket.on("addTA", function(data){
    socket.broadcast.emit("addTA", data);
  });

  // Fired when tax assessment layer is removed from controller
  socket.on("removeTA", function(data){
    socket.broadcast.emit("removeTA", data);
  });

  socket.on("updateTable", function(data){
    socket.broadcast.emit("updateTable", data);
  });

  socket.on("removeMarker", function(data){
    socket.broadcast.emit("removeMarker", data);
  });

  socket.on("newMarker", function(data){
    socket.broadcast.emit("newMarker", data);
  });

  // Fired when keyboard keys are used to nudge map on projector
  socket.on("projNudge", function(data) {
    console.log(data.direction)
    socket.broadcast.emit("projNudge", data);
  });

  /*socket.on('selectPTProjector', function(data){
    socket.broadcast.emit("sendSelectedProjector", data);
  });*/

  // Fired when a layer is hidden on the controller
  socket.on('hideLayer', function(data) {
    console.log(data.clickedLayer + " Layer hidden");
    socket.broadcast.emit('pushHideLayer', data)
  });

  // Fired when a layer is shown on the controller
  socket.on('showLayer', function(data) {
    console.log(data.clickedLayer + " Layer shown");
    socket.broadcast.emit('pushShowLayer', data)
  });

  // Fired when the laser sensor server connects to the socket
  socket.on('sensorConnected', function(data) {
    console.log("Sensor server connected");
  })

  // Fired when a new sensor reading is received from the sensor server
  socket.on('sensorUpdate', function(data) {
    console.log("Sensor updated: " + data.distance);
    socket.broadcast.emit('pushSensorUpdate', data);
  })
});
