/* ============ First-Person Hand/Item ============ */
(function(){

var handScene = new THREE.Scene();
var handCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 10);

/* --- Arm --- */
var armMat = new THREE.MeshBasicMaterial({ color: 0xc8a070 });
var armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.76, 0.26), armMat);
handScene.add(armMesh);

/* --- Finger / Handknöchel (leicht dunkler) --- */
var handMat = new THREE.MeshBasicMaterial({ color: 0xb89060 });
var handKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.16, 0.28), handMat);
handScene.add(handKnuckle);

/* --- Item-Plane mit Icon-Textur --- */
var handIconCv = document.createElement('canvas');
handIconCv.width = 16; handIconCv.height = 16;
var handIconCtx = handIconCv.getContext('2d');
var handIconTex = new THREE.CanvasTexture(handIconCv);
handIconTex.magFilter = THREE.NearestFilter;
handIconTex.minFilter = THREE.NearestFilter;

var handItemMat = new THREE.MeshBasicMaterial({
  map: handIconTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide
});
var handItemMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.50), handItemMat);
handScene.add(handItemMesh);

var handLastId = -1;
var handBobT = 0;

function setHandItem(id){
  if(id === handLastId) return;
  handLastId = id;
  handIconCtx.clearRect(0, 0, 16, 16);
  if(id && id !== AIR) drawItemIcon(handIconCtx, id);
  handIconTex.needsUpdate = true;
}

window.renderHand = function(dt){
  /* Seitenverhältnis und FOV mit Hauptkamera synchronisieren */
  handCamera.fov = curFov;
  handCamera.aspect = window.innerWidth / window.innerHeight;
  handCamera.updateProjectionMatrix();

  var show = inGame && !invOpen;
  armMesh.visible = show;
  handKnuckle.visible = show;
  handItemMesh.visible = false;

  if(!show) return;

  var sl = slots[selected];
  var id = sl ? sl.id : 0;
  var hasItem = (id && id !== AIR);

  if(hasItem){
    setHandItem(id);
    handItemMesh.visible = true;
  } else {
    handLastId = -1;
  }

  /* Lauf-Bob */
  var speed2d = Math.sqrt(player.vel.x * player.vel.x + player.vel.z * player.vel.z);
  var moving = player.onGround && speed2d > 0.6;
  if(moving) handBobT += dt * 9.5;
  var bobX = moving ? Math.sin(handBobT) * 0.026 : 0;
  var bobY = moving ? Math.abs(Math.sin(handBobT)) * -0.022 : 0;

  /* Arm: untere rechte Ecke */
  armMesh.position.set(0.38 + bobX, -0.48 + bobY, -0.74);
  armMesh.rotation.set(0.22, -0.20, -0.12);

  /* Handknöchel vorne am Arm */
  handKnuckle.position.set(0.38 + bobX, -0.17 + bobY, -0.72);
  handKnuckle.rotation.set(0.22, -0.20, -0.12);

  /* Item über der Hand, natürlich schräggestellt */
  handItemMesh.position.set(0.24 + bobX, -0.10 + bobY, -0.73);
  handItemMesh.rotation.set(-0.22, -0.46, 0.40);

  /* Hand-Szene über Welt rendern: Tiefe löschen, Farbe behalten */
  renderer.autoClearColor = false;
  renderer.autoClearDepth = true;
  renderer.autoClearStencil = false;
  renderer.render(handScene, handCamera);
  renderer.autoClearColor = true;
  renderer.autoClearDepth = true;
};

window.addEventListener('resize', function(){
  handCamera.aspect = window.innerWidth / window.innerHeight;
  handCamera.updateProjectionMatrix();
});

})();
