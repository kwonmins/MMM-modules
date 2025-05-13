from flask import Flask, Response, jsonify
from picamera2 import Picamera2
import tflite_runtime.interpreter as tflite
import threading
import cv2
import numpy as np
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 모델 로딩
interpreter = tflite.Interpreter(model_path="model_unquant.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# 라벨 로딩
with open("labels.txt", "r", encoding="utf-8") as f:
    class_names = [line.strip() for line in f.readlines()]

# 얼굴 검출기 로드
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# 카메라 초기화
picam2 = Picamera2()
picam2.preview_configuration.main.size = (640, 480)
picam2.preview_configuration.main.format = "RGB888"
picam2.configure("preview")
picam2.start()

latest_result = "결과 없음"
lock = threading.Lock()
analyzed = False

# 얼굴형 분석 백그라운드 쓰레드
def analyze_face_shape():
    global latest_result, analyzed

    while True:
        if analyzed:
            time.sleep(1)
            continue

        try:
            frame = picam2.capture_array()
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=3,
                minSize=(60, 60)
            )

            print(f"[DEBUG] 얼굴 개수: {len(faces)}")

            if len(faces) > 0:
                (x, y, w, h) = faces[0]
                face = frame[y:y + h, x:x + w]
                face = cv2.resize(face, (224, 224))
                face = np.expand_dims(face.astype(np.float32), axis=0)
                face = (face / 127.5) - 1

                interpreter.set_tensor(input_details[0]['index'], face)
                interpreter.invoke()
                output_data = interpreter.get_tensor(output_details[0]['index'])
                prediction = output_data[0]
                index = np.argmax(prediction)
                class_name = class_names[index]
                confidence = prediction[index] * 100

                with lock:
                    latest_result = f"{class_name} {confidence:.1f}%"
                    analyzed = True
                print(f"[INFO] 분석 결과: {latest_result}")

            else:
                with lock:
                    latest_result = "결과 없음"
                print("[WARN] 얼굴을 찾을 수 없습니다.")

            time.sleep(2)

        except Exception as e:
            with lock:
                latest_result = "분석 실패"
                analyzed = True
            print(f"[ERROR] 분석 중 오류 발생: {e}")
            time.sleep(2)

# 실시간 영상 출력
@app.route('/video_feed')
def video_feed():
    def generate():
        while True:
            frame = picam2.capture_array()
            ret, jpeg = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

# 분석 결과 반환
@app.route('/result')
def result():
    with lock:
        return jsonify(result=latest_result)

# 백그라운드 쓰레드 시작
threading.Thread(target=analyze_face_shape, daemon=True).start()

# 서버 실행
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
