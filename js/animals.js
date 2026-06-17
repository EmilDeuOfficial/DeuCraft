/* ============ Tiere (Kühe, Schafe) ============ */
var mobs = [];
var MOB_CAP = 8;
var mobSpawnT = 0;

// Materialien (unbeleuchtet, passend zum Spielstil)
var MMAT = {};
function mmat(hex){ if(!MMAT[hex]) MMAT[hex] = new THREE.MeshBasicMaterial({ color:hex }); return MMAT[hex]; }
function boxPart(w,h,d, col, x,y,z){
  var m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mmat(col));
  m.position.set(x,y,z);
  return m;
}
function makeMobModel(type){
  var g = new THREE.Group();
  if(type === 'cow'){
    g.add(boxPart(0.7, 0.62, 1.05, 0x6b4a2e, 0, 0.78, 0));  // Körper braun
    g.add(boxPart(0.72, 0.30, 0.5, 0xe8e2d2, 0, 0.74, 0.34));                          // weißer Fleck
    g.add(boxPart(0.42, 0.42, 0.40, 0x5a3d24, 0, 0.92, -0.66));                        // Kopf
    g.add(boxPart(0.18, 0.10, 0.10, 0xd8d0c0, -0.12, 1.02, -0.86));                    // Horn
    g.add(boxPart(0.18, 0.10, 0.10, 0xd8d0c0,  0.12, 1.02, -0.86));
    var lc = 0x4f3620;
    g.add(boxPart(0.18,0.5,0.18, lc, -0.24,0.25,-0.34));
    g.add(boxPart(0.18,0.5,0.18, lc,  0.24,0.25,-0.34));
    g.add(boxPart(0.18,0.5,0.18, lc, -0.24,0.25, 0.36));
    g.add(boxPart(0.18,0.5,0.18, lc,  0.24,0.25, 0.36));
  } else if(type === 'sheep'){
    g.add(boxPart(0.66, 0.66, 0.92, 0xeeeeee, 0, 0.82, 0));     // Wollkörper
    g.add(boxPart(0.40, 0.40, 0.40, 0x33271c, 0, 0.86, -0.58)); // Kopf dunkel
    var ls = 0x33271c;
    g.add(boxPart(0.16,0.45,0.16, ls, -0.2,0.22,-0.28));
    g.add(boxPart(0.16,0.45,0.16, ls,  0.2,0.22,-0.28));
    g.add(boxPart(0.16,0.45,0.16, ls, -0.2,0.22, 0.3));
    g.add(boxPart(0.16,0.45,0.16, ls,  0.2,0.22, 0.3));
  } else {
    // Zombie: grüner Humanoid
    g.add(boxPart(0.55, 0.78, 0.30, 0x1e4a1e, 0, 0.39, 0));           // Beine
    g.add(boxPart(0.60, 0.95, 0.32, 0x2d6b2d, 0, 0.78+0.475, 0));     // Körper
    g.add(boxPart(0.52, 0.52, 0.52, 0x4a7a3a, 0, 0.78+0.95+0.26, 0)); // Kopf
    g.add(boxPart(0.20, 0.70, 0.20, 0x2d6b2d, -0.40, 0.78+0.50, -0.20)); // Arm links
    g.add(boxPart(0.20, 0.70, 0.20, 0x2d6b2d,  0.40, 0.78+0.50, -0.20)); // Arm rechts
  }
  scene.add(g);
  return g;
}
function solidBlock(id){ return id !== AIR; }
// höchste feste Blockoberkante unter/at y an Position x,z
function groundUnder(x, y, z){
  var bx = Math.floor(x), bz = Math.floor(z);
  for(var yy = Math.min(SY-1, Math.floor(y)+1); yy >= 0; yy--){
    if(solidBlock(getB(bx, yy, bz))) return yy + 1;
  }
  return 0;
}
function mobBlocked(x, y, z){
  // feste Blöcke auf Körperhöhe (Füße und Kopf)?
  return solidBlock(getB(Math.floor(x), Math.floor(y+0.2), Math.floor(z))) ||
         solidBlock(getB(Math.floor(x), Math.floor(y+0.9), Math.floor(z)));
}
var mobNextId = 1;
function spawnMob(type, x, y, z, hp){
  var m = { id:mobNextId++, type:type, x:x, y:y, z:z, vy:0, yaw:Math.random()*Math.PI*2,
            wt:1+Math.random()*2, idle:false,
            hp:(typeof hp === 'number' ? hp : (type==='cow'?10:type==='sheep'?8:20)),
            g:makeMobModel(type), hop:0, fleeT:0, fleeYaw:0, attackT:0 };
  m.g.position.set(x,y,z);
  mobs.push(m);
}
function mobById(id){ for(var i=0;i<mobs.length;i++) if(mobs[i].id === id) return mobs[i]; return null; }
function allPlayerPositions(){
  var pos = [{ id:-1, x:player.pos.x, y:player.pos.y, z:player.pos.z }];
  if(net.mode === 'host'){
    for(var pid in net.conns){
      var pp = net.conns[pid];
      if(pp.authed) pos.push({ id:pid|0, x:pp.x, y:pp.y||0, z:pp.z });
    }
  }
  return pos;
}
function mobNearAnyPlayer(m){
  var maxD = (settings.dist * CHUNK) + 8;
  var pos = allPlayerPositions();
  for(var i=0; i<pos.length; i++){
    var dx = m.x - pos[i].x, dz = m.z - pos[i].z;
    if(dx*dx + dz*dz <= maxD*maxD) return true;
  }
  return false;
}
function hasTorchNearby(wx, wy, wz, r){
  var r2 = r * r;
  var x0 = Math.floor(wx) - r, x1 = Math.floor(wx) + r;
  var y0 = Math.max(0, Math.floor(wy) - r), y1 = Math.min(SY - 1, Math.floor(wy) + r);
  var z0 = Math.floor(wz) - r, z1 = Math.floor(wz) + r;
  for(var bx = x0; bx <= x1; bx++){
    for(var by = y0; by <= y1; by++){
      for(var bz = z0; bz <= z1; bz++){
        var dx = bx + 0.5 - wx, dy = by + 0.5 - wy, dz = bz + 0.5 - wz;
        if(dx*dx + dy*dy + dz*dz <= r2 && isTorch(getB(bx, by, bz))) return true;
      }
    }
  }
  return false;
}

