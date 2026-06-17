/* ============ Three.js ============ */
var canvas = document.getElementById('game');
var renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc9eb);
scene.fog = new THREE.Fog(0x8fc9eb, 40, 74);
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 400);
var blockMat = new THREE.MeshBasicMaterial({ map:atlasTex, vertexColors:true });
/* Standard-Nebel in three.js nutzt die Tiefe senkrecht zur Kamera. Dadurch
   dreht sich die Nebelwand mit der Blickrichtung mit (der "Kreis ums
   Fadenkreuz" Effekt). Wir patchen den globalen fog_vertex Shader-Baustein
   einmalig auf die echte radiale Distanz, sodass der Nebel als feste Kugel an
   der Render-Distanz sitzt, egal wohin man schaut. Greift für alle Materialien
   gleichermaßen (Blöcke und Spieler-Avatare). */
(function(){
  var fv = THREE.ShaderChunk.fog_vertex;
  if(fv && /mvPosition\.z/.test(fv)){
    THREE.ShaderChunk.fog_vertex = fv.replace(/-\s*mvPosition\.z/, 'length( mvPosition.xyz )');
  }
})();

