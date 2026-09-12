#pragma once
#ifdef __clang__
#include <string>
#include <cstdint>

struct String : public std::string {
    String() : std::string() {}
    String(const char* s) : std::string(s ? s : "") {}
    String(const std::string& s) : std::string(s) {}
    
    void trim() {}
    bool startsWith(const char*) const { return true; }
    int indexOf(char, int = 0) const { return 0; }
    String substring(int, int = -1) const { return ""; }
    int toInt() const { return 0; }
    float toFloat() const { return 0.0f; }
};

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1

void pinMode(uint8_t, uint8_t);
void digitalWrite(uint8_t, uint8_t);
int digitalRead(uint8_t);
int analogRead(uint8_t);
unsigned long millis();
void delay(unsigned long);
void tone(uint8_t, unsigned int, unsigned long duration = 0);
void noTone(uint8_t);

struct HardwareSerial {
    void begin(unsigned long) {}
    int available() { return 0; }
    int read() { return 0; }
    template <typename... Args> void print(Args&&...) {}
    template <typename... Args> void println(Args&&...) {}
    String readStringUntil(char) { return ""; }
};
extern HardwareSerial Serial;

struct TwoWire {
    bool begin(int = -1, int = -1) { return true; }
};
extern TwoWire Wire;

class Adafruit_GFX {};
class Adafruit_SSD1306 {
public:
    Adafruit_SSD1306(int, int, TwoWire*, int);
    bool begin(uint8_t, uint8_t) { return true; }
    void clearDisplay() {}
    void setTextColor(uint16_t) {}
    void setTextSize(uint8_t) {}
    void setCursor(int16_t, int16_t) {}
    template <typename... Args> void print(Args&&...) {}
    template <typename... Args> void println(Args&&...) {}
    void printf(const char*, ...) {}
    void drawFastHLine(int16_t, int16_t, int16_t, uint16_t) {}
    void display() {}
    void fillRect(int16_t, int16_t, int16_t, int16_t, uint16_t) {}
    void drawRect(int16_t, int16_t, int16_t, int16_t, uint16_t) {}
};

#define SSD1306_SWITCHCAPVCC 0x02
#define WHITE 1
#define BLACK 0
#endif
