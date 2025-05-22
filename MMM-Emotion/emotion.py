import os
import time
import json
import numpy as np
import sys
from picamera2 import Picamera2
import tflite_runtime.interpreter as tflite
import cv2

# ✅ 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model_unquant.tflite")
LABELS_PATH = os.path.join(BASE_DIR, "labels.txt")

# ✅ 라벨 로딩
try:
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        labels = [line.strip() for line in f.readlines()]
except Exception as e:
    print(f"[Emotion.py Error] 라벨 파일 로딩 실패: {e}", file=sys.stderr)
    sys.exit(1)

# ✅ TFLite 모델 로딩
try:
    interpreter = tflite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
except Exception as e:
    print(f"[Emotion.py Error] 모델 로딩 실패: {e}", file=sys.stderr)
    sys.exit(1)

# ✅ 입력/출력 텐서 정보
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
input_height = input_details[0]['shape'][1]
input_width = input_details[0]['shape'][2]

# ✅ PiCamera2 설정
try:
    picam2 = Picamera2()
    picam2.preview_configuration.main.size = (input_width, input_height)
    picam2.preview_configuration.main.format = "RGB888"
    picam2.configure("preview")
    picam2.start()
except Exception as e:
    print(f"[Emotion.py Error] PiCamera 설정 실패: {e}", file=sys.stderr)
    sys.exit(1)

print("✅ PiCamera2 감정 분석 시작 (5분 간격)...", file=sys.stderr)

# ✅ 감정 분석 루프 (5분 주기)
while True:
    try:
        # 📸 프레임 캡처 및 전처리
        frame = picam2.capture_array()
        resized = cv2.resize(frame, (input_width, input_height))
        input_data = np.expand_dims(resized.astype(np.float32) / 255.0, axis=0)

        # 🔍 모델 추론
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

        # 📤 JSON 출력 (flush 필수)
        print(json.dumps(result, ensure_ascii=False), flush=True)

    except Exception as e:
        print(f"[Emotion.py Error] 분석 중 오류: {e}", file=sys.stderr)

    # 💤 5분 대기
    time.sleep(10)

