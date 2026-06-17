/* ============================================================
   MEHRSPIELER (PeerJS, 6-stelliger Code, host-autoritativ)
   Topologie: Stern. Host in der Mitte, jeder Client nur am Host.
   Der Host bekommt einen 6-stelligen Code. Der Beitretende tippt
   ihn ein und ist sofort verbunden. Die Vermittlung läuft über den
   kostenlosen PeerJS-Broker, danach ist die Verbindung direkt P2P.
   ============================================================ */
var net = {
  mode: 'off',          // 'off' | 'host' | 'client'
  peer: null,           // PeerJS Peer Instanz (beide Rollen)
  conns: {},            // host: id -> { conn, name, x,y,z,yaw,pitch, authed }
  hostConn: null,       // client: Verbindung zum Host
  nextId: 1,
  myId: 0,
  code: '',             // host: der 6-stellige Code
  usePassword: false,
  password: ''
};
var remotePlayers = {}; // id -> { group, head, name, x,y,z,yaw,pitch, tx,ty,tz,tyaw,tpitch }
var netAccum = 0;
var ID_PREFIX = 'bc3dmc-';   // eigener Namensraum auf dem Broker, mindert Kollisionen

/* PeerJS bei Bedarf nachladen (zwei CDNs als Rückfall) */
var peerLib = { loading:null };
function ensurePeer(){
  if(typeof Peer !== 'undefined') return Promise.resolve();
  if(peerLib.loading) return peerLib.loading;
  peerLib.loading = new Promise(function(res, rej){
    var urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js',
      'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
    ];
    var i = 0;
    (function next(){
      if(i >= urls.length){ rej(new Error('Mehrspieler-Bibliothek konnte nicht geladen werden. Internet nötig.')); return; }
      var s = document.createElement('script');
      s.src = urls[i++];
      s.onload = function(){ res(); };
      s.onerror = next;
      document.head.appendChild(s);
    })();
  });
  return peerLib.loading;
}
function peerErrMsg(err){
  var t = err && err.type;
  if(t === 'peer-unavailable') return 'Code nicht gefunden. Läuft der Host noch?';
  if(t === 'network') return 'Keine Verbindung zum Vermittlungs-Server.';
  if(t === 'server-error') return 'Vermittlungs-Server nicht erreichbar.';
  if(t === 'unavailable-id') return 'Code schon vergeben.';
  if(t === 'browser-incompatible') return 'Dieser Browser unterstützt kein WebRTC.';
  return (err && err.message) || 'Verbindungsfehler';
}

function jsend(conn, obj){
  try{ if(conn && conn.open) conn.send(obj); }catch(e){}
}
function hostBroadcast(obj, exceptId){
  for(var id in net.conns){
    if(exceptId != null && id == exceptId) continue;
    var p = net.conns[id];
    if(p.authed) jsend(p.conn, obj);
  }
}
function netSendBlock(x,y,z,id){
  if(net.mode === 'host') hostBroadcast({ t:'block', x:x, y:y, z:z, id:id });
  else if(net.mode === 'client') jsend(net.hostConn, { t:'block', x:x, y:y, z:z, id:id });
}
function applyRemoteBlock(x,y,z,id){
  setB(x,y,z,id);
  rebuildAt(x,z);
}
function broadcastFurnaceState(fk){
  if(net.mode !== 'host') return;
  var f = furnaces[fk]; if(!f) return;
  hostBroadcast({ t:'furnace', k:fk, in:f.in, fuel:f.fuel, out:f.out, burnLeft:f.burnLeft, burnMax:f.burnMax, prog:f.prog });
}
function notifyFurnaceChange(){
  if(net.mode !== 'client' || !openFurnaceKey || !furnaces[openFurnaceKey]) return;
  var f = furnaces[openFurnaceKey];
  jsend(net.hostConn, { t:'furnace_set', k:openFurnaceKey, in:f.in, fuel:f.fuel, out:f.out });
}
function broadcastChestState(ck){
  if(net.mode !== 'host') return;
  hostBroadcast({ t:'chest', k:ck, slots:chests[ck] || [] });
}
function notifyChestChange(){
  if(net.mode !== 'client' || !openChestKey) return;
  jsend(net.hostConn, { t:'chest_set', k:openChestKey, slots:chests[openChestKey] || [] });
}

