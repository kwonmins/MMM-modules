from picamera2 import Picamera2
import tflite_runtime.interpreter as tflite
import numpy as np
import cv2
import time

# ✅ 얼굴 검출용 분류기 로드
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# ✅ TFLite 모델 로드
interpreter = tflite.Interpreter(model_path="model_unquant.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# ✅ 라벨 불러오기
with open("labels.txt", "r") as f:
    class_names = [line.strip() for line in f.readlines()]

# ✅ 카메라 초기화
picam2 = Picamera2()
picam2.preview_configuration.main.size = (640, 480)
picam2.preview_configuration.main.format = "RGB888"
picam2.configure("preview")
picam2.start()
time.sleep(1)

# ✅ 프레임 캡처
frame = picam2.capture_array()

# ✅ 얼굴 검출
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
faces = face_cascade.detectMultiScale(gray, 1.3, 5)

if len(faces) == 0:
    print("NO_FACE")
    exit()

# ✅ 첫 번째 얼굴만 사용
(x, y, w, h) = faces[0]
face = frame[y:y+h, x:x+w]
face = cv2.resize(face, (224, 224))
face = np.expand_dims(face.astype(np.float32), axis=0)
face = (face / 127.5) - 1  # Teachable Machine의 정규화 방식

# ✅ 추론
interpreter.set_tensor(input_details[0]['index'], face)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details[0]['index'])

# ✅ 결과 해석
prediction = output_data[0]
index = np.argmax(prediction)
class_name = class_names[index]
confidence = prediction[index] * 100

# ✅ 출력
print(f"{class_name}:{confidence:.2f}")
