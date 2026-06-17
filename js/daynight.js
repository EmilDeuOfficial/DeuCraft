/* ============ Tag/Nacht-Zyklus ============ */
var dayTime = 0.25;   // 0=Mitternacht, 0.25=Sonnenaufgang, 0.5=Mittag, 0.75=Sonnenuntergang
var DAY_LENGTH = 600; // Sekunden pro Zyklus (10 Minuten)

// [Zeit 0–1, Himmelsfarbe, Nebelfarbe, Dunkelheit 0–1]
var SKY_KEYS = [
  [0.00, 0x06091a, 0x060816, 0.82],
  [0.18, 0x12082a, 0x0c0618, 0.78],
  [0.22, 0xc86030, 0x903820, 0.22],
  [0.27, 0xa0c8e8, 0x88b0d0, 0.02],
  [0.50, 0x8fc9eb, 0x8fc9eb, 0.00],
  [0.73, 0xa0c8e8, 0x88b0d0, 0.02],
  [0.78, 0xd06828, 0x903818, 0.22],
  [0.82, 0x12082a, 0x0c0618, 0.78],
  [1.00, 0x06091a, 0x060816, 0.82],
];

function lerpHex(a, b, t){
  var ar=(a>>16)&0xff, ag=(a>>8)&0xff, ab=a&0xff;
  var br=(b>>16)&0xff, bg=(b>>8)&0xff, bb=b&0xff;
  return ((Math.round(ar+(br-ar)*t)<<16)|(Math.round(ag+(bg-ag)*t)<<8)|Math.round(ab+(bb-ab)*t));
}
function skyAtTime(t){
  for(var i=0; i<SKY_KEYS.length-1; i++){
    var k0=SKY_KEYS[i], k1=SKY_KEYS[i+1];
    if(t>=k0[0] && t<=k1[0]){
      var f=(t-k0[0])/(k1[0]-k0[0]);
      return { sky:lerpHex(k0[1],k1[1],f), fog:lerpHex(k0[2],k1[2],f), dark:k0[3]+(k1[3]-k0[3])*f };
    }
  }
  return { sky:0x8fc9eb, fog:0x8fc9eb, dark:0 };
}

function isNight(){ return dayTime < 0.20 || dayTime > 0.80; }

function dayTimeStr(){
  var h = Math.floor(dayTime * 24);
  var m = Math.floor((dayTime * 24 * 60) % 60);
  return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;
}

var _nightOvl = null;
function updateDayNight(dt){
  if(net.mode !== 'client') dayTime = (dayTime + dt / DAY_LENGTH) % 1;
  var s = skyAtTime(dayTime);
  scene.background.setHex(s.sky);
  scene.fog.color.setHex(s.fog);
  if(!_nightOvl) _nightOvl = document.getElementById('nightOverlay');
  if(_nightOvl) _nightOvl.style.opacity = s.dark;
}