/* ---------- HOST ---------- */
function hostStart(){
  if(net.mode === 'host') return Promise.resolve(net.code);
  if(net.mode === 'client') return Promise.reject(new Error('Du bist gerade als Gast verbunden.'));
  return ensurePeer().then(function(){
    return new Promise(function(res, rej){ tryHostId(0, res, rej); });
  });
}
function tryHostId(attempt, res, rej){
  if(attempt > 6){ rej(new Error('Kein freier Code gefunden, bitte erneut versuchen.')); return; }
  var code = String(Math.floor(100000 + Math.random()*900000));
  var peer = new Peer(ID_PREFIX + code, { debug:0 });
  var opened = false;
  peer.on('open', function(){
    opened = true;
    net.peer = peer; net.mode = 'host'; net.myId = 0; net.code = code;
    peer.on('connection', function(conn){ setupHostConn(conn); });
    document.getElementById('netBadge').classList.add('on');
    updateNetBadge();
    res(code);
  });
  peer.on('error', function(err){
    if(!opened && err && err.type === 'unavailable-id'){
      try{ peer.destroy(); }catch(e){}
      tryHostId(attempt + 1, res, rej);
    } else if(!opened){
      try{ peer.destroy(); }catch(e){}
      rej(new Error(peerErrMsg(err)));
    } else {
      if(err && err.type === 'peer-unavailable') return;
      showToast('Netzwerk: ' + peerErrMsg(err));
    }
  });
}
function setupHostConn(conn){
  var id = net.nextId++;
  net.conns[id] = { conn:conn, name:'?', x:0,y:0,z:0,yaw:0,pitch:0, authed:false };
  conn.on('data', function(d){ hostHandle(id, d); });
  conn.on('close', function(){ hostDropPeer(id); });
  conn.on('error', function(){ hostDropPeer(id); });
}
function hostHandle(id, m){
  var peer = net.conns[id];
  if(!peer || !m) return;
  if(m.t === 'hello'){
    if(net.usePassword && m.password !== net.password){
      jsend(peer.conn, { t:'reject', reason:'Falsches Passwort' });
      setTimeout(function(){ try{ peer.conn.close(); }catch(e){} }, 250);
      return;
    }
    peer.authed = true;
    peer.name = (m.name || 'Spieler').slice(0,16);
    jsend(peer.conn, {
      t:'welcome', id:id, seed:SEED, name:current ? current.name : 'Welt',
      mode:gameMode, diff:current ? current.diff : 2
    });
    sendEditsTo(peer.conn);
    jsend(peer.conn, { t:'furnace_all', data:furnaces });
    jsend(peer.conn, { t:'chest_all', data:chests });
    showToast(peer.name + ' ist beigetreten');
    refreshPlayerList();
    updateNetBadge();
  } else if(!peer.authed){
    return;
  } else if(m.t === 'pos'){
    peer.x = m.x; peer.y = m.y; peer.z = m.z; peer.yaw = m.yaw; peer.pitch = m.pitch;
  } else if(m.t === 'block'){
    applyRemoteBlock(m.x, m.y, m.z, m.id);
    hostBroadcast({ t:'block', x:m.x, y:m.y, z:m.z, id:m.id }, id);
  } else if(m.t === 'mobhit'){
    var mob = mobById(m.i);
    if(!mob) return;
    mob.hp -= (m.d || 2);
    mob.hop = 0.18; mob.vy = 3.2;
    mob.fleeT = 2.0 + Math.random();
    mob.fleeYaw = m.fyaw !== undefined ? m.fyaw : Math.random()*Math.PI*2;
    if(mob.hp <= 0){
      jsend(peer.conn, { t:'mobdrop', drops: mobDrops(mob.type) });
      var mi = mobs.indexOf(mob);
      if(mi >= 0) removeMob(mi);
    }
  } else if(m.t === 'furnace_set'){
    var fz = furnaces[m.k];
    if(!fz) return;
    fz.in = m.in || null; fz.fuel = m.fuel || null; fz.out = m.out || null;
    hostBroadcast({ t:'furnace', k:m.k, in:fz.in, fuel:fz.fuel, out:fz.out, burnLeft:fz.burnLeft, burnMax:fz.burnMax, prog:fz.prog }, id);
  } else if(m.t === 'chest_set'){
    chests[m.k] = m.slots || [];
    hostBroadcast({ t:'chest', k:m.k, slots:chests[m.k] }, id);
  } else if(m.t === 'pvphit'){
    var pvpD = Math.min(m.d || 2, 10);
    if((m.id|0) === 0){
      damage(pvpD);
    } else {
      var pvpT = net.conns[m.id];
      if(pvpT && pvpT.authed) jsend(pvpT.conn, { t:'hurt', d:pvpD });
    }
  }
}
function sendEditsTo(conn){
  // Bauänderungen in kleinen Paketen senden, damit auch große Welten
  // unter dem Größenlimit einer Verbindung bleiben.
  var keys = Object.keys(editsByChunk);
  var batch = {}, count = 0;
  for(var i=0; i<keys.length; i++){
    batch[keys[i]] = editsByChunk[keys[i]];
    count++;
    if(count >= 16){ jsend(conn, { t:'edits', d:batch }); batch = {}; count = 0; }
  }
  if(count > 0) jsend(conn, { t:'edits', d:batch });
  jsend(conn, { t:'editsdone' });
}
function hostDropPeer(id){
  var peer = net.conns[id];
  if(!peer) return;
  if(peer.authed) showToast((peer.name || 'Ein Spieler') + ' hat verlassen');
  try{ peer.conn.close(); }catch(e){}
  delete net.conns[id];
  removeAvatar(id);
  refreshPlayerList();
  updateNetBadge();
}
function hostKick(id){ hostDropPeer(id); }

