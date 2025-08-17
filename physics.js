
export function aabbIntersects(a, b){
  return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y+a.h < b.y || a.y > b.y+b.h);
}
export function resolveWorldBounds(ent, bounds){
  if(ent.x < bounds.x){ ent.x = bounds.x; ent.vx = 0; }
  if(ent.y < bounds.y){ ent.y = bounds.y; ent.vy = 0; }
  if(ent.x+ent.w > bounds.x+bounds.w){ ent.x = bounds.x+bounds.w - ent.w; ent.vx = 0; }
  if(ent.y+ent.h > bounds.y+bounds.h){ ent.y = bounds.y+bounds.h - ent.h; ent.vy = 0; }
}
