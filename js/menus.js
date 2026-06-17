/* ============ Menü-Logik ============ */
function show(id){
  var scr = document.querySelectorAll('.screen');
  for(var i=0; i<scr.length; i++) scr[i].classList.remove('open');
  if(id) document.getElementById(id).classList.add('open');
}
function showToast(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._tm);
  t._tm = setTimeout(function(){ t.style.display = 'none'; }, 1800);
}

document.getElementById('btnSingle').addEventListener('click', function(){
  renderWorldList(); show('scrWorlds');
});
document.getElementById('btnMulti').addEventListener('click', function(){
  document.getElementById('joinName').value = settings.name || 'Spieler';
  document.getElementById('joinPass').value = '';
  document.getElementById('joinCode').value = '';
  document.getElementById('joinStatus').textContent = '';
  document.getElementById('joinError').textContent = '';
  show('scrJoin');
});
var settingsReturn = 'scrMain';
document.getElementById('btnSettings').addEventListener('click', function(){
  settingsReturn = 'scrMain'; show('scrSettings');
});
document.getElementById('btnExit').addEventListener('click', function(){
  window.close();
  setTimeout(function(){ showToast('Du kannst den Tab jetzt schließen'); }, 100);
});
document.getElementById('btnWorldsBack').addEventListener('click', function(){ show('scrMain'); });
document.getElementById('btnNewWorld').addEventListener('click', function(){
  document.getElementById('inWorldName').value = 'Neue Welt';
  document.getElementById('inSeed').value = '';
  createMode = 'survival'; createDiff = 2; createCheats = false;
  refreshCreateUI();
  show('scrCreate');
});

function renderWorldList(){
  var list = document.getElementById('worldList');
  list.innerHTML = '';
  if(!worlds.length){
    list.innerHTML = '<div class="empty">Noch keine Welten. Erstell deine erste!</div>';
    return;
  }
  worlds.forEach(function(w){
    var div = document.createElement('div');
    div.className = 'world';
    var info = document.createElement('div');
    info.className = 'winfo';
    var name = document.createElement('div');
    name.className = 'wname';
    name.textContent = w.name;
    var meta = document.createElement('div');
    meta.className = 'wmeta';
    meta.textContent = (w.mode === 'survival' ? 'Überleben' : 'Kreativ') +
      ' · ' + DIFFS[w.diff] + ' · Cheats ' + (w.cheats ? 'an' : 'aus') + ' · Seed ' + w.seed;
    info.appendChild(name); info.appendChild(meta);
    var play = document.createElement('button');
    play.textContent = 'Spielen';
    play.addEventListener('click', function(){ startWorld(w); });
    var del = document.createElement('button');
    del.className = 'del';
    del.textContent = 'X';
    del.addEventListener('click', function(){
      if(del.textContent === 'X'){
        del.textContent = 'Sicher?';
        setTimeout(function(){ del.textContent = 'X'; }, 2500);
        return;
      }
      worlds = worlds.filter(function(o){ return o.id !== w.id; });
      saveWorlds();
      store.del('bc_edits_' + w.id);
      renderWorldList();
    });
    div.appendChild(info); div.appendChild(play); div.appendChild(del);
    list.appendChild(div);
  });
}

var createMode = 'survival', createDiff = 2, createCheats = false;
function refreshCreateUI(){
  var m = document.getElementById('tglMode');
  m.textContent = createMode === 'survival' ? 'Überleben' : 'Kreativ';
  m.classList.toggle('on', createMode === 'creative');
  document.getElementById('tglDiff').textContent = DIFFS[createDiff];
  var c = document.getElementById('tglCheats');
  c.textContent = createCheats ? 'An' : 'Aus';
  c.classList.toggle('on', createCheats);
}
document.getElementById('tglMode').addEventListener('click', function(){
  createMode = createMode === 'survival' ? 'creative' : 'survival'; refreshCreateUI();
});
document.getElementById('tglDiff').addEventListener('click', function(){
  createDiff = (createDiff + 1) % DIFFS.length; refreshCreateUI();
});
document.getElementById('tglCheats').addEventListener('click', function(){
  createCheats = !createCheats; refreshCreateUI();
});
document.getElementById('btnCreateBack').addEventListener('click', function(){
  renderWorldList(); show('scrWorlds');
});
document.getElementById('btnCreateGo').addEventListener('click', function(){
  var name = document.getElementById('inWorldName').value.trim() || 'Neue Welt';
  var seedIn = document.getElementById('inSeed').value.trim();
  var seed;
  if(seedIn === '') seed = Math.floor(Math.random()*999999) + 1;
  else if(/^\d+$/.test(seedIn)) seed = parseInt(seedIn) || 1;
  else {
    seed = 0;
    for(var i=0; i<seedIn.length; i++) seed = ((seed*31) + seedIn.charCodeAt(i)) % 999999;
    seed = seed || 1;
  }
  var w = {
    id: 'w' + Date.now() + Math.floor(Math.random()*1000),
    name: name, seed: seed,
    mode: createMode, diff: createDiff, cheats: createCheats,
    created: Date.now(), player: null
  };
  worlds.push(w);
  saveWorlds();
  startWorld(w);
});

