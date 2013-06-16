/*! promise-lite 2013-06-16 */
!function(a,b){"undefined"!=typeof module&&module.exports?module.exports=b():"object"==typeof exports&&exports?exports.Subscribable=b():"function"==typeof define&&define.amd?define("subscribable",b):a.Subscribable=b()}(this,function(){function a(){}return a.prepareInstance=function(b){return b.__events={},b.__handlers=[],b.on=a.on,b.un=a.un,b.fire=a.fire,b.hasListener=a.hasListener,b},a.prototype.__events=null,a.prototype.__handlers=null,a.prototype.on=function(){return a.prepareInstance(this),this.on.apply(this,arguments)},a.prototype.un=function(){return this},a.prototype.fire=function(){return!0},a.prototype.hasListener=function(){return!1},a.fire=function(b){var c,d,e,f,g,h;if("object"==typeof b&&(f=[b],b=b.constructor.toString()),h=a._getHandlersList(this,b,!1),h&&h.length){for(f=f||Array.prototype.slice.call(arguments,1),c=0,d=h.length;d>c&&e!==!1;c++)(g=this.__handlers[h[c]])&&(e=g[0].apply(g[1],f));return e!==!1}return!0},a._getHandlersList=function(a,b,c){return b=(""+b).toLowerCase(),!a.__events[b]&&c&&(a.__events[b]=[]),a.__events[b]},a._saveHandler=function(a,b,c,d){var e=a.__handlers.length;return a.__handlers.push([b,c,e]),d.push(e),e},a.on=function(b,c,d){return a._saveHandler(this,c,d,a._getHandlersList(this,b,!0))},a.un=function(b,c){var d=typeof b;switch(d){case"number":a.removeSingleEvent(this,b,c);break;case"string":case"function":b=(""+b).toLowerCase(),a.removeMultipleEvents(this,a._getHandlersList(this,b,!1),c),c&&a.consolidateEvents(this,b);break;default:b?(a.removeMultipleHandlers(this,this.__handlers,b||null),a.consolidateEvents(this)):(this.__handlers=[],this.__events={})}},a.consolidateEvents=function(b,c){if(!arguments.length)for(var c in b.__events)a.consolidateEvents(c);var d=b.__events[c];if(d&&d.length)for(var e=d.length-1;e>=0;e--)b.__handlers[d[e]]||d.splice(e,1);d&&!d.length&&delete b.__events[c]},a.removeMultipleEvents=function(b,c,d){for(var e=0,f=c.length;f>e;e++)a.removeSingleEvent(b,c[e],d)},a.removeMultipleHandlers=function(b,c,d){for(var e,f=0,g=c.length;g>f;f++)(e=c[f])&&a.removeSingleEvent(b,e[2],d)},a.removeSingleEvent=function(a,b,c){a.__handlers[b]&&(c&&a.__handlers[b][1]!==c||(a.__handlers[b]=null))},a.hasListener=function(a){var b,c,d,e;if(void 0===a){for(b=this.__handlers,d=0,e=b.length;e>d;d++)if(b[d])return!0}else if(c=this.__events[(""+a).toLowerCase()])for(d=0,e=c.length;e>d;d++)if(this.__handlers[c[d]])return!0;return!1},a}),function(a,b){"undefined"!=typeof module&&module.exports?module.exports=b(require("subscribable")):"function"==typeof define&&define.amd?define("promise",["subscribable"],b):a.Promise=b(a.Subscribable)}(this,function(a){function b(){a.prepareInstance(this)}return b.delay="object"==typeof process&&process.nextTick?function(a,b,c){process.nextTick(function(){a.call(b,c)})}:function(a,b,c){window.setTimeout(function(){a.call(b,c)},0)},b.PENDING="waiting...",b.SUCCESS="a-okay!",b.FAILURE="there was a problem :os",b.callNext=function(a,c){return"function"==typeof a&&b.delay(a,c,this._result),this},b.empty=function(){return this},b.prototype._status=b.PENDING,b.prototype._on=function(a,b,c){return b&&b instanceof Function&&this.on(a,b,c),this},b.prototype.isResolved=function(){return this._status===b.SUCCESS},b.prototype.isRejected=function(){return this._status===b.FAILURE},b.prototype.isPending=function(){return this._status===b.PENDING},b.prototype.done=function(a,c){return this._on(b.SUCCESS,a,c)},b.prototype.fail=function(a,c){return this._on(b.FAILURE,a,c)},b.prototype.always=function(a,b){return this.done(a,b).fail(a,b)},b.prototype.then=function(a,c,d,e){if("function"!=typeof a)throw new TypeError("Promise.then must have a function as the first argument");!e&&"function"!=typeof arguments[arguments.length-1]&&arguments[arguments.length-1]&&(e=arguments[arguments.length-1]),this.fail(c,e).progress(d,e);var f=new b;return this.done(function(){var c,d;try{c=a.apply(e,arguments)}catch(g){d=g}d?f.reject(d):c instanceof b?c.pipeTo(f):f.resolve(c)}),f},b.prototype._complete=function(a,c){return this._status==b.PENDING&&(this._result=c,this._status=a,this.fire(a,c),this.un(),this.done=a===b.SUCCESS?b.callNext:b.empty,this.fail=a===b.FAILURE?b.callNext:b.empty,this.always=b.callNext,this.progress=b.empty,this.notify=this.reject=this.resolve=b.empty),this},b.prototype.resolve=function(a){return this._complete.call(this,b.SUCCESS,a)},b.prototype.reject=function(a){return this._complete.call(this,b.FAILURE,a)},b.prototype.notify=function(a){return this.fire(b.PENDING,a),this},b.prototype.progress=function(a,c){return this._on(b.PENDING,a,c)},b.prototype.pipe=function(a,c,d){return this.pipeTo(new b,a,c,d)},b.prototype.pipeTo=function(a,c,d,e){return a instanceof b&&this.then(function(b){a.resolve(c?c(b):b)},function(b){a.reject(d?d(b):b)},function(b){a.notify(e?e(b):b)}),a},b.Promise=b,b});