function trySpawnMobs(){
  if(mobs.length >= MOB_CAP) return;
  var positions = allPlayerPositions();
  var center = positions[Math.floor(Math.random()*positions.length)];
  for(var attempt=0; attempt<4; attempt++){
    var ang = Math.random()*Math.PI*2, dist = 14 + Math.random()*14;
    var x = center.x + Math.cos(ang)*dist;
    var z = center.z + Math.sin(ang)*dist;
    var cx = Math.floor(x)>>4, cz = Math.floor(z)>>4;
    if(!chunks[ckey(cx,cz)]) continue;
    var h = terrainHeight(Math.floor(x), Math.floor(z));
    if(getB(Math.floor(x), h, Math.floor(z)) !== GRASS) continue;
    var sr = Math.random();
    var spawnType = (isNight() && sr < 0.3) ? 'zombie' : (Math.random() < 0.5 ? 'cow' : 'sheep');
    if(spawnType === 'zombie' && hasTorchNearby(Math.floor(x)+0.5, h+1, Math.floor(z)+0.5, 5)) continue;
    spawnMob(spawnType, Math.floor(x)+0.5, h+1, Math.floor(z)+0.5);
    return;
  }
}
function removeMob(i){
  var m = mobs[i];
  scene.remove(m.g);
  m.g.traverse(function(o){ if(o.geometry) o.geometry.dispose(); });
  mobs.splice(i, 1);
}
function mobAngDiff(a, b){ var d = (b - a) % (Math.PI*2); if(d > Math.PI) d -= Math.PI*2; if(d < -Math.PI) d += Math.PI*2; return d; }
// Client: Tiere nur anzeigen, Positionen vom Host interpolieren
function updateClientMobs(dt){
  var k = Math.min(1, dt*5);   // langsamer = weicher
  for(var i=0; i<mobs.length; i++){
    var m = mobs[i];
    if(m.tx !== undefined){
      var ddx = m.tx-m.x, ddy = m.ty-m.y, ddz = m.tz-m.z;
      if(ddx*ddx + ddy*ddy + ddz*ddz > 25){
        // mehr als 5 Blöcke Abstand -> sofort teleportieren statt gleiten
        m.x = m.tx; m.y = m.ty; m.z = m.tz; m.yaw = m.tyaw;
      } else {
        m.x += (m.tx - m.x) * k;
        m.y += (m.ty - m.y) * k;
        m.z += (m.tz - m.z) * k;
        m.yaw += mobAngDiff(m.yaw, m.tyaw) * k;
      }
    }
    m.g.position.set(m.x, m.y, m.z);
    m.g.rotation.y = m.yaw;
  }
}
// Client: Tierliste vom Host abgleichen
function syncMobs(list){
  var seen = {};
  for(var i=0; i<list.length; i++){
    var e = list[i]; seen[e.i] = true;
    var mob = mobById(e.i);
    var type = e.t === 0 ? 'cow' : e.t === 1 ? 'sheep' : 'zombie';
    if(!mob){
      mob = { id:e.i, type:type, x:e.x, y:e.y, z:e.z, yaw:e.r,
              tx:e.x, ty:e.y, tz:e.z, tyaw:e.r, g:makeMobModel(type) };
      mob.g.position.set(e.x, e.y, e.z);
      mobs.push(mob);
    } else {
      mob.tx = e.x; mob.ty = e.y; mob.tz = e.z; mob.tyaw = e.r;
    }
  }
  for(var j = mobs.length - 1; j >= 0; j--){ if(!seen[mobs[j].id]) removeMob(j); }
}
function updateMobs(dt){
  if(net.mode === 'client'){ updateClientMobs(dt); return; }   // Client simuliert nicht
  // Spawnen drosseln (Host/Einzelspieler)
  mobSpawnT += dt;
  if(mobSpawnT > 3){ mobSpawnT = 0; if(gameMode === 'survival') trySpawnMobs(); }

  for(var i = mobs.length - 1; i >= 0; i--){
    var m = mobs[i];
    if(!mobNearAnyPlayer(m)){ removeMob(i); continue; }   // zu weit von allen Spielern -> entfernen

    // Bewegung: Zombie verfolgt Spieler, Kuh/Schaf wandern/fliehen
    if(m.type === 'zombie'){
      var zpl = allPlayerPositions();
      var znear = null, znearD2 = Infinity;
      for(var zpi = 0; zpi < zpl.length; zpi++){
        var zpp = zpl[zpi];
        var zdx = zpp.x - m.x, zdy = zpp.y - m.y, zdz = zpp.z - m.z;
        var zd2 = zdx*zdx + zdy*zdy + zdz*zdz;
        if(zd2 < znearD2){ znearD2 = zd2; znear = zpp; }
      }
      if(znear){
        m.yaw = Math.atan2(m.x - znear.x, m.z - znear.z);
        if(znearD2 > 1.44){
          var zsp = 2.2;
          var znx = m.x - Math.sin(m.yaw) * zsp * dt;
          var znz = m.z - Math.cos(m.yaw) * zsp * dt;
          if(!mobBlocked(znx, m.y, znz)){ m.x = znx; m.z = znz; }
          else { m.yaw += Math.PI * 0.5; }
        }
        if(m.attackT > 0) m.attackT -= dt;
        if(znearD2 < 2.25 && m.attackT <= 0){
          m.attackT = 1.2;
          if(znear.id === -1){
            damage(3);
          } else if(net.mode === 'host'){
            var ztc = net.conns[znear.id];
            if(ztc && ztc.authed) jsend(ztc.conn, { t:'hurt', d:3 });
          }
        }
      }
    } else {
      // Flucht hat Vorrang vor normalem Wandern
      if(m.fleeT > 0){
        m.fleeT -= dt;
        m.idle = false;
        m.yaw = m.fleeYaw;
        var fsp = 2.8;
        var fnx = m.x - Math.sin(m.yaw) * fsp * dt;
        var fnz = m.z - Math.cos(m.yaw) * fsp * dt;
        if(!mobBlocked(fnx, m.y, fnz)){ m.x = fnx; m.z = fnz; }
        else { m.fleeYaw = Math.random()*Math.PI*2; m.yaw = m.fleeYaw; }
      } else {
        // normales Wandern
        m.wt -= dt;
        if(m.wt <= 0){
          m.wt = 1.5 + Math.random()*3;
          m.idle = Math.random() < 0.35;
          if(!m.idle) m.yaw = Math.random()*Math.PI*2;
        }
        if(!m.idle){
          var sp = 1.3;
          var nx = m.x - Math.sin(m.yaw) * sp * dt;
          var nz = m.z - Math.cos(m.yaw) * sp * dt;
          if(!mobBlocked(nx, m.y, nz)){ m.x = nx; m.z = nz; }
          else { m.yaw = Math.random()*Math.PI*2; }
        }
      }
    }
    // Schwerkraft + Boden
    m.vy -= GRAVITY * dt;
    m.y += m.vy * dt;
    var gy = groundUnder(m.x, m.y + 0.5, m.z);
    if(m.y <= gy){ m.y = gy; m.vy = 0; }

    if(m.hop > 0) m.hop -= dt;
    m.g.position.set(m.x, m.y + (m.hop > 0 ? 0.12 : 0), m.z);
    m.g.rotation.y = m.yaw;
  }
}
function clearMobs(){ for(var i = mobs.length - 1; i >= 0; i--) removeMob(i); }