function refreshSettingsUI(){
  document.getElementById('inName').value = settings.name || 'Spieler';
  document.getElementById('rngDist').value = settings.dist;
  document.getElementById('valDist').textContent = settings.dist + ' Ch.';
  document.getElementById('rngFov').value = settings.fov;
  document.getElementById('valFov').textContent = settings.fov;
  document.getElementById('rngSens').value = settings.sens;
  document.getElementById('valSens').textContent = settings.sens + '%';
  var fogBtn = document.getElementById('tglFog');
  var fogOn = settings.fog !== false;
  fogBtn.textContent = fogOn ? 'An' : 'Aus';
  fogBtn.classList.toggle('on', fogOn);
}
document.getElementById('inName').addEventListener('input', function(e){
  settings.name = e.target.value.trim().slice(0,16) || 'Spieler';
  saveSettings();
});
document.getElementById('rngDist').addEventListener('input', function(e){
  settings.dist = parseInt(e.target.value);
  document.getElementById('valDist').textContent = settings.dist + ' Ch.';
  applySettings(); saveSettings();
});
document.getElementById('tglFog').addEventListener('click', function(){
  settings.fog = settings.fog === false;
  refreshSettingsUI();
  applySettings(); saveSettings();
});
document.getElementById('rngFov').addEventListener('input', function(e){
  settings.fov = parseInt(e.target.value);
  document.getElementById('valFov').textContent = settings.fov;
  applySettings(); saveSettings();
});
document.getElementById('rngSens').addEventListener('input', function(e){
  settings.sens = parseInt(e.target.value);
  document.getElementById('valSens').textContent = settings.sens + '%';
  saveSettings();
});
document.getElementById('btnSettingsBack').addEventListener('click', function(){
  show(settingsReturn);
});

var pauseBtn = document.getElementById('btnPause');
pauseBtn.addEventListener('click', openPause);
function openPause(){
  if(!inGame || paused) return;
  if(invOpen) closeInv();
  paused = true;
  if(locked) document.exitPointerLock();
  if(net.mode !== 'client'){ savePlayerState(); if(editsDirty) saveEdits(); }
  // Pausenmenü an Rolle anpassen
  var hostBtn = document.getElementById('btnHostOpen');
  var quitBtn = document.getElementById('btnSaveQuit');
  if(net.mode === 'client'){
    hostBtn.style.display = 'none';
    quitBtn.textContent = 'Verbindung trennen';
  } else {
    hostBtn.style.display = '';
    hostBtn.textContent = (net.mode === 'host') ? 'Mehrspieler verwalten' : 'Welt hosten';
    quitBtn.textContent = 'Speichern und Hauptmenü';
  }
  show('scrPause');
}
document.getElementById('btnResume').addEventListener('click', function(){
  paused = false;
  show(null);
  if(!isTouch) canvas.requestPointerLock();
});
document.getElementById('btnPauseSettings').addEventListener('click', function(){
  settingsReturn = 'scrPause'; show('scrSettings');
});
document.getElementById('btnHostOpen').addEventListener('click', function(){
  show('scrHost');
  refreshPlayerList();
  if(net.mode === 'host'){
    refreshHostUI();
    return;
  }
  // Code erzeugen (lädt bei Bedarf PeerJS nach)
  document.getElementById('hostCodeBig').textContent = '...';
  document.getElementById('tglHostPass').textContent = net.usePassword ? 'An' : 'Aus';
  document.getElementById('tglHostPass').classList.toggle('on', net.usePassword);
  document.getElementById('hostPassRow').style.display = net.usePassword ? '' : 'none';
  document.getElementById('hostPass').value = net.password;
  hostStart().then(function(code){
    refreshHostUI();
    updateNetBadge();
  }).catch(function(e){
    document.getElementById('hostCodeBig').textContent = 'Fehler';
    showToast(e.message || String(e));
  });
});
document.getElementById('btnSaveQuit').addEventListener('click', function(){
  leaveToMenu(net.mode !== 'client');
});

/* Spiel verlassen, optional speichern, Netzwerk schließen */
function leaveToMenu(doSave){
  if(doSave && net.mode !== 'client'){
    savePlayerState();
    if(editsDirty) saveEdits();
  }
  netShutdown();
  inGame = false; paused = false; invOpen = false;
  scrInv.classList.remove('open');
  document.body.classList.remove('playing','flying','creativeMode');
  unloadAllChunks();
  clearMobs();
  furnaces = {}; openFurnaceKey = null;
  current = null;
  show('scrMain');
}

