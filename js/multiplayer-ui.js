/* ============ Mehrspieler-UI ============ */
function showJoinError(msg){
  document.getElementById('joinError').textContent = msg;
  document.getElementById('joinStatus').textContent = '';
  var btn = document.getElementById('btnJoinGo');
  btn.textContent = 'Beitreten'; btn.disabled = false;
}
document.getElementById('btnJoinBack').addEventListener('click', function(){
  if(net.mode === 'off' && net.peer){ try{ net.peer.destroy(); }catch(e){} net.peer = null; net.hostConn = null; }
  show('scrMain');
});
// nur Ziffern im Code-Feld
document.getElementById('joinCode').addEventListener('input', function(e){
  e.target.value = e.target.value.replace(/\D/g, '').slice(0,6);
});
document.getElementById('btnJoinGo').addEventListener('click', function(){
  var code = document.getElementById('joinCode').value.replace(/\D/g, '');
  var name = document.getElementById('joinName').value.trim().slice(0,16) || 'Spieler';
  var pass = document.getElementById('joinPass').value;
  document.getElementById('joinError').textContent = '';
  if(code.length !== 6){ document.getElementById('joinError').textContent = 'Bitte einen 6-stelligen Code eingeben.'; return; }
  settings.name = name; saveSettings();
  var btn = document.getElementById('btnJoinGo');
  btn.textContent = 'Verbinde...'; btn.disabled = true;
  document.getElementById('joinStatus').textContent = 'Suche Host...';
  clientConnect(code, name, pass).then(function(){
    document.getElementById('joinStatus').textContent = 'Verbunden, lade Welt...';
    // Weiter geht es automatisch, sobald die welcome-Nachricht eintrifft.
  }).catch(function(e){
    showJoinError(e.message || String(e));
  });
});

/* ----- Host-Bildschirm ----- */
function refreshHostUI(){
  var t = document.getElementById('tglHostPass');
  t.textContent = net.usePassword ? 'An' : 'Aus';
  t.classList.toggle('on', net.usePassword);
  document.getElementById('hostPassRow').style.display = net.usePassword ? '' : 'none';
  document.getElementById('hostPass').value = net.password;
  document.getElementById('hostCodeBig').textContent = net.code || '......';
}
document.getElementById('tglHostPass').addEventListener('click', function(){
  net.usePassword = !net.usePassword;
  if(!net.usePassword) net.password = '';
  refreshHostUI();
});
document.getElementById('hostPass').addEventListener('input', function(e){
  net.password = e.target.value;
});
document.getElementById('btnCopyCode').addEventListener('click', function(){
  if(net.code) copyText(net.code, this, 'Code kopieren');
});
document.getElementById('btnHostBack').addEventListener('click', function(){
  paused = false;
  show(null);
  if(!isTouch) canvas.requestPointerLock();
});

function refreshPlayerList(){
  var el = document.getElementById('playerList');
  if(net.mode !== 'host'){ el.innerHTML = '<div class="netHint">Noch niemand verbunden.</div>'; return; }
  var rows = [];
  rows.push('<div class="pl"><span>' + esc(settings.name) + ' (du, Host)</span></div>');
  for(var id in net.conns){
    var p = net.conns[id];
    if(!p.authed) continue;
    rows.push('<div class="pl"><span>' + esc(p.name) + '</span><button data-id="' + id + '">Kick</button></div>');
  }
  if(rows.length === 1) rows.push('<div class="netHint">Gib deinen Code weiter, damit Freunde beitreten können.</div>');
  el.innerHTML = rows.join('');
  var btns = el.querySelectorAll('button[data-id]');
  for(var i=0; i<btns.length; i++){
    btns[i].addEventListener('click', function(){ hostKick(this.getAttribute('data-id')|0); });
  }
}
function esc(s){ return String(s).replace(/[<>&]/g, function(c){ return c==='<'?'&lt;':c==='>'?'&gt;':'&amp;'; }); }
function copyText(text, btn, reset){
  var ok = function(){ btn.textContent = 'Kopiert!'; setTimeout(function(){ btn.textContent = reset; }, 1200); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(ok).catch(function(){ fallbackCopy(text); ok(); });
  } else { fallbackCopy(text); ok(); }
}
function fallbackCopy(text){
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(ta);
}

