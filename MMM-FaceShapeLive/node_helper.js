const NodeHelper = require("node_helper");
const { exec } = require("child_process");
const path = require("path");

module.exports = NodeHelper.create({
  start: function () {
    console.log("[FaceShapeLive] node_helper started.");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "PUSH_GPT_PROMPT") {
      this.handleGptPrompt(payload);
    }
  },

  handleGptPrompt: function (message) {
    if (!message || typeof message !== "string") {
      console.error("[FaceShapeLive] GPT Error: Invalid message input");
      return;
    }

    const escapedMessage = message.replace(/(["$`\\])/g, '\\$1');
    const scriptPath = path.join(__dirname, "../MMM-ChatGPT/Chat.py");
    const command = `python3 "${scriptPath}" "${escapedMessage}"`;

    console.log("[MMM-FaceShapeLive] Sending prompt to GPT:", message);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("[FaceShapeLive] GPT error:", error);
        return;
      }
      if (stderr) {
        console.error("[FaceShapeLive] GPT stderr:", stderr);
        return;
      }

      const responseText = stdout.trim();
      console.log("[MMM-FaceShapeLive] GPT 응답:", responseText);

      this.sendSocketNotification("CHAT_RESPONSE", {
        text: responseText
      });
    });
  }
});
