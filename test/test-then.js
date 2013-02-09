
var TestCase = require('unit-test').TestCase,
    Assertions = require('unit-test').Assertions,
    sinon = require('unit-test').Sinon;

module.exports = new TestCase('Then', function() {

   var Promise = require('../src/promise').Promise;

   var deferrable = function(fn, scope, data) {
      deferrable.calls.push(function() {
         fn.call(scope, data);
      });
      return deferrable.calls.length - 1;
   };
   deferrable.calls = [];

   var notifyHandler, notifyScope, doneHandler, doneScope, failHandler, failScope, anotherHandler, anotherScope;

   return {
      setUp: function() {
         notifyHandler = sinon.spy(); doneHandler = sinon.spy(); failHandler = sinon.spy(); anotherHandler = sinon.spy();
         notifyScope = {a:1}; doneScope = {b:1}; failScope = {c:1}; anotherScope = {d:1};
         sinon.stub(Promise, 'delay', deferrable);
      },
      tearDown: function() {
         notifyHandler = notifyScope = doneHandler = doneScope = failHandler = failScope = null;
         Promise.delay.restore();
         deferrable.calls.splice(0, deferrable.calls.length);
      },

      "test then handlers called shortly after attaching when on a promise that is already complete": function() {
         var promise = new Promise;
         promise.resolve().then(doneHandler, failHandler);

         Assertions.assert(doneHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(failHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(Promise.delay.calledOnce, 'Handlers are scheduled for future calling when of the correct type');
         Assertions.assert(Promise.delay.calledWith(doneHandler), 'Handler passed through to scheduler');
      },

      "test then handlers never schedule progress events for completed promises": function() {
         var promise = new Promise;
         promise.resolve().then(doneHandler, failHandler, notifyHandler);
         Assertions.assert(Promise.delay.calledOnce, 'Handlers are scheduled for future calling when of the correct type');
         Assertions.assert(Promise.delay.calledWith(doneHandler), 'Handler passed through to scheduler');
      },

      "test then handlers schedule fail handlers": function() {
         var promise = new Promise;
         promise.reject().then(doneHandler, failHandler);

         Assertions.assert(doneHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(failHandler.notCalled, 'Handlers are not called as they are attached if already complete');
         Assertions.assert(Promise.delay.calledOnce, 'Handlers are scheduled for future calling when of the correct type');
         Assertions.assert(Promise.delay.calledWith(failHandler), 'Handler passed through to scheduler');
      },

      "test delayed handlers filter non-functions": function() {
         var promise = new Promise;
         promise.resolve().then(null);
         Assertions.assert(Promise.delay.notCalled, 'Handlers are scheduled for future calling when of the correct type');
      },

      "test supplying scope as final argument no matter where (instead of fail)": function() {
         var promise = new Promise;
         var done = sinon.spy();
         var someScope = {};

         promise.then(done, someScope).resolve();
         Assertions.assert(done.calledOnce, 'Handler called');
         Assertions.assert(done.calledOn(someScope), 'Handler scope should have been set');
      },

      "test supplying scope as final argument no matter where (instead of progress)": function() {
         var done = sinon.spy();
         var fail = sinon.spy();
         var someScope = {};

         new Promise().then(done, fail, someScope).resolve();
         Assertions.assert(done.calledOnce, 'Resolution handler called');
         Assertions.assert(done.calledOn(someScope), 'Resolution handler scope should have been set');

         new Promise().then(done, fail, someScope).reject();
         Assertions.assert(fail.calledOnce, 'Fail handler called');
         Assertions.assert(fail.calledOn(someScope), 'Fail handler scope should have been set');
      }
   }

});
