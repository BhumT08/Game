
export class GameLoop {
  constructor(update, render){
    this.update = update;
    this.render = render;
    this.running = false;
    this.last = 0;
    this.acc = 0;
    this.dt = 1000/60; // fixed timestep (ms)
    this.timeScale = 1;
    this._slowTimer = 0;
    this._hitstopTimer = 0;
    this.frameMs = 0;
    this._raf = null;
  }
  start(){
    this.running=true;
    this.last = performance.now();
    const tick = (t)=>{
      if(!this.running) return;
      let rawDt = t - this.last;
      if(rawDt>100) rawDt=100; // clamp long frames
      this.frameMs = rawDt;
      this.last = t;
      // time modifiers
      let scaled = rawDt;
      if(this._hitstopTimer>0){
        this._hitstopTimer -= rawDt;
        scaled = 0; // freeze
      } else if(this._slowTimer>0){
        this._slowTimer -= rawDt;
        scaled = rawDt * this.timeScale;
      }
      this.acc += scaled;
      while(this.acc >= this.dt){
        this.update(this.dt/1000); // pass seconds
        this.acc -= this.dt;
      }
      this.render();
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }
  stop(){ this.running=false; if(this._raf) cancelAnimationFrame(this._raf); }
  slowMo(scale=0.6, ms=250){ this.timeScale = Math.max(0.05, Math.min(1, scale)); this._slowTimer = ms; }
  hitstop(ms=80){ this._hitstopTimer = Math.max(this._hitstopTimer, ms); }
  getFrameMs(){ return this.frameMs; }
}
