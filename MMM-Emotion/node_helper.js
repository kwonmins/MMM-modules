const NodeHelper = require("node_helper");
const { spawn } = require("child_process");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-Emotion] Node helper started");
    this.pythonProcess = null;
  },


socketNotificationReceived: function (notification, payload) {
     console.log("받은 감정:", payload);
    if (notification === "START_EMOTION_ANALYSIS") {
      this.startPythonScript();
    }
  },
  startPythonScript: function () {
    const scriptPath = "modules/MMM-Emotion/Emotion.py"; // 실제 경로에 맞게 수정

    this.pythonProcess = spawn("python3", [scriptPath]);

    this.pythonProcess.stdout.on("data", (data) => {
      try {
        const result = JSON.parse(data.toString());
        this.sendSocketNotification("EMOTION_RESULT", result);
      } catch (error) {
        console.error("[MMM-Emotion] JSON parse error:", error);
      }
    });

    this.pythonProcess.stderr.on("data", (data) => {
      console.error("[MMM-Emotion] stderr:", data.toString());
    });

    this.pythonProcess.on("close", (code) => {
      console.log(`[MMM-Emotion] emotion.py exited with code ${code}`);
    });
  },
    

  stop: function () {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }
});
