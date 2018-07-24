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
  res.sendFile(__dirname + '../html/index.html');
});

app.get('/controller.html', function(req, res){
  res.sendFile(__dirname + '../html/controller.html');
});

app.get('/projector.html', function(req, res){
  res.sendFile(__dirname + '../html/projector.html');
});

app.get('/table.html', function(req, res){
  res.sendFile(__dirname + '../html/table.html');
});

app.get('/controller.js', function(req, res){
  res.sendFile(__dirname + '/controller.js');
});

app.get('/projector.js', function(req, res){
  res.sendFile(__dirname + '/controller.js');
});

app.get('/table.js', function(req, res){
  res.sendFile(__dirname + '/table.js');
});

io.on('connection', function (socket) {

  socket.on('mapUpdate', function (data) {
    console.log("Map updated, pushing...");

    console.log(data.center)
    console.log(data.zoom)

    socket.broadcast.emit('pushMapUpdate', data)
  });

  socket.on("addTA", function(data){
    socket.broadcast.emit("addTA", data);
  });

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

  socket.on("projNudge", function(data) {
    console.log(data.direction)
    socket.broadcast.emit("projNudge", data);
  });

  /*socket.on('selectPTProjector', function(data){
    socket.broadcast.emit("sendSelectedProjector", data);
  });*/

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
