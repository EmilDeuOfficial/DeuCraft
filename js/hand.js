/* ============ First-Person Hand/Item (3D Viewmodel) ============ */
(function(){

/* Eigene Szene + feste Kamera für das Viewmodel. Wird nach der Welt
   gerendert; nur der Tiefenpuffer wird vorher gelöscht, damit Arm und
   Item immer über der Welt liegen, intern aber korrekt 3D überdecken. */
var hScene = new THREE.Scene();
var hCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 10);
hCam.position.set(0, 0, 0);

/* --- Arm (kommt aus der unteren rechten Ecke) --- */
var armGroup = new THREE.Group();
var armMat   = new THREE.MeshBasicMaterial({ color: 0xc99a6a });
var sleeveMat = new THREE.MeshBasicMaterial({ color: 0x4a7bd0 });
/* Ärmel (oben) + nackter Unterarm/Hand (unten zur Faust) */
var sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.22), sleeveMat);
sleeve.position.set(0, 0.30, 0);
var fore   = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), armMat);
fore.position.set(0, -0.18, 0);
armGroup.add(sleeve);
armGroup.add(fore);
armGroup.position.set(0.76, -0.82, -0.82);
armGroup.rotation.set(0.18, -0.16, 0.36);
hScene.add(armGroup);

/* Leichtes Shading auf die Würfelseiten, damit sie ohne Licht 3D wirken */
function shadeBox(geo){
  var shades = [0.82, 0.82, 1.0, 0.6, 0.9, 0.72]; // +x,-x,+y,-y,+z,-z
  var colors = [];
  for(var f = 0; f < 6; f++) for(var v = 0; v < 4; v++){ var s = shades[f]; colors.push(s, s, s); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}
shadeBox(sleeve.geometry); sleeveMat.vertexColors = true;
shadeBox(fore.geometry);   armMat.vertexColors = true;

/* --- Block als echter 3D-Würfel aus dem Atlas --- */
function buildCube(id){
  var t = blockTiles[id];                       // [top, bottom, side]
  var geo = new THREE.BoxGeometry(1, 1, 1);
  var uv = geo.attributes.uv;
  var faceTile = [t[2], t[2], t[0], t[1], t[2], t[2]]; // +x,-x,+y,-y,+z,-z
  for(var f = 0; f < 6; f++){
    for(var v = 0; v < 4; v++){
      var i = f * 4 + v;
      uv.setX(i, (faceTile[f] + uv.getX(i)) / TILES);
    }
  }
  uv.needsUpdate = true;
  shadeBox(geo);
  var mat = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true });
  return new THREE.Mesh(geo, mat);
}

