
/**
 * @exports Subscribable
 */
(function (root, subscribableFactory) {
   if(typeof module !== "undefined" && module.exports) { // Node.js
      module.exports = subscribableFactory();
   }
   else  if (typeof exports === "object" && exports) { // CommonJS
      exports.Subscribable = subscribableFactory();
   }
   else  if (typeof define === "function" && define.amd) { // AMD
      define('subscribable',subscribableFactory);
   }
   else { // <script>
      root.Subscribable = subscribableFactory();
   }
}(this, function () {

   

   /**
    * The Subscribable class is the underlying component in a pub/sub application providing the ability
    * to "fire" events and bind handlers using "on" and remove them again with "un"
    *
    * @constructor
    * @name Subscribable
    */
   function Subscribable() {
   }

   /**
    * Converts any object instance into a Subscribable by applying the interface from Subscribable onto it. Note
    * that if the object already has a function from the Subscribable interface (eg: on, off, fire) these functions
    * will be replaced.
    *
    * @param {Object} subscribable
    * @return {*} The supplied subscribable for chaining
    */
   Subscribable.prepareInstance = function(subscribable) {
      subscribable.__events = {};
      subscribable.__handlers = [];
      subscribable.on = Subscribable.on;
      subscribable.un = Subscribable.un;
      subscribable.fire = Subscribable.fire;
      subscribable.hasListener = Subscribable.hasListener;
      return subscribable;
   };

   /**
    * The events object stores the names of the events that have listeners and the numeric IDs of the handlers
    * that are listening to the events.
    * @type {Object[]}
    */
   Subscribable.prototype.__events = null;

   /**
    * The handlers object is an array of handlers that will respond to the events being fired.
    * @type {Object[]}
    */
   Subscribable.prototype.__handlers = null;

   /**
    *
    */
   Subscribable.prototype.on = function() {
      Subscribable.prepareInstance(this);
      return this.on.apply(this, arguments);
   };

   /**
    *
    */
   Subscribable.prototype.un = function() {
      return this;
   };

   /**
    *
    */
   Subscribable.prototype.fire = function() {
      return true;
   };

   /**
    * Checks for whether there are any listeners for the supplied event type, where the event type can either be the
    * string name of an event or an event constructor.
    *
    * When the eventType parameter is omitted, the method will check for a handler against any event type.
    *
    * @param {String|Function} [eventType]
    */
   Subscribable.prototype.hasListener = function(eventType) {
      return false;
   };

   /**
    * Fires the named event with any arguments used as the call to fire.
    *
    * @param {String} eventName
    */
   Subscribable.fire = function(eventName) {
      var i, l,
         returnValue,
         args,
         handler,
         handlerIds;

      if(typeof eventName == 'object') {
         args = [eventName];
         eventName = eventName.constructor.toString();
      }

      handlerIds = Subscribable._getHandlersList(this, eventName, false);

      if(handlerIds && handlerIds.length) {
         args = args || Array.prototype.slice.call(arguments, 1);
         for(i = 0, l = handlerIds.length; i < l && returnValue !== false; i++) {
            if(handler = this.__handlers[handlerIds[i]]) {
               returnValue = handler[0].apply(handler[1], args);
            }
         }
         return returnValue !== false;
      }

      return true;
   };

   /**
    * Gets the list of handler IDs for the supplied event name in the Subscribable instance. When
    * the create parameter is set to true and the event has not yet been set up in the Subscribable
    * it will be created.
    *
    * @param {Subscribable} instance
    * @param {String} eventName
    * @param {Boolean} create
    * @return {Number[]}
    */
   Subscribable._getHandlersList = function(instance, eventName, create) {
      eventName = ('' + eventName).toLowerCase();
      if(!instance.__events[eventName] && create) {
         instance.__events[eventName] = [];
      }
      return instance.__events[eventName];
   };

   /**
    * Attaches the supplied handler/scope as a listener in the supplied event list.
    *
    * @param {Function} handler
    * @param {Object} scope
    * @param {Number[]} eventList
    */
   Subscribable._saveHandler = function(instance, handler, scope, eventList) {
      var handlerId = instance.__handlers.length;
      instance.__handlers.push( [handler, scope, handlerId] );
      eventList.push(handlerId);

      return handlerId;
   };

   /**
    * Attaches the supplied handler and scope as a listener for the supplied event name. The return value is
    * the numerical ID of the handler that has been added to allow for removal of a single event handler in the
    * "un" method.
    *
    * @param {String} eventName
    * @param {Function} handler
    * @param {Object} scope
    * @return {Number}
    */
   Subscribable.on = function(eventName, handler, scope) {
      return Subscribable._saveHandler(this, handler, scope, Subscribable._getHandlersList(this, eventName, true));
   };

   /**
    * Remove handlers for the specified selector - the selector type can either be a number (which is the ID of a single
    * handler and is the result of using the .on method), a string event name (which is the same string used as the event
    * name in the .on method), the Function constructor of an event object (that has a .toString method to return the
    * name of the associated event) or an object that is the scope of a handler (in which case, any handler for any
    * event that uses that object as the scope will be removed).
    *
    * @param {Object|String|Number|Function} un
    * @param {Object} [scopeCheck]
    */
   Subscribable.un = function(un, scopeCheck) {
      var typeofRemoval = typeof un;
      switch(typeofRemoval) {
         case 'number':
            Subscribable.removeSingleEvent(this, un, scopeCheck);
            break;

         case 'string':
         case 'function':
            un = ('' + un).toLowerCase();
            Subscribable.removeMultipleEvents(this,
               Subscribable._getHandlersList(this, un, false), scopeCheck);
            if(scopeCheck) {
               Subscribable.consolidateEvents(this, un);
            }
            break;

         default:
            if(un) {
               Subscribable.removeMultipleHandlers(this, this.__handlers, un || null);
               Subscribable.consolidateEvents(this);
            }
            else {
               this.__handlers = [];
               this.__events = {};
            }
            break;
      }
   };

   /**
    * Consolidates the handler IDs registered for the supplied named event; when the event name is not specified
    * all event containers will be consolidated.
    *
    * @param {String} [eventName]
    */
   Subscribable.consolidateEvents = function(instance, eventName) {
      if(!arguments.length) {
         for(var eventName in instance.__events) {
            Subscribable.consolidateEvents(eventName);
         }
      }

      var handlerList = instance.__events[eventName];

      if(handlerList && handlerList.length) {
         for(var i = handlerList.length - 1; i >= 0; i--) {
            if(!instance.__handlers[handlerList[i]]) {
               handlerList.splice(i,1);
            }
         }
      }

      if(handlerList && !handlerList.length) {
         delete instance.__events[eventName];
      }
   };

   /**
    * Attempts to nullify the handler with the supplied list of handler IDs in the Subscribable instance. If the
    * optional scopeCheck parameter is supplied, each handler will only be nullified when the scope it was attached
    * with is the same entity as the scopeCheck.
    *
    * @param {Subscribable} instance
    * @param {Number[]} handlerList
    * @param {Object} [scopeCheck]
    */
   Subscribable.removeMultipleEvents = function(instance, handlerList, scopeCheck) {
      for(var i = 0, l = handlerList.length; i < l; i++) {
         Subscribable.removeSingleEvent(instance, handlerList[i], scopeCheck);
      }
   };

   /**
    * Attempts to nullify the supplied handlers (note that in this case the handler array is the list of actual handlers
    * rather than their handler ID values). If the optional scopeCheck parameter is supplied, each handler will only be
    * nullified when the scope it was attached with the same entity as the scopeCheck.
    *
    * @param {Subscribable} instance
    * @param {Object[]} handlers
    * @param {Object} [scopeCheck]
    */
   Subscribable.removeMultipleHandlers = function(instance, handlers, scopeCheck) {
      var handler;
      for(var i = 0, l = handlers.length; i < l; i++) {
         if(handler = handlers[i]) {
            Subscribable.removeSingleEvent(instance, handler[2], scopeCheck);
         }
      }
   };

   /**
    * Attempts to nullify the handler with the supplied handler ID in the Subscribable instance. If the optional
    * scopeCheck parameter is supplied, the handler will only be nullified when the scope it was attached with is
    * the same entity as the scopeCheck.
    *
    * @param {Subscribable} instance
    * @param {Number} handlerId
    * @param {Object} [scopeCheck]
    */
   Subscribable.removeSingleEvent = function(instance, handlerId, scopeCheck) {
      if(instance.__handlers[handlerId]) {
         if(!scopeCheck || instance.__handlers[handlerId][1] === scopeCheck) {
            instance.__handlers[handlerId] = null;
         }
      }
   };

   /**
    *
    * @param {String|Function} [eventType]
    */
   Subscribable.hasListener = function(eventType) {
      var handlers, handlerIds, i, l;

      if(eventType === undefined) {
         handlers = this.__handlers;
         for(i = 0, l = handlers.length; i < l; i++) {
            if(!!handlers[i]) {
               return true;
            }
         }
      }

      else if(handlerIds = this.__events[('' + eventType).toLowerCase()]) {
         for(i = 0, l = handlerIds.length; i < l; i++) {
            if(this.__handlers[handlerIds[i]]) {
               return true;
            }
         }
      }

      return false;
   };

   return Subscribable;

}));

