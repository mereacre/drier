#include <Wire.h>

void setup()
{
  Serial.begin(9600);  // start serial for output
  Wire.begin(4);                // join i2c bus with address #2
  Wire.onReceive(receiveData);
  Wire.onRequest(sendData);
}

void loop()
{
  delay(100);
}

// callback for received data
void receiveData(int byteCount)
{
}

// callback for sending data
void sendData()
{
  byte snd[3] = {0x21, 0x25, 0x34};
  while(Wire.available())
  {
    int number = Wire.read();
    Wire.write(snd, 3);
    Serial.print(number,HEX);
  }
}

