

var fs = require('fs');

var express = require('express');
var app = express();
var http = require('http');
var bodyParser = require('body-parser');


var server = http.createServer(app);

var io = require('socket.io').listen(server);

server.listen(8080);

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/controller.html', function(req, res){
  console.log("here")
  res.sendFile(__dirname + '/controller.html');
});

app.get('/projector.html', function(req, res){
  console.log("here")
  res.sendFile(__dirname + '/projector.html');
});

io.on('connection', function (socket) {

  socket.on('mapUpdate', function (data) {
    console.log("Map updated, pushing...");

    var projectorPosition = 0.5;
    data.projectorPosition = projectorPosition;

    socket.broadcast.emit('pushMapUpdate', data)
  });

  // added by Muniba
  socket.on('hideLayer', function(data) {
    console.log(data.clickedLayer + " Layer hidden");
    socket.broadcast.emit('pushHideLayer', data)
  });
  socket.on('showLayer', function(data) {
    console.log(data.clickedLayer + " Layer shown");
    socket.broadcast.emit('pushShowLayer', data) // will emit to client that didn't send
  });

  socket.on('sensorConnected', function(data) {
    console.log("Sensor server connected");
  })

  socket.on('sensorUpdate', function(data) {
    console.log("Sensor updated: " + data.distance);
    socket.broadcast.emit('pushSensorUpdate', data);
  })

});
