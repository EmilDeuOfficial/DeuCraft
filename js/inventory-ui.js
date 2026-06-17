/* ============ Inventar-UI ============ */
var scrInv = document.getElementById('scrInv');
var cursorItem = null;     // {id,count}
var cursorEl = document.getElementById('cursorItem');
var cursorCtx = cursorEl.querySelector('canvas').getContext('2d');
var tableOpen = false;     // ist gerade das 3x3 Werkbankgitter aktiv?
var CREATIVE_ITEMS = [GRASS, DIRT, STONE, COAL_ORE, WOOD, LEAVES, SAND, PLANK, BENCH, FURNACE, WOOL, CHEST, TORCH,
  APPLE, STICK, COAL, LEATHER, RAW_BEEF, COOKED_BEEF, RAW_MUTTON, COOKED_MUTTON,
  WPICK, WAXE, WSHOVEL, WSWORD, SPICK, SAXE, SSHOVEL, SSWORD];

/* ---------- Rezepte ----------
   shapeless: genaue Item-Mengen, Position egal.
   shaped: Muster (Symbol-Zeilen), wird auf die Bounding-Box zugeschnitten
   verglichen, auch horizontal gespiegelt. */
var RECIPES = [
  { shapeless:true, ing:[[WOOD,1]], out:{id:PLANK, count:4} },
  { shapeless:true, ing:[[PLANK,2]], out:{id:STICK, count:4} },
  { shaped:[['P','P'],['P','P']], key:{P:PLANK}, out:{id:BENCH, count:1} },
  { shaped:[['P','P','P'],['P','','P'],['P','P','P']], key:{P:PLANK}, out:{id:CHEST, count:1} },
  { shaped:[['C'],['S']], key:{C:COAL,S:STICK}, out:{id:TORCH, count:4} },
  // Ofen: 8 Stein im Ring (3x3 mit leerer Mitte)
  { shaped:[['C','C','C'],['C','','C'],['C','C','C']], key:{C:STONE}, out:{id:FURNACE, count:1} },
  // Werkzeuge (3x3): M = Material (Bretter oder Stein), S = Stock
  { shaped:[['M','M','M'],['','S',''],['','S','']], key:{M:PLANK,S:STICK}, out:{id:WPICK, count:1} },
  { shaped:[['M','M','M'],['','S',''],['','S','']], key:{M:STONE,S:STICK}, out:{id:SPICK, count:1} },
  { shaped:[['M','M'],['M','S'],['','S']], key:{M:PLANK,S:STICK}, out:{id:WAXE, count:1} },
  { shaped:[['M','M'],['M','S'],['','S']], key:{M:STONE,S:STICK}, out:{id:SAXE, count:1} },
  { shaped:[['M'],['S'],['S']], key:{M:PLANK,S:STICK}, out:{id:WSHOVEL, count:1} },
  { shaped:[['M'],['S'],['S']], key:{M:STONE,S:STICK}, out:{id:SSHOVEL, count:1} },
  { shaped:[['M'],['M'],['S']], key:{M:PLANK,S:STICK}, out:{id:WSWORD, count:1} },
  { shaped:[['M'],['M'],['S']], key:{M:STONE,S:STICK}, out:{id:SSWORD, count:1} }
];

