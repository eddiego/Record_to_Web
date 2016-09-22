Speech = function() {
    this.SERVICE_URL = "/record"
    this.MAX_RECORD_TIME = 3E4;
    this.TIMEOUT_AMOUNT = 6E4;
    this.RECORD_END_DELAY = 500;
    this.NO_CAPTCHA_SUBMITS_ALLOWED = 5;
    this.recordButton_ = document.getElementById("speech_demo_record_button");
    this.processingCaption_ = document.getElementById("speech_demo_record_processing");
    this.timerCaption_ = document.getElementById("speech_demo_record_timer");
    this.recordContainer_ = document.getElementById("speech_demo_section");
    this.recordLanguageSelect_ = document.getElementById("speech_demo_record_language");
    this.resultContainer_ = document.getElementById("speech_demo_results_container");
    this.result_ = document.getElementById("speech_demo_results");
    // this.resultCode_ = document.getElementById("speech_demo_results_code");
    this.errorContainer_ = document.getElementById("speech_demo_error_container");
    this.noMicContainer_ = document.getElementById("speech_demo_unavailable");
    this.isProcessing_ = this.isRecording_ = !1;
    this.totalSubmits_ = this.startTime_ = this.submitTimeout_ = 0;
    this.rec_ = this.audioContext_ = null
};
Speech.prototype.init = function() {
    this.supportsFileReader() ? this.recordButton_.addEventListener("click", function(a) {
        a.preventDefault();
        this.audioContext_ ? this.toggleRecord() : this.initRecorder()
    }.bind(this)) : this.hideDemo()
};
Speech.prototype.initRecorder = function() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext, navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia, window.URL = window.URL || window.webkitURL, this.audioContext_ = new AudioContext
    } catch (a) {
        this.hideDemo()
    }
    navigator.getUserMedia({
        audio: !0
    }, function(a) {
        this.startUserMedia(a)
    }.bind(this), function() {
        this.hideDemo()
    }.bind(this))
};
Speech.prototype.hideDemo = function() {
    this.recordContainer_.style.display = "none";
    this.noMicContainer_.style.display = "block";
    document.getElementById("speech_demo_reload").addEventListener("click", function(a) {
        a.preventDefault();
        location.reload()
    })
};
Speech.prototype.processAudioRecording = function(a) {
    // var b = this.recordLanguageSelect_.children[this.recordLanguageSelect_.selectedIndex].value,
    var b = this.recordLanguageSelect_.value,
        c = new FileReader;
    c.onload = function(a) {
        a = a.target.result;
        this.sendAudio(btoa(a), b, "LINEAR16", this.audioContext_.sampleRate)
    }.bind(this);
    c.readAsBinaryString(a)
};
Speech.prototype.enableForm = function() {
    this.recordLanguageSelect_.removeAttribute("disabled");
    this.recordButton_.removeAttribute("disabled")
};
Speech.prototype.sendAudio = function(a, b, c, e) {
    a = JSON.stringify({
        config: {
            encoding: c,
            sampleRate: e,
            languageCode: b,
            maxAlternatives: 1
        },
        audio: {
            content: a
        }
    });
    var d = new XMLHttpRequest;
    d.onload = function(a) {
        200 <= d.status && 400 > d.status ? (a = JSON.parse(d.responseText), this.showResults(a)) : this.handleError(a)
    }.bind(this);
    d.onerror = this.handleError;
    d.open("POST", this.SERVICE_URL, !0);
    d.send(a);
    this.requestTimedOut = !1;
    this.submitTimeout_ = setTimeout(function() {
            this.showError();
            this.requestTimedOut = !0
        }.bind(this),
        this.TIMEOUT_AMOUNT)
};
Speech.prototype.handleError = function(a) {
    this.requestTimedOut || (clearTimeout(this.submitTimeout_), this.enableForm(), this.isProcessing_ = !1, this.errorContainer_.style.display = "none", console.log(a), this.showError())
};
Speech.prototype.showError = function() {
    clearTimeout(this.submitTimeout_);
    this.enableForm();
    this.isProcessing_ = !1;
    this.setButtonState("");
    this.errorContainer_.style.display = "block"
};
Speech.prototype.showResults = function(a) {
/*    this.requestTimedOut || (clearTimeout(this.submitTimeout_), this.enableForm(), this.isProcessing_ = !1, this.setButtonState(""), a.results ? (a = a.results.map(function(a) {
        return a.alternatives[0].transcript
    }), this.result_.textContent = a.join("")) : this.result_.textContent = "No speech detected")*/
    this.requestTimedOut || (clearTimeout(this.submitTimeout_), this.enableForm(), this.isProcessing_ = !1, this.setButtonState(""),
         a.results ? this.result_.innerHTML = a.results.replace(/\n/g,"<br>") + a.time : this.result_.textContent = "No speech detected")
};
Speech.prototype.toggleRecord = function() {
    this.rec_ ? this.isRecording_ ? this.stopRecording() : this.isProcessing_ || this.startRecording() : this.hideDemo()
};
Speech.prototype.startRecording = function() {
    var a, b = 0,
        c = "00",
        e = " / 00:" + this.MAX_RECORD_TIME.toString().slice(0, -3);
    // this.resultContainer_.style.display = "none";
    this.errorContainer_.style.display = "none";
    this.setButtonState("recording");
    this.timerCaption_.textContent = "00:00" + e;
    this.startTime_ = Date.now();
    this.rec_.clear();
    this.rec_.record();
    this.isRecording_ = !0;
    a = setInterval(function() {
        this.isRecording_ ? (b = Date.now() - this.startTime_, b >= this.MAX_RECORD_TIME ? (this.stopRecording(), clearInterval(a)) :
            1E3 <= b && (c = 1E4 > b ? "0" + b.toString().slice(0, -3) : b.toString().slice(0, -3), this.timerCaption_.textContent = "00:" + c + e)) : clearInterval(a)
    }.bind(this), 250)
};
Speech.prototype.stopRecording = function() {
    this.isProcessing_ = !0;
    this.isRecording_ = !1;
    this.setButtonState("processing");
    setTimeout(function() {
        this.rec_.stop();
        this.rec_.exportWAV(function(a) {
            this.processAudioRecording(a)
        }.bind(this))
    }.bind(this), this.RECORD_END_DELAY)
};
Speech.prototype.setButtonState = function(a) {
    switch (a) {
        case "processing":
            this.recordButton_.classList.remove("recording");
            this.recordButton_.classList.add("processing");
            this.processingCaption_.style.display = "block";
            this.timerCaption_.style.display = "none";
            break;
        case "recording":
            this.recordButton_.classList.add("recording");
            this.recordButton_.classList.remove("processing");
            this.processingCaption_.style.display = "none";
            this.timerCaption_.style.display = "block";
            break;
        default:
            this.recordButton_.classList.remove("recording"),
            this.recordButton_.classList.remove("processing"),
            this.processingCaption_.style.display = "none", 
            this.timerCaption_.style.display = "none"
    }
};
Speech.prototype.startUserMedia = function(a) {
    a = this.audioContext_.createMediaStreamSource(a);
    this.rec_ = new window.Recorder(a, {
        numChannels: 1,
        // sampleRate: 16000,
        workerPath: "/static/js/recorderWorker.js"
    });
    this.toggleRecord()
};
Speech.prototype.supportsFileReader = function() {
    return "FileReader" in window
};
speechDemo = new Speech;
speechDemo.init();
