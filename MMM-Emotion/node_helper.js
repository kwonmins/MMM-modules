const NodeHelper = require("node_helper");
const { spawn } = require("child_process");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-Emotion] Node helper started");
    this.pythonProcess = null;
  },

  socketNotificationReceived: function (notification) {
    if (notification === "START_EMOTION_ANALYSIS") {
      this.startPythonScript();
    }
  },

  startPythonScript: function () {
 const path = require("path");
 const scriptPath = path.join(__dirname, "emotion.py");
    this.pythonProcess = spawn("python3", [scriptPath]);

    this.pythonProcess.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach(line => {
        if (line.trim().length === 0) return;
        try {
          const result = JSON.parse(line.trim());
          this.sendSocketNotification("EMOTION_RESULT", result);
        } catch (error) {
          console.error("[MMM-Emotion] JSON parse error:", error);
          console.error("⛔️ 원본 데이터:", line);
        }
      });
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