function gridFromSlots(base, w, h){
  var g = [];
  for(var y=0; y<h; y++){ var row = []; for(var x=0; x<w; x++){ var s = slots[base + y*w + x]; row.push(s ? s.id : 0); } g.push(row); }
  return g;
}
function trimGrid(g){
  var minR=99,maxR=-1,minC=99,maxC=-1;
  for(var y=0;y<g.length;y++) for(var x=0;x<g[y].length;x++) if(g[y][x]){ if(y<minR)minR=y; if(y>maxR)maxR=y; if(x<minC)minC=x; if(x>maxC)maxC=x; }
  if(maxR<0) return [];
  var out=[];
  for(var r=minR;r<=maxR;r++){ var row=[]; for(var c=minC;c<=maxC;c++) row.push(g[r][c]); out.push(row); }
  return out;
}
function patternToIds(pat, key){
  return pat.map(function(row){ return row.map(function(sym){ return sym ? key[sym] : 0; }); });
}
function gridsEqual(a, b){
  if(a.length !== b.length) return false;
  for(var y=0;y<a.length;y++){ if(a[y].length !== b[y].length) return false; for(var x=0;x<a[y].length;x++) if(a[y][x] !== b[y][x]) return false; }
  return true;
}
function mirror(g){ return g.map(function(row){ return row.slice().reverse(); }); }
function countItems(g){
  var m = {};
  for(var y=0;y<g.length;y++) for(var x=0;x<g[y].length;x++){ var id=g[y][x]; if(id) m[id]=(m[id]||0)+1; }
  return m;
}
function matchRecipe(g){
  var trimmed = trimGrid(g);
  if(!trimmed.length) return null;
  var counts = countItems(g);
  var nKinds = Object.keys(counts).length;
  for(var i=0;i<RECIPES.length;i++){
    var rec = RECIPES[i];
    if(rec.shapeless){
      // exakte Mengen
      if(rec.ing.length !== nKinds) continue;
      var ok = true;
      for(var k=0;k<rec.ing.length;k++){ var id=rec.ing[k][0], n=rec.ing[k][1]; if(counts[id] !== n){ ok=false; break; } }
      if(ok) return rec.out;
    } else {
      var pat = patternToIds(rec.shaped, rec.key);
      if(gridsEqual(trimmed, pat) || gridsEqual(trimmed, mirror(pat))) return rec.out;
    }
  }
  return null;
}

function craftCfg(){
  return tableOpen ? { base:TABLE_0, result:TABLE_RESULT, w:3, h:3 }
                   : { base:CRAFT_0, result:CRAFT_RESULT, w:2, h:2 };
}
function computeCraft(){
  var cfg = craftCfg();
  slots[cfg.result] = matchRecipe(gridFromSlots(cfg.base, cfg.w, cfg.h));
}
function takeCraft(){
  var cfg = craftCfg();
  var res = slots[cfg.result];
  if(!res) return;
  var ms = maxStack(res.id);
  if(cursorItem && (cursorItem.id !== res.id || cursorItem.count + res.count > ms)) return;
  if(!cursorItem) cursorItem = { id:res.id, count:0 };
  cursorItem.count += res.count;
  for(var i=0; i<cfg.w*cfg.h; i++){
    var s = slots[cfg.base + i];
    if(s){ s.count--; if(s.count <= 0) slots[cfg.base + i] = null; }
  }
  computeCraft();
  invDirty = true;
  renderInvUI(); renderCursor();
}

function buildInvUI(){
  var grid = document.getElementById('invGrid');
  var hot = document.getElementById('invHotbarRow');
  var pal = document.getElementById('creativePalette');
  var armor = document.getElementById('armorCol');
  var craft = document.getElementById('craftGrid');
  var result = document.getElementById('craftResult');
  var tgrid = document.getElementById('tableGrid');
  var tresult = document.getElementById('tableResult');
  var cGrid = document.getElementById('chestGrid');
  grid.innerHTML = ''; hot.innerHTML = ''; pal.innerHTML = '';
  armor.innerHTML = ''; craft.innerHTML = ''; result.innerHTML = '';
  tgrid.innerHTML = ''; tresult.innerHTML = ''; cGrid.innerHTML = '';
  for(var cs=CHEST_0; cs<CHEST_0+27; cs++) cGrid.appendChild(makeInvSlot(cs));
  for(var i=HOTBAR_N; i<SLOTS_N; i++) grid.appendChild(makeInvSlot(i));
  for(var j=0; j<HOTBAR_N; j++) hot.appendChild(makeInvSlot(j));
  for(var c=CRAFT_0; c<CRAFT_RESULT; c++) craft.appendChild(makeInvSlot(c));
  result.appendChild(makeInvSlot(CRAFT_RESULT));
  for(var t=TABLE_0; t<TABLE_RESULT; t++) tgrid.appendChild(makeInvSlot(t));
  tresult.appendChild(makeInvSlot(TABLE_RESULT));
  document.getElementById('furInSlot').appendChild(makeInvSlot(FUR_IN));
  document.getElementById('furFuelSlot').appendChild(makeInvSlot(FUR_FUEL));
  document.getElementById('furOutSlot').appendChild(makeInvSlot(FUR_OUT));
  for(var a=ARMOR_0; a<ARMOR_END; a++) armor.appendChild(makeInvSlot(a));
  CREATIVE_ITEMS.forEach(function(id){
    var d = document.createElement('div');
    d.className = 'islot';
    var cv = document.createElement('canvas');
    cv.width = 16; cv.height = 16;
    drawItemIcon(cv.getContext('2d'), id);
    d.appendChild(cv);
    d.addEventListener('click', function(){
      cursorItem = { id:id, count:maxStack(id) };
      renderCursor();
    });
    pal.appendChild(d);
  });
}

