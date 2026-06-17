/* ============ Welt starten ============ */
function startWorld(w){
  current = w;
  SEED = w.seed;
  unloadAllChunks();
  clearMobs();
  furnaces = {}; openFurnaceKey = null;
  editsByChunk = {};
  editsDirty = false;
  gameMode = w.mode;
  flying = false;
  document.body.classList.remove('flying');

  store.get('bc_edits_' + w.id).then(function(raw){
    if(raw){ try{ editsByChunk = JSON.parse(raw) || {}; }catch(e){ editsByChunk = {}; } }

    slots = new Array(TOTAL_SLOTS).fill(null);
    health = 20; hunger = 20;

    if(w.player){
      player.pos.set(w.player.x, w.player.y, w.player.z);
      player.yaw = w.player.yaw; player.pitch = w.player.pitch;
      if(w.player.mode) gameMode = w.player.mode;
      if(typeof w.player.hp === 'number') health = w.player.hp;
      if(typeof w.player.food === 'number') hunger = w.player.food;
      if(w.player.inv){
        // Lager (0..39) und Rüstung (45..48) laden, Craftfelder und Ofen bleiben leer (Öfen kommen separat)
        for(var i=0; i<SLOTS_N; i++) slots[i] = w.player.inv[i] || null;
        for(var a=ARMOR_0; a<ARMOR_END; a++) slots[a] = w.player.inv[a] || null;
      }
    } else {
      player.pos.set(WORLD_BLOCKS/2 + 0.5, 40, WORLD_BLOCKS/2 + 0.5);
      player.yaw = 0; player.pitch = 0;
      spawnHeight();
      // Kreativ startet mit gefüllter Hotbar, Überleben mit leerer
      if(gameMode === 'creative'){
        var items = [GRASS, DIRT, STONE, WOOD, LEAVES, SAND, PLANK];
        for(var j=0; j<items.length; j++) slots[j] = { id:items[j], count:MAX_STACK };
      }
    }
    player.vel.set(0,0,0);
    fallPeak = 0;
    selected = 0;
    // gespeicherte Tiere wiederherstellen (nur Host/Einzelspieler)
    if(w.mobs && net.mode !== 'client'){
      w.mobs.forEach(function(m){ spawnMob(m.type, m.x, m.y, m.z, m.hp); });
    }
    // gespeicherte Öfen (jeder mit eigenem Inhalt) wiederherstellen
    if(w.furnaces){
      for(var fk in w.furnaces){
        var s = w.furnaces[fk];
        if(!s) continue;
        var nf = newFurnace(s.x, s.y, s.z);
        nf.in = s.in || null; nf.fuel = s.fuel || null; nf.out = s.out || null;
        nf.burnLeft = s.burnLeft || 0; nf.burnMax = s.burnMax || 0; nf.prog = s.prog || 0;
        furnaces[fk] = nf;
      }
    }
    document.body.classList.toggle('creativeMode', gameMode === 'creative');

    inGame = true; paused = false; invOpen = false;
    invDirty = true; statsDirty = true;
    document.body.classList.add('playing');
    show(null);
    applySettings();
    updateChunks(true);
    processQueue(30);
    if(!isTouch) canvas.requestPointerLock();
  });
}

/* ============ Init ============ */
document.getElementById('btnRespawn').addEventListener('click', respawn);
buildInvUI();
store.get('bc_settings').then(function(raw){
  if(raw){ try{ var s = JSON.parse(raw); if(s) settings = Object.assign(settings, s); }catch(e){} }
  refreshSettingsUI();
  applySettings();
});
store.get('bc_worlds').then(function(raw){
  if(raw){ try{ worlds = JSON.parse(raw) || []; }catch(e){ worlds = []; } }
});
loop();
