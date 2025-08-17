
import { GameLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { aabbIntersects } from './engine/physics.js';
import * as ST from './engine/stats.js';
import { save, load, clearSave } from './engine/storage.js';
import { Enemy } from './engine/ai.js';

// Canvas / DPR / Letterbox
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha:false, desynchronized:true });
const DPR = Math.max(1, Math.min(3, window.devicePixelRatio||1));
const DESIGN = { w: 1280, h: 720 };
let view = { w: DESIGN.w, h: DESIGN.h, scale: 1, ox:0, oy:0 };

function resize(){
  const w = window.innerWidth; const h = window.innerHeight;
  const scale = Math.min(w / DESIGN.w, h / DESIGN.h);
  view.scale = scale;
  view.w = Math.round(DESIGN.w * scale);
  view.h = Math.round(DESIGN.h * scale);
  view.ox = Math.floor((w - view.w) * 0.5);
  view.oy = Math.floor((h - view.h) * 0.5);
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', debounce(resize, 60), {passive:true});
window.addEventListener('orientationchange', debounce(resize, 120), {passive:true});

// Prevent gestures
window.addEventListener('gesturestart', (e)=>e.preventDefault(), {passive:false});

// Utilities
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }
function mapToView(x,y){ return [view.ox + x*view.scale, view.oy + y*view.scale]; }
function drawRect(x,y,w,h,color){ const [sx,sy]=mapToView(x,y); ctx.fillStyle=color; ctx.fillRect(sx,sy,w*view.scale,h*view.scale); }
function drawText(txt,x,y,size=16,color='#e7ecf3',align='left'){ ctx.save(); ctx.fillStyle=color; ctx.textAlign=align; ctx.textBaseline='top'; ctx.font = `${Math.round(size*view.scale)}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`; const [sx,sy]=mapToView(x,y); ctx.fillText(txt, sx, sy); ctx.restore(); }

// World and Entities
const world = { x:80, y:80, w: DESIGN.w-160, h: DESIGN.h-140 };
const input = new Input();
const loop = new GameLoop(update, render);

const startBtn = document.getElementById('startBtn');
const preloader = document.getElementById('preloader');
const hud = document.getElementById('hud');
const upgrade = document.getElementById('upgrade');
const balance = document.getElementById('balance');
const ftCanvas = document.getElementById('frametime');
const ftCtx = ftCanvas.getContext('2d');

const btnUpgrade = document.getElementById('btnUpgrade');
const btnResetSave = document.getElementById('btnResetSave');
const closeUpgrade = document.getElementById('closeUpgrade');
const closeBalance = document.getElementById('closeBalance');

const hpFill = document.getElementById('hpFill');
const expFill = document.getElementById('expFill');
const comboText = document.getElementById('comboText');
const statEls = {
  STR: document.getElementById('statStr'),
  SPD: document.getElementById('statSpd'),
  TEC: document.getElementById('statTec'),
  DUR: document.getElementById('statDur'),
};
const lvlEl = document.getElementById('level');
const ptsEl = document.getElementById('points');

// Upgrade bindings
const upPoints = document.getElementById('upPoints');
const upVals = {
  STR: document.getElementById('upStr'),
  SPD: document.getElementById('upSpd'),
  TEC: document.getElementById('upTec'),
  DUR: document.getElementById('upDur'),
};
upgrade.addEventListener('click', (e)=>{
  const k = e.target?.dataset?.up;
  if(!k) return;
  if(player.statPoints>0){
    player[k]+=1;
    player.statPoints--;
    updateHUD();
    persist();
    refreshUpgrade();
  }
});
btnUpgrade.addEventListener('click', ()=>togglePanel(upgrade,true));
closeUpgrade.addEventListener('click', ()=>togglePanel(upgrade,false));
window.addEventListener('toggle-upgrade', ()=>togglePanel(upgrade, upgrade.classList.contains('hidden')));

function refreshUpgrade(){
  upPoints.textContent = player.statPoints;
  upVals.STR.textContent = player.STR;
  upVals.SPD.textContent = player.SPD;
  upVals.TEC.textContent = player.TEC;
  upVals.DUR.textContent = player.DUR;
}

btnResetSave.addEventListener('click', ()=>{
  if(confirm('ล้างเซฟทั้งหมด?')){
    clearSave(); window.location.reload();
  }
});

