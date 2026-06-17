/* ============ Welten ============ */
var worlds = [];
var current = null;
var editsByChunk = {};
var editsDirty = false;

function saveWorlds(){
  if(net && net.mode === 'client') return;   // Gast speichert die Welt nicht
  store.set('bc_worlds', JSON.stringify(worlds));
}
function saveEdits(){
  if(!current || (net && net.mode === 'client')) return;
  store.set('bc_edits_' + current.id, JSON.stringify(editsByChunk));
  editsDirty = false;
}
function savePlayerState(){
  if(!current || (net && net.mode === 'client')) return;
  syncOpenFurnaceFromSlots();   // offenen Ofen vor dem Speichern in die Registry sichern
  // Craftfelder, Ergebnisse und Ofen-Spiegel nicht im Inventar mitspeichern
  var saveInv = slots.slice();
  for(var i=CRAFT_0; i<=CRAFT_RESULT; i++) saveInv[i] = null;
  for(var j=TABLE_0; j<=TABLE_RESULT; j++) saveInv[j] = null;
  saveInv[FUR_IN] = null; saveInv[FUR_FUEL] = null; saveInv[FUR_OUT] = null;
  current.player = {
    x:player.pos.x, y:player.pos.y, z:player.pos.z,
    yaw:player.yaw, pitch:player.pitch, mode:gameMode,
    hp:health, food:hunger, inv:saveInv
  };
  current.furnaces = furnaces;   // jeder Ofen mit eigenem Inhalt
  saveWorlds();
}

