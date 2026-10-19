// 只用於錄影：捕獲遊戲實際Web Audio輸出，不取麥克風、不另配假音效。
(() => {
  const Native = window.AudioContext || window.webkitAudioContext;
  if (!Native || !window.MediaRecorder) return;
  window.qaAudioRecordings = [];
  const originalConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(destination, ...args) {
    const output = originalConnect.call(this, destination, ...args);
    if (destination === this.context.destination && this.context.qaCaptureBus)
      originalConnect.call(this, this.context.qaCaptureBus);
    return output;
  };
  class RecordingContext extends Native {
    constructor(...args) {
      super(...args);
      this.qaCaptureBus = this.createMediaStreamDestination();
      const recorder = new MediaRecorder(this.qaCaptureBus.stream, { mimeType: 'audio/webm;codecs=opus' });
      const record = { recorder, chunks: [], started: Date.now() };
      recorder.ondataavailable = event => { if (event.data.size) record.chunks.push(event.data); };
      recorder.start(); window.qaAudioRecordings.push(record);
    }
  }
  window.AudioContext = RecordingContext;
  if (window.webkitAudioContext) window.webkitAudioContext = RecordingContext;
  window.qaStopAudio = async () => Promise.all(window.qaAudioRecordings.map(record => new Promise(resolve => {
    record.recorder.onstop = async () => {
      const blob = new Blob(record.chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => resolve({ started: record.started, data: reader.result.split(',')[1] });
      reader.readAsDataURL(blob);
    };
    record.recorder.stop();
  })));
})();
