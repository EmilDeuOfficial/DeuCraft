/* ============ Abbauen & Platzieren ============ */
var mineTarget = null, mineTime = 0;
var mineProgEl = document.getElementById('mineProg');
var mineProgBar = mineProgEl.querySelector('div');

function blockDrop(id){
  return id;   // Standard: Block selbst
}
function doBreakDrop(x,y,z,id){
  setB(x,y,z,AIR);
  rebuildAt(x,z);
  netSendBlock(x,y,z,AIR);
  // Ofen abgebaut: Inhalt fällt raus, Eintrag entfernen (in jedem Modus)
  if(id === FURNACE){
    var fk = fKey(x,y,z);
    var f = furnaces[fk];
    if(f && gameMode === 'survival'){
      [f.in, f.fuel, f.out].forEach(function(it){ if(it) addItem(it.id, it.count); });
    }
    if(openFurnaceKey === fk){ slots[FUR_IN] = null; slots[FUR_FUEL] = null; slots[FUR_OUT] = null; openFurnaceKey = null; }
    delete furnaces[fk];
    if(gameMode === 'survival') addItem(FURNACE, 1);
    return;
  }
  if(gameMode !== 'survival') return;
  var heldTool = toolInfo(slots[selected] ? slots[selected].id : 0);
  if(id === COAL_ORE){
    // Kohle gibt es nur mit einer Spitzhacke
    if(heldTool && heldTool.type === 'pick'){ addItem(COAL, 1); }
    else showToast('Dafür brauchst du eine Spitzhacke');
    return;
  }
  addItem(blockDrop(id), 1);
  if(id === LEAVES && hash2(x*13+y*7, z*17+y*3) < 0.12){
    addItem(APPLE, 1);
    showToast('Apfel gefunden!');
  }
}
function breakBlockInstant(){
  var r = raycast(6);
  if(!r) return;
  if(r.hit[1] === 0) return;
  doBreakDrop(r.hit[0], r.hit[1], r.hit[2], getB(r.hit[0],r.hit[1],r.hit[2]));
}
function updateMining(dt){
  var wantMine = (gameMode === 'survival') && ((locked && mouseLeft) || touchMining);
  if(!wantMine){
    mineTarget = null; mineTime = 0;
    mineProgEl.style.display = 'none';
    return;
  }
  // Tier im Fadenkreuz -> nicht abbauen (man schlägt das Tier)
  if(nearestMobHit(3.4)){
    mineTarget = null; mineTime = 0;
    mineProgEl.style.display = 'none';
    return;
  }
  var r = raycast(6);
  if(!r || r.hit[1] === 0){
    mineTarget = null; mineTime = 0;
    mineProgEl.style.display = 'none';
    return;
  }
  var key2 = r.hit.join(',');
  if(mineTarget !== key2){ mineTarget = key2; mineTime = 0; }
  var id = getB(r.hit[0], r.hit[1], r.hit[2]);
  var held = slots[selected] ? slots[selected].id : 0;
  var need = (BREAK_TIME[id] || 1) / toolSpeedFor(id, held);
  mineTime += dt;
  mineProgEl.style.display = 'block';
  mineProgBar.style.width = Math.min(100, mineTime/need*100) + '%';
  if(mineTime >= need){
    doBreakDrop(r.hit[0], r.hit[1], r.hit[2], id);
    mineTarget = null; mineTime = 0;
    mineProgEl.style.display = 'none';
  }
}
function toolSpeedFor(blockId, toolId){
  var cat = blockCategory(blockId);
  var tool = toolInfo(toolId);
  if(cat && tool && tool.type === cat) return tool.tier === 2 ? 4 : 2.2;
  return 1;
}

function isGuiBlock(id){ return id === BENCH || id === FURNACE; }   // Blöcke mit eigenem Menü
function tryOpenBlockGui(){
  var r = raycast(6);
  if(!r) return false;
  var id = getB(r.hit[0], r.hit[1], r.hit[2]);
  if(id === BENCH){ openTable(); return true; }
  if(id === FURNACE){ openFurnace(r.hit[0], r.hit[1], r.hit[2]); return true; }
  return false;
}

function useItem(){
  // Auf einen Block mit Menü zielen (Werkbank/Ofen) -> Menü öffnen
  if(tryOpenBlockGui()) return;

  var s = slots[selected];
  if(!s) return;
  // Essbares essen
  if(FOOD[s.id] !== undefined){
    if(gameMode === 'survival'){
      if(hunger >= 20){ showToast('Du bist satt'); return; }
      hunger = Math.min(20, hunger + FOOD[s.id]);
      consumeSelected();
      statsDirty = true;
      showToast('Mmh, lecker');
    }
    return;   // Essen ist kein Block
  }
  placeBlock(s.id, gameMode === 'survival');
}
function placeBlock(id, consume){
  if(!blockTiles[id]) return;
  var r = raycast(6);
  if(!r) return;
  var p = r.prev;
  if(p[1] < 0 || p[1] >= SY) return;
  if(getB(p[0], p[1], p[2]) !== AIR) return;
  var pMinX = player.pos.x - player.w, pMaxX = player.pos.x + player.w;
  var pMinY = player.pos.y, pMaxY = player.pos.y + player.h;
  var pMinZ = player.pos.z - player.w, pMaxZ = player.pos.z + player.w;
  if(p[0] < pMaxX && p[0]+1 > pMinX && p[1] < pMaxY && p[1]+1 > pMinY && p[2] < pMaxZ && p[2]+1 > pMinZ) return;
  setB(p[0], p[1], p[2], id);
  if(id === FURNACE) getFurnace(p[0], p[1], p[2]);   // neuer, leerer Ofen
  rebuildAt(p[0], p[2]);
  netSendBlock(p[0], p[1], p[2], id);
  if(consume) consumeSelected();
}

