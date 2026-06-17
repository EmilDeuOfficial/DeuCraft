/* ============ Fackeln ============ */
var torchTex = new THREE.CanvasTexture(torchCv);
torchTex.magFilter = THREE.NearestFilter;
torchTex.minFilter = THREE.NearestFilter;

var torchMat = new THREE.MeshBasicMaterial({
  map: torchTex,
  transparent: true,
  alphaTest: 0.1,
  side: THREE.DoubleSide
});

var torchChunkObjects = {};

function makeTorchGroup(wx, wy, wz, type){
  var group = new THREE.Group();
  var geo1 = new THREE.PlaneGeometry(0.5, 0.7);
  var geo2 = new THREE.PlaneGeometry(0.5, 0.7);
  var m1 = new THREE.Mesh(geo1, torchMat);
  var m2 = new THREE.Mesh(geo2, torchMat);
  m2.rotation.y = Math.PI / 2;
  group.add(m1, m2);

  if(type === TORCH){
    group.position.set(wx + 0.5, wy + 0.35, wz + 0.5);
  } else if(type === TORCH_N){
    group.position.set(wx + 0.5, wy + 0.4, wz + 0.82);
    group.rotation.x = -Math.PI / 9;
  } else if(type === TORCH_S){
    group.position.set(wx + 0.5, wy + 0.4, wz + 0.18);
    group.rotation.x = Math.PI / 9;
  } else if(type === TORCH_E){
    group.position.set(wx + 0.18, wy + 0.4, wz + 0.5);
    group.rotation.z = -Math.PI / 9;
  } else if(type === TORCH_W){
    group.position.set(wx + 0.82, wy + 0.4, wz + 0.5);
    group.rotation.z = Math.PI / 9;
  }
  return group;
}

function removeTorchObjects(key){
  if(torchChunkObjects[key]){
    torchChunkObjects[key].forEach(function(g){ scene.remove(g); });
    delete torchChunkObjects[key];
  }
}

function buildTorchesForChunk(c){
  var key = ckey(c.cx, c.cz);
  removeTorchObjects(key);
  var arr = [];
  var x0 = c.cx * CHUNK, z0 = c.cz * CHUNK;
  for(var lx = 0; lx < CHUNK; lx++)
  for(var lz = 0; lz < CHUNK; lz++)
  for(var y = 0; y < SY; y++){
    var b = c.b[bIdx(lx, y, lz)];
    if(!isTorch(b)) continue;
    var g = makeTorchGroup(x0 + lx, y, z0 + lz, b);
    scene.add(g);
    arr.push(g);
  }
  if(arr.length) torchChunkObjects[key] = arr;
}
