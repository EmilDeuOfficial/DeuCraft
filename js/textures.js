/* ============ Textur-Atlas: 16x16 Pixel-Art ============ */
var TILES = 15, TPX = 16;
var atlasCv = document.createElement('canvas');
atlasCv.width = TILES*TPX; atlasCv.height = TPX;
var actx = atlasCv.getContext('2d');

function px(t,x,y,c){ actx.fillStyle = c; actx.fillRect(t*TPX+x, y, 1, 1); }
function tn(t,x,y,s){ return thash(t*731 + x*17 + s*101, y*53 + t*3 + s*7); }
function pick(arr, r){ return arr[Math.min(arr.length-1, Math.floor(r*arr.length))]; }

function drawDirt(t){
  var browns = ['#9b6c48','#8c5d3b','#7e5234','#a5764f','#74492c','#906040'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(t,x,y, pick(browns, tn(t,x,y,1)));
  for(var s=0;s<5;s++) px(t, Math.floor(tn(t,s,21,4)*15), Math.floor(tn(t,s,33,5)*15), '#b08e6c');
}
drawDirt(2);

(function(){ var g=['#7cbd45','#74b33e','#6aa838','#80c24a','#619e33'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(0,x,y, pick(g, tn(0,x,y,1)));
  for(var i=0;i<9;i++){
    px(0, Math.floor(tn(0,i,5,2)*16), Math.floor(tn(0,i,11,3)*16), '#8fd058');
    px(0, Math.floor(tn(0,i,17,4)*16), Math.floor(tn(0,i,23,5)*16), '#578c2c');
  }
})();
(function(){ drawDirt(1);
  var gTop = ['#7cbd45','#74b33e','#6aa838','#80c24a'];
  for(var x=0;x<16;x++){
    var depth = 2 + Math.floor(tn(1,x,1,6)*3);
    for(var y=0;y<depth;y++) px(1,x,y, pick(gTop, tn(1,x,y,7)));
    px(1,x,depth,'#578c2c');
    if(tn(1,x,2,8) > 0.7 && depth < 5) px(1,x,depth+1,'#578c2c');
  }
})();
(function(){ var g=['#909090','#8a8a8a','#9a9a9a','#858585','#939393','#878787'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(3,x,y, pick(g, tn(3,x,y,1)));
})();
(function(){ var bark=['#6b5232','#5f4729','#73593a','#553f23'];
  for(var x=0;x<16;x++){
    var shade = pick(bark, tn(4,x,0,1));
    for(var y=0;y<16;y++){
      var c = shade, r = tn(4,x,y,2);
      if(r > 0.85) c = '#7d6342'; else if(r < 0.12) c = '#4a3318';
      px(4,x,y,c);
    }
  }
  var gr=[2,6,10,13];
  for(var g2=0; g2<gr.length; g2++) for(var y2=0;y2<16;y2++)
    if(tn(4,gr[g2],y2,3) > 0.25) px(4,gr[g2],y2,'#43300f');
  px(4,4,5,'#3a2a0e'); px(4,5,5,'#43300f'); px(4,4,6,'#43300f');
  px(4,11,11,'#3a2a0e'); px(4,12,11,'#43300f');
})();
(function(){
  for(var x=0;x<16;x++) for(var y=0;y<16;y++){
    var d = Math.max(Math.abs(x-7.5), Math.abs(y-7.5)), c;
    if(d > 6.5) c = tn(5,x,y,1) > 0.5 ? '#6b5232' : '#5f4729';
    else {
      c = (Math.floor(d) % 2 === 0) ? '#b08a4a' : '#9a7438';
      if(tn(5,x,y,2) > 0.85) c = '#c09a58';
      if(d < 1.2) c = '#8a6630';
    }
    px(5,x,y,c);
  }
})();
(function(){ var g=['#3f7d26','#356d1e','#48892d','#2e6118'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(6,x,y, pick(g, tn(6,x,y,1)));
  for(var i=0;i<14;i++) px(6, Math.floor(tn(6,i,5,2)*16), Math.floor(tn(6,i,11,3)*16), '#1d4210');
  for(var h=0;h<8;h++) px(6, Math.floor(tn(6,h,17,4)*16), Math.floor(tn(6,h,23,5)*16), '#5aa03a');
})();
(function(){ var s2=['#decfa0','#d6c794','#e5d8ac','#cfbf88'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(7,x,y, pick(s2, tn(7,x,y,1)));
  for(var i=0;i<6;i++){
    var wx = Math.floor(tn(7,i,7,2)*13), wy = Math.floor(tn(7,i,13,3)*15);
    px(7,wx,wy,'#c2b178'); px(7,wx+1,wy,'#c2b178'); px(7,wx+2,wy,'#cab97f');
  }
  for(var s3=0;s3<5;s3++) px(7, Math.floor(tn(7,s3,21,4)*16), Math.floor(tn(7,s3,27,5)*16), '#f0e4ba');
})();
(function(){ var bs=['#b08c50','#a8854a','#b6915a','#a07e44'];
  for(var b=0;b<4;b++){
    var base = bs[b];
    for(var x=0;x<16;x++) for(var y=b*4; y<b*4+4; y++){
      var c = base, r = tn(8,x,y,1);
      if(r > 0.88) c = '#c29c62'; else if(r < 0.10) c = '#94733c';
      px(8,x,y,c);
    }
    for(var m=0;m<2;m++){
      var mx = Math.floor(tn(8,b,m*9,2)*10), my = b*4+1+Math.floor(tn(8,b,m*5,3)*2);
      px(8,mx,my,'#8d6c36'); px(8,mx+1,my,'#8d6c36'); px(8,mx+2,my,'#94733c');
    }
    for(var fx2=0; fx2<16; fx2++) px(8,fx2,b*4+3,'#6e5226');
    var endX = (b % 2 === 0) ? 5 : 11;
    px(8,endX,b*4,'#6e5226'); px(8,endX,b*4+1,'#6e5226'); px(8,endX,b*4+2,'#6e5226');
    px(8, endX > 8 ? endX-2 : endX+2, b*4+1, '#7d6233');
  }
})();

/* Tile 9: Werkbank Oberseite (Raster) */
(function(){
  var bs = ['#b08c50','#a8854a','#b6915a'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(9,x,y, pick(bs, tn(9,x,y,1)));
  // Rasterlinien
  for(var i=0;i<16;i++){ px(9,i,0,'#6e5226'); px(9,i,15,'#6e5226'); px(9,0,i,'#6e5226'); px(9,15,i,'#6e5226'); px(9,8,i,'#6e5226'); px(9,i,8,'#6e5226'); }
  // kleine Vertiefungen in den vier Feldern
  [[3,3],[11,3],[3,11],[11,11]].forEach(function(p){ px(9,p[0],p[1],'#7d6233'); px(9,p[0]+1,p[1],'#94733c'); });
})();
/* Tile 10: Werkbank Seite (Bretter + Säge/Werkzeug-Andeutung) */
(function(){
  var bs = ['#a8854a','#9c7a40','#b08c50'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(10,x,y, pick(bs, tn(10,x,y,1)));
  for(var i=0;i<16;i++){ px(10,i,0,'#6e5226'); px(10,i,7,'#6e5226'); px(10,i,15,'#5c4420'); }
  // Säge-Andeutung
  for(var sx=3;sx<13;sx++) px(10,sx,4,'#cfd2d6');
  for(var t=3;t<13;t+=2) px(10,t,5,'#cfd2d6');
  px(10,3,3,'#6b4a26'); px(10,3,2,'#6b4a26');
})();

/* Tile 11: Kohleerz (Stein mit schwarzen Brocken) */
(function(){
  var bs = ['#8a8a8a','#7e7e7e','#949494','#888888'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(11,x,y, pick(bs, tn(11,x,y,1)));
  // Kohlebrocken
  var spots = [[3,4],[4,4],[3,5],[9,3],[10,3],[10,4],[5,10],[6,10],[6,11],[11,11],[12,11],[2,11]];
  spots.forEach(function(p){ px(11,p[0],p[1],'#222'); px(11,p[0]+1,p[1],'#333'); px(11,p[0],p[1]+1,'#1a1a1a'); });
})();
/* Tile 12: Ofen Seite/Oben (Bruchstein) */
(function(){
  var bs = ['#7c7c7c','#6f6f6f','#868686','#767676'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(12,x,y, pick(bs, tn(12,x,y,1)));
  // Bruchstein-Fugen
  for(var i=0;i<16;i++){ px(12,i,5,'#5a5a5a'); px(12,i,11,'#5a5a5a'); }
  for(var j=0;j<16;j++){ px(12,5,j,'#5a5a5a'); px(12,11,j,'#5a5a5a'); }
})();
/* Tile 13: Ofen Front (Bruchstein mit Öffnung) */
(function(){
  var bs = ['#7c7c7c','#6f6f6f','#868686'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(13,x,y, pick(bs, tn(13,x,y,1)));
  // dunkle Brennkammer
  for(var x2=4;x2<12;x2++) for(var y2=7;y2<13;y2++) px(13,x2,y2, (y2>10? '#3a2a14':'#1a1a1a'));
  // Glut unten
  for(var gx=5;gx<11;gx++){ px(13,gx,12,'#e0772a'); px(13,gx,11,'#b8551c'); }
  // Rahmen oben
  for(var fx=3;fx<13;fx++) px(13,fx,5,'#5a5a5a');
})();
/* Tile 14: Wolle (weiß, leicht flauschig) */
(function(){
  var bs = ['#eeeeee','#e2e2e2','#f4f4f4','#e8e8e8'];
  for(var x=0;x<16;x++) for(var y=0;y<16;y++) px(14,x,y, pick(bs, tn(14,x,y,1)));
  for(var k=0;k<10;k++){ var rx=Math.floor(tn(14,k,3,2)*16), ry=Math.floor(tn(14,k,7,3)*16); px(14,rx,ry,'#d4d4d4'); }
})();

/* Apfel-Icon (eigenes Canvas) */
var appleCv = document.createElement('canvas');
appleCv.width = 16; appleCv.height = 16;
(function(){
  var a = appleCv.getContext('2d');
  function ap(x,y,c){ a.fillStyle=c; a.fillRect(x,y,1,1); }
  var body = [
    '....GG..........','.....G..........','....SS..........',
    '..RRRRRRRR......','.RRRRRRRRRR.....','.RRLRRRRRRR.....',
    'RRLLRRRRRRRR....','RRLRRRRRRRRR....','RRRRRRRRRRRR....',
    'RRRRRRRRRRRR....','.RRRRRRRRRR.....','.RRRRRRRRRR.....',
    '..RRR..RRR......','................','................','................'
  ];
  for(var y=0;y<16;y++) for(var x=0;x<16;x++){
    var ch = body[y][x];
    if(ch==='R') ap(x+2,y,'#d6342c');
    else if(ch==='L') ap(x+2,y,'#f07a72');
    else if(ch==='G') ap(x+2,y,'#4e8a2e');
    else if(ch==='S') ap(x+2,y,'#6b4a26');
  }
})();

/* Stock-Icon */
var stickCv = document.createElement('canvas');
stickCv.width = 16; stickCv.height = 16;
(function(){
  var a = stickCv.getContext('2d');
  function ap(x,y,c){ a.fillStyle=c; a.fillRect(x,y,1,1); }
  for(var i=0;i<9;i++){ var y=3+i, x=11-i; ap(x,y,'#7d5a2c'); ap(x+1,y,'#9a7440'); ap(x,y+1,'#5f4420'); }
})();

/* Werkzeug-Icons: generisch aus Kopffarbe + Typ erzeugen */
var toolCv = {};
function buildTool(id, type, headCol, headDark){
  var cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
  var a = cv.getContext('2d');
  function ap(x,y,c){ if(x<0||y<0||x>15||y>15) return; a.fillStyle=c; a.fillRect(x,y,1,1); }
  // Stiel (diagonal von unten-links nach oben-rechts)
  for(var i=0;i<9;i++){ var sx=4+i, sy=11-i; ap(sx,sy,'#7d5a2c'); ap(sx,sy+1,'#5f4420'); }
  function fillHead(cells){ cells.forEach(function(p){ ap(p[0],p[1],headCol); }); }
  function edge(cells){ cells.forEach(function(p){ ap(p[0],p[1],headDark); }); }
  if(type === 'pick'){
    fillHead([[9,1],[10,1],[11,1],[12,2],[13,2],[8,2],[7,3]]);
    edge([[6,4],[14,3]]);
  } else if(type === 'axe'){
    fillHead([[10,1],[11,1],[12,1],[10,2],[11,2],[12,2],[10,3],[11,3],[13,2]]);
    edge([[9,2],[9,3]]);
  } else if(type === 'shovel'){
    fillHead([[11,1],[12,1],[11,2],[12,2],[11,3],[12,3]]);
    edge([[10,1],[13,1],[10,3],[13,3]]);
  } else if(type === 'sword'){
    // Klinge diagonal, andere Richtung
    for(var j=0;j<7;j++){ var bx=12-j, by=2+j; ap(bx,by,headCol); ap(bx-1,by,headDark); }
    ap(5,11,'#6b4a26'); ap(6,10,'#6b4a26'); ap(4,12,'#5f4420'); // Griff
    ap(6,11,'#8a8a8a'); ap(7,10,'#8a8a8a');                      // Parierstange
  }
  toolCv[id] = cv;
}
buildTool(WPICK,'pick','#b08c50','#8d6c36');   buildTool(SPICK,'pick','#9a9a9a','#6e6e6e');
buildTool(WAXE,'axe','#b08c50','#8d6c36');     buildTool(SAXE,'axe','#9a9a9a','#6e6e6e');
buildTool(WSHOVEL,'shovel','#b08c50','#8d6c36'); buildTool(SSHOVEL,'shovel','#9a9a9a','#6e6e6e');
buildTool(WSWORD,'sword','#b08c50','#8d6c36');  buildTool(SSWORD,'sword','#9a9a9a','#6e6e6e');

/* einfache, kompakte Item-Icons (Klecks-Form mit Farben) */
var itemCv = {};
function buildBlob(id, cells, palette){
  var cv = document.createElement('canvas'); cv.width=16; cv.height=16;
  var a = cv.getContext('2d');
  for(var y=0;y<cells.length;y++) for(var x=0;x<cells[y].length;x++){
    var ch = cells[y][x];
    if(ch !== ' ' && palette[ch]){ a.fillStyle = palette[ch]; a.fillRect(x+2, y+2, 1, 1); }
  }
  itemCv[id] = cv;
}
// Kohle (schwarzer Klumpen)
buildBlob(COAL, [
  '        ','   KK   ',' KKKKK  ','KKKKLKK ','KKLKKKK ','KKKKKK  ',' KKKK   ','        '
], {K:'#2a2a2a', L:'#555'});
// Rohes Rindfleisch (rosa Stück)
buildBlob(RAW_BEEF, [
  '        ',' RRRR   ','RRPRRR  ','RPRRRRR ','RRRRPR  ','RRRRR   ',' RRR    ','        '
], {R:'#d56a6a', P:'#e8a0a0'});
// Steak (braun gebraten)
buildBlob(COOKED_BEEF, [
  '        ',' BBBB   ','BBSBBB  ','BSBBBBB ','BBBBSB  ','BBBBB   ',' BBB    ','        '
], {B:'#7a4a26', S:'#9c6a3c'});
// Rohes Hammelfleisch (helleres rosa)
buildBlob(RAW_MUTTON, [
  '        ','  RRR   ',' RRPRR  ','RRRRRRR ',' RRPRR  ',' RRRR   ','        ','        '
], {R:'#e07f8a', P:'#f0aab0'});
// Gebratenes Hammelfleisch
buildBlob(COOKED_MUTTON, [
  '        ','  BBB   ',' BBSBB  ','BBBBBBB ',' BBSBB  ',' BBBB   ','        ','        '
], {B:'#86532c', S:'#a8743f'});
// Leder (braunes Stück)
buildBlob(LEATHER, [
  '        ',' LLLLL  ','LLLLLLL ','LLDLLLL ','LLLLDL  ','LLLLLL  ',' LLLLL  ','        '
], {L:'#9c6b3f', D:'#7d5430'});

var atlasTex = new THREE.CanvasTexture(atlasCv);
atlasTex.magFilter = THREE.NearestFilter;
atlasTex.minFilter = THREE.NearestFilter;

var blockTiles = {};
blockTiles[GRASS]=[0,2,1]; blockTiles[DIRT]=[2,2,2]; blockTiles[STONE]=[3,3,3];
blockTiles[WOOD]=[5,5,4]; blockTiles[LEAVES]=[6,6,6]; blockTiles[SAND]=[7,7,7];
blockTiles[PLANK]=[8,8,8]; blockTiles[BENCH]=[9,8,10];
blockTiles[COAL_ORE]=[11,11,11]; blockTiles[FURNACE]=[12,12,13]; blockTiles[WOOL]=[14,14,14];

function drawItemIcon(ctx2, id){
  ctx2.clearRect(0,0,16,16);
  if(id === APPLE) ctx2.drawImage(appleCv, 0, 0);
  else if(id === STICK) ctx2.drawImage(stickCv, 0, 0);
  else if(toolCv[id]) ctx2.drawImage(toolCv[id], 0, 0);
  else if(itemCv[id]) ctx2.drawImage(itemCv[id], 0, 0);
  else if(blockTiles[id]) ctx2.drawImage(atlasCv, blockTiles[id][2]*TPX, 0, TPX, TPX, 0, 0, 16, 16);
}

