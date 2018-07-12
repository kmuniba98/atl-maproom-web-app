

var io = require('socket.io-client')
var PythonShell = require('python-shell');


var socket = io.connect('http://143.215.119.183:8080');
socket.on('connect', function () {
  socket.emit('sensorConnected', "Success");
});

console.log("Running sensor server...");
var pyshell = new PythonShell('lr4.py');

pyshell.on('message', function (message) {
  // received a message sent from the Python script (a simple "print" statement)
  console.log(message);
  socket.emit('sensorUpdate', {'distance': message})
});

pyshell.end(function (err,code,signal) {
  if (err) throw err;
  console.log('The exit code was: ' + code);
  console.log('The exit signal was: ' + signal);
  console.log('Done!')
});
