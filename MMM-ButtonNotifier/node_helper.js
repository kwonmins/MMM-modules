const NodeHelper = require("node_helper");
const fs = require("fs");
const TRIGGER_FILE = "/tmp/page_trigger";
module.exports = NodeHelper.create({
  start: function () {
    console.log("[MMM-pages-helper] ✅ 시작됨");
    this.monitorTrigger();
  },

  monitorTrigger: function () {
    setInterval(() => {
      if (fs.existsSync(TRIGGER_FILE)) {
        fs.unlinkSync(TRIGGER_FILE);
        console.log("click!"); // 버튼 누를 때마다 콘솔에 출력됨
        this.sendSocketNotification("BUTTON_TRIGGERED", {});
      }
    }, 300);
  }
});