/* --- Tool/Item: 16×16 Icon Pixel-für-Pixel zu Voxel-Modell extrudieren --- */
function buildExtruded(id){
  var cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
  var c = cv.getContext('2d');
  drawItemIcon(c, id);
  var data = c.getImageData(0, 0, 16, 16).data;
  function alpha(x, y){ if(x < 0 || y < 0 || x > 15 || y > 15) return 0; return data[(y * 16 + x) * 4 + 3]; }

  var pos = [], col = [];
  var s = 1 / 16;          // Pixelgröße (gesamtes Sprite = 1 Einheit)
  var d = s * 1.6;         // Dicke der Platte
  function quad(a, b, cc, dd, r, g, bl, sh){
    var v = [a, b, cc, a, cc, dd];
    for(var i = 0; i < 6; i++){ var p = v[i]; pos.push(p[0], p[1], p[2]); col.push(r * sh, g * sh, bl * sh); }
  }
  for(var py = 0; py < 16; py++) for(var pxl = 0; pxl < 16; pxl++){
    if(alpha(pxl, py) < 30) continue;
    var idx = (py * 16 + pxl) * 4;
    var r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
    var x0 = (pxl - 8) * s, x1 = x0 + s;
    var y1 = (8 - py) * s, y0 = y1 - s;
    var zf = d / 2, zb = -d / 2;
    quad([x0,y0,zf],[x1,y0,zf],[x1,y1,zf],[x0,y1,zf], r,g,b, 1.0);   // front
    quad([x1,y0,zb],[x0,y0,zb],[x0,y1,zb],[x1,y1,zb], r,g,b, 0.7);   // back
    if(alpha(pxl-1,py) < 30) quad([x0,y0,zb],[x0,y0,zf],[x0,y1,zf],[x0,y1,zb], r,g,b, 0.8); // -x
    if(alpha(pxl+1,py) < 30) quad([x1,y0,zf],[x1,y0,zb],[x1,y1,zb],[x1,y1,zf], r,g,b, 0.8); // +x
    if(alpha(pxl,py-1) < 30) quad([x0,y1,zf],[x1,y1,zf],[x1,y1,zb],[x0,y1,zb], r,g,b, 0.92); // +y
    if(alpha(pxl,py+1) < 30) quad([x0,y0,zb],[x1,y0,zb],[x1,y0,zf],[x0,y0,zf], r,g,b, 0.6);  // -y
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
  var mat = new THREE.MeshBasicMaterial({ vertexColors: true });
  return new THREE.Mesh(geo, mat);
}

/* Mesh-Cache pro Item-ID */
var meshCache = {};
var curMesh = null, curId = -1;
function getMesh(id){
  if(meshCache[id] !== undefined) return meshCache[id];
  var m = blockTiles[id] ? buildCube(id) : buildExtruded(id);
  meshCache[id] = m;
  return m;
}

var bobT = 0;
var swingPhase = 0;

window.renderHand = function(dt){
  hCam.fov = curFov;
  hCam.aspect = window.innerWidth / window.innerHeight;
  hCam.updateProjectionMatrix();

  var show = inGame && !invOpen;
  armGroup.visible = show;
  if(!show){ if(curMesh) curMesh.visible = false; swingPhase = 0; return; }

  /* Gehaltenes Item ermitteln */
  var sl = slots[selected];
  var id = (sl && sl.id && sl.id !== AIR) ? sl.id : 0;

  if(id !== curId){
    if(curMesh){ hScene.remove(curMesh); curMesh.visible = false; }
    curId = id;
    curMesh = id ? getMesh(id) : null;
    if(curMesh){ hScene.add(curMesh); }
  }

  /* Lauf-Bob */
  var spd = Math.sqrt(player.vel.x * player.vel.x + player.vel.z * player.vel.z);
  var moving = player.onGround && spd > 0.6;
  if(moving) bobT += dt * 9.5;
  var bx = moving ? Math.sin(bobT) * 0.022 : 0;
  var by = moving ? Math.abs(Math.sin(bobT)) * -0.020 : 0;

  /* Abbau-Schwung: läuft solange ein Block abgebaut oder Mob angegriffen wird */
  var isMining = (mineTarget !== null) || touchMining
              || (mouseLeft && locked && !nearestMobHit && gameMode === 'creative');
  if(isMining){
    swingPhase = (swingPhase + dt * 2.8) % 1;
  } else {
    swingPhase = 0;
  }
  /* Schnell nach vorne, langsam zurück: asymmetrische Kurve per halbem Sinus */
  var sw = Math.sin(swingPhase * Math.PI * 2);
  var sDy = sw * -0.13;          // Arm taucht beim Schlag nach unten
  var sDz = Math.max(0, sw) * 0.11;  // kurzer Ruck nach vorne
  var sRx = sw * 0.60;           // Kippwinkel nach vorne

  armGroup.position.set(0.60 + bx, -0.62 + by + sDy, -0.92 + sDz);
  armGroup.rotation.set(0.32 + sRx, -0.10, 0.42);

  if(curMesh){
    curMesh.visible = true;
    var isBlock = !!blockTiles[curId];
    if(isBlock){
      curMesh.scale.setScalar(0.42);
      curMesh.position.set(0.44 + bx, -0.24 + by + sDy, -0.46 + sDz);
      curMesh.rotation.set(0.46 + sRx, -0.72, 0);
    } else {
      curMesh.scale.setScalar(0.68);
      curMesh.position.set(0.42 + bx, -0.24 + by + sDy, -0.60 + sDz);
      curMesh.rotation.set(0.40 + sRx, -0.40, 0.40);
    }
  }

  /* Über der Welt rendern: nur Tiefe löschen, Farbe behalten */
  var prevAutoClear = renderer.autoClear;
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(hScene, hCam);
  renderer.autoClear = prevAutoClear;
};

window.addEventListener('resize', function(){
  hCam.aspect = window.innerWidth / window.innerHeight;
  hCam.updateProjectionMatrix();
});

})();
