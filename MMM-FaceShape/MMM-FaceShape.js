Module.register("MMM-FaceShape", {
  defaults: {
    interval: 60000
  },

  start: function () {
    this.result = "얼굴형 분석 대기 중...";
    this.sendSocketNotification("START_ANALYSIS");

    const self = this;
    setInterval(function () {
      self.sendSocketNotification("START_ANALYSIS");
    }, this.config.interval);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "FACE_ANALYSIS_RESULT") {
      this.result = payload;
      this.updateDom();
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<strong>\ud83e\udde0 얼굴형 분석 결과</strong><br>${this.result}`;
    return wrapper;
  }
});
