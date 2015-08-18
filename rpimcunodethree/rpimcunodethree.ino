#include <Wire.h>
#include "Timer.h"

#define SENSOR_COUNT        19
#define TEST_COMMAND        0x00
#define TEST_SENSOR_COMMAND 0xFD
#define START_DATA_COMMAND  0xFF
#define STOP_DATA_COMMAND   0xFE
#define DATA_SIZE           0x02
#define SENSOR_READ_FREQ    30000//60000
#define AFTER_SENSOR_TEST   100

byte gSensorData[SENSOR_COUNT][DATA_SIZE];
byte gSensorDataState[SENSOR_COUNT];
Timer gTimerSensor;
int gTimerSensorID = -1;
byte valSerial, curID = 0xFF, gStartRead = 0;
int tmpCnt = 0;
byte gSensorBusy = 0;
byte gSensorTestRead = 0;

void setup()
{
  memset(gSensorDataState,0,sizeof(gSensorData));
  
  Serial.begin(9600);  // start serial for output
  Wire.begin(4);                // join i2c bus with address #2
  Wire.onReceive(receiveData);
  Wire.onRequest(sendData);

}

void loop()
{
  
  gTimerSensor.update();
  //delay(SENSOR_READ_FREQ);
  //if (gStartRead)
  //  takeSensorReading();
}

//void serialEvent() {
//  while (Serial.available()) {
//    
//  }
//}

void sensorTestRead()
{
  tmpCnt = 0;
  Serial.write(TEST_COMMAND);
  while(!Serial.available() && tmpCnt<10000) {
  delay(100);
  if (Serial.available()) {
    if(Serial.read()==TEST_COMMAND)
      gSensorTestRead = 1;  
  }    
}

void ReadSensor(byte idx)
{
    Serial.write(idx);
  
    tmpCnt = 0;
    if (Serial.available()) {
      valSerial = Serial.read();
      if (valSerial>=1 && valSerial <= SENSOR_COUNT) {
        curID = valSerial;
        while(Serial.available() && tmpCnt<2) {
          gSensorData[curID][tmpCnt] = Serial.read();
          tmpCnt++;
        }
        gSensorDataState[valSerial] = 1;
      }
    }  
}

void takeSensorReading()
{
  gSensorBusy = 1;
  for (byte idx=1;idx<=SENSOR_COUNT;idx++) {
    ReadSensor(idx);
  }
  gSensorBusy = 0;
}

// callback for received data
void receiveData(int byteCount)
{
}

// callback for sending data
void sendData()
{
  byte snd[DATA_SIZE+1];
  while(Wire.available() && !gSensorBusy)
  {
    int cmd = Wire.read(), cnt = 0;
    // Testing command
    if (cmd==TEST_COMMAND) {
      snd[0] = 0x01;
      Wire.write(snd,1);
      
      gTimerSensor.after(50, sensorTestRead);
      
    } if (cmd==TEST_SENSOR_COMMAND) {
      if (gSensorTestRead) {
        snd[0] = 0x01;
        Wire.write(snd,1);
        gSensorTestRead = 0;
      }
    }
    else if(cmd>TEST_COMMAND && cmd <=SENSOR_COUNT) {
      
      //ReadSensor(cmd);
      
      if (gSensorDataState[cmd]) {
        snd[0] = cmd;
        snd[1] = gSensorData[cmd][0];
        snd[2] = gSensorData[cmd][1];
        Wire.write(snd,DATA_SIZE+1);
        gSensorDataState[cmd] = 0;
      } else {
        snd[0] = 0xFF;
        Wire.write(snd,DATA_SIZE+1);
      }

    } else if(cmd==START_DATA_COMMAND) {
      snd[0] = cmd;
      Wire.write(snd,1);
      gTimerSensorID = gTimerSensor.every(SENSOR_READ_FREQ, takeSensorReading);
      //gStartRead = 1;
      
    } else if(cmd==STOP_DATA_COMMAND) {
      snd[0] = cmd;
      Wire.write(snd,1);
      gTimerSensor.stop(gTimerSensorID);
      
      memset(gSensorDataState,0,sizeof(gSensorData));
      //gStartRead = 0;
    }
  }
}