/* ---------- CLIENT ---------- */
function clientConnect(code, name, password){
  return ensurePeer().then(function(){
    return new Promise(function(res, rej){
      var peer = new Peer({ debug:0 });   // zufällige eigene ID
      net._code = code; net._joinName = name; net._joinPass = password;
      var opened = false, settled = false;
      function fail(msg){ if(!settled){ settled = true; rej(new Error(msg)); } }
      peer.on('open', function(){
        opened = true;
        net.peer = peer;
        var conn = peer.connect(ID_PREFIX + code, { reliable:true });
        net.hostConn = conn;
        setupClientConn(conn, function(){ if(!settled){ settled = true; res(); } });
      });
      peer.on('error', function(err){
        if(err && err.type === 'peer-unavailable') fail(peerErrMsg(err));
        else if(!opened) fail(peerErrMsg(err));
        else if(net.mode !== 'client') showToast('Netzwerk: ' + peerErrMsg(err));
      });
      setTimeout(function(){
        if(net.mode !== 'client') fail('Zeitüberschreitung. Code prüfen und ob der Host online ist.');
      }, 15000);
    });
  });
}
function setupClientConn(conn, onOpen){
  conn.on('open', function(){
    jsend(conn, { t:'hello', name:net._joinName, password:net._joinPass });
    if(onOpen) onOpen();
  });
  conn.on('data', function(d){ clientHandle(d); });
  conn.on('close', function(){ onClientLost('Verbindung zum Host getrennt'); });
  conn.on('error', function(){});
}
function clientHandle(m){
  if(!m) return;
  if(m.t === 'welcome'){
    net.mode = 'client';
    net.myId = m.id;
    startClientWorld(m);
  } else if(m.t === 'reject'){
    showJoinError(m.reason || 'Abgelehnt');
    try{ if(net.peer) net.peer.destroy(); }catch(e){}
    net.peer = null; net.hostConn = null;
  } else if(m.t === 'block'){
    applyRemoteBlock(m.x, m.y, m.z, m.id);
  } else if(m.t === 'edits'){
    for(var k in m.d){
      editsByChunk[k] = m.d[k];
      if(chunks[k]){ unloadMesh(chunks[k]); delete chunks[k]; }
    }
    lastPCX = -999;
    updateChunks(true);
    processQueue(40);
  } else if(m.t === 'editsdone'){
    lastPCX = -999;
    updateChunks(true);
    processQueue(40);
  } else if(m.t === 'players'){
    if(m.day !== undefined) dayTime = m.day;
    syncRoster(m.list);
  } else if(m.t === 'mobs'){
    syncMobs(m.list);
  } else if(m.t === 'mobdrop'){
    if(m.drops) m.drops.forEach(function(d){ addItem(d.id, d.count); });
    showToast('Beute erhalten');
  } else if(m.t === 'furnace'){
    if(!furnaces[m.k]){ var pts = m.k.split('|'); furnaces[m.k] = newFurnace(pts[0]|0, pts[1]|0, pts[2]|0); }
    var fz = furnaces[m.k];
    fz.in = m.in||null; fz.fuel = m.fuel||null; fz.out = m.out||null;
    fz.burnLeft = m.burnLeft||0; fz.burnMax = m.burnMax||0; fz.prog = m.prog||0;
    if(openFurnaceKey === m.k){ mirrorFurnaceToSlots(fz); invDirty = true; }
  } else if(m.t === 'furnace_all'){
    for(var fk in m.data){
      var fd = m.data[fk];
      furnaces[fk] = { x:fd.x, y:fd.y, z:fd.z, in:fd.in||null, fuel:fd.fuel||null, out:fd.out||null,
                       burnLeft:fd.burnLeft||0, burnMax:fd.burnMax||0, prog:fd.prog||0 };
    }
  } else if(m.t === 'chest'){
    chests[m.k] = m.slots || [];
    if(openChestKey === m.k){ syncChestToMirror(); invDirty = true; renderInvUI(); }
  } else if(m.t === 'chest_all'){
    for(var ck in m.data){ chests[ck] = m.data[ck] || []; }
  } else if(m.t === 'hurt'){
    damage(m.d || 2);
  }
}
function onClientLost(reason){
  if(net.mode !== 'client') return;
  var savedCode = net._code, savedName = net._joinName, savedPass = net._joinPass;
  net.mode = 'off';
  try{ if(net.peer) net.peer.destroy(); }catch(e){}
  net.peer = null; net.hostConn = null;
  if(!inGame || !savedCode){ showToast(reason); leaveToMenu(false); return; }
  showToast(reason + ' – Wiederverbindung...');
  var attempt = 0;
  (function tryReconnect(){
    if(attempt >= 3){ showToast('Verbindung verloren'); leaveToMenu(false); return; }
    attempt++;
    setTimeout(function(){
      if(net.mode === 'client') return;   // in der Zwischenzeit verbunden
      clientConnect(savedCode, savedName, savedPass).catch(function(){ tryReconnect(); });
    }, attempt * 2000);
  })();
}