// Strahl-Kugel-Schnitt, gibt nächste positive Distanz oder null
function raySphere(ox,oy,oz, dx,dy,dz, cx,cy,cz, r){
  var ex = ox - cx, ey = oy - cy, ez = oz - cz;
  var b = ex*dx + ey*dy + ez*dz;
  var c = ex*ex + ey*ey + ez*ez - r*r;
  var disc = b*b - c;
  if(disc < 0) return null;
  var t = -b - Math.sqrt(disc);
  if(t < 0) t = -b + Math.sqrt(disc);
  return t >= 0 ? t : null;
}
function nearestMobHit(reach){
  var ox = player.pos.x, oy = player.pos.y + player.eye, oz = player.pos.z;
  var dx = -Math.sin(player.yaw)*Math.cos(player.pitch);
  var dy = Math.sin(player.pitch);
  var dz = -Math.cos(player.yaw)*Math.cos(player.pitch);
  var best = null, bestT = reach;
  for(var i=0; i<mobs.length; i++){
    var m = mobs[i];
    var t = raySphere(ox,oy,oz, dx,dy,dz, m.x, m.y + 0.55, m.z, 0.7);
    if(t != null && t < bestT){ bestT = t; best = { mob:m, t:t, idx:i, dx:dx, dz:dz }; }
  }
  return best;
}
function nearestAvatarHit(reach){
  var ox = player.pos.x, oy = player.pos.y + player.eye, oz = player.pos.z;
  var dx = -Math.sin(player.yaw)*Math.cos(player.pitch);
  var dy = Math.sin(player.pitch);
  var dz = -Math.cos(player.yaw)*Math.cos(player.pitch);
  var best = null, bestT = reach;
  for(var rid in remotePlayers){
    var rp = remotePlayers[rid];
    var t = raySphere(ox,oy,oz, dx,dy,dz, rp.x, rp.y + 1.0, rp.z, 0.6);
    if(t != null && t < bestT){ bestT = t; best = { id:rid|0, t:t }; }
  }
  return best;
}
function meleeDamage(){
  var ti = toolInfo(slots[selected] ? slots[selected].id : 0);
  if(ti && ti.type === 'sword') return ti.tier === 2 ? 5 : 4;
  return 2;   // Faust
}
function mobDrops(type){
  var d = [];
  if(type === 'cow'){
    d.push({ id:RAW_BEEF, count:1 + (Math.random()<0.5?1:0) });
    var lz = Math.random()<0.7 ? (1 + (Math.random()<0.4?1:0)) : 0;
    if(lz > 0) d.push({ id:LEATHER, count:lz });
  } else {
    d.push({ id:RAW_MUTTON, count:1 + (Math.random()<0.5?1:0) });
    d.push({ id:WOOL, count:1 });
  }
  return d;
}
function killMob(m){
  if(gameMode === 'survival' && m.type !== 'zombie') mobDrops(m.type).forEach(function(d){ addItem(d.id, d.count); });
  var toasts = { cow:'Kuh erlegt', sheep:'Schaf erlegt', zombie:'Zombie besiegt!' };
  showToast(toasts[m.type] || m.type + ' erlegt');
}
function meleeAttack(){
  var hit = nearestMobHit(3.4);
  var avatarHit = nearestAvatarHit(3.4);
  // PvP: Avatar-Treffer hat Vorrang wenn er näher ist
  if(avatarHit && (!hit || avatarHit.t < hit.t)){
    var pvpD = meleeDamage();
    if(net.mode === 'client'){
      jsend(net.hostConn, { t:'pvphit', id:avatarHit.id, d:pvpD });
    } else if(net.mode === 'host'){
      var pvpT = net.conns[avatarHit.id];
      if(pvpT && pvpT.authed) jsend(pvpT.conn, { t:'hurt', d:pvpD });
    }
    return true;
  }
  if(!hit) return false;
  var m = hit.mob;
  var fleeYaw = Math.atan2(hit.dx, hit.dz) + Math.PI;
  if(net.mode === 'client'){
    jsend(net.hostConn, { t:'mobhit', i:m.id, d:meleeDamage(), fyaw:fleeYaw });
    m.hop = 0.18;
    return true;
  }
  m.hp -= meleeDamage();
  m.hop = 0.18;
  m.fleeT = 2.0 + Math.random();
  m.fleeYaw = fleeYaw;
  var nx = m.x + hit.dx * 0.5, nz = m.z + hit.dz * 0.5;
  if(!mobBlocked(nx, m.y, nz)){ m.x = nx; m.z = nz; }
  m.vy = 3.2;
  if(m.hp <= 0){
    killMob(m);
    var idx = mobs.indexOf(m);
    if(idx >= 0) removeMob(idx);
  }
  return true;
}