/* Platzhalter-Silhouetten für leere Rüstungsslots */
function drawArmorPh(ctx2, type){
  ctx2.clearRect(0,0,16,16);
  ctx2.fillStyle = '#6f6f6f';
  function r(x,y,w,h){ ctx2.fillRect(x,y,w,h); }
  if(type === 0){ r(4,4,8,3); r(4,7,2,3); r(10,7,2,3); r(5,3,6,1); }
  else if(type === 1){ r(4,3,8,2); r(3,5,10,5); r(5,10,6,3); r(3,3,1,3); r(12,3,1,3); }
  else if(type === 2){ r(4,3,8,3); r(4,6,3,7); r(9,6,3,7); }
  else { r(4,5,3,5); r(9,5,3,5); r(4,10,4,2); r(9,10,4,2); }
}
var invSlotEls = {};
function makeInvSlot(idx){
  var d = document.createElement('div');
  d.className = 'islot';
  var cv = document.createElement('canvas');
  cv.width = 16; cv.height = 16;
  d.appendChild(cv);
  var cnt = document.createElement('span');
  cnt.className = 'cnt';
  d.appendChild(cnt);

  var lpTimer = null, suppressClick = false;
  d.addEventListener('click', function(){
    if(suppressClick){ suppressClick = false; return; }  // war ein Langdruck
    invSlotClick(idx);
  });
  // PC: Rechtsklick halbiert / legt einzeln ab
  d.addEventListener('contextmenu', function(e){ e.preventDefault(); splitClick(idx); });
  // Drag-Splitting: Maus gedrückt halten und über Slots ziehen → je 1 Item ablegen
  d.addEventListener('mouseenter', function(e){
    if(!(e.buttons & 1)) return;       // nur bei gedrückter linker Maustaste
    if(!cursorItem) return;
    var ms = maxStack(cursorItem.id);
    var s = slots[idx];
    if(idx === CRAFT_RESULT || idx === TABLE_RESULT || idx === FUR_OUT) return;
    if(idx >= ARMOR_0 && idx < ARMOR_END) return;
    if(!s){
      slots[idx] = { id:cursorItem.id, count:1 };
    } else if(s.id === cursorItem.id && s.count < ms){
      s.count++;
    } else {
      return;
    }
    cursorItem.count--;
    if(cursorItem.count <= 0) cursorItem = null;
    if(isCraftInput(idx)) computeCraft();
    if(idx === FUR_IN || idx === FUR_FUEL){ syncOpenFurnaceFromSlots(); notifyFurnaceChange(); }
    if(idx >= CHEST_0 && idx < CHEST_0+27 && openChestKey) syncMirrorToChest();
    invDirty = true;
    renderInvUI(); renderCursor();
  });
  // Handy: langes Drücken halbiert
  d.addEventListener('touchstart', function(){
    if(lpTimer) clearTimeout(lpTimer);
    suppressClick = false;
    lpTimer = setTimeout(function(){
      lpTimer = null; suppressClick = true;
      splitClick(idx);
    }, 350);
  }, { passive:true });
  function cancelLp(){ if(lpTimer){ clearTimeout(lpTimer); lpTimer = null; } }
  d.addEventListener('touchmove', cancelLp, { passive:true });
  d.addEventListener('touchend', cancelLp);
  d.addEventListener('touchcancel', cancelLp);

  invSlotEls[idx] = { ctx:cv.getContext('2d'), cnt:cnt };
  return d;
}
function isCraftInput(idx){
  return (idx >= CRAFT_0 && idx < CRAFT_RESULT) || (idx >= TABLE_0 && idx < TABLE_RESULT);
}
function invSlotClick(idx){
  // Ergebnis-Slots: nur entnehmen
  if(idx === CRAFT_RESULT || idx === TABLE_RESULT){ takeCraft(); return; }
  if(idx === FUR_OUT){ takeFurnaceOut(); return; }
  // Rüstungsslots: noch keine Rüstungs-Items
  if(idx >= ARMOR_0 && idx < ARMOR_END){
    if(cursorItem) showToast('Rüstung gibt es noch nicht');
    return;
  }
  var s = slots[idx];
  if(!cursorItem){
    if(s){ cursorItem = s; slots[idx] = null; }
  } else {
    var ms = maxStack(cursorItem.id);
    if(!s){ slots[idx] = cursorItem; cursorItem = null; }
    else if(s.id === cursorItem.id && s.count < maxStack(s.id)){
      var take = Math.min(maxStack(s.id) - s.count, cursorItem.count);
      s.count += take; cursorItem.count -= take;
      if(cursorItem.count <= 0) cursorItem = null;
    } else {
      slots[idx] = cursorItem; cursorItem = s;
    }
  }
  if(isCraftInput(idx)) computeCraft();
  if(idx === FUR_IN || idx === FUR_FUEL){ syncOpenFurnaceFromSlots(); notifyFurnaceChange(); }
  if(idx >= CHEST_0 && idx < CHEST_0+27 && openChestKey) syncMirrorToChest();
  invDirty = true;
  renderInvUI(); renderCursor();
}
/* Rechtsklick / Langdruck: Stapel halbieren bzw. einzeln ablegen */
function splitClick(idx){
  if(idx === CRAFT_RESULT || idx === TABLE_RESULT){ takeCraft(); return; }
  if(idx === FUR_OUT){ takeFurnaceOut(); return; }
  if(idx >= ARMOR_0 && idx < ARMOR_END) return;
  var s = slots[idx];
  if(!cursorItem){
    if(!s) return;
    var take = Math.ceil(s.count / 2);
    var leave = s.count - take;
    cursorItem = { id:s.id, count:take };
    slots[idx] = leave > 0 ? { id:s.id, count:leave } : null;
  } else {
    var ms = maxStack(cursorItem.id);
    if(!s){
      slots[idx] = { id:cursorItem.id, count:1 };
      cursorItem.count--;
    } else if(s.id === cursorItem.id && s.count < ms){
      s.count++; cursorItem.count--;
    } else {
      return;
    }
    if(cursorItem.count <= 0) cursorItem = null;
  }
  if(isCraftInput(idx)) computeCraft();
  if(idx === FUR_IN || idx === FUR_FUEL){ syncOpenFurnaceFromSlots(); notifyFurnaceChange(); }
  if(idx >= CHEST_0 && idx < CHEST_0+27 && openChestKey) syncMirrorToChest();
  invDirty = true;
  renderInvUI(); renderCursor();
}

