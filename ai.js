
import { aabbIntersects } from './physics.js';

export class Enemy {
  constructor(type, x, y){
    this.type = type; // 'thug' or 'striker'
    this.x=x; this.y=y; this.w=28; this.h=40;
    this.vx=0; this.vy=0;
    this.dir=1;
    this.state='idle'; // idle, patrol, chase, attack, evade, stunned
    this.stateTimer= Math.random()*800 + 400;
    this.hp=80;
    this.baseDamage=8;
    this.speed= 90 + (type==='striker'? 40: 0);
    this.attackCd= 1200 + (type==='striker'?-200:200);
    this.attackTimer= 400 + Math.random()*600;
    this.stunTimer=0;
    this.invul=0;
    this.isAttacking=false;
    this.attackHitbox=null;
    this.exp= 15 + (type==='striker'?10:0);
  }
  bbox(){ return {x:this.x, y:this.y, w:this.w, h:this.h}; }
  update(dt, world, player){
    if(this.invul>0) this.invul-=dt*1000;
    if(this.stunTimer>0){ this.stunTimer-=dt*1000; this.vx=0; this.vy=0; this.state='stunned'; this.isAttacking=false; this.attackHitbox=null; return; }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx,dy);
    this.dir = dx>=0?1:-1;

    if(this.state==='idle' || this.state==='patrol'){
      this.stateTimer -= dt*1000;
      if(this.stateTimer<=0){ this.state = (Math.random()<0.5)?'patrol':'idle'; this.stateTimer = 800+Math.random()*1000; }
      if(this.state==='patrol'){ this.vx = this.dir * 40; this.vy = 0; }
      if(dist<220) this.state='chase';
    } else if(this.state==='chase'){
      // move toward player
      const nx = dx / (dist||1); const ny = dy / (dist||1);
      this.vx = nx * this.speed; this.vy = ny * this.speed*0.6;
      this.attackTimer -= dt*1000;
      if(dist<46 && this.attackTimer<=0){
        this.state='attack'; this.isAttacking=true; this.attackTimer=this.attackCd;
      }
    } else if(this.state==='attack'){
      // simple lunge
      this.vx = this.dir * (this.speed+60); this.vy = 0;
      // create attack hitbox briefly
      this.attackHitbox = { x: this.x + (this.dir>0? this.w-6 : -16), y: this.y+10, w: 16, h: 12, ttl: 90 };
      this.state='chase'; this.isAttacking=false;
    } else if(this.state==='stunned'){
      this.vx=0; this.vy=0;
    }

    // advance attack hitbox ttl
    if(this.attackHitbox){
      this.attackHitbox.ttl -= dt*1000;
      if(this.attackHitbox.ttl<=0) this.attackHitbox=null;
    }

    // apply movement
    this.x += this.vx*dt; this.y += this.vy*dt;
    // clamp inside world bounds
    if(this.x<world.x) this.x=world.x;
    if(this.y<world.y) this.y=world.y;
    if(this.x+this.w>world.x+world.w) this.x=world.x+world.w-this.w;
    if(this.y+this.h>world.y+world.h) this.y=world.y+world.h-this.h;
  }
  takeDamage(dmg, kb, dir){
    if(this.invul>0) return false;
    this.hp -= dmg;
    this.stunTimer = 200;
    this.invul = 120;
    this.x += dir * kb * 0.06;
    return this.hp<=0;
  }
}