// Balance panel
const balStr=document.getElementById('balStr');
const balSpd=document.getElementById('balSpd');
const balTec=document.getElementById('balTec');
const balDur=document.getElementById('balDur');
[balStr,balSpd,balTec,balDur].forEach(inp=>{
  inp.addEventListener('input', ()=>{
    player.STR=+balStr.value; player.SPD=+balSpd.value; player.TEC=+balTec.value; player.DUR=+balDur.value;
    updateHUD();
  });
});
closeBalance.addEventListener('click', ()=>togglePanel(balance,false));
window.addEventListener('toggle-balance', ()=>togglePanel(balance, balance.classList.contains('hidden')));

function togglePanel(el, show){
  el.classList.toggle('hidden', !show);
  el.setAttribute('aria-hidden', (!show).toString());
}

function updateHUD(){
  statEls.STR.textContent = player.STR|0;
  statEls.SPD.textContent = player.SPD|0;
  statEls.TEC.textContent = player.TEC|0;
  statEls.DUR.textContent = player.DUR|0;
  lvlEl.textContent = player.level|0;
  ptsEl.textContent = player.statPoints|0;
  hpFill.style.width = (player.hp / player.maxHp * 100).toFixed(1)+'%';
  expFill.style.width = (player.exp / player.nextExp * 100).toFixed(1)+'%';
  comboText.textContent = 'COMBO x' + Math.max(1, player.combo|0);
  balStr.value = player.STR; balSpd.value = player.SPD; balTec.value = player.TEC; balDur.value = player.DUR;
}

// Player
const player = {
  x: world.x + world.w/2, y: world.y + world.h/2, w:28, h:42,
  vx:0, vy:0, dir:1,
  baseAtk: 12,
  STR: 10, SPD: 10, TEC: 10, DUR: 10,
  hp: 200, maxHp: 200,
  combo: 0, comboTimer: 0, comboWindow: ST.comboWindowMs(10),
  attackTimer: 0, attackInterval: ST.attackInterval(10),
  isAttacking: false, attackHitbox: null, attackKind:'light',
  dashTimer: 0, invul: 0,
  parryTimer: 0, parryActive: false,
  level:1, exp:0, nextExp:100, statPoints:0,
};

// Load save if any
const sv = load();
if(sv){
  Object.assign(player, sv.player || {});
  player.maxHp = ST.hpFromDUR(player.DUR);
  player.hp = Math.min(player.hp, player.maxHp);
}

// Enemies
const enemies = [];
function spawnWave(n=5){
  enemies.length=0;
  for(let i=0;i<n;i++){
    const t = (i%2===0)?'thug':'striker';
    enemies.push(new Enemy(t, world.x+40 + Math.random()*(world.w-80), world.y+40+Math.random()*(world.h-80)));
  }
}
spawnWave(6);

// Damage numbers
const dmgNums = [];
function pushDmg(x,y,txt,col='#ffe066'){ dmgNums.push({x,y,txt,ttl:600, col}); }

// Frametime graph buffer
const ftBuf = new Array(120).fill(16);

// Start flow
startBtn.addEventListener('click', ()=>{
  preloader.classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  input.attach();
  resize();
  loop.start();
}, {passive:true});

// iPad portrait/landscape => show touch layer after start
window.addEventListener('load', resize, {passive:true});