function renderInvUI(){
  for(var i=0; i<TOTAL_SLOTS; i++){
    var e = invSlotEls[i];
    if(!e) continue;
    e.ctx.clearRect(0,0,16,16);
    var s = slots[i];
    if(s){ drawItemIcon(e.ctx, s.id); e.cnt.textContent = s.count > 1 ? s.count : ''; }
    else {
      e.cnt.textContent = '';
      if(i >= ARMOR_0 && i < ARMOR_END) drawArmorPh(e.ctx, i - ARMOR_0);
    }
  }
}
var lastPointer = { x: window.innerWidth/2, y: window.innerHeight/2 };
function positionCursor(){
  cursorEl.style.left = (lastPointer.x + 6) + 'px';
  cursorEl.style.top  = (lastPointer.y + 6) + 'px';
}
function renderCursor(){
  if(cursorItem){
    cursorEl.style.display = 'block';
    cursorCtx.clearRect(0,0,16,16);
    drawItemIcon(cursorCtx, cursorItem.id);
    cursorEl.querySelector('.cnt').textContent = cursorItem.count > 1 ? cursorItem.count : '';
    positionCursor();   // direkt an der aktuellen Position zeigen (auch beim Langdruck)
  } else cursorEl.style.display = 'none';
}
function trackPointer(e){
  var p = (e.touches && e.touches[0]) ? e.touches[0] : e;
  if(typeof p.clientX === 'number'){ lastPointer.x = p.clientX; lastPointer.y = p.clientY; }
  if(cursorItem) positionCursor();
}
document.addEventListener('pointermove', trackPointer, { passive:true });
document.addEventListener('pointerdown', trackPointer, { passive:true });
document.addEventListener('touchstart', trackPointer, { passive:true });
document.addEventListener('touchmove', trackPointer, { passive:true });
var furnaceOpen = false;
var chestOpen = false;
var chests = {};              // "x|y|z" -> Array(27) von {id,count}|null
var openChestKey = null;
// Jeder Ofen-Block hat seinen eigenen Zustand, abgelegt nach Position
var furnaces = {};            // "x|y|z" -> { x,y,z, in, fuel, out, burnLeft, burnMax, prog }
var openFurnaceKey = null;    // welcher Ofen gerade offen ist
function fKey(x,y,z){ return (x|0) + '|' + (y|0) + '|' + (z|0); }
function newFurnace(x,y,z){ return { x:x|0, y:y|0, z:z|0, in:null, fuel:null, out:null, burnLeft:0, burnMax:0, prog:0 }; }
function getFurnace(x,y,z){ var k = fKey(x,y,z); if(!furnaces[k]) furnaces[k] = newFurnace(x,y,z); return furnaces[k]; }
function mirrorFurnaceToSlots(f){ slots[FUR_IN] = f.in; slots[FUR_FUEL] = f.fuel; slots[FUR_OUT] = f.out; }
function syncOpenFurnaceFromSlots(){
  if(openFurnaceKey && furnaces[openFurnaceKey]){
    var f = furnaces[openFurnaceKey];
    f.in = slots[FUR_IN]; f.fuel = slots[FUR_FUEL]; f.out = slots[FUR_OUT];
  }
}
function setPanelMode(mode){   // 'craft' | 'table' | 'furnace' | 'chest'
  if(mode !== 'furnace' && openFurnaceKey){
    syncOpenFurnaceFromSlots();
    slots[FUR_IN] = null; slots[FUR_FUEL] = null; slots[FUR_OUT] = null;
    openFurnaceKey = null;
  }
  if(mode !== 'chest' && openChestKey){
    syncMirrorToChest();
    for(var ci=0; ci<27; ci++) slots[CHEST_0+ci] = null;
    openChestKey = null; chestOpen = false;
  }
  tableOpen = (mode === 'table');
  furnaceOpen = (mode === 'furnace');
  chestOpen = (mode === 'chest');
  document.getElementById('craft2x2wrap').style.display = (mode === 'craft') ? 'flex' : 'none';
  document.getElementById('craft3x3wrap').style.display = (mode === 'table') ? 'flex' : 'none';
  document.getElementById('furnaceWrap').style.display  = (mode === 'furnace') ? 'flex' : 'none';
  document.getElementById('chestWrap').style.display    = (mode === 'chest') ? 'flex' : 'none';
  var title = mode === 'table' ? 'Werkbank (3x3)' : mode === 'furnace' ? 'Ofen' : mode === 'chest' ? 'Truhe' : 'Handwerk (2x2)';
  document.getElementById('craftTitle').textContent = title;
  var ch = document.getElementById('craftHint');
  if(ch) ch.textContent =
    mode === 'table' ? 'Werkzeuge: 3 Material oben + 2 Stöcke (Spitzhacke) usw.'
    : mode === 'furnace' ? 'Oben rein, Brennstoff (Kohle/Holz) drunter. Rohes Fleisch wird gebraten.'
    : mode === 'chest' ? 'Klick: Item bewegen. Rechtsklick / lang drücken: halbieren.'
    : '1 Holz ➜ 4 Bretter · 2 Bretter ➜ 4 Stöcke · 4 Bretter ➜ Werkbank';
}
function setCraftMode(table){ setPanelMode(table ? 'table' : 'craft'); }
function returnCraftItems(){
  // Items aus den Craftgittern zurück ins Lager. Der Ofen bleibt unberührt und schmilzt weiter.
  for(var i=CRAFT_0; i<CRAFT_RESULT; i++){ if(slots[i]){ addItem(slots[i].id, slots[i].count); slots[i] = null; } }
  for(var t=TABLE_0; t<TABLE_RESULT; t++){ if(slots[t]){ addItem(slots[t].id, slots[t].count); slots[t] = null; } }
  slots[CRAFT_RESULT] = null; slots[TABLE_RESULT] = null;
}
/* Ofen: Ausgabe in die Hand nehmen */
function takeFurnaceOut(){
  var res = slots[FUR_OUT];
  if(!res) return;
  var ms = maxStack(res.id);
  if(cursorItem && (cursorItem.id !== res.id || cursorItem.count + res.count > ms)) return;
  if(!cursorItem) cursorItem = { id:res.id, count:0 };
  cursorItem.count += res.count;
  slots[FUR_OUT] = null;
  syncOpenFurnaceFromSlots();
  notifyFurnaceChange();
  invDirty = true;
  renderInvUI(); renderCursor();
}
/* Einen einzelnen Ofen weiterschmelzen. Gibt true zurück, wenn sich der Inhalt geändert hat. */
function tickFurnace(f, dt){
  var inS = f.in, fuelS = f.fuel, outS = f.out;
  var smeltTo = inS ? SMELT[inS.id] : undefined;
  var canOutput = smeltTo !== undefined && (!outS || (outS.id === smeltTo && outS.count < maxStack(smeltTo)));
  var wantSmelt = (smeltTo !== undefined) && canOutput;
  var changed = false;
  // Brennstoff nachlegen, wenn nötig
  if(f.burnLeft <= 0 && wantSmelt && fuelS && FUEL[fuelS.id]){
    f.burnLeft = FUEL[fuelS.id]; f.burnMax = f.burnLeft;
    fuelS.count--; if(fuelS.count <= 0) f.fuel = null;
    changed = true;
  }
  if(f.burnLeft > 0){
    f.burnLeft -= dt;
    if(wantSmelt){
      f.prog += dt;
      if(f.prog >= SMELT_TIME){
        f.prog = 0;
        inS.count--; if(inS.count <= 0) f.in = null;
        if(f.out) f.out.count++;
        else f.out = { id:smeltTo, count:1 };
        changed = true;
      }
    } else {
      f.prog = Math.max(0, f.prog - dt*2);
    }
  } else {
    f.prog = Math.max(0, f.prog - dt*2);
  }
  return changed;
}
/* Alle Öfen der Welt schmelzen weiter, auch geschlossen */
function furnaceTick(dt){
  var openF = (openFurnaceKey && furnaces[openFurnaceKey]) ? furnaces[openFurnaceKey] : null;
  for(var k in furnaces){
    var changed = tickFurnace(furnaces[k], dt);
    if(changed){
      if(furnaces[k] === openF){ mirrorFurnaceToSlots(openF); invDirty = true; }
      broadcastFurnaceState(k);
    }
  }
  // Anzeige (Flamme + Balken) nur für den gerade offenen Ofen
  if(invOpen && furnaceOpen && openF){
    var flame = document.getElementById('furFlame');
    if(flame){
      var lit = openF.burnLeft > 0;
      flame.style.filter = lit ? 'none' : 'grayscale(1)';
      flame.style.opacity = lit ? (0.5 + 0.5*Math.min(1, openF.burnLeft / (openF.burnMax||1))) : '0.35';
    }
    var bar = document.getElementById('furProgBar');
    if(bar) bar.style.width = Math.min(100, (openF.prog / SMELT_TIME) * 100) + '%';
  }
}
function openInv(){
  if(!inGame || paused) return;
  invOpen = true;
  setPanelMode('craft');
  document.getElementById('creativeBox').style.display = (gameMode === 'creative') ? 'block' : 'none';
  renderInvUI();
  scrInv.classList.add('open');
  if(locked) document.exitPointerLock();
}
function openTable(){
  if(!inGame || paused) return;
  invOpen = true;
  setPanelMode('table');
  document.getElementById('creativeBox').style.display = (gameMode === 'creative') ? 'block' : 'none';
  computeCraft();
  renderInvUI();
  scrInv.classList.add('open');
  if(locked) document.exitPointerLock();
}
function openFurnace(x, y, z){
  if(!inGame || paused) return;
  var f = getFurnace(x, y, z);          // Ofen genau an dieser Position
  openFurnaceKey = fKey(x, y, z);
  mirrorFurnaceToSlots(f);              // Inhalt dieses Ofens in die Anzeige-Slots spiegeln
  invOpen = true;
  setPanelMode('furnace');
  document.getElementById('creativeBox').style.display = (gameMode === 'creative') ? 'block' : 'none';
  renderInvUI();
  scrInv.classList.add('open');
  if(locked) document.exitPointerLock();
}
function closeInv(){
  invOpen = false;
  if(cursorItem){ addItem(cursorItem.id, cursorItem.count); cursorItem = null; renderCursor(); }
  syncOpenFurnaceFromSlots();
  slots[FUR_IN] = null; slots[FUR_FUEL] = null; slots[FUR_OUT] = null;
  openFurnaceKey = null;
  if(openChestKey){
    syncMirrorToChest();
    for(var ci=0; ci<27; ci++) slots[CHEST_0+ci] = null;
    openChestKey = null; chestOpen = false;
  }
  returnCraftItems();
  tableOpen = false; furnaceOpen = false;
  scrInv.classList.remove('open');
  if(!isTouch && inGame && !paused) canvas.requestPointerLock();
}
/* Inventar sortieren: gleiche Items zusammenführen, nach Stapelmenge absteigend,
   Lücken nach hinten schieben. Hotbar (0-9) + Hauptinventar (10-39) gemeinsam. */
