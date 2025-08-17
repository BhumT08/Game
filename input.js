
import { Vec2, clamp } from './math.js';

export class Input {
  constructor() {
    this.keys = new Set();
    this.axis = new Vec2(0,0);
    this.actions = { light:false, heavy:false, dash:false, parry:false };
    this.actionsPressed = { light:false, heavy:false, dash:false, parry:false }; // rising edge
    this._pressedBuffer = new Set();
    // touch
    this.joystick = { active:false, id:null, baseX:0, baseY:0, stickX:0, stickY:0, radius:56 };
    this.touchButtons = new Map(); // id -> action
  }
  attach() {
    window.addEventListener('keydown', (e)=>{
      const k = e.key;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(k)) { this.keys.add(k.toLowerCase()); e.preventDefault(); }
      if(k==='j'||k==='J'){ this._pressedBuffer.add('light'); }
      if(k==='k'||k==='K'){ this._pressedBuffer.add('heavy'); }
      if(k==='l'||k==='L'){ this._pressedBuffer.add('dash'); }
      if(k==='i'||k==='I'){ this._pressedBuffer.add('parry'); }
      if(k==='~'){ const ev = new CustomEvent('toggle-balance'); window.dispatchEvent(ev); }
      if(k==='u'||k==='U'){ const ev = new CustomEvent('toggle-upgrade'); window.dispatchEvent(ev); }
    }, {passive:false});
    window.addEventListener('keyup', (e)=>{
      const k=e.key.toLowerCase();
      this.keys.delete(k);
    }, {passive:true});

    // touch (joystick + buttons)
    const joy = document.getElementById('joyL');
    const stick = joy.querySelector('.stick');
    const buttons = document.getElementById('buttons');
    const touchLayer = document.getElementById('touchLayer');

    const findActionByTarget = (t)=>{
      if(t.id==='btnLight') return 'light';
      if(t.id==='btnHeavy') return 'heavy';
      if(t.id==='btnDash') return 'dash';
      if(t.id==='btnParry') return 'parry';
      return null;
    };

    const onTouchStart = (e)=>{
      for(const touch of e.changedTouches){
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if(joy.contains(target)) {
          if(!this.joystick.active){
            this.joystick.active=true; this.joystick.id=touch.identifier;
            const r = joy.getBoundingClientRect();
            this.joystick.baseX = r.left + r.width/2;
            this.joystick.baseY = r.top + r.height/2;
            updateStick(touch.clientX, touch.clientY);
          }
        } else {
          const act = findActionByTarget(target);
          if(act){
            this.touchButtons.set(touch.identifier, act);
            this._pressedBuffer.add(act);
            target.classList.add('down');
          }
        }
      }
    };
    const onTouchMove = (e)=>{
      for(const touch of e.changedTouches){
        if(this.joystick.active && touch.identifier===this.joystick.id){
          updateStick(touch.clientX, touch.clientY);
        }
      }
    };
    const onTouchEnd = (e)=>{
      for(const touch of e.changedTouches){
        if(this.joystick.active && touch.identifier===this.joystick.id){
          this.joystick.active=false; this.joystick.id=null;
          stick.style.transform = `translate(30px,30px)`;
          this.axis.set(0,0);
        }
        if(this.touchButtons.has(touch.identifier)){
          const act = this.touchButtons.get(touch.identifier);
          this.touchButtons.delete(touch.identifier);
          const target = document.elementFromPoint(touch.clientX, touch.clientY);
          if(target && target.classList) target.classList.remove('down');
        }
      }
    };

    const updateStick = (x,y)=>{
      const dx = x - this.joystick.baseX;
      const dy = y - this.joystick.baseY;
      const len = Math.hypot(dx,dy);
      const max = this.joystick.radius;
      const nx = len>0 ? dx/len : 0;
      const ny = len>0 ? dy/len : 0;
      const mag = clamp(len, 0, max);
      const sx = 30 + nx * (mag * 0.7 + 10);
      const sy = 30 + ny * (mag * 0.7 + 10);
      stick.style.transform = `translate(${sx}px,${sy}px)`;
      this.axis.set(nx * (mag/max), ny * (mag/max));
    };

    touchLayer.addEventListener('touchstart', onTouchStart, {passive:false});
    touchLayer.addEventListener('touchmove', onTouchMove, {passive:false});
    touchLayer.addEventListener('touchend', onTouchEnd, {passive:false});
    touchLayer.addEventListener('touchcancel', onTouchEnd, {passive:false});

    // show touch UI only on touch-capable
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints>0;
    if(isTouch){
      touchLayer.classList.remove('hidden');
    }
  }

  update(){
    // keyboard axes
    const l = this.keys.has('a') || this.keys.has('arrowleft') ? -1 : 0;
    const r = this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0;
    const u = this.keys.has('w') || this.keys.has('arrowup') ? -1 : 0;
    const dn= this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0;
    // if joystick active override; else keyboard
    if(!this.joystick.active){
      this.axis.set(l+r, u+dn);
      if(this.axis.len()>1){ this.axis.norm(); }
    }
    // consume pressed buffer
    this.actionsPressed.light = this._pressedBuffer.has('light');
    this.actionsPressed.heavy = this._pressedBuffer.has('heavy');
    this.actionsPressed.dash = this._pressedBuffer.has('dash');
    this.actionsPressed.parry = this._pressedBuffer.has('parry');
    // latch actions for one frame
    this._pressedBuffer.clear();
  }
}
