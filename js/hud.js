/* ============ HUD: Hotbar ============ */
var hotbarEl = document.getElementById('hotbar');
var slotCtx = [];
for(var hi=0; hi<HOTBAR_N; hi++){
  (function(i){
    var slot = document.createElement('div');
    slot.className = 'slot' + (i===0 ? ' active' : '');
    var cv = document.createElement('canvas');
    cv.width = 16; cv.height = 16;
    slot.appendChild(cv);
    var num = document.createElement('span');
    num.className = 'num';
    num.textContent = (i+1) % 10;
    slot.appendChild(num);
    var cnt = document.createElement('span');
    cnt.className = 'cnt';
    slot.appendChild(cnt);
    slot.addEventListener('click', function(){ selectSlot(i); });
    slot.addEventListener('touchstart', function(e){ e.preventDefault(); selectSlot(i); });
    hotbarEl.appendChild(slot);
    slotCtx.push({ el:slot, ctx:cv.getContext('2d'), cnt:cnt });
  })(hi);
}
var invDirty = true;
function renderHotbar(){
  for(var i=0; i<HOTBAR_N; i++){
    var s = slots[i];
    slotCtx[i].ctx.clearRect(0,0,16,16);
    if(s){
      drawItemIcon(slotCtx[i].ctx, s.id);
      slotCtx[i].cnt.textContent = (gameMode === 'creative') ? '' : (s.count > 1 ? s.count : '');
    } else slotCtx[i].cnt.textContent = '';
    slotCtx[i].el.classList.toggle('active', i === selected);
  }
}
function selectSlot(i){ selected = i; invDirty = true; }

/* ============ HUD: Leben & Hunger ============ */
var statsCv = document.getElementById('statsCv');
var statsCtx = statsCv.getContext('2d');
var statsDirty = true;
statsCtx.imageSmoothingEnabled = false;

function drawHeart(x,y,fill){
  var c = statsCtx;
  function p(ox,oy,col){ c.fillStyle=col; c.fillRect(x+ox*2, y+oy*2, 2, 2); }
  var shape = [[1,0],[2,0],[4,0],[5,0],
               [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
               [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
               [1,3],[2,3],[3,3],[4,3],[5,3],
               [2,4],[3,4],[4,4],
               [3,5]];
  for(var i=0;i<shape.length;i++){
    var sx = shape[i][0], sy = shape[i][1];
    var col = '#3a3a3a';                                   // leer
    if(fill >= 1 || (fill >= 0.5 && sx <= 3)) col = '#e3393c';
    p(sx, sy, col);
  }
  // Glanzpunkt
  if(fill >= 0.5){ c.fillStyle='#ff8a8c'; c.fillRect(x+2, y+2, 2, 2); }
}
function drawFood(x,y,fill){
  var c = statsCtx;
  function p(ox,oy,col){ c.fillStyle=col; c.fillRect(x+ox*2, y+oy*2, 2, 2); }
  var meat = [[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[1,3],[2,3],[3,3]];
  var bone = [[4,3],[5,4],[4,4],[5,5],[6,5],[6,4]];
  var on = fill >= 1 || fill >= 0.5;
  for(var i=0;i<meat.length;i++){
    var mx2 = meat[i][0], my2 = meat[i][1];
    var col = '#3a3a3a';
    if(fill >= 1 || (fill >= 0.5 && mx2 <= 2)) col = '#b5652a';
    p(mx2,my2,col);
  }
  for(var j=0;j<bone.length;j++){
    p(bone[j][0], bone[j][1], on ? '#e8dcc8' : '#3a3a3a');
  }
  if(fill >= 1){ c.fillStyle='#d98a4a'; c.fillRect(x+2, y+2, 2, 2); }
}
function renderStats(){
  statsCtx.clearRect(0,0,statsCv.width,statsCv.height);
  for(var i=0;i<10;i++){
    var hv = health/2 - i;
    drawHeart(i*18, 6, hv >= 1 ? 1 : (hv >= 0.5 ? 0.5 : 0));
  }
  for(var j=0;j<10;j++){
    var fv = hunger/2 - (9-j);
    drawFood(statsCv.width - 180 + j*18, 6, fv >= 1 ? 1 : (fv >= 0.5 ? 0.5 : 0));
  }
}

