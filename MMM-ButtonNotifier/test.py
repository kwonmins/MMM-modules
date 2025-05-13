import RPi.GPIO as GPIO
import time

BUTTON_PIN = 2
GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

def signal_page_change():
    with open("/tmp/page_trigger", "w") as f:
        f.write("next")

try:
    while True:
        if GPIO.input(BUTTON_PIN) == GPIO.HIGH:
            signal_page_change()
            print("next")
            while GPIO.input(BUTTON_PIN) == GPIO.HIGH:
                time.sleep(0.01)
        time.sleep(0.05)
except KeyboardInterrupt:
    GPIO.cleanup()
