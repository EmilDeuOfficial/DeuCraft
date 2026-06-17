/* ============ Input ============ */
var keys = {};
var isTouch = ('ontouchstart' in window) && navigator.maxTouchPoints > 0;
if(isTouch) document.body.classList.add('touch');

var lastSpace = 0;
var lastWTap = 0, wantSprint = false;
document.addEventListener('keydown', function(e){
  keys[e.code] = true;
  if(!inGame || paused) return;
  if(e.code === 'KeyE'){ e.preventDefault(); invOpen ? closeInv() : openInv(); return; }
  if(invOpen) return;
  if(e.code.indexOf('Digit') === 0){
    var n = parseInt(e.code.slice(5));
    selectSlot(n === 0 ? 9 : n-1);
  }
  if(e.code === 'KeyW' && !e.repeat){
    var nw = performance.now();
    if(nw - lastWTap < 300) wantSprint = true;   // Doppeltipp W = sprinten
    lastWTap = nw;
  }
  if(e.code === 'Space' && !e.repeat && gameMode === 'creative'){
    var now = performance.now();
    if(now - lastSpace < 300) toggleFly();
    lastSpace = now;
  }
  if(e.code === 'KeyG' && current && current.cheats) toggleGameMode();
});
document.addEventListener('keyup', function(e){
  keys[e.code] = false;
  if(e.code === 'KeyW') wantSprint = false;       // Sprint endet beim Loslassen
});

function toggleFly(){
  if(gameMode !== 'creative'){ flying = false; return; }
  flying = !flying;
  player.vel.y = 0;
  document.body.classList.toggle('flying', flying);
  showToast(flying ? 'Fliegen an' : 'Fliegen aus');
}
function toggleGameMode(){
  gameMode = (gameMode === 'survival') ? 'creative' : 'survival';
  if(gameMode === 'survival'){ flying = false; document.body.classList.remove('flying'); }
  document.body.classList.toggle('creativeMode', gameMode === 'creative');
  invDirty = true; statsDirty = true;
  showToast('Spielmodus: ' + (gameMode === 'survival' ? 'Überleben' : 'Kreativ'));
}

var locked = false;
var skipNextMove = false;   // ersten mousemove nach Lock-Erwerb ignorieren
canvas.addEventListener('click', function(){
  if(inGame && !paused && !invOpen && !isTouch && !locked) canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', function(){
  locked = (document.pointerLockElement === canvas);
  if(locked) skipNextMove = true;   // Browser sendet oft einen riesigen Versatz-Event direkt nach Lock
  if(!locked && inGame && !paused && !invOpen && !isTouch) openPause();
});
document.addEventListener('mousemove', function(e){
  if(!locked || paused || invOpen) return;
  if(skipNextMove){ skipNextMove = false; return; }   // Spike beim ersten Event überspringen
  var s = 0.0024 * settings.sens/100;
  /* Harter Clamp: max 200 Pixel pro Event verhindert Rest-Spikes */
  var mx = Math.max(-200, Math.min(200, e.movementX));
  var my = Math.max(-200, Math.min(200, e.movementY));
  player.yaw   -= mx * s;
  player.pitch -= my * s;
  player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch));
});

var mouseLeft = false;
var creativeBreakCd = 0;
document.addEventListener('mousedown', function(e){
  if(!locked || paused || invOpen) return;
  if(e.button === 0){
    mouseLeft = true;
    if(meleeAttack()) return;   // erst Tier treffen
    if(gameMode === 'creative' && !nearestMobHit(3.4)){ breakBlockInstant(); creativeBreakCd = 0.22; }
  }
  if(e.button === 2) useItem();
});
document.addEventListener('mouseup', function(e){
  if(e.button === 0) mouseLeft = false;
});
document.addEventListener('contextmenu', function(e){ e.preventDefault(); });
/* Mausrad: Hotbar-Slot wechseln */
document.addEventListener('wheel', function(e){
  if(!inGame || paused || invOpen) return;
  e.preventDefault();
  if(e.deltaY > 0) selected = (selected + 1) % HOTBAR_N;
  else             selected = (selected - 1 + HOTBAR_N) % HOTBAR_N;
  invDirty = true;
}, { passive: false });

