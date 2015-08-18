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

var i2c = require('i2c');
var address = 0x04;
var wire = new i2c(address,{device:'/dev/i2c-1'});

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
            	//startSensors(1);

		wire.readBytes(START_DATA_COMMAND, 1, function(err, res) {
			if(res.length==1 && res[0]==START_DATA_COMMAND)
            			sendTimer = setInterval(recursiveTimer,1000);
			else
				connection.sendUTF("Could not start sensor reading");
		});
            } else if(msgJSON.start==0) {
		//startSensors(0);
                wire.readBytes(STOP_DATA_COMMAND, 1, function(err, res) {
                        if(res.length==1 && res[0]==STOP_DATA_COMMAND) {
                                clearInterval(sendTimer);
				sensorIdx = 1;
			}
                        else
                                connection.sendUTF("Could not stop sensor reading");
                });

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

	wire.readBytes(sensorIdx, DATA_SIZE+1, function(err, res) {
        	// result contains a buffer of bytes
        	if(err) {
                	console.log("RPi node not responding: "+err);
                	//connection.sendUTF("RPi node not responding: "+err);
        	}
        	else {
                	if (res.length==DATA_SIZE+1 && res[0]==sensorIdx) {
				if (res[1]!=0xFF || res[2]!=0xFF) {
					var tmp = (res[1]<<8);
					tmp=tmp|res[2];
					tmp = tmp/10;
					console.log("Sensor ["+sensorIdx+"]: "+tmp);
					connection.sendUTF("Sensor ["+sensorIdx+"]: "+tmp);
					dataSensors = dataSensors+sensorIdx+", "+tmp+"\n";
				} else if(res[1]==0xFF && res[2]==0xFF) {
					console.log("Sensor ["+sensorIdx+"] not connected or faulty!!!");
                                        connection.sendUTF("Sensor ["+sensorIdx+"] not connected or faulty!!!");
				}
                	} else if(res.length==DATA_SIZE+1 && res[0]==0xFF) {
                        	console.log("No new sensor: "+sensorIdx+" data");
                	} else if(res.length!=DATA_SIZE+1){
                        	console.log("Error RPi node (wrong length)");
                        	connection.sendUTF("Error RPi node (wrong length)");
                	}

			sensorIdx = sensorIdx + 1;
        	} 
	});
	
}

//function startSensors(state) {
//
//}

function testSensors() {
	console.log("Testing boards");
	connection.sendUTF("RPi OK!");

	wire.readBytes(TEST_COMMAND, 1, function(err, res) {
  		// result contains a buffer of bytes
        	if(err) {
                	console.log("Error RPi node:"+err);
			connection.sendUTF("Error RPi node:"+err);
		}
        	else {
			if (res.length!=1) {
				console.log("Error RPi node (length not 1)");
                		connection.sendUTF("Error RPi node (length not 1)");
			} else if(res.length==1 && res[0]==0x01) {
                        	console.log("RPi node OK!");
                        	connection.sendUTF("RPi node OK!");
				setTimeout(function () {
					wire.readBytes(TEST_SENSOR_COMMAND, 1, function(err, res) {
                                        	if(res.length==1 && res[0]==0x01) {
                                                	console.log("Sensor board OK && Radio OK!");
                                                	connection.sendUTF("Sensor board OK && Radio OK!");
                                        	} else {
                                                	console.log("Sensor board faulty or Radio not working!");
                                                	connection.sendUTF("Sensor board faulty or Radio not working!");
                                        	}
					});
				}, 1000);
			} else {
                        	console.log("Error RPi node (wrong data)");
                        	connection.sendUTF("Error RPi node (wrong data)");
			}
        	}
	});
}
