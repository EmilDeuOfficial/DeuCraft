/* ============ Truhen ============ */
function chKey(x,y,z){ return (x|0)+'|'+(y|0)+'|'+(z|0); }

function syncChestToMirror(){
  if(!openChestKey) return;
  var s = chests[openChestKey] || [];
  for(var i=0; i<27; i++) slots[CHEST_0+i] = s[i] || null;
}

function syncMirrorToChest(){
  if(!openChestKey) return;
  if(!chests[openChestKey]) chests[openChestKey] = new Array(27).fill(null);
  for(var i=0; i<27; i++) chests[openChestKey][i] = slots[CHEST_0+i] || null;
}

function openChest(x,y,z){
  if(!inGame || paused) return;
  openChestKey = chKey(x,y,z);
  syncChestToMirror();
  invOpen = true;
  setPanelMode('chest');
  document.getElementById('creativeBox').style.display = (gameMode === 'creative') ? 'block' : 'none';
  renderInvUI();
  scrInv.classList.add('open');
  if(locked) document.exitPointerLock();
}
