Module.register("MMM-FaceShapeLive", {
  defaults: {
    updateInterval: 2000,
    resultEndpoint: "http://localhost:5001/result",
    videoFeed: "http://localhost:5001/video_feed",
  },

  start() {
    Log.info("Starting module: " + this.name);
    this.result = "결과 없음";
    this.loaded = false;
    this.lastPushedShape = null;
    this.hasPrompted = false; 
 
    this.getResult(); // 첫 로딩 시 호출
    this.timer = setInterval(() => {
      this.getResult();
    }, this.config.updateInterval);
  },

  getStyles() {
    return ["MMM-FaceShapeLive.css"];
  },

  getResult() {
    fetch(this.config.resultEndpoint)
      .then((res) => res.json())
      .then((data) => {
        this.result = data.result;
        this.suggestion = data.suggestion;

        // 얼굴형별 GPT 프롬프트 매핑
        const prompts = {
          "둥근형": "둥근형 얼굴에 어울리는 머리스타일과 코디를 추천해줘",
          "각진형": "각진형 얼굴에 어울리는 머리스타일과 스타일링 팁을 알려줘",
          "계란형": "계란형 얼굴에 어울리는 헤어와 코디를 추천해줘",
          "긴형": "긴형 얼굴에 잘 어울리는 머리스타일과 옷 스타일은 뭐야?"
        };

        for (const shape in prompts) {
          if (this.result.includes(shape) && this.lastPushedShape !== this.result) {
            this.sendSocketNotification("PUSH_GPT_PROMPT", prompts[shape]);
            this.lastPushedShape = this.result;
            this.hasPrompted = true;
            break;
          }
        }

        this.updateDom();
      })
      .catch((err) => {
        console.error("[MMM-FaceShapeLive] Error fetching result:", err);
        this.result = "불러오기 실패";
        this.updateDom();
      });
  },
  socketNotificationReceived: function (notification, payload) {
  if (notification === "CHAT_RESPONSE") {
    this.sendNotification("CHATGPT_RESPONSE", payload); // 이게 핵심
  }
},

  getDom() {
    const wrapper = document.createElement("div");

    // 실시간 영상
    const video = document.createElement("img");
    video.src = this.config.videoFeed;
    video.style.maxWidth = "100%";
    video.style.border = "2px solid #444";
    wrapper.appendChild(video);

    // 분석 결과
    const resultLabel = document.createElement("div");
    resultLabel.innerHTML = `<strong>얼굴형:</strong> ${this.result}`;
    resultLabel.style.color = "#ccc";
    resultLabel.style.marginTop = "10px";
    wrapper.appendChild(resultLabel);

    return wrapper;
  }
});
