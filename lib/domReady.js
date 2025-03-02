/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


  define(function(){'use strict';var isTop,testDiv,scrollIntervalId,isBrowser=typeof window!=="undefined"&&window.document,isPageLoaded=!isBrowser,doc=isBrowser?document:null,readyCalls=[];function runCallbacks(callbacks){var i;for(i=0;i<callbacks.length;i+=1){callbacks[i](doc);}}
  function callReady(){var callbacks=readyCalls;if(isPageLoaded){if(callbacks.length){readyCalls=[];runCallbacks(callbacks);}}}
  function pageLoaded(){if(!isPageLoaded){isPageLoaded=true;if(scrollIntervalId){clearInterval(scrollIntervalId);}
  callReady();}}
  if(isBrowser){if(document.addEventListener){document.addEventListener("DOMContentLoaded",pageLoaded,false);window.addEventListener("load",pageLoaded,false);}else if(window.attachEvent){window.attachEvent("onload",pageLoaded);testDiv=document.createElement('div');try{isTop=window.frameElement===null;}catch(e){}
  if(testDiv.doScroll&&isTop&&window.external){scrollIntervalId=setInterval(function(){try{testDiv.doScroll();pageLoaded();}catch(e){}},30);}}
  if(document.readyState==="complete"){pageLoaded();}}
  function domReady(callback){if(isPageLoaded){callback(doc);}else{readyCalls.push(callback);}
  return domReady;}
  domReady.version='2.0.1';domReady.load=function(name,req,onLoad,config){if(config.isBuild){onLoad(null);}else{domReady(onLoad);}};return domReady;});