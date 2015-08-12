#include <Wire.h>
#include "Timer.h"

#define SENSOR_COUNT        19
#define TEST_COMMAND        0x00
#define START_DATA_COMMAND  0xFF
#define STOP_DATA_COMMAND   0xFE
#define DATA_SIZE           0x02
#define SENSOR_READ_FREQ    5000//60000

byte gSensorData[SENSOR_COUNT][DATA_SIZE];
byte gSensorDataState[SENSOR_COUNT];
Timer gTimerSensor;
int gTimerSensorID = -1;
int gReadState = 0;
byte valSerial, curID = 0xFF, tmpBuf[DATA_SIZE+1];

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
  
  if (Serial.available()) {
    valSerial = Serial.read();
    if (valSerial>=1 && valSerial <= SENSOR_COUNT && !gReadState) {
      curID = valSerial;
      gSensorDataState[valSerial] = 1;
      gReadState = 1;
    }else if(gReadState==1) {
      // Save MSB byte
      gSensorData[curID][0] = valSerial;
      gReadState=2;
    }else if(gReadState==2) {
      // Save LSB byte
      gSensorData[curID][1] = valSerial;
      gReadState=0;
      curID = 0xFF;
    }
  }
}

void takeSensorReading()
{
  //for (byte idx=1;idx<=SENSOR_COUNT;idx++) {
    Serial.write(0x09);
    //delay(1000);    
  //}
}

// callback for received data
void receiveData(int byteCount)
{
}

// callback for sending data
void sendData()
{
  byte snd[DATA_SIZE+1];
  while(Wire.available())
  {
    int cmd = Wire.read(), tmp[10], cnt = 0;
    // Testing command
    if (cmd==TEST_COMMAND) {
      snd[0] = 0x01;
      Wire.write(snd,1);
    } else if(cmd>TEST_COMMAND && cmd <=SENSOR_COUNT) {
      /*
      Serial.write(0x09);
      while(!Serial.available());
      cnt = 0;
      while(Serial.available()) {
        tmp[cnt] = Serial.read();
        cnt++;        
      }
        snd[0] = tmp[cnt];
        Wire.write(snd,1);
      */

      if (gSensorDataState[cmd]) {
        snd[0] = cmd;
        snd[1] = gSensorData[cmd][0];
        snd[2] = gSensorData[cmd][1];
        Wire.write(snd,DATA_SIZE+1);
        gSensorDataState[cmd] = 0;
        //Serial.print(gSensorDataState[cmd],HEX);
      } else {
        snd[0] = 0xFF;
        Wire.write(snd,DATA_SIZE+1);
      }

    } else if(cmd==START_DATA_COMMAND) {
      snd[0] = cmd;
      Wire.write(snd,1);
      gTimerSensorID = gTimerSensor.every(SENSOR_READ_FREQ, takeSensorReading);
      
    } else if(cmd==STOP_DATA_COMMAND) {
      snd[0] = cmd;
      Wire.write(snd,1);
      gTimerSensor.stop(gTimerSensorID);
      
    }
  }
}

