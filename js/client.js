/* ============ Client betritt die Host-Welt ============ */
function startClientWorld(welcome){
  current = {
    id:'remote', name:welcome.name || 'Mehrspieler-Welt',
    seed:welcome.seed, mode:welcome.mode || 'survival',
    diff:(typeof welcome.diff === 'number') ? welcome.diff : 2,
    cheats:false, player:null
  };
  SEED = welcome.seed;
  gameMode = welcome.mode || 'survival';
  flying = false;
  document.body.classList.remove('flying');
  document.body.classList.toggle('creativeMode', gameMode === 'creative');

  unloadAllChunks();
  clearAvatars();
  clearMobs();
  furnaces = {}; openFurnaceKey = null;
  editsByChunk = welcome.edits || {};
  editsDirty = false;

  slots = new Array(TOTAL_SLOTS).fill(null);
  health = 20; hunger = 20;
  if(gameMode === 'creative'){
    var items = [GRASS, DIRT, STONE, WOOD, LEAVES, SAND, PLANK];
    for(var j=0; j<items.length; j++) slots[j] = { id:items[j], count:MAX_STACK };
  }
  selected = 0;
  fallPeak = 0;

  player.pos.set(WORLD_BLOCKS/2 + 0.5, 40, WORLD_BLOCKS/2 + 0.5);
  player.yaw = 0; player.pitch = 0; player.vel.set(0,0,0);
  spawnHeight();

  inGame = true; paused = false; invOpen = false;
  invDirty = true; statsDirty = true;
  document.body.classList.add('playing');
  show(null);
  applySettings();
  updateChunks(true);
  processQueue(30);
  updateNetBadge();
  if(!isTouch) canvas.requestPointerLock();
  showToast('Mit "' + (welcome.name || 'Welt') + '" verbunden');
}

