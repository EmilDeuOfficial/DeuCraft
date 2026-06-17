/* ============ Noise ============ */
var SEED = 1;
function hash2(x,z){
  var n = (x|0) * 374761393 + (z|0) * 668265263 + (SEED|0) * 144665;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}
function thash(x,z){
  var n = (x|0) * 374761393 + (z|0) * 668265263 + 99991;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}
function smooth(t){ return t*t*(3-2*t); }
function noise2(x,z){
  var xi = Math.floor(x), zi = Math.floor(z);
  var xf = x - xi, zf = z - zi;
  var a = hash2(xi,zi), b = hash2(xi+1,zi), c = hash2(xi,zi+1), d = hash2(xi+1,zi+1);
  var u = smooth(xf), v = smooth(zf);
  return a*(1-u)*(1-v) + b*u*(1-v) + c*(1-u)*v + d*u*v;
}
function terrainHeight(x,z){
  var n = noise2(x/90, z/90)*0.5 + noise2(x/28, z/28)*0.35 + noise2(x/9, z/9)*0.15;
  var mountains = noise2(x/160 + 500, z/160 + 500);
  var h = 12 + n*16 + (mountains > 0.62 ? (mountains-0.62)*70 : 0);
  return Math.min(SY-10, Math.floor(h));
}

/* ============ Chunks ============ */
var chunks = {};
function ckey(cx,cz){ return cx + ',' + cz; }
function chunkInWorld(cx,cz){ return cx>=0 && cx<WORLD && cz>=0 && cz<WORLD; }
function bIdx(lx,y,lz){ return (lx*CHUNK + lz)*SY + y; }

function genChunk(cx,cz){
  var b = new Uint8Array(CHUNK*CHUNK*SY);
  var x0 = cx*CHUNK, z0 = cz*CHUNK;
  for(var lx=0; lx<CHUNK; lx++){
    for(var lz=0; lz<CHUNK; lz++){
      var h = terrainHeight(x0+lx, z0+lz);
      for(var y=0; y<=h; y++){
        var blk;
        if(y === 0) blk = BEDROCK;
        else if(y === h) blk = (h <= 12) ? SAND : GRASS;
        else if(y >= h-3) blk = (h <= 12) ? SAND : DIRT;
        else {
          blk = STONE;
          // Kohleerz-Adern: tiefer im Stein, deterministisch
          if(y < h-4 && y > 1 && hash2((x0+lx)*131 + y*977, (z0+lz)*197 + y*53) < 0.035) blk = COAL_ORE;
        }
        b[bIdx(lx,y,lz)] = blk;
      }
    }
  }
  /* Bäume: pro Spalte eine kleine, weltkoordinaten-basierte Chance.
     Dadurch kein Raster-Muster und insgesamt deutlich seltener.
     Wahrscheinlichkeit variiert zusätzlich über großräumiges Rauschen
     (Waldgebiete vs. fast leere Ebenen). */
  for(var tx=2; tx<14; tx++){
    for(var tz=2; tz<14; tz++){
      var wx = x0+tx, wz = z0+tz;
      var forest = noise2(wx/120 + 9000, wz/120 + 9000);     // Walddichte 0..1
      var chance = 0.001 + Math.max(0, forest-0.45) * 0.022; // 0,1% bis ~1,3%
      if(hash2(wx*31 + 17, wz*57 + 41) > chance) continue;
      var th = terrainHeight(wx, wz);
      if(b[bIdx(tx,th,tz)] !== GRASS) continue;
      var trunkH = 4 + Math.floor(hash2(wx*7, wz*11)*2);
      for(var i=1; i<=trunkH && th+i<SY; i++) b[bIdx(tx,th+i,tz)] = WOOD;
      var topY = th + trunkH;
      for(var dx=-2; dx<=2; dx++) for(var dz=-2; dz<=2; dz++) for(var dy=0; dy<=2; dy++){
        if(Math.abs(dx)+Math.abs(dz)+dy > 3) continue;
        if(dx===0 && dz===0 && dy<1) continue;
        var py = topY+dy;
        if(py >= SY) continue;
        var idx = bIdx(tx+dx, py, tz+dz);
        if(b[idx] === AIR) b[idx] = LEAVES;
      }
    }
  }
  var e = editsByChunk[ckey(cx,cz)];
  if(e){ for(var k in e) b[k|0] = e[k]; }
  return { b:b, mesh:null, cx:cx, cz:cz };
}

function getChunk(cx,cz){
  if(!chunkInWorld(cx,cz)) return null;
  var k = ckey(cx,cz);
  var c = chunks[k];
  if(!c){ c = genChunk(cx,cz); chunks[k] = c; }
  return c;
}
function getB(x,y,z){
  if(y < 0 || y >= SY) return AIR;
  var c = getChunk(x >> 4, z >> 4);
  if(!c) return AIR;
  return c.b[bIdx(x & 15, y, z & 15)];
}
function setB(x,y,z,v){
  if(y < 0 || y >= SY) return;
  var cx = x >> 4, cz = z >> 4;
  var c = getChunk(cx,cz);
  if(!c) return;
  var idx = bIdx(x & 15, y, z & 15);
  c.b[idx] = v;
  var k = ckey(cx,cz);
  if(!editsByChunk[k]) editsByChunk[k] = {};
  editsByChunk[k][idx] = v;
  editsDirty = true;
}

