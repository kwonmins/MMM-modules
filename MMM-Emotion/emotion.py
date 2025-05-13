import time
import json
import numpy as np
import sys
from picamera2 import Picamera2
import tflite_runtime.interpreter as tflite

# 모델 및 라벨 로드
MODEL_PATH = "model_unquant.tflite"
LABELS_PATH = "labels.txt"

with open(LABELS_PATH, "r") as f:
    labels = [line.strip() for line in f.readlines()]

interpreter = tflite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

height = input_details[0]['shape'][1]
width = input_details[0]['shape'][2]

# Pi Camera 설정
picam2 = Picamera2()
picam2.preview_configuration.main.size = (width, height)
picam2.preview_configuration.main.format = "RGB888"
picam2.configure("preview")
picam2.start()

print("✅ PiCamera2 감정 분석 시작...", file=sys.stderr)

while True:
    try:
        frame = picam2.capture_array()
        input_data = np.expand_dims(frame.astype(np.float32) / 255.0, axis=0)

        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()

        output_data = interpreter.get_tensor(output_details[0]['index'])
        result_index = int(np.argmax(output_data))
        emotion = labels[result_index]
        confidence = float(output_data[0][result_index])

        result = {
            "emotion": emotion,
            "confidence": round(confidence, 3),
            "timestamp": int(time.time())
        }

        # MagicMirror node_helper.js에서 읽을 수 있도록 flush=True
        print(json.dumps(result), flush=True)
        time.sleep(2)

    except Exception as e:
        print(f"[Emotion.py Error] {e}", file=sys.stderr)
        time.sleep(2)