// Core Update & Render
function update(dt){
  input.update();

  // Derived stats
  player.attackInterval = ST.attackInterval(player.SPD);
  player.comboWindow = ST.comboWindowMs(player.TEC);
  player.maxHp = ST.hpFromDUR(player.DUR);
  if(player.hp>player.maxHp) player.hp=player.maxHp;

  // Movement
  const spd = ST.moveSpeed(player.SPD);
  player.vx = input.axis.x * spd;
  player.vy = input.axis.y * spd * 0.9;
  player.x += player.vx*dt; player.y += player.vy*dt;
  // bounds
  if(player.x<world.x) player.x=world.x;
  if(player.y<world.y) player.y=world.y;
  if(player.x+player.w>world.x+world.w) player.x=world.x+world.w-player.w;
  if(player.y+player.h>world.y+world.h) player.y=world.y+world.h-player.h;

  // Facing
  if(Math.abs(player.vx) > 1) player.dir = player.vx>0?1:-1;

  // Dash (i-frames)
  if(input.actionsPressed.dash && player.dashTimer<=0){
    player.dashTimer = 240; // ms
    player.invul = 160; // i-frames
    const dashSpeed = 320;
    player.x += player.dir * dashSpeed * dt;
  } else {
    player.dashTimer = Math.max(0, player.dashTimer - dt*1000);
  }
  if(player.invul>0) player.invul -= dt*1000;

  // Parry
  if(input.actionsPressed.parry && player.parryTimer<=0){
    player.parryTimer = ST.parryWindowMs(player.TEC);
    player.parryActive = true;
  }
  if(player.parryTimer>0){
    player.parryTimer -= dt*1000;
    if(player.parryTimer<=0) player.parryActive=false;
  }

  // Attacks
  if(!player.isAttacking && (input.actionsPressed.light || input.actionsPressed.heavy) && player.attackTimer<=0){
    player.isAttacking = true;
    player.attackKind = input.actionsPressed.heavy? 'heavy' : 'light';
    player.attackTimer = input.actionsPressed.heavy? 380 : 240; // attack windup+recover
    const base = player.baseAtk * (player.attackKind==='heavy'? 1.8:1.0);
    const hb = { x: player.x + (player.dir>0? player.w-4 : -22), y: player.y+8, w: 26, h: 18, ttl: player.attackKind==='heavy'? 120: 80, base };
    player.attackHitbox = hb;
  } else {
    player.attackTimer = Math.max(0, player.attackTimer - dt*1000);
    if(player.attackTimer<=0) player.isAttacking = false;
  }
  if(player.attackHitbox){
    player.attackHitbox.ttl -= dt*1000;
    if(player.attackHitbox.ttl<=0) player.attackHitbox=null;
  }

  // Enemy update + collisions
  for(let i=enemies.length-1;i>=0;i--){
    const e = enemies[i];
    e.update(dt, world, player);

    // Enemy attack -> player
    if(e.attackHitbox && aabbIntersects(e.attackHitbox, player)){
      const incoming = 8;
      if(player.parryActive){
        // parry success
        player.parryActive=false; player.parryTimer=0;
        // counter & slow-mo
        loop.slowMo(0.6, 250);
        loop.hitstop(70);
        const dmg = ST.computeDamage(18, player.STR, 1.4, 1.2, 20);
        const dead = e.takeDamage(dmg, ST.knockbackFromSTR(player.STR), player.dir);
        pushDmg(e.x, e.y-12, 'PARRY!', '#9ef7ff');
        pushDmg(e.x, e.y-4, `${dmg}`, '#ffee88');
        player.combo += 1; player.comboTimer = player.comboWindow;
        if(dead){
          player.exp += e.exp;
          enemies.splice(i,1);
          checkLevelUp();
        }
        e.attackHitbox=null; // negate
      } else if(player.invul<=0){
        // take damage
        const mult = ST.dmgTakenMultiplierFromDUR(player.DUR);
        const got = Math.max(1, Math.round(incoming * mult));
        player.hp = Math.max(0, player.hp - got);
        pushDmg(player.x, player.y-10, `-${got}`, '#ff8a8a');
        loop.hitstop(60);
      }
    }

    // Player attack -> enemy
    if(player.attackHitbox && aabbIntersects(player.attackHitbox, e)){
      const comboMult = 1 + (Math.min(10, player.combo) * 0.08);
      const crit = Math.random() < Math.min(0.45, player.TEC*0.0015);
      const critMult = crit? 1.5 : 1.0;
      const dmg = ST.computeDamage(player.attackHitbox.base, player.STR, comboMult, critMult, 20);
      const dead = e.takeDamage(dmg, ST.knockbackFromSTR(player.STR), player.dir);
      pushDmg(e.x, e.y-6, crit?`${dmg}!`:`${dmg}`, crit?'#ffeb88':'#ffe066');
      loop.hitstop(crit? 110: 60);
      player.combo += 1; player.comboTimer = player.comboWindow;
      // prevent multi-hit in one swing
      player.attackHitbox=null;
      if(dead){
        player.exp += e.exp;
        enemies.splice(i,1);
        checkLevelUp();
      }
    }
  }

  // combo timer
  if(player.comboTimer>0){
    player.comboTimer -= dt*1000;
    if(player.comboTimer<=0) player.combo=0;
  }

  // Respawn enemies if all dead
  if(enemies.length===0){
    spawnWave(6 + Math.floor(player.level*0.5));
  }

  // Update HUD occasionally
  _hudTimer -= dt;
  if(_hudTimer<=0){ updateHUD(); _hudTimer=0.1; }

  // frametime buffer
  ftBuf.shift(); ftBuf.push(loop.getFrameMs());
}
let _hudTimer = 0.05;

