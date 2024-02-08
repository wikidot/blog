// WorkerVersion: 1.5
// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/6.0.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/6.0.4/firebase-messaging.js');

var g_senderId = '98659632341' ;
firebase.initializeApp({
    messagingSenderId: g_senderId

});

const messaging = firebase.messaging();
const swversion = '4.0' ;
var baseName  = "pushwdb", storeName ="pushwstore", curToken = '', gtargeting='' ;


Object.defineProperty(String.prototype, 'hashCode', {
    value: function() {
      var hash = 0, i, chr;
      for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; 
      }
      return hash;
    }
  });

function logerr(err){
    console.log(err);
}

function connectDB(f){
    var request = indexedDB.open(baseName, 4);
    request.onerror = logerr;
    request.onsuccess = function(){
        f(request.result);
    }
    request.onupgradeneeded = function(e){
        if (!e.currentTarget.result.objectStoreNames.contains(storeName)){
        e.currentTarget.result.createObjectStore(storeName, { keyPath: "key" });
        }
        if (!e.currentTarget.result.objectStoreNames.contains("pushes")){
        let objectStore = e.currentTarget.result.createObjectStore("pushes", { keyPath: "dt" });
        objectStore.createIndex("ifromback", "fromback");
        }
        if (!e.currentTarget.result.objectStoreNames.contains("clicks")){
        let clickStore = e.currentTarget.result.createObjectStore("clicks", { keyPath: "dt" });
        clickStore.createIndex("ifromback", "fromback");
        }
        connectDB(f);
    }
}

function savePushClick(p,fromback, store="pushes"){
    connectDB(function(db){
        var request = db.transaction([store], "readwrite").objectStore(store).put({dt:new Date().getTime(), pushhash: p.hashCode(), fromback:fromback, push:p});
        request.onerror = logerr;
        request.onsuccess = function(){
            return request.result;
        }
    });
}

function getPushLastInterval(p, interval, f){ 
    connectDB(function(db){
    var store = db.transaction(["pushes"], "readonly").objectStore("pushes");
    var pushhash = JSON.stringify(p).hashCode() ;
    let ts = new Date().getTime()-interval* 1000 ;
    var req = store.getAll(IDBKeyRange.lowerBound(ts)) ;
    req.onsuccess = function(event) {
        if (req.result) {
            for (i = 0; i< req.result.length;i++){
                if (pushhash == req.result[i].pushhash){
                    return f(true) ;
                }
            }
        }
        return f(false) ;
        };
    });
}

function getVal(key, f){
    connectDB(function(db){
    var request = db.transaction([storeName], "readonly").objectStore("pushwstore").get(key);
        request.onerror = logerr;
        request.onsuccess = function(){
        f( (request.result && request.result.val) ? request.result.val : "");
    }
    });
}

function getStateAlltime(f){
    getVal( 'targeting', function(targeting) {
        gtargeting = targeting ;
    connectDB(function(db){

    var store = db.transaction(["pushes"], "readonly").objectStore("pushes");
    var frmbackind = store.index("ifromback") ;
    var req = frmbackind.count(IDBKeyRange.only(0)) ;
    var recvcc = 0, clickcc = 0 , recvbackcc = 0 , clickbackcc = 0, recvemptybackcc=0 ;
    req.onsuccess = function(event) {
        if (req.result){
            recvcc = req.result ;
        }
        var req2 = frmbackind.count(IDBKeyRange.only(1)) ;
        req2.onsuccess = function(event) {
            if (req2.result){
                recvbackcc = req2.result ;
            }
            var req4 = frmbackind.count(IDBKeyRange.only(2)) ;
            req4.onsuccess = function(event) {
                if (req4.result){
                    recvemptybackcc = req4.result ;
                }
                var clickstore = db.transaction(["clicks"], "readonly").objectStore("clicks");
                var cfrmbackind = clickstore.index("ifromback") ;
                var req3 = cfrmbackind.count(IDBKeyRange.only(0)) ;
                req3.onsuccess = function(event) {
                    if (req3.result){
                        clickcc = req3.result ;
                    }
                    var req4 = cfrmbackind.count(IDBKeyRange.only(1)) ;
                    req4.onsuccess = function(event) {
                        if (req4.result){
                            clickbackcc = req4.result ;
                        }
                        f(gtargeting + "&recvcc="+recvcc+"&recvbackcc="+recvbackcc+"&recvemptybackcc="+recvemptybackcc+"&clickcc="+clickcc+"&clickbackcc="+clickbackcc) ;
                    }
                }
            }
        }
    }
    });
    });
}

function setVal(key, val){
    connectDB(function(db){
        var request = db.transaction([storeName], "readwrite").objectStore(storeName).put({key:key, val:val});
        request.onerror = logerr;
        request.onsuccess = function(){
            return request.result;
        }
    });
}

function delVal(key){
    connectDB(function(db){
        var request = db.transaction([storeName], "readwrite").objectStore(storeName).delete(key);
        request.onerror = logerr;
        request.onsuccess = function(){
        }
    });
}


self.addEventListener('activate', function() {
    console.log('ACTIVATE!') ;
});