/* ---- Touch ---- */
var joy = document.getElementById('joy'), joyKnob = document.getElementById('joyKnob');
var joyVec = { x:0, y:0 }, joyId = null;
var lookId = null, lookLast = null, lookStart = null, lookMoved = false, lookT0 = 0;
var touchMining = false;
var placeMode = false;
var btnMode = document.getElementById('btnMode');
var modeHoldTimer = null;
btnMode.addEventListener('touchstart', function(e){
  e.preventDefault();
  modeHoldTimer = setTimeout(function(){
    modeHoldTimer = null;
    if(current && current.cheats) toggleGameMode();
  }, 700);
});
btnMode.addEventListener('touchend', function(e){
  e.preventDefault();
  if(modeHoldTimer){
    clearTimeout(modeHoldTimer); modeHoldTimer = null;
    placeMode = !placeMode;
    btnMode.textContent = placeMode ? '🧱' : '⛏';
    btnMode.classList.toggle('place', placeMode);
    showToast(placeMode ? 'Modus: Platzieren / Benutzen' : 'Modus: Abbauen');
  }
});
var jumpHeld = false, downHeld = false, lastJumpTap = 0;
var btnJump = document.getElementById('btnJump');
btnJump.addEventListener('touchstart', function(e){
  e.preventDefault(); jumpHeld = true;
  if(gameMode === 'creative'){
    var now = performance.now();
    if(now - lastJumpTap < 300) toggleFly();
    lastJumpTap = now;
  }
});
btnJump.addEventListener('touchend', function(e){ e.preventDefault(); jumpHeld = false; });
var btnDown = document.getElementById('btnDown');
btnDown.addEventListener('touchstart', function(e){ e.preventDefault(); downHeld = true; });
btnDown.addEventListener('touchend', function(e){ e.preventDefault(); downHeld = false; });

function joyUpdate(t){
  var r = joy.getBoundingClientRect();
  var cx = r.left + r.width/2, cy = r.top + r.height/2;
  var dx = t.clientX - cx, dy = t.clientY - cy;
  var len = Math.sqrt(dx*dx + dy*dy), max = r.width/2;
  if(len > max){ dx = dx/len*max; dy = dy/len*max; }
  joyVec.x = dx/max; joyVec.y = dy/max;
  joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
}
joy.addEventListener('touchstart', function(e){
  e.preventDefault();
  joyId = e.changedTouches[0].identifier;
  joyUpdate(e.changedTouches[0]);
});
document.addEventListener('touchmove', function(e){
  if(!inGame || paused || invOpen) return;
  for(var i=0; i<e.changedTouches.length; i++){
    var t = e.changedTouches[i];
    if(t.identifier === joyId){ joyUpdate(t); }
    else if(t.identifier === lookId && lookLast){
      var dx = t.clientX - lookLast.x, dy = t.clientY - lookLast.y;
      if(Math.abs(t.clientX-lookStart.x) + Math.abs(t.clientY-lookStart.y) > 14){
        lookMoved = true; touchMining = false;
      }
      var s = 0.005 * settings.sens/100;
      player.yaw   -= dx * s;
      player.pitch -= dy * s;
      player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch));
      lookLast = { x:t.clientX, y:t.clientY };
    }
  }
}, { passive:false });
document.addEventListener('touchstart', function(e){
  if(!inGame || paused || invOpen) return;
  for(var i=0; i<e.changedTouches.length; i++){
    var t = e.changedTouches[i];
    var el = document.elementFromPoint(t.clientX, t.clientY);
    if(el && (el.closest('#joy') || el.closest('#btnJump') || el.closest('#btnDown') || el.closest('#btnMode') || el.closest('#hotbar') || el.closest('#btnPause') || el.closest('#btnInv'))) continue;
    if(lookId === null){
      lookId = t.identifier;
      lookLast = { x:t.clientX, y:t.clientY };
      lookStart = { x:t.clientX, y:t.clientY };
      lookMoved = false; lookT0 = performance.now();
      if(!placeMode) touchMining = true;   // Finger halten = abbauen
    }
  }
}, { passive:true });
document.addEventListener('touchend', function(e){
  for(var i=0; i<e.changedTouches.length; i++){
    var t = e.changedTouches[i];
    if(t.identifier === joyId){
      joyId = null; joyVec.x = 0; joyVec.y = 0;
      joyKnob.style.transform = 'translate(0,0)';
    }
    if(t.identifier === lookId){
      e.preventDefault(); // prevent ghost-click from landing on newly opened overlay
      if(!lookMoved && performance.now() - lookT0 < 300 && inGame && !paused && !invOpen){
        if(placeMode){
          useItem();
        } else {
          // Abbau-Modus: erst Tier schlagen, sonst Menü-Block, sonst Kreativ-Abbau
          if(!meleeAttack() && !tryOpenBlockGui() && gameMode === 'creative') breakBlockInstant();
        }
      }
      lookId = null; lookLast = null; touchMining = false;
    }
  }
});
document.addEventListener('touchcancel', function(e){
  for(var i=0; i<e.changedTouches.length; i++){
    var t = e.changedTouches[i];
    if(t.identifier === joyId){
      joyId = null; joyVec.x = 0; joyVec.y = 0;
      joyKnob.style.transform = 'translate(0,0)';
    }
    if(t.identifier === lookId){
      lookId = null; lookLast = null; touchMining = false;
    }
  }
});