/* ---------- Tick: Positionen austauschen ---------- */
function netTick(dt){
  if(net.mode === 'off') return;
  netAccum += dt;
  if(netAccum < 0.066) return;   // ~15 Hz
  netAccum = 0;
  if(net.mode === 'client'){
    jsend(net.hostConn, {
      t:'pos', x:player.pos.x, y:player.pos.y, z:player.pos.z,
      yaw:player.yaw, pitch:player.pitch
    });
  } else if(net.mode === 'host'){
    var list = [{ id:0, name:settings.name, x:player.pos.x, y:player.pos.y, z:player.pos.z, yaw:player.yaw, pitch:player.pitch }];
    for(var id in net.conns){
      var p = net.conns[id];
      if(!p.authed) continue;
      list.push({ id:id|0, name:p.name, x:p.x, y:p.y, z:p.z, yaw:p.yaw, pitch:p.pitch });
    }
    hostBroadcast({ t:'players', list:list, day:dayTime });
    // Tiere an die Clients schicken
    hostBroadcast({ t:'mobs', list: mobs.map(function(m){
      return { i:m.id, t:(m.type==='cow'?0:m.type==='sheep'?1:2),
               x:Math.round(m.x*100)/100, y:Math.round(m.y*100)/100, z:Math.round(m.z*100)/100,
               r:Math.round(m.yaw*100)/100 };
    }) });
    var seen = {};
    for(var id2 in net.conns){
      var pp = net.conns[id2];
      if(!pp.authed) continue;
      seen[id2] = true;
      setAvatarTarget(id2|0, pp.name, pp.x, pp.y, pp.z, pp.yaw, pp.pitch);
    }
    for(var rk in remotePlayers){ if(!seen[rk]) removeAvatar(rk|0); }
  }
}
/* Client bekommt die volle Spielerliste vom Host */
function syncRoster(list){
  var seen = {};
  for(var i=0; i<list.length; i++){
    var e = list[i];
    if((e.id|0) === (net.myId|0)) continue;   // sich selbst nicht zeichnen
    seen[e.id] = true;
    setAvatarTarget(e.id|0, e.name, e.x, e.y, e.z, e.yaw, e.pitch);
  }
  for(var rk in remotePlayers){ if(!seen[rk]) removeAvatar(rk|0); }
}

