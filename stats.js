
export const DR = (DUR)=> DUR / (DUR + 100);
export function computeDamage(base, STR, comboMult, critMult, targetDUR){
  const dmg = base * (1 + STR/100) * comboMult * critMult * (1 - DR(targetDUR));
  return Math.max(1, Math.round(dmg));
}
export function moveSpeed(SPD){
  // soft cap using sqrt
  return 140 + Math.sqrt(SPD) * 10; // px/s
}
export function attackInterval(SPD){
  // faster with SP D, min 120ms
  const t = 600 - Math.sqrt(SPD) * 14;
  return Math.max(120, t);
}
export function parryWindowMs(TEC){ return 100 + Math.sqrt(TEC)*6; }
export function comboWindowMs(TEC){ return 240 + Math.sqrt(TEC)*8; }
export function knockbackFromSTR(STR){ return 80 + Math.sqrt(STR)*10; }
export function hpFromDUR(DUR){ return 100 + Math.round(DUR*4); }
export function dmgTakenMultiplierFromDUR(DUR){ return (1 - DR(DUR)); }
