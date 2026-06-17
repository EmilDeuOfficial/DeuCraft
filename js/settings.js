/* ============ Einstellungen ============ */
var settings = { dist:5, fov:75, sens:100, name:'Spieler', fog:true };
function applySettings(){
  if(camera){ camera.fov = settings.fov; camera.updateProjectionMatrix(); }
  var edge = settings.dist * CHUNK;
  if(settings.fog !== false){
    scene.fog.near = edge - 22;
    scene.fog.far  = edge - 2;
  } else {
    scene.fog.near = 5000;
    scene.fog.far  = 6000;
  }
  if(inGame){ lastPCX = -999; updateChunks(true); }
}
function saveSettings(){ store.set('bc_settings', JSON.stringify(settings)); }

