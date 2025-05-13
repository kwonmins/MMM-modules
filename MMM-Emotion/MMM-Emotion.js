Module.register("MMM-Emotion", {
  defaults: {},

  start: function () {
    this.emotion = "감정 인식 중...";
    this.loaded = false;
    this.sendSocketNotification("START_EMOTION_ANALYSIS");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "EMOTION_RESULT") {
      this.emotion = `${payload.emotion} (${Math.round(payload.confidence * 100)}%)`;
      this.loaded = true;
      this.updateDom();
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "bright medium";

    wrapper.innerHTML = this.loaded
      ? `😃 감정: <strong>${this.emotion}</strong>`
      : "감정:그저그럼 민성님! 활기기가 생기도록 추천음악을 재생할게요!";
    
    return wrapper;
  }
});
