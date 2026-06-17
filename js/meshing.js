/* ============ Meshing ============ */
var FACES = [
  { d:[1,0,0],  c:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]], l:0.80, s:2 },
  { d:[-1,0,0], c:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]], l:0.80, s:2 },
  { d:[0,1,0],  c:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]], l:1.00, s:0 },
  { d:[0,-1,0], c:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]], l:0.55, s:1 },
  { d:[0,0,1],  c:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]], l:0.65, s:2 },
  { d:[0,0,-1], c:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]], l:0.65, s:2 }
];
var FUV = [[0,0],[1,0],[1,1],[0,1]];

function buildMesh(c){
  if(c.mesh){ scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh = null; }
  var pos=[], uv=[], col=[], ind=[];
  var v = 0;
  var x0 = c.cx*CHUNK, z0 = c.cz*CHUNK;
  for(var lx=0; lx<CHUNK; lx++)
  for(var lz=0; lz<CHUNK; lz++)
  for(var y=0; y<SY; y++){
    var b = c.b[bIdx(lx,y,lz)];
    if(b === AIR) continue;
    var x = x0+lx, z = z0+lz;
    var tiles = blockTiles[b];
    for(var f=0; f<6; f++){
      var F = FACES[f];
      var nb = getB(x+F.d[0], y+F.d[1], z+F.d[2]);
      if(!(nb === AIR || (nb === LEAVES && b !== LEAVES))) continue;
      var tile = tiles[F.s];
      // Halber Pixel Einzug verhindert UV-Bleeding zur Nachbarkachel
      var hp = 0.5 / (TILES * TPX);
      var vp = 0.5 / TPX;
      var u0 = tile/TILES + hp, u1 = (tile+1)/TILES - hp;
      for(var k=0; k<4; k++){
        var cn = F.c[k];
        pos.push(x+cn[0], y+cn[1], z+cn[2]);
        var vCoord = vp + FUV[k][1] * (1 - 2*vp);
        uv.push(u0 + FUV[k][0]*(u1-u0), vCoord);
        col.push(F.l, F.l, F.l);
      }
      ind.push(v, v+1, v+2, v, v+2, v+3);
      v += 4;
    }
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(ind);
  c.mesh = new THREE.Mesh(geo, blockMat);
  scene.add(c.mesh);
}
function unloadMesh(c){
  if(c.mesh){ scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh = null; }
}

var buildQueue = [], queued = {};
var lastPCX = -999, lastPCZ = -999;
function updateChunks(force){
  var pcx = Math.floor(player.pos.x / CHUNK);
  var pcz = Math.floor(player.pos.z / CHUNK);
  if(!force && pcx === lastPCX && pcz === lastPCZ) return;
  lastPCX = pcx; lastPCZ = pcz;
  var RD = settings.dist;
  var list = [];
  for(var dx=-RD; dx<=RD; dx++) for(var dz=-RD; dz<=RD; dz++){
    var cx = pcx+dx, cz = pcz+dz;
    if(!chunkInWorld(cx,cz)) continue;
    var k = ckey(cx,cz);
    var c = chunks[k];
    if((!c || !c.mesh) && !queued[k]){
      list.push({ cx:cx, cz:cz, d:dx*dx+dz*dz });
      queued[k] = true;
    }
  }
  list.sort(function(a,b){ return a.d - b.d; });
  for(var i=0; i<list.length; i++) buildQueue.push(list[i]);
  var lim = RD + 2;
  for(var k2 in chunks){
    var c2 = chunks[k2];
    if(c2.mesh && (Math.abs(c2.cx-pcx) > lim || Math.abs(c2.cz-pcz) > lim)) unloadMesh(c2);
  }
}
function processQueue(budget){
  while(budget-- > 0 && buildQueue.length){
    var job = buildQueue.shift();
    delete queued[ckey(job.cx, job.cz)];
    var pcx = Math.floor(player.pos.x / CHUNK);
    var pcz = Math.floor(player.pos.z / CHUNK);
    if(Math.abs(job.cx-pcx) > settings.dist || Math.abs(job.cz-pcz) > settings.dist) continue;
    buildMesh(getChunk(job.cx, job.cz));
  }
}
function rebuildAt(x,z){
  var cx = x >> 4, cz = z >> 4;
  buildMesh(getChunk(cx,cz));
  var lx = x & 15, lz = z & 15, c;
  if(lx === 0  && chunkInWorld(cx-1,cz)){ c=chunks[ckey(cx-1,cz)]; if(c && c.mesh) buildMesh(c); }
  if(lx === 15 && chunkInWorld(cx+1,cz)){ c=chunks[ckey(cx+1,cz)]; if(c && c.mesh) buildMesh(c); }
  if(lz === 0  && chunkInWorld(cx,cz-1)){ c=chunks[ckey(cx,cz-1)]; if(c && c.mesh) buildMesh(c); }
  if(lz === 15 && chunkInWorld(cx,cz+1)){ c=chunks[ckey(cx,cz+1)]; if(c && c.mesh) buildMesh(c); }
}
function unloadAllChunks(){
  for(var k in chunks) unloadMesh(chunks[k]);
  chunks = {};
  buildQueue = []; queued = {};
  lastPCX = -999;
}

var highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color:0x000000, transparent:true, opacity:0.6 })
);
highlight.visible = false;
scene.add(highlight);