var sprinting = false, curFov = settings.fov;
var infoEl = document.getElementById('info');
var last = performance.now(), fpsT = 0, fpsC = 0, fps = 0;
var saveTimer = 0;

function survivalTick(dt){
  var diff = current ? current.diff : 2;
  // Hunger sinkt langsam (nicht auf Friedlich)
  if(diff > 0){
    hungerDrain += dt * (0.7 + diff*0.25);     // schwerer = schneller hungrig
    if(sprinting) hungerDrain += dt * 1.6;     // Sprinten kostet extra Hunger
    if(hungerDrain > 28){
      hungerDrain = 0;
      if(hunger > 0){ hunger--; statsDirty = true; }
    }
  } else if(hunger < 20){
    hunger = 20; statsDirty = true;
  }
  // Regeneration bei vollem Hunger
  if(hunger >= 18 && health < 20){
    regenTimer += dt;
    if(regenTimer > 2){
      regenTimer = 0;
      health = Math.min(20, health + 1);
      statsDirty = true;
      if(diff > 0){ hungerDrain += 8; }
    }
  } else regenTimer = 0;
  // Verhungern
  if(hunger <= 0){
    starveTimer += dt;
    if(starveTimer > 3){
      starveTimer = 0;
      var floor2 = (diff >= 3) ? 0 : (diff === 2 ? 1 : 10);
      if(health > floor2) damage(1);
    }
  } else starveTimer = 0;
}

