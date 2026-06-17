/* ============ Speicher ============ */
/* Reihenfolge: window.storage (Artefakt) -> localStorage (heruntergeladene
   Datei) -> RAM. So bleiben Welten und Name lokal erhalten, egal wo das Spiel
   läuft. */
var memStore = {};
function lsGet(k){ try{ return window.localStorage ? localStorage.getItem(k) : null; }catch(e){ return null; } }
function lsSet(k,v){ try{ if(window.localStorage){ localStorage.setItem(k,v); return true; } }catch(e){} return false; }
function lsDel(k){ try{ if(window.localStorage) localStorage.removeItem(k); }catch(e){} }
var store = {
  get: function(k){
    return new Promise(function(res){
      if(window.storage && window.storage.get){
        window.storage.get(k).then(function(r){
          res(r ? r.value : (lsGet(k) || (k in memStore ? memStore[k] : null)));
        }).catch(function(){ res(lsGet(k) || (k in memStore ? memStore[k] : null)); });
      } else {
        res(lsGet(k) || (k in memStore ? memStore[k] : null));
      }
    });
  },
  set: function(k,v){
    memStore[k] = v;
    var ls = lsSet(k,v);
    if(window.storage && window.storage.set) window.storage.set(k,v).catch(function(){});
  },
  del: function(k){
    delete memStore[k];
    lsDel(k);
    if(window.storage && window.storage.delete) window.storage.delete(k).catch(function(){});
  }
};

