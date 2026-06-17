/* ============ First-Person Hand/Item ============ */
(function(){

/* Alle Objekte werden beim ersten renderHand()-Aufruf erstellt,
   damit camera/scene/drawItemIcon definitiv initialisiert sind. */
var handReady = false;
var armMesh, knuckleMesh, itemMesh;
var iconCtx, iconTex;
var lastId = -1;
var bobT = 0;

function init(){
  if(handReady) return;
  handReady = true;

  /* Arm */
  var armMat = new THREE.MeshBasicMaterial({ color: 0xc8a070, depthTest: false });
  armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.78, 0.26), armMat);
  armMesh.renderOrder = 999;

  /* Handknöchel (etwas dunkler) */
  var knuckleMat = new THREE.MeshBasicMaterial({ color: 0xb28858, depthTest: false });
  knuckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.17, 0.29), knuckleMat);
  knuckleMesh.renderOrder = 999;

  /* Item-Plane mit Pixel-Art Icon-Textur */
  var iconCv = document.createElement('canvas');
  iconCv.width = 16; iconCv.height = 16;
  iconCtx = iconCv.getContext('2d');
  iconTex = new THREE.CanvasTexture(iconCv);
  iconTex.magFilter = THREE.NearestFilter;
  iconTex.minFilter = THREE.NearestFilter;

  var itemMat = new THREE.MeshBasicMaterial({
    map: iconTex, transparent: true, alphaTest: 0.05,
    side: THREE.DoubleSide, depthTest: false
  });
  itemMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), itemMat);
  itemMesh.renderOrder = 1000;

  /* Als Kinder der Kamera anhängen → folgen automatisch der Blickrichtung */
  camera.add(armMesh);
  camera.add(knuckleMesh);
  camera.add(itemMesh);
  scene.add(camera);   /* Kamera muss in der Szene sein damit ihre Kinder gerendert werden */
}

function updateIcon(id){
  if(id === lastId) return;
  lastId = id;
  iconCtx.clearRect(0, 0, 16, 16);
  if(id && id !== AIR) drawItemIcon(iconCtx, id);
  iconTex.needsUpdate = true;
}

window.renderHand = function(dt){
  init();

  var show = inGame && !invOpen;
  armMesh.visible   = show;
  knuckleMesh.visible = show;
  itemMesh.visible  = false;

  if(!show) return;

  /* Gehaltenes Item ermitteln */
  var sl = slots[selected];
  var id = sl ? sl.id : 0;
  if(id && id !== AIR){
    updateIcon(id);
    itemMesh.visible = true;
  } else {
    lastId = -1;
  }

  /* Lauf-Bob: sanfte Auf-Ab-Bewegung beim Gehen */
  var spd = Math.sqrt(player.vel.x * player.vel.x + player.vel.z * player.vel.z);
  var moving = player.onGround && spd > 0.6;
  if(moving) bobT += dt * 9.5;
  var bx = moving ? Math.sin(bobT) * 0.026 : 0;
  var by = moving ? Math.abs(Math.sin(bobT)) * -0.022 : 0;

  /* Positionen in Kamera-Lokalraum (rechts, unten, vor der Kamera) */
  armMesh.position.set(0.38 + bx,  -0.50 + by, -0.76);
  armMesh.rotation.set(0.20, -0.18, -0.10);

  knuckleMesh.position.set(0.38 + bx, -0.18 + by, -0.74);
  knuckleMesh.rotation.set(0.20, -0.18, -0.10);

  itemMesh.position.set(0.25 + bx, -0.10 + by, -0.75);
  itemMesh.rotation.set(-0.22, -0.46, 0.40);
};

})();