function step(dt){
  var fx = 0, fz = 0;
  if(keys['KeyW']) fz -= 1;
  if(keys['KeyS']) fz += 1;
  if(keys['KeyA']) fx -= 1;
  if(keys['KeyD']) fx += 1;
  fx += joyVec.x; fz += joyVec.y;
  var len = Math.sqrt(fx*fx + fz*fz);
  if(len > 1){ fx /= len; fz /= len; }

  // Sprinten: vorwärts und (Doppel-W / Strg) oder Joystick voll, und nicht am Verhungern
  var movingFwd = (keys['KeyW'] || joyVec.y < -0.2);
  var joySprint = joyVec.y < -0.55 && Math.abs(joyVec.x) < 0.6;
  var ctrlSprint = (keys['ControlLeft'] || keys['ControlRight']) && movingFwd;
  sprinting = !flying && len > 0.1 && movingFwd && hunger > 0 &&
              (wantSprint || ctrlSprint || joySprint);

  var sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  var spd = flying ? FLY_SPEED : (sprinting ? SPEED * 1.45 : SPEED);
  player.vel.x = ( fx*cos + fz*sin) * spd;
  player.vel.z = (-fx*sin + fz*cos) * spd;

  // sanfte FOV-Anpassung beim Sprinten
  var tgtFov = settings.fov + (sprinting ? 8 : 0);
  curFov += (tgtFov - curFov) * Math.min(1, dt*9);
  if(Math.abs(curFov - camera.fov) > 0.05){ camera.fov = curFov; camera.updateProjectionMatrix(); }

  if(flying){
    player.vel.y = 0;
    if(keys['Space'] || jumpHeld) player.vel.y = FLY_SPEED * 0.8;
    if(keys['ShiftLeft'] || keys['ShiftRight'] || downHeld) player.vel.y = -FLY_SPEED * 0.8;
  } else {
    player.vel.y -= GRAVITY * dt;
    if(player.vel.y < -40) player.vel.y = -40;
    if((keys['Space'] || jumpHeld) && player.onGround && !invOpen){
      player.vel.y = JUMP;
      player.onGround = false;
      hungerDrain += 0.4;
    }
  }

  var p = player.pos;
  var wasGround = player.onGround;
  p.x += player.vel.x * dt;
  if(collides(p)){ p.x -= player.vel.x * dt; player.vel.x = 0; }
  p.z += player.vel.z * dt;
  if(collides(p)){ p.z -= player.vel.z * dt; player.vel.z = 0; }
  p.y += player.vel.y * dt;
  if(collides(p)){
    if(player.vel.y < 0 && !flying){
      player.onGround = true;
      // Fallschaden
      if(gameMode === 'survival' && fallPeak > 0){
        var fallDist = fallPeak - p.y;
        var dmg = Math.floor(fallDist - 3);
        if(dmg > 0) damage(dmg);
      }
      fallPeak = 0;
    }
    p.y -= player.vel.y * dt;
    player.vel.y = 0;
  } else {
    if(!flying){
      player.onGround = false;
      if(p.y > fallPeak) fallPeak = p.y;
      if(wasGround) fallPeak = p.y;
    } else fallPeak = 0;
  }

  p.x = Math.max(0.5, Math.min(WORLD_BLOCKS - 0.5, p.x));
  p.z = Math.max(0.5, Math.min(WORLD_BLOCKS - 0.5, p.z));
  if(p.y > SY + 20) p.y = SY + 20;
  if(p.y < -10) die();

  camera.position.set(p.x, p.y + player.eye, p.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  // Kreativ: Dauerabbau bei gehaltener Maus
  if(gameMode === 'creative' && mouseLeft && locked && !nearestMobHit(3.4)){
    creativeBreakCd -= dt;
    if(creativeBreakCd <= 0){ breakBlockInstant(); creativeBreakCd = 0.22; }
  }
  updateMining(dt);
  if(gameMode === 'survival') survivalTick(dt);

  var r = raycast(6);
  if(r && !nearestMobHit(3.4)){
    highlight.visible = true;
    highlight.position.set(r.hit[0]+0.5, r.hit[1]+0.5, r.hit[2]+0.5);
  } else highlight.visible = false;
}

function loop(){
  requestAnimationFrame(loop);
  var now = performance.now();
  var dt = Math.min((now - last)/1000, 0.05);
  last = now;

  if(inGame && !paused && !invOpen){
    step(dt);
    updateChunks(false);
    processQueue(2);
    netTick(dt);
    if(net.mode !== 'client'){
      saveTimer += dt;
      if(saveTimer > 5){
        saveTimer = 0;
        if(editsDirty) saveEdits();
        savePlayerState();
      }
    }
  }
  if(inGame) updateAvatars(dt);
  if(inGame && !paused) updateMobs(dt);
  if(inGame && !paused) furnaceTick(dt);
  if(inGame && !paused) updateDayNight(dt);
  if(invDirty){ invDirty = false; renderHotbar(); if(invOpen) renderInvUI(); }
  if(statsDirty){ statsDirty = false; renderStats(); }
  renderer.render(scene, camera);
  if(inGame) renderHand(dt);

  if(inGame){
    fpsC++;
    if(now - fpsT > 500){
      fps = Math.round(fpsC * 1000/(now - fpsT));
      fpsT = now; fpsC = 0;
      var loaded = 0;
      for(var k in chunks) if(chunks[k].mesh) loaded++;
      infoEl.innerHTML = 'FPS: ' + fps +
        '<br>XYZ: ' + Math.floor(player.pos.x) + ' ' + Math.floor(player.pos.y) + ' ' + Math.floor(player.pos.z) +
        '<br>Modus: ' + (gameMode === 'survival' ? 'Überleben' : 'Kreativ') + (flying ? ' (fliegt)' : '') +
        '<br>Chunks: ' + loaded + (buildQueue.length ? ' (+' + buildQueue.length + ')' : '') +
        '<br>Zeit: ' + dayTimeStr() + (isNight() ? ' (Nacht)' : ' (Tag)');
    }
  }
}

window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

