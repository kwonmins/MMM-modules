const NodeHelper = require("node_helper");
const { spawn } = require("child_process");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-FaceShape] node_helper 시작됨");
  },

  socketNotificationReceived: function (notification, payload) {
    const self = this;
    if (notification === "START_ANALYSIS") {
      const pythonProcess = spawn("python3", ["modules/MMM-FaceShape/face_shape.py"]);

      let result = "";

      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error("[MMM-FaceShape] 오류:", data.toString());
      });

      pythonProcess.on("close", (code) => {
        result = result.trim();
        if (result.includes("NO_FACE")) {
          self.sendSocketNotification("FACE_ANALYSIS_RESULT", "얼굴이 감지되지 않았습니다.");
        } else if (result.includes(":")) {
          const [shape, confidence] = result.split(":");
          self.sendSocketNotification(
            "FACE_ANALYSIS_RESULT",
            `얼굴형: <strong>${shape}</strong><br>신뢰도: ${parseFloat(confidence).toFixed(2)}%`
          );
        } else {
          self.sendSocketNotification("FACE_ANALYSIS_RESULT", "분석 결과 없음");
        }
      });
    }
  }
});