function sortInventory(){
  /* Alle Items sammeln */
  var items = [];
  for(var i = 0; i < SLOTS_N; i++){
    if(slots[i]) items.push({ id: slots[i].id, count: slots[i].count });
    slots[i] = null;
  }
  /* Gleiche Item-Typen zusammenführen */
  var merged = {};
  for(var k = 0; k < items.length; k++){
    var it = items[k];
    if(!merged[it.id]) merged[it.id] = 0;
    merged[it.id] += it.count;
  }
  /* Auf Max-Stapelgröße aufteilen */
  var stacks = [];
  for(var id in merged){
    var ms = maxStack(id|0), rem = merged[id];
    while(rem > 0){ var take = Math.min(ms, rem); stacks.push({ id:id|0, count:take }); rem -= take; }
  }
  /* Absteigend nach Anzahl sortieren, bei Gleichstand nach ID (stabil) */
  stacks.sort(function(a, b){ return b.count !== a.count ? b.count - a.count : a.id - b.id; });
  /* Zurück in Slots schreiben */
  for(var j = 0; j < SLOTS_N; j++) slots[j] = stacks[j] || null;
  invDirty = true;
  renderInvUI();
}

scrInv.addEventListener('click', function(e){ if(e.target === scrInv) closeInv(); });
document.getElementById('btnInv').addEventListener('click', function(){ invOpen ? closeInv() : openInv(); });
document.getElementById('btnSort').addEventListener('click', sortInventory);

