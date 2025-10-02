class PCMWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Int16Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0][0];

    if (input) {
      for (let i = 0; i < input.length; i++) {
        let s = Math.max(-1, Math.min(1, input[i]));
        this.buffer[this.bufferIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer.buffer.slice(0, this.bufferIndex), [this.buffer.buffer.slice(0, this.bufferIndex)]);
          this.bufferIndex = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor('pcm-worklet', PCMWorkletProcessor);