(function (root, promiseFactory) {
   if(typeof module !== "undefined" && module.exports) { // Node.js
      module.exports = promiseFactory(require('subscribable'));
   }
   else  if (typeof define === "function" && define.amd) { // AMD
      define('promise',['subscribable'], promiseFactory);
   }
   else { // <script>
      root.Promise = promiseFactory(root.Subscribable);
   }
}(this, function (Subscribable) {

   

   /**
    *
    * @constructor
    * @name Promise
    */
   function Promise() {
      Subscribable.prepareInstance(this);
   }

   /**
    * Calls the scoped function with the arguments specified in the next execution context.
    *
    * @param {Function} fn
    * @param {Object} scope
    * @param {Object} data
    * @function
    * @ignore
    */
   Promise.delay = (typeof process == 'object' && process.nextTick) ? (function(fn, scope, data) {
      process.nextTick(function() {fn.call(scope, data);});
   }) : function(fn, scope, data) {
      window.setTimeout(function() {fn.call(scope, data);}, 0);
   };

   /**
    * The status of having not yet been resolved or rejected
    * @type {String}
    */
   Promise.PENDING = 'waiting...';

   /**
    * The status of having been resolved - this is a terminating status and once reached cannot be changed
    * @type {String}
    */
   Promise.SUCCESS = 'a-okay!';

   /**
    * The status of having been rejected - this is a terminating status and once reached cannot be changed
    * @type {String}
    */
   Promise.FAILURE = 'there was a problem :os';

   /**
    * When the Promise has been resolved or rejected, the done and fail methods for attaching new handlers are replaced
    * with either this or the empty method to either always call or never call the handler. Forms part of the contract
    * that a Promise can only complete its path once.
    *
    * @param {Function} fn
    * @param {Object} scope
    * @return {Promise}
    */
   Promise.callNext = function(fn, scope) {
      if(typeof fn == 'function') {
         Promise.delay(fn, scope, this._result);
      }
      return this;
   };

   /**
    * An empty method that can be referenced to a Promise instance method to remove its functionality - attached as soon
    * as a Promise is resolved or rejected, ensures a single completion result and removes status checking in event attaching
    * and notification methods.
    *
    * @return {Promise}
    */
   Promise.empty = function() {
      return this;
   };

   /**
    * The current state of the Promise - by default should be in the Pending state
    * @type {String}
    */
   Promise.prototype._status = Promise.PENDING;

   /**
    * Wrapper for the event handler to allow for sending rubbish into the Subscribable, makes other functions simpler
    * throughout the rest of the Promise
    *
    * @param {String} eventName
    * @param {Function} func
    * @param {Object} [scope]
    * @return {Promise}
    */
   Promise.prototype._on = function(eventName, func, scope) {
      if(func && func instanceof Function) {
         this.on(eventName, func, scope);
      }
      return this;
   };

   /**
    * Gets whether this Promise has been resolved
    * @return {Boolean}
    */
   Promise.prototype.isResolved = function() {
      return this._status === Promise.SUCCESS;
   };

   /**
    * Gets whether this Promise has been rejected
    * @return {Boolean}
    */
   Promise.prototype.isRejected = function() {
      return this._status === Promise.FAILURE;
   };

   /**
    * Gets whether this Promise has not yet been resolved or rejected
    * @return {Boolean}
    */
   Promise.prototype.isPending = function() {
      return this._status === Promise.PENDING;
   };

   /**
    * Attaches a handler for when this Promise is resolved, attaching a handler after the Promise is already resolved
    * will call back in the next execution scope (ie: will always
    *
    * @param {Function} done A function to call when the promise is resolved
    * @param {Object} [scope] The optional scope to call done with on resolution of the promise
    */
   Promise.prototype.done = function(done, scope) {
      return this._on(Promise.SUCCESS, done, scope);
   };

   Promise.prototype.fail = function(fail, scope) {
      return this._on(Promise.FAILURE, fail, scope);
   };

   Promise.prototype.always = function(complete, scope) {
      return this.done(complete, scope).fail(complete, scope);
   };

   Promise.prototype.then = function(done, fail, progress, scope) {
      if('function' !== typeof done) {
         throw new TypeError('Promise.then must have a function as the first argument');
      }

      if(!scope && 'function' !== typeof arguments[arguments.length - 1] && arguments[arguments.length - 1]) {
         scope = arguments[arguments.length - 1];
      }

      this.fail(fail, scope).progress(progress, scope);

      // when this promise has completed successfully
      var promise = new Promise();
      this.done(function() {
         var result, err;
         try {
            // try running the done handler
            result = done.apply(scope, arguments);
         }
         catch (e) {
            err = e;
         }

         // if it threw an error, reject the new promise so any chained .then(_, FAIL) handlers get called
         if(err) {
            promise.reject(err);
         }

         // if no error was thrown and the return is another promise, then pipe that promise onto the returned one
         else if (result instanceof Promise) {
            result.pipeTo(promise);
         }

         // if no error was thrown and the return is a result then resolve the returned promise to call .then(DONE) handlers
         else {
            promise.resolve(result);
         }
      });

      return promise
   };

   Promise.prototype._complete = function(status, result) {
      if(this._status == Promise.PENDING) {
         this._result = result;
         this._status = status;
         this.fire(status, result);
         this.un();

         this.done = status === Promise.SUCCESS ? Promise.callNext : Promise.empty;
         this.fail = status === Promise.FAILURE ? Promise.callNext : Promise.empty;
         this.always = Promise.callNext;
         this.progress = Promise.empty;
         this.notify = this.reject = this.resolve = Promise.empty;
      }
      return this;
   };

   /**
    * Resolves this Promise, notifying all handlers with the first argument sent to this function.
    *
    * @param {Object} data
    * @return {Promise}
    */
   Promise.prototype.resolve = function(data) {
      return this._complete.call(this, Promise.SUCCESS, data);
   };

   /**
    * Rejects this Promise, notifying all fail handlers with the first argument sent to this function.
    *
    * @param {Object} data
    * @return {Promise}
    */
   Promise.prototype.reject = function(data) {
      return this._complete.call(this, Promise.FAILURE, data);
   };

   /**
    * Sends a notification through this Promise, notify calls all progress handlers so long as the Promise is in the
    * PENDING state.
    *
    * @param {Object} data
    * @return {Promise}
    */
   Promise.prototype.notify = function(data) {
      this.fire(Promise.PENDING, data);
      return this;
   };

   /**
    * Binds a handler to the progress event, these handlers will be called when a notify update takes place.
    *
    * @param {Function} handler
    * @param {Object} [scope]
    * @return Promise
    */
   Promise.prototype.progress = function(handler, scope) {
      return this._on(Promise.PENDING, handler, scope);
   };

   /**
    * Creates a new Promise that will be resolved, rejected or notified as a result of events on the current Promise,
    * the optional filter functions can be used to change the value that is passed through to the Promise that this
    * function returns.
    *
    * When one of the filters isn't supplied, the new Promise is updated using the same value that was sent into the
    * current Promise.
    *
    * @example
    * var promise = new Promise;
    * var pipedPromise = promise.pipe(function(val) {return val * 2})
    *                      .then(function(result){alert(result);});
    *
    * promise.resolve(2); // alerts 4
    *
    * @param {Function} [doneFilter]
    * @param {Function} [failFilter]
    * @param {Function} [notifyFilter]
    * @return {Promise}
    */
   Promise.prototype.pipe = function(doneFilter, failFilter, notifyFilter) {
      return this.pipeTo(new Promise, doneFilter, failFilter, notifyFilter);
   };

   /**
    * Essentially the reverse of the Promise#pipe function, this method will attempt to reject, resolve and notify the
    * supplied Promise whenever this Promise is rejected, resolved or notified. The return value is the supplied
    * Promise instance to allow for chaining on that promise.
    *
    * If the supplied promise isn't an instance of this Promise class, no handlers will be bound to it.
    *
    * @param {Promise} promise
    * @param {Function} [doneFilter]
    * @param {Function} [failFilter]
    * @param {Function} [notifyFilter]
    */
   Promise.prototype.pipeTo = function(promise, doneFilter, failFilter, notifyFilter) {
      if(promise instanceof Promise) {
         this.then(function(data) {
            promise.resolve(doneFilter ? doneFilter(data) : data);
         }, function(data) {
            promise.reject(failFilter ? failFilter(data) : data);
         }, function(data) {
            promise.notify(notifyFilter ? notifyFilter(data) : data);
         });
      }
      return promise;
   };

   // backwards compatibility - the Promise used to be exported as a property of the main export not as the export
   Promise.Promise = Promise;

   return Promise;

}));
