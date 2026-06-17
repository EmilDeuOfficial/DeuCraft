/* ============ Einstellungen ============ */
var settings = { dist:5, fov:75, sens:100, name:'Spieler' };
function applySettings(){
  if(camera){ camera.fov = settings.fov; camera.updateProjectionMatrix(); }
  var edge = settings.dist*CHUNK;            // Chunk-Ladekante
  scene.fog.far = edge - 2;                  // Nebel endet genau an der Kante
  scene.fog.near = edge - 22;                // schmales Nebelband davor
  if(inGame){ lastPCX = -999; updateChunks(true); }
}
function saveSettings(){ store.set('bc_settings', JSON.stringify(settings)); }

