
const KEY = 'beatup-save-v1';
export function save(obj){
  try{ localStorage.setItem(KEY, JSON.stringify(obj)); }catch(e){}
}
export function load(){
  try{ const s = localStorage.getItem(KEY); return s? JSON.parse(s) : null; }catch(e){ return null; }
}
export function clearSave(){ try{ localStorage.removeItem(KEY); }catch(e){} }
