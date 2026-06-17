/* ============ Raycast ============ */
function raycast(maxDist){
  var dx = -Math.sin(player.yaw)*Math.cos(player.pitch);
  var dy = Math.sin(player.pitch);
  var dz = -Math.cos(player.yaw)*Math.cos(player.pitch);
  var ox = player.pos.x, oy = player.pos.y + player.eye, oz = player.pos.z;
  var x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  var stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
  var tdx = Math.abs(1/dx), tdy = Math.abs(1/dy), tdz = Math.abs(1/dz);
  var tx = (dx > 0 ? (x+1-ox) : (ox-x)) * tdx;
  var ty = (dy > 0 ? (y+1-oy) : (oy-y)) * tdy;
  var tz = (dz > 0 ? (z+1-oz) : (oz-z)) * tdz;
  var px2 = x, py2 = y, pz2 = z;
  var dist = 0;
  while(dist <= maxDist){
    px2 = x; py2 = y; pz2 = z;
    if(tx < ty && tx < tz){ dist = tx; tx += tdx; x += stepX; }
    else if(ty < tz){ dist = ty; ty += tdy; y += stepY; }
    else { dist = tz; tz += tdz; z += stepZ; }
    if(dist > maxDist) break;
    if(getB(x,y,z) !== AIR) return { hit:[x,y,z], prev:[px2,py2,pz2] };
  }
  return null;
}

