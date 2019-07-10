define(function(require){var msgInit=0;var msgListUsers=1;var msgCreateSharedActivity=2;var msgListSharedActivities=3;var msgJoinSharedActivity=4;var msgLeaveSharedActivity=5;var msgOnConnectionClosed=6;var msgOnSharedActivityUserChanged=7;var msgSendMessage=8;var callbackArray=[];var userInfo=null;var sharedInfo=null;function SugarPresence(){var emptyCallback=function(){};var listUsersCallback=emptyCallback;var createSharedActivityCallback=emptyCallback;var listSharedActivityCallback=emptyCallback;var joinSharedActivity=emptyCallback;var leaveSharedActivity=emptyCallback;var onConnectionClosed=emptyCallback;var onSharedActivityUserChanged=emptyCallback;var receivedDataCallback=emptyCallback;callbackArray=[emptyCallback,listUsersCallback,createSharedActivityCallback,listSharedActivityCallback,joinSharedActivity,leaveSharedActivity,onConnectionClosed,onSharedActivityUserChanged,receivedDataCallback];this.socket=null;this.registerMessageHandler=function(){this.socket.onmessage=function(event){var edata=event.data;try{var json=JSON.parse(edata);}catch(e){console.log('Presence API error, this doesn\'t look like a valid JSON: ',edata);return;}
if(json.type<callbackArray.length)
callbackArray[json.type](json.data);else
console.log('Presence API error, unknown callback type:'+json.type);};}
this.registerUser=function(){this.socket.send(JSON.stringify(this.userInfo));}}
var presence=new SugarPresence();SugarPresence.prototype.isConnected=function(){return(this.socket!=null);}
SugarPresence.prototype.getUserInfo=function(){return this.userInfo;}
SugarPresence.prototype.getSharedInfo=function(){return this.sharedInfo;}
function getSugarSettings(callback){if(typeof chrome!='undefined'&&chrome.app&&chrome.app.runtime){chrome.storage.local.get('sugar_settings',function(values){callback(values.sugar_settings);});}else{callback(localStorage.sugar_settings);}}
SugarPresence.prototype.joinNetwork=function(callback){if(!window.WebSocket){console.log('WebSocket not supported');callback({code:-1},presence);}
var that=this;getSugarSettings(function(sugar_settings){var server=location.hostname;if(sugar_settings){var sugarSettings=JSON.parse(sugar_settings);if(sugarSettings.server){server=sugarSettings.server;var endName=server.indexOf(':')
if(endName==-1)endName=server.indexOf('/');if(endName==-1)endName=server.length;server=server.substring(0,endName);}}
try{that.socket=new WebSocket('ws://'+server+':8039');}catch(e){return;}
that.socket.onerror=function(error){console.log('WebSocket Error: '+error);callback(error,presence);that.socket=null;};that.socket.onopen=function(event){var sugarSettings=JSON.parse(sugar_settings);that.userInfo={name:sugarSettings.name,networkId:sugarSettings.networkId,colorvalue:sugarSettings.colorvalue};that.registerMessageHandler();that.registerUser();callback(null,presence);};that.socket.onclose=function(event){callbackArray[msgOnConnectionClosed](event);};});}
SugarPresence.prototype.leaveNetwork=function(){if(!this.isConnected())
return;this.socket.close();}
SugarPresence.prototype.listUsers=function(callback){if(!this.isConnected())
return;callbackArray[msgListUsers]=callback;var sjson=JSON.stringify({type:msgListUsers});this.socket.send(sjson);}
SugarPresence.prototype.createSharedActivity=function(activityId,callback){if(!this.isConnected())
return;var that=this;callbackArray[msgCreateSharedActivity]=function(data){that.sharedInfo={id:data};callback(data);}
var sjson=JSON.stringify({type:msgCreateSharedActivity,activityId:activityId});this.socket.send(sjson);}
SugarPresence.prototype.listSharedActivities=function(callback){if(!this.isConnected())
return;callbackArray[msgListSharedActivities]=callback;var sjson=JSON.stringify({type:msgListSharedActivities});this.socket.send(sjson);}
SugarPresence.prototype.joinSharedActivity=function(group,callback){if(!this.isConnected())
return;var that=this;callbackArray[msgJoinSharedActivity]=function(data){that.sharedInfo=data;callback(data);}
var sjson=JSON.stringify({type:msgJoinSharedActivity,group:group});this.socket.send(sjson);}
SugarPresence.prototype.leaveSharedActivity=function(group,callback){if(!this.isConnected())
return;callbackArray[msgLeaveSharedActivity]=callback;var sjson=JSON.stringify({type:msgLeaveSharedActivity,group:group});this.socket.send(sjson);}
SugarPresence.prototype.onConnectionClosed=function(callback){callbackArray[msgOnConnectionClosed]=callback;}
SugarPresence.prototype.onSharedActivityUserChanged=function(callback){callbackArray[msgOnSharedActivityUserChanged]=callback;}
SugarPresence.prototype.sendMessage=function(group,data){;if(!this.isConnected())
return;var sjson=JSON.stringify({type:msgSendMessage,group:group,data:data});this.socket.send(sjson);}
SugarPresence.prototype.onDataReceived=function(callback){callbackArray[msgSendMessage]=callback;}
return presence;});