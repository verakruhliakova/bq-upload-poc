class StopWatch {

  constructor() {
    this._startTime = 0;
    this._splitTime = 0;
    this._endTime = 0;
    this._splits = {};
  }

  start() {
    this._startTime = Date.now();
  }

  split(label) {
    const start = this._splitTime || this._startTime;
    this._splitTime = Date.now();
    const elapsed = this._splitTime - start;
    this._splits[label] = elapsed;
    return elapsed;
  }

  getSplitTime(label) {
    return this._splits[label];
  }

  stop() {
    this._endTime = Date.now();
    return this._endTime - this._startTime;
  }

  getElapsedTime() {
    return this._endTime - this._startTime;
  }

  toJSON() {
    return {
      elapsed: this._endTime - this._startTime,
      splits: this._splits
    }
  }
}

module.exports = StopWatch;