function render(){
  // clear
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0,0,canvas.width/DPR, canvas.height/DPR);

  // letterbox area darken
  ctx.fillStyle='#000';
  if(view.ox>0){ ctx.fillRect(0,0,view.ox, canvas.height/DPR); ctx.fillRect(view.ox+view.w,0, canvas.width/DPR-(view.ox+view.w), canvas.height/DPR); }
  if(view.oy>0){ ctx.fillRect(0,0, canvas.width/DPR, view.oy); ctx.fillRect(0, view.oy+view.h, canvas.width/DPR, canvas.height/DPR-(view.oy+view.h)); }

  // world background
  drawRect(world.x, world.y, world.w, world.h, '#121722');
  // grid
  ctx.save(); ctx.globalAlpha=0.15;
  for(let x=world.x;x<world.x+world.w;x+=40){ drawRect(x,world.y,1,world.h,'#2a3344'); }
  for(let y=world.y;y<world.y+world.h;y+=40){ drawRect(world.x,y,world.w,1,'#2a3344'); }
  ctx.restore();

  // enemies
  enemies.forEach(e=>{
    const c = e.type==='striker'? '#6fd3ff' : '#e17676';
    drawRect(e.x, e.y, e.w, e.h, c);
    // hp bar
    const pct = Math.max(0, e.hp)/80;
    drawRect(e.x, e.y-6, e.w, 4, '#252d3b');
    drawRect(e.x, e.y-6, e.w*pct, 4, '#ffd166');
    if(e.attackHitbox){
      drawRect(e.attackHitbox.x, e.attackHitbox.y, e.attackHitbox.w, e.attackHitbox.h, '#ffd16688');
    }
  });

  // player
  drawRect(player.x, player.y, player.w, player.h, '#6ae6a6');
  // parry hint
  if(player.parryActive){ ctx.save(); ctx.globalAlpha=0.4; drawRect(player.x-6, player.y-6, player.w+12, player.h+12, '#8af1ff55'); ctx.restore(); }
  if(player.attackHitbox){
    drawRect(player.attackHitbox.x, player.attackHitbox.y, player.attackHitbox.w, player.attackHitbox.h, '#fff49a88');
  }

  // damage numbers
  for(let i=dmgNums.length-1;i>=0;i--){
    const d = dmgNums[i];
    d.ttl -= loop.getFrameMs();
    if(d.ttl<=0){ dmgNums.splice(i,1); continue; }
    const t = 1 - d.ttl/600;
    drawText(d.txt, d.x, d.y - t*20, 16, d.col, 'left');
  }

  // frametime chart (balance panel)
  if(!balance.classList.contains('hidden')){
    const W = ftCanvas.width, H=ftCanvas.height;
    ftCtx.clearRect(0,0,W,H);
    ftCtx.strokeStyle = '#4ea1ff'; ftCtx.lineWidth=2;
    ftCtx.beginPath();
    for(let i=0;i<ftBuf.length;i++){
      const x = i/(ftBuf.length-1)*W;
      const y = H - Math.min(50, ftBuf[i]) / 50 * H;
      if(i===0) ftCtx.moveTo(x,y); else ftCtx.lineTo(x,y);
    }
    ftCtx.stroke();
    ftCtx.fillStyle='#cbd4e3'; ftCtx.font='12px monospace';
    ftCtx.fillText('Frame ms (<=16.7 is ~60fps)', 8, 12);
  }
}

function checkLevelUp(){
  while(player.exp >= player.nextExp){
    player.exp -= player.nextExp;
    player.level++;
    player.statPoints += 1;
    player.nextExp = Math.round(player.nextExp * 1.25 + 20);
  }
  updateHUD(); refreshUpgrade(); persist();
}

function persist(){
  save({ player });
}

// Start UI show/hide
window.addEventListener('focus', resize, {passive:true});
window.addEventListener('blur', ()=>{}, {passive:true});

// Show HUD/touch after start handled in startBtn

// Hook touchLayer visibility to HUD
const touchLayer = document.getElementById('touchLayer');
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints>0;
if(isTouch){ touchLayer.classList.remove('hidden'); }

// Initial HUD refresh
updateHUD(); refreshUpgrade();
