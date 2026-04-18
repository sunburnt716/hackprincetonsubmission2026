class CircularBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = new Float32Array(capacity);
    this.timestamps = new Array(capacity).fill(0);
    this.index = 0;
    this.size = 0;
  }

  push(value, timestamp = Date.now()) {
    this.buffer[this.index] = Number.isFinite(value) ? value : 0;
    this.timestamps[this.index] = timestamp;
    this.index = (this.index + 1) % this.capacity;
    this.size = Math.min(this.size + 1, this.capacity);
  }

  clear() {
    this.buffer.fill(0);
    this.timestamps.fill(0);
    this.index = 0;
    this.size = 0;
  }

  valuesWithTimestamps() {
    const result = [];

    for (let offset = 0; offset < this.size; offset += 1) {
      const idx =
        (this.index - this.size + offset + this.capacity) % this.capacity;
      result.push({
        value: this.buffer[idx],
        timestamp: this.timestamps[idx],
      });
    }

    return result;
  }
}

export default CircularBuffer;
