Module.register("MMM-Emotion", {
   defaults: {},

  start: function () {
    this.emotion = "감정 인식 중...";
    this.emotionMessage = "";
    this.loaded = false;
    this.sendSocketNotification("START_EMOTION_ANALYSIS");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "EMOTION_RESULT") {
      const emotionRaw = payload.emotion;
      const confidence = payload.confidence;

      // 괄호와 숫자 제거한 감정 텍스트 추출
      const emotion = typeof emotionRaw === "string"
        ? emotionRaw.trim().split(/\s|\(/)[0]
        : "";

      // 상단에 표시될 텍스트
      this.emotion = `${emotion} (${Math.round(confidence * 100)}%)`;
      this.loaded = true;

      // 다른 모듈로 전달 (정제된 emotion만)
      this.sendNotification("EMOTION_RESULT", {
        emotion: emotion,
        confidence: confidence
      });

      // 감정에 따른 메시지 및 유튜브 영상 설정
      if (emotion === "좋음") {
        this.emotionMessage = "권민성님, 오늘 기분이 좋으신가봐요 😊\n기분에 어울리는 영상을 준비했어요!";
        this.sendNotification("SHOW_VIDEO", { video_id: "fRh_vgS2dFE", autoplay: true });
      } else if (emotion === "그저그럼") {
        this.emotionMessage = "권민성님, 오늘은 평범한 하루네요 ☁️\n잠시 쉬어가요.";
        this.sendNotification("SHOW_VIDEO", { video_id: "5qap5aO4i9A", autoplay: true });
      } else if (emotion === "나쁨") {
        this.emotionMessage = "권민성님, 조금 기운이 없어 보이네요 😥\n마음이 차분해지는 영상을 띄워드릴게요.";
        this.sendNotification("SHOW_VIDEO", { video_id: "2OEL4P1Rz04", autoplay: true });
      }

      this.updateDom();
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "bright medium";

    wrapper.innerHTML = this.loaded
      ? `<div> 감정: <strong>${this.emotion}</strong><br><br>${this.emotionMessage}</div>`
      : "😶 감정 인식 중...";

    return wrapper;
  }
});