self.addEventListener('push',function(e){
  var pushdata = e.data.json() ;
  var oself = self ;
  if ( 'notification' in pushdata){
    return ;
  }
  if ('data' in pushdata){
    if ( navigator.userAgent.indexOf('Macintosh') != -1){
	pushdata.data.requireInteraction=false;
    }
    pushdata = pushdata.data ;
  }
  if ( "doppushes" in pushdata){
        let doppushes = pushdata.doppushes ;
        if (!Array.isArray(doppushes)){
    	    doppushes = JSON.parse(doppushes)
    	}
        if (Array.isArray(doppushes)){
    	for (let i=0;i<doppushes.length; i++){
		processPush( doppushes[i],e, oself);
        }
	}
  }

  if ('targeting' in pushdata){
      gtargeting = pushdata.targeting ;
            setVal('targeting',pushdata.targeting) ;
  }
  if ('sync' in pushdata){
    console.log('sync4') ;
    registration.update();
  }
  if ( 'get_state' in pushdata){
    getStateAlltime(function(state){
        return fetch(pushdata.get_state+"&"+state)
            .then(function(response) { console.log( response.text()); })
    });
   }
   
    if ( 'hide_in_interval' in pushdata){
        e.waitUntil(
            new Promise((resolve, reject) => {
        let interval = pushdata.hide_in_interval ;
        delete pushdata.hide_in_interval ;
        getPushLastInterval(pushdata, interval, function(isshowed){
            if (!isshowed){
                resolve(processPush(pushdata,e,oself) );
            }else{
                return ;
            }
        })
        }));
    }else{
        processPush(pushdata,e,oself) ;
    }
});

function processPush(pushdata,e,oself){
    if ( 'push_id_req' in pushdata){
        e.waitUntil(
            new Promise((resolve, reject) => {
        getVal( 'targeting', function(targeting) {
            gtargeting = targeting ;
            var req_url = pushdata.push_id_req + "&" + targeting ;
            return fetch(req_url)
              .then(function(response) { return response.json(); })
              .then(function(pushdata2) {
                  if ('targeting' in pushdata2){
                      gtargeting = pushdata2.targeting ;
                            setVal('targeting',pushdata2.targeting) ;
                  }
	        if (Array.isArray(pushdata2)){
		    for (let i=0;i<pushdata2.length; i++){
			processPush( pushdata2[i],e, oself);
		    }
		}else{
		    savePushClick(JSON.stringify(pushdata2),1,"pushes");
		    resolve(showNotification(oself, pushdata2)) ;
    	        }
              })
              .catch(function(err) {
                  console.log('err hapens while fetching push info');
                  console.log(err);
                  savePushClick(JSON.stringify({"push":"empty"}),2,"pushes");
                  // e.waitUntil( self.registration.pushManager.getSubscription().then(function(subscription) {   return showNotification(oself, pushdata) ; }));
              });
          }) ;
        }));
      }else{
          getVal( 'targeting', function(targeting) {gtargeting=targeting;});
          savePushClick(JSON.stringify(pushdata),0,"pushes");
           return e.waitUntil(self.registration.pushManager.getSubscription().then(function(subscription) {   return showNotification(oself, pushdata) ; }));
      }
}

function showNotification(o,pushdata){
  if ( !('data' in pushdata) || !pushdata.data){
    pushdata.data = pushdata ;
  }
  var duration = 60000 ;
  if ('duration' in pushdata){
    duration = pushdata.duration ;
  }
  if ('actions' in pushdata && !Array.isArray(pushdata.actions)){
    pushdata.actions = JSON.parse(pushdata.actions) ;
  }
  return  o.registration.showNotification(pushdata.title, pushdata).
  then(() => o.registration.getNotifications())
        .then(notifications => { setTimeout(() => notifications.forEach(notification => notification.close()), duration); });
}

self.addEventListener('notificationclick', (event) => {

    var pushdata = event.notification ;
    var clickURL = undefined ;
    var close_on_click = true;
    if ('data' in pushdata && pushdata.data){
        var data = pushdata.data ;
        if ('close_on_click' in data){
            close_on_click = (data.close_on_click != 'false') ;
        }
        if ('click_action' in data){
            clickURL = data.click_action;
        }
        if ( 'actions' in data && Array.isArray(data.actions)){
            var act = undefined ;
            if (event.action === data.actions[0].action){
                act = data.actions[0] ;
            }else if( data.actions[1] && event.action === data.actions[1].action){
                act = data.actions[1] ;
            }
            if (act){
                if ( 'js' in act ){
                    eval( act.js ) ;
                }
                if ('click_action' in act ){
                    clickURL = act.click_action ;
                }
            }
        }
        delete data.data ;
        savePushClick(JSON.stringify(data),0,"clicks");
    }else{
        delete pushdata.data ;
        savePushClick(JSON.stringify(pushdata),0,"clicks");
    }
    if (close_on_click){
        event.notification.close();
    }
    if( clickURL ) {
        clickURL = clickURL + "&" + gtargeting ;
        event.waitUntil(clients.matchAll({
          type: "window"
          }).then(function(clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url == clickURL && 'focus' in client)
                          return client.focus();
                }
                if (clients.openWindow) {
                  var url = clickURL;
                  return clients.openWindow(url);
                }
        }));
    }
});


