#define DATA_PIN  10

byte ggState = 0, gMSB = 0x00, gLSB = 0x00, gByteMask = 0x80, gLastByte;
unsigned short gData = 0x00, gTmpData, gMask = 0x8000;
int gIdx;


void setup() {
  // put your setup code here, to run once:
  
  // Set pin external interrupt to falling edge
}

void loop() {
  
  if (gState==1) {
    
    // Set pin external interrupt to rising edge
    delay(18);
    gState = 2;
    
  } else if (gState==3) {
    
    noInterrupts();
    
    delayMicroseconds(20);
    if (pin is high) {
      delayMicroseconds(20);
      
      // Clear interrupts
      pinMode(DATA_PIN, OUTPUT)
      
      digitalWrite(DATA_PIN, LOW);
      delayMicroseconds(80);
      
      digitalWrite(DATA_PIN, HIGH);
      delayMicroseconds(80);
      
      for (gIdx=0; gIdx<sizeof(unsigned short); gIdx++) {
        if(gData & (gMask>>gIdx)) {
          digitalWrite(DATA_PIN, LOW);
          delayMicroseconds(50);
          digitalWrite(DATA_PIN, HIGH);
          delayMicroseconds(70);          
        } else {
          digitalWrite(DATA_PIN, LOW);
          delayMicroseconds(50);
          digitalWrite(DATA_PIN, HIGH);
          delayMicroseconds(28);                    
        }
      }

      for (gIdx=0; gIdx<sizeof(unsigned short); gIdx++) {
        digitalWrite(DATA_PIN, LOW);
        delayMicroseconds(50);
        digitalWrite(DATA_PIN, HIGH);
        delayMicroseconds(28);                    
      }

      // Get MSB
      gMSB = 
      // Get LSB
      gLSB = 

      gLastByte = (gMSB+gLSB+0x00+0x00) & 0xFF;

      for (gIdx=0; gIdx<sizeof(byte); gIdx++) {
        if(gLastByte & (gByteMask>>gIdx)) {
          digitalWrite(DATA_PIN, LOW);
          delayMicroseconds(50);
          digitalWrite(DATA_PIN, HIGH);
          delayMicroseconds(70);          
        } else {
          digitalWrite(DATA_PIN, LOW);
          delayMicroseconds(50);
          digitalWrite(DATA_PIN, HIGH);
          delayMicroseconds(28);                    
        }
      }
      
       
    }
    else {
      gState = 0;
      // Set pin external interrupt to falling edge
    }
    
    interrupts();    
  }
}

void ISR() {
  if (!gState)
    gState = 1;
  else if (gState==1)
    gState = 0;
  else if (gState==2)
    gState = 3;
}