/* ---------- Avatare ---------- */
function makeLabel(text){
  var cv = document.createElement('canvas');
  cv.width = 160; cv.height = 36;
  var c = cv.getContext('2d');
  c.fillStyle = 'rgba(0,0,0,0.55)';
  c.fillRect(0,0,160,36);
  c.font = 'bold 20px monospace';
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text.slice(0,12), 80, 18);
  var tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, depthTest:true, transparent:true }));
  spr.scale.set(1.8, 0.4, 1);
  return spr;
}
function makeAvatar(name){
  var g = new THREE.Group();
  var body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.95, 0.32),
    new THREE.MeshBasicMaterial({ color:0x3a6ea5 })
  );
  body.position.y = 0.95/2 + 0.78;
  var legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.78, 0.3),
    new THREE.MeshBasicMaterial({ color:0x2c3e66 })
  );
  legs.position.y = 0.78/2;
  var head = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.52, 0.52),
    new THREE.MeshBasicMaterial({ color:0xd9a066 })
  );
  head.position.y = 0.78 + 0.95 + 0.26;
  var label = makeLabel(name);
  label.position.y = 0.78 + 0.95 + 0.85;
  g.add(legs); g.add(body); g.add(head); g.add(label);
  scene.add(g);
  return { group:g, head:head };
}
function setAvatarTarget(id, name, x, y, z, yaw, pitch){
  var rp = remotePlayers[id];
  if(!rp){
    var av = makeAvatar(name || 'Spieler');
    rp = remotePlayers[id] = {
      group:av.group, head:av.head, name:name,
      x:x, y:y, z:z, yaw:yaw, pitch:pitch,
      tx:x, ty:y, tz:z, tyaw:yaw, tpitch:pitch
    };
  }
  rp.tx = x; rp.ty = y; rp.tz = z; rp.tyaw = yaw; rp.tpitch = pitch;
}
function removeAvatar(id){
  var rp = remotePlayers[id];
  if(!rp) return;
  scene.remove(rp.group);
  rp.group.traverse(function(o){
    if(o.geometry) o.geometry.dispose();
    if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
  delete remotePlayers[id];
}
function clearAvatars(){
  for(var id in remotePlayers) removeAvatar(id|0);
}
function angLerp(a, b, t){
  var d = b - a;
  while(d > Math.PI) d -= Math.PI*2;
  while(d < -Math.PI) d += Math.PI*2;
  return a + d*t;
}
function updateAvatars(dt){
  var k = Math.min(1, dt*12);
  for(var id in remotePlayers){
    var rp = remotePlayers[id];
    rp.x += (rp.tx - rp.x)*k;
    rp.y += (rp.ty - rp.y)*k;
    rp.z += (rp.tz - rp.z)*k;
    rp.yaw = angLerp(rp.yaw, rp.tyaw, k);
    rp.group.position.set(rp.x, rp.y, rp.z);
    rp.group.rotation.y = rp.yaw;
  }
}

function updateNetBadge(){
  var b = document.getElementById('netBadge');
  if(net.mode === 'off'){ b.classList.remove('on'); return; }
  b.classList.add('on');
  if(net.mode === 'host'){
    var n = 0; for(var k in net.conns) if(net.conns[k].authed) n++;
    b.textContent = 'Hosting · Code ' + net.code + ' · ' + n + ' verbunden';
  } else {
    b.textContent = 'Mehrspieler · verbunden';
  }
}

function netShutdown(){
  if(net.peer){ try{ net.peer.destroy(); }catch(e){} }  // schließt alle Verbindungen
  net.peer = null; net.conns = {}; net.hostConn = null;
  net.mode = 'off'; net.myId = 0; net.code = '';
  clearAvatars();
  updateNetBadge();
}

window.addEventListener('beforeunload', function(){
  if(net.mode !== 'off') netShutdown();
});

