
Module.register("MMM-ButtonNotifier", {
  requiresVersion: "2.1.0",
	  defaults: {
    displayTime: 3000
  },

  start() {
    this.message = "";
    this.sendSocketNotification("INIT"); // optional init
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "BUTTON_TRIGGERED") {
       this.sendNotification("PAGE_INCREMENT");
      this.message = "버튼이 눌렸습니다!";
      this.updateDom();

      setTimeout(() => {
        this.message = "";
        this.updateDom();
      }, this.config.displayTime);
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    if (this.message) {
      wrapper.innerHTML += `<div style="font-size: 24px; color: red;">${this.message}</div>`;
    }
    return wrapper;
  }
});
