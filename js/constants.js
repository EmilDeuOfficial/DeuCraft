/* ============ Konstanten ============ */
var CHUNK = 16, SY = 64;
var WORLD = 64;
var WORLD_BLOCKS = WORLD * CHUNK;
var AIR=0, GRASS=1, DIRT=2, STONE=3, WOOD=4, LEAVES=5, SAND=6, PLANK=7, BENCH=8, APPLE=9;
var STICK=10, WPICK=11, WAXE=12, WSHOVEL=13, WSWORD=14, SPICK=15, SAXE=16, SSHOVEL=17, SSWORD=18;
var COAL_ORE=19, FURNACE=20, WOOL=21;                         // Blöcke
var COAL=22, RAW_BEEF=23, COOKED_BEEF=24, RAW_MUTTON=25, COOKED_MUTTON=26, LEATHER=27;   // Items
var BEDROCK=28;                                                // Unzerstörbarer Boden
var DIFFS = ['Friedlich','Einfach','Normal','Schwer'];
var ITEM_NAMES = {1:'Gras',2:'Erde',3:'Stein',4:'Holz',5:'Laub',6:'Sand',7:'Bretter',8:'Werkbank',9:'Apfel',
  10:'Stock',11:'Holzspitzhacke',12:'Holzaxt',13:'Holzschaufel',14:'Holzschwert',
  15:'Steinspitzhacke',16:'Steinaxt',17:'Steinschaufel',18:'Steinschwert',
  19:'Kohleerz',20:'Ofen',21:'Wolle',22:'Kohle',23:'Rohes Rindfleisch',24:'Steak',
  25:'Rohes Hammelfleisch',26:'Gebratenes Hammelfleisch',27:'Leder',28:'Grundgestein'};
var BREAK_TIME = {1:0.7, 2:0.6, 3:3.5, 4:1.6, 5:0.35, 6:0.6, 7:1.6, 8:1.8, 19:4.2, 20:4.5, 21:0.6};
var MAX_STACK = 64;
// Essbares: Item -> Hunger das es auffüllt
var FOOD = {}; FOOD[APPLE]=8; FOOD[RAW_BEEF]=3; FOOD[COOKED_BEEF]=8; FOOD[RAW_MUTTON]=2; FOOD[COOKED_MUTTON]=6;
// Schmelzen im Ofen: Eingabe -> Ausgabe
var SMELT = {}; SMELT[RAW_BEEF]=COOKED_BEEF; SMELT[RAW_MUTTON]=COOKED_MUTTON; SMELT[SAND]=undefined;
// Brennstoff: Item -> Brenndauer in Sekunden
var FUEL = {}; FUEL[COAL]=80; FUEL[PLANK]=15; FUEL[WOOD]=18; FUEL[STICK]=5;
var SMELT_TIME = 10;   // Sekunden pro geschmolzenem Item
function isTool(id){ return id >= WPICK && id <= SSWORD; }
function maxStack(id){ return isTool(id) ? 1 : MAX_STACK; }
// Werkzeug-Info: Typ + Stufe (1 Holz, 2 Stein)
function toolInfo(id){
  switch(id){
    case WPICK: return {type:'pick', tier:1};   case SPICK: return {type:'pick', tier:2};
    case WAXE: return {type:'axe', tier:1};     case SAXE: return {type:'axe', tier:2};
    case WSHOVEL: return {type:'shovel', tier:1}; case SSHOVEL: return {type:'shovel', tier:2};
    case WSWORD: return {type:'sword', tier:1};  case SSWORD: return {type:'sword', tier:2};
    default: return null;
  }
}
// Welche Werkzeugart hilft bei welchem Block
function blockCategory(id){
  if(id === STONE || id === COAL_ORE || id === FURNACE) return 'pick';
  if(id === WOOD || id === PLANK || id === BENCH) return 'axe';
  if(id === DIRT || id === GRASS || id === SAND) return 'shovel';
  return null;
}
var HOTBAR_N = 10, INV_N = 30, SLOTS_N = HOTBAR_N + INV_N;   // 0..39 = Lager
var CRAFT_0 = 40, CRAFT_RESULT = 44;                          // 40..43 Craftfeld 2x2, 44 Ergebnis
var ARMOR_0 = 45, ARMOR_END = 49;                             // 45..48 Rüstung (Helm,Brust,Hose,Schuhe)
var TABLE_0 = 49, TABLE_RESULT = 58;                          // 49..57 Werkbank 3x3, 58 Ergebnis
var FUR_IN = 59, FUR_FUEL = 60, FUR_OUT = 61;                 // Ofen: Eingabe, Brennstoff, Ausgabe
var TOTAL_SLOTS = 62;
var GRAVITY = 24, JUMP = 8.2, SPEED = 4.5, FLY_SPEED = 9;     // Physik (früh, da Tiere sie nutzen)

