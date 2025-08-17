
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const sign = (x) => (x<0?-1:1);

export class Vec2 {
  constructor(x=0,y=0){ this.x=x; this.y=y; }
  set(x,y){ this.x=x; this.y=y; return this; }
  copy(v){ this.x=v.x; this.y=v.y; return this; }
  add(v){ this.x+=v.x; this.y+=v.y; return this; }
  sub(v){ this.x-=v.x; this.y-=v.y; return this; }
  scale(s){ this.x*=s; this.y*=s; return this; }
  len(){ return Math.hypot(this.x,this.y); }
  norm(){ const l=this.len(); if(l>1e-6){ this.x/=l; this.y/=l; } return this; }
  clone(){ return new Vec2(this.x,this.y); }
}
