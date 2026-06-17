/* ============ Spieler & Status ============ */
var player = {
  pos: new THREE.Vector3(WORLD_BLOCKS/2 + 0.5, 40, WORLD_BLOCKS/2 + 0.5),
  vel: new THREE.Vector3(),
  yaw: 0, pitch: 0,
  onGround: false,
  w: 0.3, h: 1.8, eye: 1.62
};
var gameMode = 'survival';
var flying = false;
var inGame = false, paused = false, invOpen = false;
var health = 20, hunger = 20;     // jeweils 0..20 (halbe Einheiten)
var fallPeak = 0;
var hungerDrain = 0, regenTimer = 0, starveTimer = 0;

function spawnHeight(){
  var sx = Math.floor(player.pos.x), sz = Math.floor(player.pos.z);
  for(var y=SY-1; y>0; y--){
    var b = getB(sx,y,sz);
    if(b !== AIR && !isTorch(b)){ player.pos.y = y + 1.01; return; }
  }
}
function collides(p){
  var minX = Math.floor(p.x - player.w), maxX = Math.floor(p.x + player.w);
  var minY = Math.floor(p.y), maxY = Math.floor(p.y + player.h);
  var minZ = Math.floor(p.z - player.w), maxZ = Math.floor(p.z + player.w);
  for(var x=minX; x<=maxX; x++)
  for(var y=minY; y<=maxY; y++)
  for(var z=minZ; z<=maxZ; z++){
    var cb = getB(x,y,z);
    if(cb !== AIR && !isTorch(cb)) return true;
  }
  return false;
}
function damage(d){
  if(gameMode === 'creative') return;
  health = Math.max(0, health - d);
  statsDirty = true;
  var hf = document.getElementById('hurtFlash');
  if(hf){ hf.classList.remove('on'); void hf.offsetWidth; hf.classList.add('on'); }
  if(health <= 0) die();
}
function die(){
  if(gameMode === 'creative') return;
  health = 20; hunger = 20;
  statsDirty = true;
  player.vel.set(0,0,0);
  paused = true;
  if(locked) document.exitPointerLock();
  document.getElementById('deathScreen').classList.add('active');
}
function respawn(){
  document.getElementById('deathScreen').classList.remove('active');
  paused = false;
  player.pos.set(WORLD_BLOCKS/2 + 0.5, 40, WORLD_BLOCKS/2 + 0.5);
  player.yaw = 0; player.pitch = 0;
  spawnHeight();
  lastPCX = -999;
  updateChunks(true);
  if(!isTouch) canvas.requestPointerLock();
}

/* ============ Inventar ============ */
var slots = new Array(TOTAL_SLOTS).fill(null);   // {id, count}
var selected = 0;

function addItem(id, count){
  var ms = maxStack(id);
  // erst auf bestehende Stacks
  for(var i=0; i<SLOTS_N && count>0; i++){
    var s = slots[i];
    if(s && s.id === id && s.count < ms){
      var take = Math.min(ms - s.count, count);
      s.count += take; count -= take;
    }
  }
  // dann leere Slots (Hotbar zuerst)
  for(var j=0; j<SLOTS_N && count>0; j++){
    if(!slots[j]){
      var put = Math.min(ms, count);
      slots[j] = { id:id, count:put };
      count -= put;
    }
  }
  invDirty = true;
  return count; // Rest der nicht reinpasst
}
function consumeSelected(){
  var s = slots[selected];
  if(!s) return;
  s.count--;
  if(s.count <= 0) slots[selected] = null;
  invDirty = true;
}

