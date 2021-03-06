#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var messageArr = null;
var sendTimer;
var connection;

var inputtime;
var inputgrainmass; 
var inputgraintype;
var inputinitmoisture;
var inputhotairgates;
var inputairvents;
var inputfanvents;
var inputburnertemp;
var inputdischargetime;
var inputfinalmoisture;
var dataSensors = null;

var SENSOR_COUNT = 19;
var DATA_SIZE = 2;
var START_DATA_COMMAND = 0xFF;
var STOP_DATA_COMMAND = 0xFE;
var TEST_COMMAND = 0x00;
var TEST_SENSOR_COMMAND = 0xFD;
var sensorIdx = 1;

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    connection = request.accept('realtime-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            var msgJSON = JSON.parse(message.utf8Data);

            if(msgJSON.start==1) {
            	inputtime = msgJSON.JSONtime;
              sendTimer = setInterval(recursiveTimer,1000);
            	//startSensors(1);

            } else if(msgJSON.start==0) {

            clearInterval(sendTimer);
            var outfilename = inputtime+".txt";

            fs.writeFile(outfilename, inputtime+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log('Time: '+inputtime+ ' saved to file '+outfilename);
				});

            	fs.appendFile(outfilename, "inputgrainmass:"+inputgrainmass+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputgrainmass+ ' saved to file '+outfilename);
				});

            	fs.appendFile(outfilename, "inputgraintype:"+inputgraintype+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputgraintype+ ' saved to file '+outfilename);
				});
				
            	fs.appendFile(outfilename, "inputinitmoisture:"+inputinitmoisture+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputinitmoisture+ ' saved to file '+outfilename);
				});

            	fs.appendFile(outfilename, "inputhotairgates:"+inputhotairgates+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputhotairgates+ ' saved to file '+outfilename);
				});

            	fs.appendFile(outfilename, "inputairvents:"+inputairvents+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputairvents+ ' saved to file '+outfilename);
				});

            	fs.appendFile(outfilename, "inputburnertemp:"+inputburnertemp+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputburnertemp+ ' saved to file '+outfilename);
				});

            	fs.appendFile(outfilename, "inputdischargetime:"+inputdischargetime+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputdischargetime+ ' saved to file '+outfilename);
				});

            	fs.appendFile(outfilename, "inputfinalmoisture:"+inputfinalmoisture+"\n", function (err) {
  					if (err) return console.log(err);
  					else console.log(inputfinalmoisture+ ' saved to file '+outfilename);
				});

		    fs.appendFile(outfilename, dataSensors, function (err) {
          if (err) {
            return console.log(err);
          } else {
            console.log('Sensor data saved to file '+outfilename);
            dataSensors = null;
          }
        });

            }

            if(msgJSON.inputgrainmass)
            	inputgrainmass = msgJSON.inputgrainmass;
            else if (msgJSON.inputgraintype)
            	inputgraintype = msgJSON.inputgraintype;	
            else if (msgJSON.inputinitmoisture)
            	inputinitmoisture = msgJSON.inputinitmoisture;	
            else if (msgJSON.inputhotairgates)
            	inputhotairgates = msgJSON.inputhotairgates;	
            else if (msgJSON.inputairvents)
            	inputairvents = msgJSON.inputairvents;	
            else if (msgJSON.inputfanvents)
            	inputfanvents = msgJSON.inputfanvents;	
            else if (msgJSON.inputburnertemp)
            	inputburnertemp = msgJSON.inputburnertemp;	
            else if (msgJSON.inputdischargetime)
            	inputdischargetime = msgJSON.inputdischargetime;	
            else if (msgJSON.inputfinalmoisture)
            	inputfinalmoisture = msgJSON.inputfinalmoisture;

            if(msgJSON.test==1) {
            	testSensors();
            }
        }
    });

	connection.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});
});

function recursiveTimer() {
	console.log("Checking for new sensor data...");

	if (sensorIdx>SENSOR_COUNT)
		sensorIdx = 1;		

  var tmp = Math.random() * 100;
  
  console.log("Sensor ["+sensorIdx+"]: "+tmp);
  connection.sendUTF("Sensor ["+sensorIdx+"]: "+tmp);
  dataSensors = dataSensors+sensorIdx+", "+tmp+"\n";

  sensorIdx = sensorIdx + 1;

}

function testSensors() {
	console.log("Testing boards");
	connection.sendUTF("RPi OK!");
  console.log("RPi node OK!");
  connection.sendUTF("RPi node OK!");
  console.log("Sensor board OK && Radio OK!");
  connection.sendUTF("Sensor board OK && Radio OK!");
}
