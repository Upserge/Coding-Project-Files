import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  __async,
  __commonJS,
  __spreadProps,
  __spreadValues,
  __toESM
} from "./chunk-YHCV7DAQ.js";

// node_modules/rxjs/dist/cjs/internal/util/isFunction.js
var require_isFunction = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isFunction.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isFunction = void 0;
    function isFunction(value) {
      return typeof value === "function";
    }
    exports.isFunction = isFunction;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/createErrorClass.js
var require_createErrorClass = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/createErrorClass.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createErrorClass = void 0;
    function createErrorClass(createImpl) {
      var _super = function(instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
      };
      var ctorFunc = createImpl(_super);
      ctorFunc.prototype = Object.create(Error.prototype);
      ctorFunc.prototype.constructor = ctorFunc;
      return ctorFunc;
    }
    exports.createErrorClass = createErrorClass;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/UnsubscriptionError.js
var require_UnsubscriptionError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/UnsubscriptionError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnsubscriptionError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports.UnsubscriptionError = createErrorClass_1.createErrorClass(function(_super) {
      return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
          return i + 1 + ") " + err.toString();
        }).join("\n  ") : "";
        this.name = "UnsubscriptionError";
        this.errors = errors;
      };
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/arrRemove.js
var require_arrRemove = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/arrRemove.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.arrRemove = void 0;
    function arrRemove(arr, item) {
      if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
      }
    }
    exports.arrRemove = arrRemove;
  }
});

// node_modules/rxjs/dist/cjs/internal/Subscription.js
var require_Subscription = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Subscription.js"(exports) {
    "use strict";
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isSubscription = exports.EMPTY_SUBSCRIPTION = exports.Subscription = void 0;
    var isFunction_1 = require_isFunction();
    var UnsubscriptionError_1 = require_UnsubscriptionError();
    var arrRemove_1 = require_arrRemove();
    var Subscription = (function() {
      function Subscription2(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
      }
      Subscription2.prototype.unsubscribe = function() {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
          this.closed = true;
          var _parentage = this._parentage;
          if (_parentage) {
            this._parentage = null;
            if (Array.isArray(_parentage)) {
              try {
                for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                  var parent_1 = _parentage_1_1.value;
                  parent_1.remove(this);
                }
              } catch (e_1_1) {
                e_1 = { error: e_1_1 };
              } finally {
                try {
                  if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                } finally {
                  if (e_1) throw e_1.error;
                }
              }
            } else {
              _parentage.remove(this);
            }
          }
          var initialFinalizer = this.initialTeardown;
          if (isFunction_1.isFunction(initialFinalizer)) {
            try {
              initialFinalizer();
            } catch (e) {
              errors = e instanceof UnsubscriptionError_1.UnsubscriptionError ? e.errors : [e];
            }
          }
          var _finalizers = this._finalizers;
          if (_finalizers) {
            this._finalizers = null;
            try {
              for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                var finalizer = _finalizers_1_1.value;
                try {
                  execFinalizer(finalizer);
                } catch (err) {
                  errors = errors !== null && errors !== void 0 ? errors : [];
                  if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                    errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                  } else {
                    errors.push(err);
                  }
                }
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
              } finally {
                if (e_2) throw e_2.error;
              }
            }
          }
          if (errors) {
            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
          }
        }
      };
      Subscription2.prototype.add = function(teardown) {
        var _a;
        if (teardown && teardown !== this) {
          if (this.closed) {
            execFinalizer(teardown);
          } else {
            if (teardown instanceof Subscription2) {
              if (teardown.closed || teardown._hasParent(this)) {
                return;
              }
              teardown._addParent(this);
            }
            (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
          }
        }
      };
      Subscription2.prototype._hasParent = function(parent) {
        var _parentage = this._parentage;
        return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
      };
      Subscription2.prototype._addParent = function(parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
      };
      Subscription2.prototype._removeParent = function(parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
          this._parentage = null;
        } else if (Array.isArray(_parentage)) {
          arrRemove_1.arrRemove(_parentage, parent);
        }
      };
      Subscription2.prototype.remove = function(teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove_1.arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription2) {
          teardown._removeParent(this);
        }
      };
      Subscription2.EMPTY = (function() {
        var empty = new Subscription2();
        empty.closed = true;
        return empty;
      })();
      return Subscription2;
    })();
    exports.Subscription = Subscription;
    exports.EMPTY_SUBSCRIPTION = Subscription.EMPTY;
    function isSubscription(value) {
      return value instanceof Subscription || value && "closed" in value && isFunction_1.isFunction(value.remove) && isFunction_1.isFunction(value.add) && isFunction_1.isFunction(value.unsubscribe);
    }
    exports.isSubscription = isSubscription;
    function execFinalizer(finalizer) {
      if (isFunction_1.isFunction(finalizer)) {
        finalizer();
      } else {
        finalizer.unsubscribe();
      }
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/config.js
var require_config = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.config = void 0;
    exports.config = {
      onUnhandledError: null,
      onStoppedNotification: null,
      Promise: void 0,
      useDeprecatedSynchronousErrorHandling: false,
      useDeprecatedNextContext: false
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/timeoutProvider.js
var require_timeoutProvider = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/timeoutProvider.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timeoutProvider = void 0;
    exports.timeoutProvider = {
      setTimeout: function(handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
          args[_i - 2] = arguments[_i];
        }
        var delegate = exports.timeoutProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
          return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
      },
      clearTimeout: function(handle) {
        var delegate = exports.timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
      },
      delegate: void 0
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/util/reportUnhandledError.js
var require_reportUnhandledError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/reportUnhandledError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportUnhandledError = void 0;
    var config_1 = require_config();
    var timeoutProvider_1 = require_timeoutProvider();
    function reportUnhandledError(err) {
      timeoutProvider_1.timeoutProvider.setTimeout(function() {
        var onUnhandledError = config_1.config.onUnhandledError;
        if (onUnhandledError) {
          onUnhandledError(err);
        } else {
          throw err;
        }
      });
    }
    exports.reportUnhandledError = reportUnhandledError;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/noop.js
var require_noop = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/noop.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.noop = void 0;
    function noop2() {
    }
    exports.noop = noop2;
  }
});

// node_modules/rxjs/dist/cjs/internal/NotificationFactories.js
var require_NotificationFactories = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/NotificationFactories.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createNotification = exports.nextNotification = exports.errorNotification = exports.COMPLETE_NOTIFICATION = void 0;
    exports.COMPLETE_NOTIFICATION = (function() {
      return createNotification("C", void 0, void 0);
    })();
    function errorNotification(error) {
      return createNotification("E", void 0, error);
    }
    exports.errorNotification = errorNotification;
    function nextNotification(value) {
      return createNotification("N", value, void 0);
    }
    exports.nextNotification = nextNotification;
    function createNotification(kind, value, error) {
      return {
        kind,
        value,
        error
      };
    }
    exports.createNotification = createNotification;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/errorContext.js
var require_errorContext = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/errorContext.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.captureError = exports.errorContext = void 0;
    var config_1 = require_config();
    var context = null;
    function errorContext(cb) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        var isRoot = !context;
        if (isRoot) {
          context = { errorThrown: false, error: null };
        }
        cb();
        if (isRoot) {
          var _a = context, errorThrown = _a.errorThrown, error = _a.error;
          context = null;
          if (errorThrown) {
            throw error;
          }
        }
      } else {
        cb();
      }
    }
    exports.errorContext = errorContext;
    function captureError(err) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling && context) {
        context.errorThrown = true;
        context.error = err;
      }
    }
    exports.captureError = captureError;
  }
});

// node_modules/rxjs/dist/cjs/internal/Subscriber.js
var require_Subscriber = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Subscriber.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EMPTY_OBSERVER = exports.SafeSubscriber = exports.Subscriber = void 0;
    var isFunction_1 = require_isFunction();
    var Subscription_1 = require_Subscription();
    var config_1 = require_config();
    var reportUnhandledError_1 = require_reportUnhandledError();
    var noop_1 = require_noop();
    var NotificationFactories_1 = require_NotificationFactories();
    var timeoutProvider_1 = require_timeoutProvider();
    var errorContext_1 = require_errorContext();
    var Subscriber = (function(_super) {
      __extends(Subscriber2, _super);
      function Subscriber2(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
          _this.destination = destination;
          if (Subscription_1.isSubscription(destination)) {
            destination.add(_this);
          }
        } else {
          _this.destination = exports.EMPTY_OBSERVER;
        }
        return _this;
      }
      Subscriber2.create = function(next, error, complete) {
        return new SafeSubscriber(next, error, complete);
      };
      Subscriber2.prototype.next = function(value) {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.nextNotification(value), this);
        } else {
          this._next(value);
        }
      };
      Subscriber2.prototype.error = function(err) {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.errorNotification(err), this);
        } else {
          this.isStopped = true;
          this._error(err);
        }
      };
      Subscriber2.prototype.complete = function() {
        if (this.isStopped) {
          handleStoppedNotification(NotificationFactories_1.COMPLETE_NOTIFICATION, this);
        } else {
          this.isStopped = true;
          this._complete();
        }
      };
      Subscriber2.prototype.unsubscribe = function() {
        if (!this.closed) {
          this.isStopped = true;
          _super.prototype.unsubscribe.call(this);
          this.destination = null;
        }
      };
      Subscriber2.prototype._next = function(value) {
        this.destination.next(value);
      };
      Subscriber2.prototype._error = function(err) {
        try {
          this.destination.error(err);
        } finally {
          this.unsubscribe();
        }
      };
      Subscriber2.prototype._complete = function() {
        try {
          this.destination.complete();
        } finally {
          this.unsubscribe();
        }
      };
      return Subscriber2;
    })(Subscription_1.Subscription);
    exports.Subscriber = Subscriber;
    var _bind = Function.prototype.bind;
    function bind(fn, thisArg) {
      return _bind.call(fn, thisArg);
    }
    var ConsumerObserver = (function() {
      function ConsumerObserver2(partialObserver) {
        this.partialObserver = partialObserver;
      }
      ConsumerObserver2.prototype.next = function(value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
          try {
            partialObserver.next(value);
          } catch (error) {
            handleUnhandledError(error);
          }
        }
      };
      ConsumerObserver2.prototype.error = function(err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
          try {
            partialObserver.error(err);
          } catch (error) {
            handleUnhandledError(error);
          }
        } else {
          handleUnhandledError(err);
        }
      };
      ConsumerObserver2.prototype.complete = function() {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
          try {
            partialObserver.complete();
          } catch (error) {
            handleUnhandledError(error);
          }
        }
      };
      return ConsumerObserver2;
    })();
    var SafeSubscriber = (function(_super) {
      __extends(SafeSubscriber2, _super);
      function SafeSubscriber2(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction_1.isFunction(observerOrNext) || !observerOrNext) {
          partialObserver = {
            next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
            error: error !== null && error !== void 0 ? error : void 0,
            complete: complete !== null && complete !== void 0 ? complete : void 0
          };
        } else {
          var context_1;
          if (_this && config_1.config.useDeprecatedNextContext) {
            context_1 = Object.create(observerOrNext);
            context_1.unsubscribe = function() {
              return _this.unsubscribe();
            };
            partialObserver = {
              next: observerOrNext.next && bind(observerOrNext.next, context_1),
              error: observerOrNext.error && bind(observerOrNext.error, context_1),
              complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
            };
          } else {
            partialObserver = observerOrNext;
          }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
      }
      return SafeSubscriber2;
    })(Subscriber);
    exports.SafeSubscriber = SafeSubscriber;
    function handleUnhandledError(error) {
      if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        errorContext_1.captureError(error);
      } else {
        reportUnhandledError_1.reportUnhandledError(error);
      }
    }
    function defaultErrorHandler(err) {
      throw err;
    }
    function handleStoppedNotification(notification, subscriber) {
      var onStoppedNotification = config_1.config.onStoppedNotification;
      onStoppedNotification && timeoutProvider_1.timeoutProvider.setTimeout(function() {
        return onStoppedNotification(notification, subscriber);
      });
    }
    exports.EMPTY_OBSERVER = {
      closed: true,
      next: noop_1.noop,
      error: defaultErrorHandler,
      complete: noop_1.noop
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/symbol/observable.js
var require_observable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/symbol/observable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.observable = void 0;
    exports.observable = (function() {
      return typeof Symbol === "function" && Symbol.observable || "@@observable";
    })();
  }
});

// node_modules/rxjs/dist/cjs/internal/util/identity.js
var require_identity = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/identity.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.identity = void 0;
    function identity(x) {
      return x;
    }
    exports.identity = identity;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/pipe.js
var require_pipe = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/pipe.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pipeFromArray = exports.pipe = void 0;
    var identity_1 = require_identity();
    function pipe() {
      var fns = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
      }
      return pipeFromArray(fns);
    }
    exports.pipe = pipe;
    function pipeFromArray(fns) {
      if (fns.length === 0) {
        return identity_1.identity;
      }
      if (fns.length === 1) {
        return fns[0];
      }
      return function piped(input) {
        return fns.reduce(function(prev, fn) {
          return fn(prev);
        }, input);
      };
    }
    exports.pipeFromArray = pipeFromArray;
  }
});

// node_modules/rxjs/dist/cjs/internal/Observable.js
var require_Observable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Observable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Observable = void 0;
    var Subscriber_1 = require_Subscriber();
    var Subscription_1 = require_Subscription();
    var observable_1 = require_observable();
    var pipe_1 = require_pipe();
    var config_1 = require_config();
    var isFunction_1 = require_isFunction();
    var errorContext_1 = require_errorContext();
    var Observable2 = (function() {
      function Observable3(subscribe) {
        if (subscribe) {
          this._subscribe = subscribe;
        }
      }
      Observable3.prototype.lift = function(operator) {
        var observable = new Observable3();
        observable.source = this;
        observable.operator = operator;
        return observable;
      };
      Observable3.prototype.subscribe = function(observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new Subscriber_1.SafeSubscriber(observerOrNext, error, complete);
        errorContext_1.errorContext(function() {
          var _a = _this, operator = _a.operator, source = _a.source;
          subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
        });
        return subscriber;
      };
      Observable3.prototype._trySubscribe = function(sink) {
        try {
          return this._subscribe(sink);
        } catch (err) {
          sink.error(err);
        }
      };
      Observable3.prototype.forEach = function(next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function(resolve, reject) {
          var subscriber = new Subscriber_1.SafeSubscriber({
            next: function(value) {
              try {
                next(value);
              } catch (err) {
                reject(err);
                subscriber.unsubscribe();
              }
            },
            error: reject,
            complete: resolve
          });
          _this.subscribe(subscriber);
        });
      };
      Observable3.prototype._subscribe = function(subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
      };
      Observable3.prototype[observable_1.observable] = function() {
        return this;
      };
      Observable3.prototype.pipe = function() {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          operations[_i] = arguments[_i];
        }
        return pipe_1.pipeFromArray(operations)(this);
      };
      Observable3.prototype.toPromise = function(promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function(resolve, reject) {
          var value;
          _this.subscribe(function(x) {
            return value = x;
          }, function(err) {
            return reject(err);
          }, function() {
            return resolve(value);
          });
        });
      };
      Observable3.create = function(subscribe) {
        return new Observable3(subscribe);
      };
      return Observable3;
    })();
    exports.Observable = Observable2;
    function getPromiseCtor(promiseCtor) {
      var _a;
      return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config_1.config.Promise) !== null && _a !== void 0 ? _a : Promise;
    }
    function isObserver(value) {
      return value && isFunction_1.isFunction(value.next) && isFunction_1.isFunction(value.error) && isFunction_1.isFunction(value.complete);
    }
    function isSubscriber(value) {
      return value && value instanceof Subscriber_1.Subscriber || isObserver(value) && Subscription_1.isSubscription(value);
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/util/lift.js
var require_lift = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/lift.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.operate = exports.hasLift = void 0;
    var isFunction_1 = require_isFunction();
    function hasLift(source) {
      return isFunction_1.isFunction(source === null || source === void 0 ? void 0 : source.lift);
    }
    exports.hasLift = hasLift;
    function operate(init) {
      return function(source) {
        if (hasLift(source)) {
          return source.lift(function(liftedSource) {
            try {
              return init(liftedSource, this);
            } catch (err) {
              this.error(err);
            }
          });
        }
        throw new TypeError("Unable to lift unknown Observable type");
      };
    }
    exports.operate = operate;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/OperatorSubscriber.js
var require_OperatorSubscriber = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/OperatorSubscriber.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OperatorSubscriber = exports.createOperatorSubscriber = void 0;
    var Subscriber_1 = require_Subscriber();
    function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
      return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
    }
    exports.createOperatorSubscriber = createOperatorSubscriber;
    var OperatorSubscriber = (function(_super) {
      __extends(OperatorSubscriber2, _super);
      function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext ? function(value) {
          try {
            onNext(value);
          } catch (err) {
            destination.error(err);
          }
        } : _super.prototype._next;
        _this._error = onError ? function(err) {
          try {
            onError(err);
          } catch (err2) {
            destination.error(err2);
          } finally {
            this.unsubscribe();
          }
        } : _super.prototype._error;
        _this._complete = onComplete ? function() {
          try {
            onComplete();
          } catch (err) {
            destination.error(err);
          } finally {
            this.unsubscribe();
          }
        } : _super.prototype._complete;
        return _this;
      }
      OperatorSubscriber2.prototype.unsubscribe = function() {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
          var closed_1 = this.closed;
          _super.prototype.unsubscribe.call(this);
          !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
      };
      return OperatorSubscriber2;
    })(Subscriber_1.Subscriber);
    exports.OperatorSubscriber = OperatorSubscriber;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/refCount.js
var require_refCount = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/refCount.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.refCount = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function refCount() {
      return lift_1.operate(function(source, subscriber) {
        var connection = null;
        source._refCount++;
        var refCounter = OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, void 0, void 0, function() {
          if (!source || source._refCount <= 0 || 0 < --source._refCount) {
            connection = null;
            return;
          }
          var sharedConnection = source._connection;
          var conn = connection;
          connection = null;
          if (sharedConnection && (!conn || sharedConnection === conn)) {
            sharedConnection.unsubscribe();
          }
          subscriber.unsubscribe();
        });
        source.subscribe(refCounter);
        if (!refCounter.closed) {
          connection = source.connect();
        }
      });
    }
    exports.refCount = refCount;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/ConnectableObservable.js
var require_ConnectableObservable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/ConnectableObservable.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConnectableObservable = void 0;
    var Observable_1 = require_Observable();
    var Subscription_1 = require_Subscription();
    var refCount_1 = require_refCount();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var lift_1 = require_lift();
    var ConnectableObservable = (function(_super) {
      __extends(ConnectableObservable2, _super);
      function ConnectableObservable2(source, subjectFactory) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subjectFactory = subjectFactory;
        _this._subject = null;
        _this._refCount = 0;
        _this._connection = null;
        if (lift_1.hasLift(source)) {
          _this.lift = source.lift;
        }
        return _this;
      }
      ConnectableObservable2.prototype._subscribe = function(subscriber) {
        return this.getSubject().subscribe(subscriber);
      };
      ConnectableObservable2.prototype.getSubject = function() {
        var subject = this._subject;
        if (!subject || subject.isStopped) {
          this._subject = this.subjectFactory();
        }
        return this._subject;
      };
      ConnectableObservable2.prototype._teardown = function() {
        this._refCount = 0;
        var _connection = this._connection;
        this._subject = this._connection = null;
        _connection === null || _connection === void 0 ? void 0 : _connection.unsubscribe();
      };
      ConnectableObservable2.prototype.connect = function() {
        var _this = this;
        var connection = this._connection;
        if (!connection) {
          connection = this._connection = new Subscription_1.Subscription();
          var subject_1 = this.getSubject();
          connection.add(this.source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subject_1, void 0, function() {
            _this._teardown();
            subject_1.complete();
          }, function(err) {
            _this._teardown();
            subject_1.error(err);
          }, function() {
            return _this._teardown();
          })));
          if (connection.closed) {
            this._connection = null;
            connection = Subscription_1.Subscription.EMPTY;
          }
        }
        return connection;
      };
      ConnectableObservable2.prototype.refCount = function() {
        return refCount_1.refCount()(this);
      };
      return ConnectableObservable2;
    })(Observable_1.Observable);
    exports.ConnectableObservable = ConnectableObservable;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/performanceTimestampProvider.js
var require_performanceTimestampProvider = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/performanceTimestampProvider.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.performanceTimestampProvider = void 0;
    exports.performanceTimestampProvider = {
      now: function() {
        return (exports.performanceTimestampProvider.delegate || performance).now();
      },
      delegate: void 0
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/animationFrameProvider.js
var require_animationFrameProvider = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/animationFrameProvider.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.animationFrameProvider = void 0;
    var Subscription_1 = require_Subscription();
    exports.animationFrameProvider = {
      schedule: function(callback) {
        var request = requestAnimationFrame;
        var cancel = cancelAnimationFrame;
        var delegate = exports.animationFrameProvider.delegate;
        if (delegate) {
          request = delegate.requestAnimationFrame;
          cancel = delegate.cancelAnimationFrame;
        }
        var handle = request(function(timestamp) {
          cancel = void 0;
          callback(timestamp);
        });
        return new Subscription_1.Subscription(function() {
          return cancel === null || cancel === void 0 ? void 0 : cancel(handle);
        });
      },
      requestAnimationFrame: function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var delegate = exports.animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.requestAnimationFrame) || requestAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
      },
      cancelAnimationFrame: function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var delegate = exports.animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.cancelAnimationFrame) || cancelAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
      },
      delegate: void 0
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/dom/animationFrames.js
var require_animationFrames = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/dom/animationFrames.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.animationFrames = void 0;
    var Observable_1 = require_Observable();
    var performanceTimestampProvider_1 = require_performanceTimestampProvider();
    var animationFrameProvider_1 = require_animationFrameProvider();
    function animationFrames(timestampProvider) {
      return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
    }
    exports.animationFrames = animationFrames;
    function animationFramesFactory(timestampProvider) {
      return new Observable_1.Observable(function(subscriber) {
        var provider = timestampProvider || performanceTimestampProvider_1.performanceTimestampProvider;
        var start = provider.now();
        var id = 0;
        var run = function() {
          if (!subscriber.closed) {
            id = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function(timestamp) {
              id = 0;
              var now = provider.now();
              subscriber.next({
                timestamp: timestampProvider ? now : timestamp,
                elapsed: now - start
              });
              run();
            });
          }
        };
        run();
        return function() {
          if (id) {
            animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
          }
        };
      });
    }
    var DEFAULT_ANIMATION_FRAMES = animationFramesFactory();
  }
});

// node_modules/rxjs/dist/cjs/internal/util/ObjectUnsubscribedError.js
var require_ObjectUnsubscribedError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/ObjectUnsubscribedError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectUnsubscribedError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports.ObjectUnsubscribedError = createErrorClass_1.createErrorClass(function(_super) {
      return function ObjectUnsubscribedErrorImpl() {
        _super(this);
        this.name = "ObjectUnsubscribedError";
        this.message = "object unsubscribed";
      };
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/Subject.js
var require_Subject = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Subject.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnonymousSubject = exports.Subject = void 0;
    var Observable_1 = require_Observable();
    var Subscription_1 = require_Subscription();
    var ObjectUnsubscribedError_1 = require_ObjectUnsubscribedError();
    var arrRemove_1 = require_arrRemove();
    var errorContext_1 = require_errorContext();
    var Subject = (function(_super) {
      __extends(Subject2, _super);
      function Subject2() {
        var _this = _super.call(this) || this;
        _this.closed = false;
        _this.currentObservers = null;
        _this.observers = [];
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
      }
      Subject2.prototype.lift = function(operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
      };
      Subject2.prototype._throwIfClosed = function() {
        if (this.closed) {
          throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
      };
      Subject2.prototype.next = function(value) {
        var _this = this;
        errorContext_1.errorContext(function() {
          var e_1, _a;
          _this._throwIfClosed();
          if (!_this.isStopped) {
            if (!_this.currentObservers) {
              _this.currentObservers = Array.from(_this.observers);
            }
            try {
              for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var observer = _c.value;
                observer.next(value);
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
              } finally {
                if (e_1) throw e_1.error;
              }
            }
          }
        });
      };
      Subject2.prototype.error = function(err) {
        var _this = this;
        errorContext_1.errorContext(function() {
          _this._throwIfClosed();
          if (!_this.isStopped) {
            _this.hasError = _this.isStopped = true;
            _this.thrownError = err;
            var observers = _this.observers;
            while (observers.length) {
              observers.shift().error(err);
            }
          }
        });
      };
      Subject2.prototype.complete = function() {
        var _this = this;
        errorContext_1.errorContext(function() {
          _this._throwIfClosed();
          if (!_this.isStopped) {
            _this.isStopped = true;
            var observers = _this.observers;
            while (observers.length) {
              observers.shift().complete();
            }
          }
        });
      };
      Subject2.prototype.unsubscribe = function() {
        this.isStopped = this.closed = true;
        this.observers = this.currentObservers = null;
      };
      Object.defineProperty(Subject2.prototype, "observed", {
        get: function() {
          var _a;
          return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
        },
        enumerable: false,
        configurable: true
      });
      Subject2.prototype._trySubscribe = function(subscriber) {
        this._throwIfClosed();
        return _super.prototype._trySubscribe.call(this, subscriber);
      };
      Subject2.prototype._subscribe = function(subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
      };
      Subject2.prototype._innerSubscribe = function(subscriber) {
        var _this = this;
        var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
        if (hasError || isStopped) {
          return Subscription_1.EMPTY_SUBSCRIPTION;
        }
        this.currentObservers = null;
        observers.push(subscriber);
        return new Subscription_1.Subscription(function() {
          _this.currentObservers = null;
          arrRemove_1.arrRemove(observers, subscriber);
        });
      };
      Subject2.prototype._checkFinalizedStatuses = function(subscriber) {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
          subscriber.error(thrownError);
        } else if (isStopped) {
          subscriber.complete();
        }
      };
      Subject2.prototype.asObservable = function() {
        var observable = new Observable_1.Observable();
        observable.source = this;
        return observable;
      };
      Subject2.create = function(destination, source) {
        return new AnonymousSubject(destination, source);
      };
      return Subject2;
    })(Observable_1.Observable);
    exports.Subject = Subject;
    var AnonymousSubject = (function(_super) {
      __extends(AnonymousSubject2, _super);
      function AnonymousSubject2(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
      }
      AnonymousSubject2.prototype.next = function(value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
      };
      AnonymousSubject2.prototype.error = function(err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
      };
      AnonymousSubject2.prototype.complete = function() {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
      };
      AnonymousSubject2.prototype._subscribe = function(subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : Subscription_1.EMPTY_SUBSCRIPTION;
      };
      return AnonymousSubject2;
    })(Subject);
    exports.AnonymousSubject = AnonymousSubject;
  }
});

// node_modules/rxjs/dist/cjs/internal/BehaviorSubject.js
var require_BehaviorSubject = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/BehaviorSubject.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BehaviorSubject = void 0;
    var Subject_1 = require_Subject();
    var BehaviorSubject2 = (function(_super) {
      __extends(BehaviorSubject3, _super);
      function BehaviorSubject3(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
      }
      Object.defineProperty(BehaviorSubject3.prototype, "value", {
        get: function() {
          return this.getValue();
        },
        enumerable: false,
        configurable: true
      });
      BehaviorSubject3.prototype._subscribe = function(subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
      };
      BehaviorSubject3.prototype.getValue = function() {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
        if (hasError) {
          throw thrownError;
        }
        this._throwIfClosed();
        return _value;
      };
      BehaviorSubject3.prototype.next = function(value) {
        _super.prototype.next.call(this, this._value = value);
      };
      return BehaviorSubject3;
    })(Subject_1.Subject);
    exports.BehaviorSubject = BehaviorSubject2;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/dateTimestampProvider.js
var require_dateTimestampProvider = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/dateTimestampProvider.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dateTimestampProvider = void 0;
    exports.dateTimestampProvider = {
      now: function() {
        return (exports.dateTimestampProvider.delegate || Date).now();
      },
      delegate: void 0
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/ReplaySubject.js
var require_ReplaySubject = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/ReplaySubject.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplaySubject = void 0;
    var Subject_1 = require_Subject();
    var dateTimestampProvider_1 = require_dateTimestampProvider();
    var ReplaySubject = (function(_super) {
      __extends(ReplaySubject2, _super);
      function ReplaySubject2(_bufferSize, _windowTime, _timestampProvider) {
        if (_bufferSize === void 0) {
          _bufferSize = Infinity;
        }
        if (_windowTime === void 0) {
          _windowTime = Infinity;
        }
        if (_timestampProvider === void 0) {
          _timestampProvider = dateTimestampProvider_1.dateTimestampProvider;
        }
        var _this = _super.call(this) || this;
        _this._bufferSize = _bufferSize;
        _this._windowTime = _windowTime;
        _this._timestampProvider = _timestampProvider;
        _this._buffer = [];
        _this._infiniteTimeWindow = true;
        _this._infiniteTimeWindow = _windowTime === Infinity;
        _this._bufferSize = Math.max(1, _bufferSize);
        _this._windowTime = Math.max(1, _windowTime);
        return _this;
      }
      ReplaySubject2.prototype.next = function(value) {
        var _a = this, isStopped = _a.isStopped, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow, _timestampProvider = _a._timestampProvider, _windowTime = _a._windowTime;
        if (!isStopped) {
          _buffer.push(value);
          !_infiniteTimeWindow && _buffer.push(_timestampProvider.now() + _windowTime);
        }
        this._trimBuffer();
        _super.prototype.next.call(this, value);
      };
      ReplaySubject2.prototype._subscribe = function(subscriber) {
        this._throwIfClosed();
        this._trimBuffer();
        var subscription = this._innerSubscribe(subscriber);
        var _a = this, _infiniteTimeWindow = _a._infiniteTimeWindow, _buffer = _a._buffer;
        var copy = _buffer.slice();
        for (var i = 0; i < copy.length && !subscriber.closed; i += _infiniteTimeWindow ? 1 : 2) {
          subscriber.next(copy[i]);
        }
        this._checkFinalizedStatuses(subscriber);
        return subscription;
      };
      ReplaySubject2.prototype._trimBuffer = function() {
        var _a = this, _bufferSize = _a._bufferSize, _timestampProvider = _a._timestampProvider, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow;
        var adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
        _bufferSize < Infinity && adjustedBufferSize < _buffer.length && _buffer.splice(0, _buffer.length - adjustedBufferSize);
        if (!_infiniteTimeWindow) {
          var now = _timestampProvider.now();
          var last = 0;
          for (var i = 1; i < _buffer.length && _buffer[i] <= now; i += 2) {
            last = i;
          }
          last && _buffer.splice(0, last + 1);
        }
      };
      return ReplaySubject2;
    })(Subject_1.Subject);
    exports.ReplaySubject = ReplaySubject;
  }
});

// node_modules/rxjs/dist/cjs/internal/AsyncSubject.js
var require_AsyncSubject = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/AsyncSubject.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsyncSubject = void 0;
    var Subject_1 = require_Subject();
    var AsyncSubject = (function(_super) {
      __extends(AsyncSubject2, _super);
      function AsyncSubject2() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._value = null;
        _this._hasValue = false;
        _this._isComplete = false;
        return _this;
      }
      AsyncSubject2.prototype._checkFinalizedStatuses = function(subscriber) {
        var _a = this, hasError = _a.hasError, _hasValue = _a._hasValue, _value = _a._value, thrownError = _a.thrownError, isStopped = _a.isStopped, _isComplete = _a._isComplete;
        if (hasError) {
          subscriber.error(thrownError);
        } else if (isStopped || _isComplete) {
          _hasValue && subscriber.next(_value);
          subscriber.complete();
        }
      };
      AsyncSubject2.prototype.next = function(value) {
        if (!this.isStopped) {
          this._value = value;
          this._hasValue = true;
        }
      };
      AsyncSubject2.prototype.complete = function() {
        var _a = this, _hasValue = _a._hasValue, _value = _a._value, _isComplete = _a._isComplete;
        if (!_isComplete) {
          this._isComplete = true;
          _hasValue && _super.prototype.next.call(this, _value);
          _super.prototype.complete.call(this);
        }
      };
      return AsyncSubject2;
    })(Subject_1.Subject);
    exports.AsyncSubject = AsyncSubject;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/Action.js
var require_Action = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/Action.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Action = void 0;
    var Subscription_1 = require_Subscription();
    var Action = (function(_super) {
      __extends(Action2, _super);
      function Action2(scheduler, work) {
        return _super.call(this) || this;
      }
      Action2.prototype.schedule = function(state, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        return this;
      };
      return Action2;
    })(Subscription_1.Subscription);
    exports.Action = Action;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/intervalProvider.js
var require_intervalProvider = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/intervalProvider.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.intervalProvider = void 0;
    exports.intervalProvider = {
      setInterval: function(handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
          args[_i - 2] = arguments[_i];
        }
        var delegate = exports.intervalProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setInterval) {
          return delegate.setInterval.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setInterval.apply(void 0, __spreadArray([handler, timeout], __read(args)));
      },
      clearInterval: function(handle) {
        var delegate = exports.intervalProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearInterval) || clearInterval)(handle);
      },
      delegate: void 0
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsyncAction.js
var require_AsyncAction = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/AsyncAction.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsyncAction = void 0;
    var Action_1 = require_Action();
    var intervalProvider_1 = require_intervalProvider();
    var arrRemove_1 = require_arrRemove();
    var AsyncAction = (function(_super) {
      __extends(AsyncAction2, _super);
      function AsyncAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.pending = false;
        return _this;
      }
      AsyncAction2.prototype.schedule = function(state, delay) {
        var _a;
        if (delay === void 0) {
          delay = 0;
        }
        if (this.closed) {
          return this;
        }
        this.state = state;
        var id = this.id;
        var scheduler = this.scheduler;
        if (id != null) {
          this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.pending = true;
        this.delay = delay;
        this.id = (_a = this.id) !== null && _a !== void 0 ? _a : this.requestAsyncId(scheduler, this.id, delay);
        return this;
      };
      AsyncAction2.prototype.requestAsyncId = function(scheduler, _id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        return intervalProvider_1.intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
      };
      AsyncAction2.prototype.recycleAsyncId = function(_scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null && this.delay === delay && this.pending === false) {
          return id;
        }
        if (id != null) {
          intervalProvider_1.intervalProvider.clearInterval(id);
        }
        return void 0;
      };
      AsyncAction2.prototype.execute = function(state, delay) {
        if (this.closed) {
          return new Error("executing a cancelled action");
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
          return error;
        } else if (this.pending === false && this.id != null) {
          this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
      };
      AsyncAction2.prototype._execute = function(state, _delay) {
        var errored = false;
        var errorValue;
        try {
          this.work(state);
        } catch (e) {
          errored = true;
          errorValue = e ? e : new Error("Scheduled action threw falsy error");
        }
        if (errored) {
          this.unsubscribe();
          return errorValue;
        }
      };
      AsyncAction2.prototype.unsubscribe = function() {
        if (!this.closed) {
          var _a = this, id = _a.id, scheduler = _a.scheduler;
          var actions = scheduler.actions;
          this.work = this.state = this.scheduler = null;
          this.pending = false;
          arrRemove_1.arrRemove(actions, this);
          if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, null);
          }
          this.delay = null;
          _super.prototype.unsubscribe.call(this);
        }
      };
      return AsyncAction2;
    })(Action_1.Action);
    exports.AsyncAction = AsyncAction;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/Immediate.js
var require_Immediate = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/Immediate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestTools = exports.Immediate = void 0;
    var nextHandle = 1;
    var resolved;
    var activeHandles = {};
    function findAndClearHandle(handle) {
      if (handle in activeHandles) {
        delete activeHandles[handle];
        return true;
      }
      return false;
    }
    exports.Immediate = {
      setImmediate: function(cb) {
        var handle = nextHandle++;
        activeHandles[handle] = true;
        if (!resolved) {
          resolved = Promise.resolve();
        }
        resolved.then(function() {
          return findAndClearHandle(handle) && cb();
        });
        return handle;
      },
      clearImmediate: function(handle) {
        findAndClearHandle(handle);
      }
    };
    exports.TestTools = {
      pending: function() {
        return Object.keys(activeHandles).length;
      }
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/immediateProvider.js
var require_immediateProvider = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/immediateProvider.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.immediateProvider = void 0;
    var Immediate_1 = require_Immediate();
    var setImmediate = Immediate_1.Immediate.setImmediate;
    var clearImmediate = Immediate_1.Immediate.clearImmediate;
    exports.immediateProvider = {
      setImmediate: function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var delegate = exports.immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.setImmediate) || setImmediate).apply(void 0, __spreadArray([], __read(args)));
      },
      clearImmediate: function(handle) {
        var delegate = exports.immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearImmediate) || clearImmediate)(handle);
      },
      delegate: void 0
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsapAction.js
var require_AsapAction = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/AsapAction.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsapAction = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var immediateProvider_1 = require_immediateProvider();
    var AsapAction = (function(_super) {
      __extends(AsapAction2, _super);
      function AsapAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
      }
      AsapAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay !== null && delay > 0) {
          return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler._scheduled || (scheduler._scheduled = immediateProvider_1.immediateProvider.setImmediate(scheduler.flush.bind(scheduler, void 0)));
      };
      AsapAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
        var _a;
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null ? delay > 0 : this.delay > 0) {
          return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        var actions = scheduler.actions;
        if (id != null && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
          immediateProvider_1.immediateProvider.clearImmediate(id);
          if (scheduler._scheduled === id) {
            scheduler._scheduled = void 0;
          }
        }
        return void 0;
      };
      return AsapAction2;
    })(AsyncAction_1.AsyncAction);
    exports.AsapAction = AsapAction;
  }
});

// node_modules/rxjs/dist/cjs/internal/Scheduler.js
var require_Scheduler = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Scheduler.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scheduler = void 0;
    var dateTimestampProvider_1 = require_dateTimestampProvider();
    var Scheduler = (function() {
      function Scheduler2(schedulerActionCtor, now) {
        if (now === void 0) {
          now = Scheduler2.now;
        }
        this.schedulerActionCtor = schedulerActionCtor;
        this.now = now;
      }
      Scheduler2.prototype.schedule = function(work, delay, state) {
        if (delay === void 0) {
          delay = 0;
        }
        return new this.schedulerActionCtor(this, work).schedule(state, delay);
      };
      Scheduler2.now = dateTimestampProvider_1.dateTimestampProvider.now;
      return Scheduler2;
    })();
    exports.Scheduler = Scheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsyncScheduler.js
var require_AsyncScheduler = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/AsyncScheduler.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsyncScheduler = void 0;
    var Scheduler_1 = require_Scheduler();
    var AsyncScheduler = (function(_super) {
      __extends(AsyncScheduler2, _super);
      function AsyncScheduler2(SchedulerAction, now) {
        if (now === void 0) {
          now = Scheduler_1.Scheduler.now;
        }
        var _this = _super.call(this, SchedulerAction, now) || this;
        _this.actions = [];
        _this._active = false;
        return _this;
      }
      AsyncScheduler2.prototype.flush = function(action) {
        var actions = this.actions;
        if (this._active) {
          actions.push(action);
          return;
        }
        var error;
        this._active = true;
        do {
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        } while (action = actions.shift());
        this._active = false;
        if (error) {
          while (action = actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      return AsyncScheduler2;
    })(Scheduler_1.Scheduler);
    exports.AsyncScheduler = AsyncScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsapScheduler.js
var require_AsapScheduler = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/AsapScheduler.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsapScheduler = void 0;
    var AsyncScheduler_1 = require_AsyncScheduler();
    var AsapScheduler = (function(_super) {
      __extends(AsapScheduler2, _super);
      function AsapScheduler2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      AsapScheduler2.prototype.flush = function(action) {
        this._active = true;
        var flushId = this._scheduled;
        this._scheduled = void 0;
        var actions = this.actions;
        var error;
        action = action || actions.shift();
        do {
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        } while ((action = actions[0]) && action.id === flushId && actions.shift());
        this._active = false;
        if (error) {
          while ((action = actions[0]) && action.id === flushId && actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      return AsapScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports.AsapScheduler = AsapScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/asap.js
var require_asap = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/asap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.asap = exports.asapScheduler = void 0;
    var AsapAction_1 = require_AsapAction();
    var AsapScheduler_1 = require_AsapScheduler();
    exports.asapScheduler = new AsapScheduler_1.AsapScheduler(AsapAction_1.AsapAction);
    exports.asap = exports.asapScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/async.js
var require_async = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/async.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.async = exports.asyncScheduler = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var AsyncScheduler_1 = require_AsyncScheduler();
    exports.asyncScheduler = new AsyncScheduler_1.AsyncScheduler(AsyncAction_1.AsyncAction);
    exports.async = exports.asyncScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/QueueAction.js
var require_QueueAction = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/QueueAction.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueueAction = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var QueueAction = (function(_super) {
      __extends(QueueAction2, _super);
      function QueueAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
      }
      QueueAction2.prototype.schedule = function(state, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay > 0) {
          return _super.prototype.schedule.call(this, state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
      };
      QueueAction2.prototype.execute = function(state, delay) {
        return delay > 0 || this.closed ? _super.prototype.execute.call(this, state, delay) : this._execute(state, delay);
      };
      QueueAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null && delay > 0 || delay == null && this.delay > 0) {
          return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.flush(this);
        return 0;
      };
      return QueueAction2;
    })(AsyncAction_1.AsyncAction);
    exports.QueueAction = QueueAction;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/QueueScheduler.js
var require_QueueScheduler = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/QueueScheduler.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueueScheduler = void 0;
    var AsyncScheduler_1 = require_AsyncScheduler();
    var QueueScheduler = (function(_super) {
      __extends(QueueScheduler2, _super);
      function QueueScheduler2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      return QueueScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports.QueueScheduler = QueueScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/queue.js
var require_queue = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/queue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.queue = exports.queueScheduler = void 0;
    var QueueAction_1 = require_QueueAction();
    var QueueScheduler_1 = require_QueueScheduler();
    exports.queueScheduler = new QueueScheduler_1.QueueScheduler(QueueAction_1.QueueAction);
    exports.queue = exports.queueScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameAction.js
var require_AnimationFrameAction = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameAction.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnimationFrameAction = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var animationFrameProvider_1 = require_animationFrameProvider();
    var AnimationFrameAction = (function(_super) {
      __extends(AnimationFrameAction2, _super);
      function AnimationFrameAction2(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
      }
      AnimationFrameAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (delay !== null && delay > 0) {
          return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler._scheduled || (scheduler._scheduled = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function() {
          return scheduler.flush(void 0);
        }));
      };
      AnimationFrameAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
        var _a;
        if (delay === void 0) {
          delay = 0;
        }
        if (delay != null ? delay > 0 : this.delay > 0) {
          return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        var actions = scheduler.actions;
        if (id != null && id === scheduler._scheduled && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
          animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
          scheduler._scheduled = void 0;
        }
        return void 0;
      };
      return AnimationFrameAction2;
    })(AsyncAction_1.AsyncAction);
    exports.AnimationFrameAction = AnimationFrameAction;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameScheduler.js
var require_AnimationFrameScheduler = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameScheduler.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnimationFrameScheduler = void 0;
    var AsyncScheduler_1 = require_AsyncScheduler();
    var AnimationFrameScheduler = (function(_super) {
      __extends(AnimationFrameScheduler2, _super);
      function AnimationFrameScheduler2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      AnimationFrameScheduler2.prototype.flush = function(action) {
        this._active = true;
        var flushId;
        if (action) {
          flushId = action.id;
        } else {
          flushId = this._scheduled;
          this._scheduled = void 0;
        }
        var actions = this.actions;
        var error;
        action = action || actions.shift();
        do {
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        } while ((action = actions[0]) && action.id === flushId && actions.shift());
        this._active = false;
        if (error) {
          while ((action = actions[0]) && action.id === flushId && actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      return AnimationFrameScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports.AnimationFrameScheduler = AnimationFrameScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/animationFrame.js
var require_animationFrame = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/animationFrame.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.animationFrame = exports.animationFrameScheduler = void 0;
    var AnimationFrameAction_1 = require_AnimationFrameAction();
    var AnimationFrameScheduler_1 = require_AnimationFrameScheduler();
    exports.animationFrameScheduler = new AnimationFrameScheduler_1.AnimationFrameScheduler(AnimationFrameAction_1.AnimationFrameAction);
    exports.animationFrame = exports.animationFrameScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduler/VirtualTimeScheduler.js
var require_VirtualTimeScheduler = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduler/VirtualTimeScheduler.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VirtualAction = exports.VirtualTimeScheduler = void 0;
    var AsyncAction_1 = require_AsyncAction();
    var Subscription_1 = require_Subscription();
    var AsyncScheduler_1 = require_AsyncScheduler();
    var VirtualTimeScheduler = (function(_super) {
      __extends(VirtualTimeScheduler2, _super);
      function VirtualTimeScheduler2(schedulerActionCtor, maxFrames) {
        if (schedulerActionCtor === void 0) {
          schedulerActionCtor = VirtualAction;
        }
        if (maxFrames === void 0) {
          maxFrames = Infinity;
        }
        var _this = _super.call(this, schedulerActionCtor, function() {
          return _this.frame;
        }) || this;
        _this.maxFrames = maxFrames;
        _this.frame = 0;
        _this.index = -1;
        return _this;
      }
      VirtualTimeScheduler2.prototype.flush = function() {
        var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
        var error;
        var action;
        while ((action = actions[0]) && action.delay <= maxFrames) {
          actions.shift();
          this.frame = action.delay;
          if (error = action.execute(action.state, action.delay)) {
            break;
          }
        }
        if (error) {
          while (action = actions.shift()) {
            action.unsubscribe();
          }
          throw error;
        }
      };
      VirtualTimeScheduler2.frameTimeFactor = 10;
      return VirtualTimeScheduler2;
    })(AsyncScheduler_1.AsyncScheduler);
    exports.VirtualTimeScheduler = VirtualTimeScheduler;
    var VirtualAction = (function(_super) {
      __extends(VirtualAction2, _super);
      function VirtualAction2(scheduler, work, index) {
        if (index === void 0) {
          index = scheduler.index += 1;
        }
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.index = index;
        _this.active = true;
        _this.index = scheduler.index = index;
        return _this;
      }
      VirtualAction2.prototype.schedule = function(state, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        if (Number.isFinite(delay)) {
          if (!this.id) {
            return _super.prototype.schedule.call(this, state, delay);
          }
          this.active = false;
          var action = new VirtualAction2(this.scheduler, this.work);
          this.add(action);
          return action.schedule(state, delay);
        } else {
          return Subscription_1.Subscription.EMPTY;
        }
      };
      VirtualAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        this.delay = scheduler.frame + delay;
        var actions = scheduler.actions;
        actions.push(this);
        actions.sort(VirtualAction2.sortActions);
        return 1;
      };
      VirtualAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
        if (delay === void 0) {
          delay = 0;
        }
        return void 0;
      };
      VirtualAction2.prototype._execute = function(state, delay) {
        if (this.active === true) {
          return _super.prototype._execute.call(this, state, delay);
        }
      };
      VirtualAction2.sortActions = function(a, b) {
        if (a.delay === b.delay) {
          if (a.index === b.index) {
            return 0;
          } else if (a.index > b.index) {
            return 1;
          } else {
            return -1;
          }
        } else if (a.delay > b.delay) {
          return 1;
        } else {
          return -1;
        }
      };
      return VirtualAction2;
    })(AsyncAction_1.AsyncAction);
    exports.VirtualAction = VirtualAction;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/empty.js
var require_empty = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/empty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.empty = exports.EMPTY = void 0;
    var Observable_1 = require_Observable();
    exports.EMPTY = new Observable_1.Observable(function(subscriber) {
      return subscriber.complete();
    });
    function empty(scheduler) {
      return scheduler ? emptyScheduled(scheduler) : exports.EMPTY;
    }
    exports.empty = empty;
    function emptyScheduled(scheduler) {
      return new Observable_1.Observable(function(subscriber) {
        return scheduler.schedule(function() {
          return subscriber.complete();
        });
      });
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isScheduler.js
var require_isScheduler = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isScheduler.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isScheduler = void 0;
    var isFunction_1 = require_isFunction();
    function isScheduler(value) {
      return value && isFunction_1.isFunction(value.schedule);
    }
    exports.isScheduler = isScheduler;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/args.js
var require_args = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/args.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.popNumber = exports.popScheduler = exports.popResultSelector = void 0;
    var isFunction_1 = require_isFunction();
    var isScheduler_1 = require_isScheduler();
    function last(arr) {
      return arr[arr.length - 1];
    }
    function popResultSelector(args) {
      return isFunction_1.isFunction(last(args)) ? args.pop() : void 0;
    }
    exports.popResultSelector = popResultSelector;
    function popScheduler(args) {
      return isScheduler_1.isScheduler(last(args)) ? args.pop() : void 0;
    }
    exports.popScheduler = popScheduler;
    function popNumber(args, defaultValue) {
      return typeof last(args) === "number" ? args.pop() : defaultValue;
    }
    exports.popNumber = popNumber;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isArrayLike.js
var require_isArrayLike = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isArrayLike.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isArrayLike = void 0;
    exports.isArrayLike = (function(x) {
      return x && typeof x.length === "number" && typeof x !== "function";
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isPromise.js
var require_isPromise = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isPromise.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isPromise = void 0;
    var isFunction_1 = require_isFunction();
    function isPromise(value) {
      return isFunction_1.isFunction(value === null || value === void 0 ? void 0 : value.then);
    }
    exports.isPromise = isPromise;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isInteropObservable.js
var require_isInteropObservable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isInteropObservable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isInteropObservable = void 0;
    var observable_1 = require_observable();
    var isFunction_1 = require_isFunction();
    function isInteropObservable(input) {
      return isFunction_1.isFunction(input[observable_1.observable]);
    }
    exports.isInteropObservable = isInteropObservable;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isAsyncIterable.js
var require_isAsyncIterable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isAsyncIterable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAsyncIterable = void 0;
    var isFunction_1 = require_isFunction();
    function isAsyncIterable(obj) {
      return Symbol.asyncIterator && isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
    }
    exports.isAsyncIterable = isAsyncIterable;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/throwUnobservableError.js
var require_throwUnobservableError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/throwUnobservableError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createInvalidObservableTypeError = void 0;
    function createInvalidObservableTypeError(input) {
      return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
    }
    exports.createInvalidObservableTypeError = createInvalidObservableTypeError;
  }
});

// node_modules/rxjs/dist/cjs/internal/symbol/iterator.js
var require_iterator = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/symbol/iterator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.iterator = exports.getSymbolIterator = void 0;
    function getSymbolIterator() {
      if (typeof Symbol !== "function" || !Symbol.iterator) {
        return "@@iterator";
      }
      return Symbol.iterator;
    }
    exports.getSymbolIterator = getSymbolIterator;
    exports.iterator = getSymbolIterator();
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isIterable.js
var require_isIterable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isIterable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isIterable = void 0;
    var iterator_1 = require_iterator();
    var isFunction_1 = require_isFunction();
    function isIterable(input) {
      return isFunction_1.isFunction(input === null || input === void 0 ? void 0 : input[iterator_1.iterator]);
    }
    exports.isIterable = isIterable;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isReadableStreamLike.js
var require_isReadableStreamLike = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isReadableStreamLike.js"(exports) {
    "use strict";
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    var __await = exports && exports.__await || function(v) {
      return this instanceof __await ? (this.v = v, this) : new __await(v);
    };
    var __asyncGenerator = exports && exports.__asyncGenerator || function(thisArg, _arguments, generator) {
      if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
      var g = generator.apply(thisArg, _arguments || []), i, q = [];
      return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
      }, i;
      function verb(n) {
        if (g[n]) i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
      }
      function resume(n, v) {
        try {
          step(g[n](v));
        } catch (e) {
          settle(q[0][3], e);
        }
      }
      function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
      }
      function fulfill(value) {
        resume("next", value);
      }
      function reject(value) {
        resume("throw", value);
      }
      function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isReadableStreamLike = exports.readableStreamLikeToAsyncGenerator = void 0;
    var isFunction_1 = require_isFunction();
    function readableStreamLikeToAsyncGenerator(readableStream) {
      return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
        var reader, _a, value, done;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              reader = readableStream.getReader();
              _b.label = 1;
            case 1:
              _b.trys.push([1, , 9, 10]);
              _b.label = 2;
            case 2:
              if (false) return [3, 8];
              return [4, __await(reader.read())];
            case 3:
              _a = _b.sent(), value = _a.value, done = _a.done;
              if (!done) return [3, 5];
              return [4, __await(void 0)];
            case 4:
              return [2, _b.sent()];
            case 5:
              return [4, __await(value)];
            case 6:
              return [4, _b.sent()];
            case 7:
              _b.sent();
              return [3, 2];
            case 8:
              return [3, 10];
            case 9:
              reader.releaseLock();
              return [7];
            case 10:
              return [2];
          }
        });
      });
    }
    exports.readableStreamLikeToAsyncGenerator = readableStreamLikeToAsyncGenerator;
    function isReadableStreamLike(obj) {
      return isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
    }
    exports.isReadableStreamLike = isReadableStreamLike;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/innerFrom.js
var require_innerFrom = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/innerFrom.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    var __asyncValues = exports && exports.__asyncValues || function(o) {
      if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
      var m = o[Symbol.asyncIterator], i;
      return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
      }, i);
      function verb(n) {
        i[n] = o[n] && function(v) {
          return new Promise(function(resolve, reject) {
            v = o[n](v), settle(resolve, reject, v.done, v.value);
          });
        };
      }
      function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v2) {
          resolve({ value: v2, done: d });
        }, reject);
      }
    };
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromReadableStreamLike = exports.fromAsyncIterable = exports.fromIterable = exports.fromPromise = exports.fromArrayLike = exports.fromInteropObservable = exports.innerFrom = void 0;
    var isArrayLike_1 = require_isArrayLike();
    var isPromise_1 = require_isPromise();
    var Observable_1 = require_Observable();
    var isInteropObservable_1 = require_isInteropObservable();
    var isAsyncIterable_1 = require_isAsyncIterable();
    var throwUnobservableError_1 = require_throwUnobservableError();
    var isIterable_1 = require_isIterable();
    var isReadableStreamLike_1 = require_isReadableStreamLike();
    var isFunction_1 = require_isFunction();
    var reportUnhandledError_1 = require_reportUnhandledError();
    var observable_1 = require_observable();
    function innerFrom(input) {
      if (input instanceof Observable_1.Observable) {
        return input;
      }
      if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
          return fromInteropObservable(input);
        }
        if (isArrayLike_1.isArrayLike(input)) {
          return fromArrayLike(input);
        }
        if (isPromise_1.isPromise(input)) {
          return fromPromise(input);
        }
        if (isAsyncIterable_1.isAsyncIterable(input)) {
          return fromAsyncIterable(input);
        }
        if (isIterable_1.isIterable(input)) {
          return fromIterable(input);
        }
        if (isReadableStreamLike_1.isReadableStreamLike(input)) {
          return fromReadableStreamLike(input);
        }
      }
      throw throwUnobservableError_1.createInvalidObservableTypeError(input);
    }
    exports.innerFrom = innerFrom;
    function fromInteropObservable(obj) {
      return new Observable_1.Observable(function(subscriber) {
        var obs = obj[observable_1.observable]();
        if (isFunction_1.isFunction(obs.subscribe)) {
          return obs.subscribe(subscriber);
        }
        throw new TypeError("Provided object does not correctly implement Symbol.observable");
      });
    }
    exports.fromInteropObservable = fromInteropObservable;
    function fromArrayLike(array) {
      return new Observable_1.Observable(function(subscriber) {
        for (var i = 0; i < array.length && !subscriber.closed; i++) {
          subscriber.next(array[i]);
        }
        subscriber.complete();
      });
    }
    exports.fromArrayLike = fromArrayLike;
    function fromPromise(promise) {
      return new Observable_1.Observable(function(subscriber) {
        promise.then(function(value) {
          if (!subscriber.closed) {
            subscriber.next(value);
            subscriber.complete();
          }
        }, function(err) {
          return subscriber.error(err);
        }).then(null, reportUnhandledError_1.reportUnhandledError);
      });
    }
    exports.fromPromise = fromPromise;
    function fromIterable(iterable) {
      return new Observable_1.Observable(function(subscriber) {
        var e_1, _a;
        try {
          for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
            var value = iterable_1_1.value;
            subscriber.next(value);
            if (subscriber.closed) {
              return;
            }
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
        subscriber.complete();
      });
    }
    exports.fromIterable = fromIterable;
    function fromAsyncIterable(asyncIterable) {
      return new Observable_1.Observable(function(subscriber) {
        process(asyncIterable, subscriber).catch(function(err) {
          return subscriber.error(err);
        });
      });
    }
    exports.fromAsyncIterable = fromAsyncIterable;
    function fromReadableStreamLike(readableStream) {
      return fromAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(readableStream));
    }
    exports.fromReadableStreamLike = fromReadableStreamLike;
    function process(asyncIterable, subscriber) {
      var asyncIterable_1, asyncIterable_1_1;
      var e_2, _a;
      return __awaiter(this, void 0, void 0, function() {
        var value, e_2_1;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              _b.trys.push([0, 5, 6, 11]);
              asyncIterable_1 = __asyncValues(asyncIterable);
              _b.label = 1;
            case 1:
              return [4, asyncIterable_1.next()];
            case 2:
              if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
              value = asyncIterable_1_1.value;
              subscriber.next(value);
              if (subscriber.closed) {
                return [2];
              }
              _b.label = 3;
            case 3:
              return [3, 1];
            case 4:
              return [3, 11];
            case 5:
              e_2_1 = _b.sent();
              e_2 = { error: e_2_1 };
              return [3, 11];
            case 6:
              _b.trys.push([6, , 9, 10]);
              if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
              return [4, _a.call(asyncIterable_1)];
            case 7:
              _b.sent();
              _b.label = 8;
            case 8:
              return [3, 10];
            case 9:
              if (e_2) throw e_2.error;
              return [7];
            case 10:
              return [7];
            case 11:
              subscriber.complete();
              return [2];
          }
        });
      });
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/util/executeSchedule.js
var require_executeSchedule = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/executeSchedule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.executeSchedule = void 0;
    function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
      if (delay === void 0) {
        delay = 0;
      }
      if (repeat === void 0) {
        repeat = false;
      }
      var scheduleSubscription = scheduler.schedule(function() {
        work();
        if (repeat) {
          parentSubscription.add(this.schedule(null, delay));
        } else {
          this.unsubscribe();
        }
      }, delay);
      parentSubscription.add(scheduleSubscription);
      if (!repeat) {
        return scheduleSubscription;
      }
    }
    exports.executeSchedule = executeSchedule;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/observeOn.js
var require_observeOn = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/observeOn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.observeOn = void 0;
    var executeSchedule_1 = require_executeSchedule();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function observeOn(scheduler, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            return subscriber.next(value);
          }, delay);
        }, function() {
          return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            return subscriber.complete();
          }, delay);
        }, function(err) {
          return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            return subscriber.error(err);
          }, delay);
        }));
      });
    }
    exports.observeOn = observeOn;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/subscribeOn.js
var require_subscribeOn = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/subscribeOn.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.subscribeOn = void 0;
    var lift_1 = require_lift();
    function subscribeOn(scheduler, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      return lift_1.operate(function(source, subscriber) {
        subscriber.add(scheduler.schedule(function() {
          return source.subscribe(subscriber);
        }, delay));
      });
    }
    exports.subscribeOn = subscribeOn;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleObservable.js
var require_scheduleObservable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduled/scheduleObservable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scheduleObservable = void 0;
    var innerFrom_1 = require_innerFrom();
    var observeOn_1 = require_observeOn();
    var subscribeOn_1 = require_subscribeOn();
    function scheduleObservable(input, scheduler) {
      return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
    }
    exports.scheduleObservable = scheduleObservable;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduled/schedulePromise.js
var require_schedulePromise = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduled/schedulePromise.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.schedulePromise = void 0;
    var innerFrom_1 = require_innerFrom();
    var observeOn_1 = require_observeOn();
    var subscribeOn_1 = require_subscribeOn();
    function schedulePromise(input, scheduler) {
      return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
    }
    exports.schedulePromise = schedulePromise;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleArray.js
var require_scheduleArray = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduled/scheduleArray.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scheduleArray = void 0;
    var Observable_1 = require_Observable();
    function scheduleArray(input, scheduler) {
      return new Observable_1.Observable(function(subscriber) {
        var i = 0;
        return scheduler.schedule(function() {
          if (i === input.length) {
            subscriber.complete();
          } else {
            subscriber.next(input[i++]);
            if (!subscriber.closed) {
              this.schedule();
            }
          }
        });
      });
    }
    exports.scheduleArray = scheduleArray;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleIterable.js
var require_scheduleIterable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduled/scheduleIterable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scheduleIterable = void 0;
    var Observable_1 = require_Observable();
    var iterator_1 = require_iterator();
    var isFunction_1 = require_isFunction();
    var executeSchedule_1 = require_executeSchedule();
    function scheduleIterable(input, scheduler) {
      return new Observable_1.Observable(function(subscriber) {
        var iterator;
        executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          iterator = input[iterator_1.iterator]();
          executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            var _a;
            var value;
            var done;
            try {
              _a = iterator.next(), value = _a.value, done = _a.done;
            } catch (err) {
              subscriber.error(err);
              return;
            }
            if (done) {
              subscriber.complete();
            } else {
              subscriber.next(value);
            }
          }, 0, true);
        });
        return function() {
          return isFunction_1.isFunction(iterator === null || iterator === void 0 ? void 0 : iterator.return) && iterator.return();
        };
      });
    }
    exports.scheduleIterable = scheduleIterable;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleAsyncIterable.js
var require_scheduleAsyncIterable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduled/scheduleAsyncIterable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scheduleAsyncIterable = void 0;
    var Observable_1 = require_Observable();
    var executeSchedule_1 = require_executeSchedule();
    function scheduleAsyncIterable(input, scheduler) {
      if (!input) {
        throw new Error("Iterable cannot be null");
      }
      return new Observable_1.Observable(function(subscriber) {
        executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          var iterator = input[Symbol.asyncIterator]();
          executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            iterator.next().then(function(result) {
              if (result.done) {
                subscriber.complete();
              } else {
                subscriber.next(result.value);
              }
            });
          }, 0, true);
        });
      });
    }
    exports.scheduleAsyncIterable = scheduleAsyncIterable;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleReadableStreamLike.js
var require_scheduleReadableStreamLike = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduled/scheduleReadableStreamLike.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scheduleReadableStreamLike = void 0;
    var scheduleAsyncIterable_1 = require_scheduleAsyncIterable();
    var isReadableStreamLike_1 = require_isReadableStreamLike();
    function scheduleReadableStreamLike(input, scheduler) {
      return scheduleAsyncIterable_1.scheduleAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(input), scheduler);
    }
    exports.scheduleReadableStreamLike = scheduleReadableStreamLike;
  }
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduled.js
var require_scheduled = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/scheduled/scheduled.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scheduled = void 0;
    var scheduleObservable_1 = require_scheduleObservable();
    var schedulePromise_1 = require_schedulePromise();
    var scheduleArray_1 = require_scheduleArray();
    var scheduleIterable_1 = require_scheduleIterable();
    var scheduleAsyncIterable_1 = require_scheduleAsyncIterable();
    var isInteropObservable_1 = require_isInteropObservable();
    var isPromise_1 = require_isPromise();
    var isArrayLike_1 = require_isArrayLike();
    var isIterable_1 = require_isIterable();
    var isAsyncIterable_1 = require_isAsyncIterable();
    var throwUnobservableError_1 = require_throwUnobservableError();
    var isReadableStreamLike_1 = require_isReadableStreamLike();
    var scheduleReadableStreamLike_1 = require_scheduleReadableStreamLike();
    function scheduled(input, scheduler) {
      if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
          return scheduleObservable_1.scheduleObservable(input, scheduler);
        }
        if (isArrayLike_1.isArrayLike(input)) {
          return scheduleArray_1.scheduleArray(input, scheduler);
        }
        if (isPromise_1.isPromise(input)) {
          return schedulePromise_1.schedulePromise(input, scheduler);
        }
        if (isAsyncIterable_1.isAsyncIterable(input)) {
          return scheduleAsyncIterable_1.scheduleAsyncIterable(input, scheduler);
        }
        if (isIterable_1.isIterable(input)) {
          return scheduleIterable_1.scheduleIterable(input, scheduler);
        }
        if (isReadableStreamLike_1.isReadableStreamLike(input)) {
          return scheduleReadableStreamLike_1.scheduleReadableStreamLike(input, scheduler);
        }
      }
      throw throwUnobservableError_1.createInvalidObservableTypeError(input);
    }
    exports.scheduled = scheduled;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/from.js
var require_from = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/from.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.from = void 0;
    var scheduled_1 = require_scheduled();
    var innerFrom_1 = require_innerFrom();
    function from(input, scheduler) {
      return scheduler ? scheduled_1.scheduled(input, scheduler) : innerFrom_1.innerFrom(input);
    }
    exports.from = from;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/of.js
var require_of = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/of.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.of = void 0;
    var args_1 = require_args();
    var from_1 = require_from();
    function of() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      return from_1.from(args, scheduler);
    }
    exports.of = of;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/throwError.js
var require_throwError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/throwError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.throwError = void 0;
    var Observable_1 = require_Observable();
    var isFunction_1 = require_isFunction();
    function throwError2(errorOrErrorFactory, scheduler) {
      var errorFactory = isFunction_1.isFunction(errorOrErrorFactory) ? errorOrErrorFactory : function() {
        return errorOrErrorFactory;
      };
      var init = function(subscriber) {
        return subscriber.error(errorFactory());
      };
      return new Observable_1.Observable(scheduler ? function(subscriber) {
        return scheduler.schedule(init, 0, subscriber);
      } : init);
    }
    exports.throwError = throwError2;
  }
});

// node_modules/rxjs/dist/cjs/internal/Notification.js
var require_Notification = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/Notification.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.observeNotification = exports.Notification = exports.NotificationKind = void 0;
    var empty_1 = require_empty();
    var of_1 = require_of();
    var throwError_1 = require_throwError();
    var isFunction_1 = require_isFunction();
    var NotificationKind;
    (function(NotificationKind2) {
      NotificationKind2["NEXT"] = "N";
      NotificationKind2["ERROR"] = "E";
      NotificationKind2["COMPLETE"] = "C";
    })(NotificationKind = exports.NotificationKind || (exports.NotificationKind = {}));
    var Notification = (function() {
      function Notification2(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === "N";
      }
      Notification2.prototype.observe = function(observer) {
        return observeNotification(this, observer);
      };
      Notification2.prototype.do = function(nextHandler, errorHandler, completeHandler) {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        return kind === "N" ? nextHandler === null || nextHandler === void 0 ? void 0 : nextHandler(value) : kind === "E" ? errorHandler === null || errorHandler === void 0 ? void 0 : errorHandler(error) : completeHandler === null || completeHandler === void 0 ? void 0 : completeHandler();
      };
      Notification2.prototype.accept = function(nextOrObserver, error, complete) {
        var _a;
        return isFunction_1.isFunction((_a = nextOrObserver) === null || _a === void 0 ? void 0 : _a.next) ? this.observe(nextOrObserver) : this.do(nextOrObserver, error, complete);
      };
      Notification2.prototype.toObservable = function() {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        var result = kind === "N" ? of_1.of(value) : kind === "E" ? throwError_1.throwError(function() {
          return error;
        }) : kind === "C" ? empty_1.EMPTY : 0;
        if (!result) {
          throw new TypeError("Unexpected notification kind " + kind);
        }
        return result;
      };
      Notification2.createNext = function(value) {
        return new Notification2("N", value);
      };
      Notification2.createError = function(err) {
        return new Notification2("E", void 0, err);
      };
      Notification2.createComplete = function() {
        return Notification2.completeNotification;
      };
      Notification2.completeNotification = new Notification2("C");
      return Notification2;
    })();
    exports.Notification = Notification;
    function observeNotification(notification, observer) {
      var _a, _b, _c;
      var _d = notification, kind = _d.kind, value = _d.value, error = _d.error;
      if (typeof kind !== "string") {
        throw new TypeError('Invalid notification, missing "kind"');
      }
      kind === "N" ? (_a = observer.next) === null || _a === void 0 ? void 0 : _a.call(observer, value) : kind === "E" ? (_b = observer.error) === null || _b === void 0 ? void 0 : _b.call(observer, error) : (_c = observer.complete) === null || _c === void 0 ? void 0 : _c.call(observer);
    }
    exports.observeNotification = observeNotification;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isObservable.js
var require_isObservable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isObservable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isObservable = void 0;
    var Observable_1 = require_Observable();
    var isFunction_1 = require_isFunction();
    function isObservable(obj) {
      return !!obj && (obj instanceof Observable_1.Observable || isFunction_1.isFunction(obj.lift) && isFunction_1.isFunction(obj.subscribe));
    }
    exports.isObservable = isObservable;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/EmptyError.js
var require_EmptyError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/EmptyError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptyError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports.EmptyError = createErrorClass_1.createErrorClass(function(_super) {
      return function EmptyErrorImpl() {
        _super(this);
        this.name = "EmptyError";
        this.message = "no elements in sequence";
      };
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/lastValueFrom.js
var require_lastValueFrom = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/lastValueFrom.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lastValueFrom = void 0;
    var EmptyError_1 = require_EmptyError();
    function lastValueFrom(source, config) {
      var hasConfig = typeof config === "object";
      return new Promise(function(resolve, reject) {
        var _hasValue = false;
        var _value;
        source.subscribe({
          next: function(value) {
            _value = value;
            _hasValue = true;
          },
          error: reject,
          complete: function() {
            if (_hasValue) {
              resolve(_value);
            } else if (hasConfig) {
              resolve(config.defaultValue);
            } else {
              reject(new EmptyError_1.EmptyError());
            }
          }
        });
      });
    }
    exports.lastValueFrom = lastValueFrom;
  }
});

// node_modules/rxjs/dist/cjs/internal/firstValueFrom.js
var require_firstValueFrom = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/firstValueFrom.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.firstValueFrom = void 0;
    var EmptyError_1 = require_EmptyError();
    var Subscriber_1 = require_Subscriber();
    function firstValueFrom(source, config) {
      var hasConfig = typeof config === "object";
      return new Promise(function(resolve, reject) {
        var subscriber = new Subscriber_1.SafeSubscriber({
          next: function(value) {
            resolve(value);
            subscriber.unsubscribe();
          },
          error: reject,
          complete: function() {
            if (hasConfig) {
              resolve(config.defaultValue);
            } else {
              reject(new EmptyError_1.EmptyError());
            }
          }
        });
        source.subscribe(subscriber);
      });
    }
    exports.firstValueFrom = firstValueFrom;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/ArgumentOutOfRangeError.js
var require_ArgumentOutOfRangeError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/ArgumentOutOfRangeError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ArgumentOutOfRangeError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports.ArgumentOutOfRangeError = createErrorClass_1.createErrorClass(function(_super) {
      return function ArgumentOutOfRangeErrorImpl() {
        _super(this);
        this.name = "ArgumentOutOfRangeError";
        this.message = "argument out of range";
      };
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/NotFoundError.js
var require_NotFoundError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/NotFoundError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotFoundError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports.NotFoundError = createErrorClass_1.createErrorClass(function(_super) {
      return function NotFoundErrorImpl(message) {
        _super(this);
        this.name = "NotFoundError";
        this.message = message;
      };
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/SequenceError.js
var require_SequenceError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/SequenceError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SequenceError = void 0;
    var createErrorClass_1 = require_createErrorClass();
    exports.SequenceError = createErrorClass_1.createErrorClass(function(_super) {
      return function SequenceErrorImpl(message) {
        _super(this);
        this.name = "SequenceError";
        this.message = message;
      };
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isDate.js
var require_isDate = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/isDate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isValidDate = void 0;
    function isValidDate(value) {
      return value instanceof Date && !isNaN(value);
    }
    exports.isValidDate = isValidDate;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/timeout.js
var require_timeout = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/timeout.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timeout = exports.TimeoutError = void 0;
    var async_1 = require_async();
    var isDate_1 = require_isDate();
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var createErrorClass_1 = require_createErrorClass();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var executeSchedule_1 = require_executeSchedule();
    exports.TimeoutError = createErrorClass_1.createErrorClass(function(_super) {
      return function TimeoutErrorImpl(info) {
        if (info === void 0) {
          info = null;
        }
        _super(this);
        this.message = "Timeout has occurred";
        this.name = "TimeoutError";
        this.info = info;
      };
    });
    function timeout(config, schedulerArg) {
      var _a = isDate_1.isValidDate(config) ? { first: config } : typeof config === "number" ? { each: config } : config, first = _a.first, each = _a.each, _b = _a.with, _with = _b === void 0 ? timeoutErrorFactory : _b, _c = _a.scheduler, scheduler = _c === void 0 ? schedulerArg !== null && schedulerArg !== void 0 ? schedulerArg : async_1.asyncScheduler : _c, _d = _a.meta, meta = _d === void 0 ? null : _d;
      if (first == null && each == null) {
        throw new TypeError("No timeout provided.");
      }
      return lift_1.operate(function(source, subscriber) {
        var originalSourceSubscription;
        var timerSubscription;
        var lastValue = null;
        var seen = 0;
        var startTimer = function(delay) {
          timerSubscription = executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
            try {
              originalSourceSubscription.unsubscribe();
              innerFrom_1.innerFrom(_with({
                meta,
                lastValue,
                seen
              })).subscribe(subscriber);
            } catch (err) {
              subscriber.error(err);
            }
          }, delay);
        };
        originalSourceSubscription = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
          seen++;
          subscriber.next(lastValue = value);
          each > 0 && startTimer(each);
        }, void 0, void 0, function() {
          if (!(timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.closed)) {
            timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
          }
          lastValue = null;
        }));
        !seen && startTimer(first != null ? typeof first === "number" ? first : +first - scheduler.now() : each);
      });
    }
    exports.timeout = timeout;
    function timeoutErrorFactory(info) {
      throw new exports.TimeoutError(info);
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/map.js
var require_map = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/map.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.map = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function map(project, thisArg) {
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          subscriber.next(project.call(thisArg, value, index++));
        }));
      });
    }
    exports.map = map;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/mapOneOrManyArgs.js
var require_mapOneOrManyArgs = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/mapOneOrManyArgs.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mapOneOrManyArgs = void 0;
    var map_1 = require_map();
    var isArray = Array.isArray;
    function callOrApply(fn, args) {
      return isArray(args) ? fn.apply(void 0, __spreadArray([], __read(args))) : fn(args);
    }
    function mapOneOrManyArgs(fn) {
      return map_1.map(function(args) {
        return callOrApply(fn, args);
      });
    }
    exports.mapOneOrManyArgs = mapOneOrManyArgs;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/bindCallbackInternals.js
var require_bindCallbackInternals = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/bindCallbackInternals.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bindCallbackInternals = void 0;
    var isScheduler_1 = require_isScheduler();
    var Observable_1 = require_Observable();
    var subscribeOn_1 = require_subscribeOn();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var observeOn_1 = require_observeOn();
    var AsyncSubject_1 = require_AsyncSubject();
    function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
      if (resultSelector) {
        if (isScheduler_1.isScheduler(resultSelector)) {
          scheduler = resultSelector;
        } else {
          return function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler).apply(this, args).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
          };
        }
      }
      if (scheduler) {
        return function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          return bindCallbackInternals(isNodeStyle, callbackFunc).apply(this, args).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
        };
      }
      return function() {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var subject = new AsyncSubject_1.AsyncSubject();
        var uninitialized = true;
        return new Observable_1.Observable(function(subscriber) {
          var subs = subject.subscribe(subscriber);
          if (uninitialized) {
            uninitialized = false;
            var isAsync_1 = false;
            var isComplete_1 = false;
            callbackFunc.apply(_this, __spreadArray(__spreadArray([], __read(args)), [
              function() {
                var results = [];
                for (var _i2 = 0; _i2 < arguments.length; _i2++) {
                  results[_i2] = arguments[_i2];
                }
                if (isNodeStyle) {
                  var err = results.shift();
                  if (err != null) {
                    subject.error(err);
                    return;
                  }
                }
                subject.next(1 < results.length ? results : results[0]);
                isComplete_1 = true;
                if (isAsync_1) {
                  subject.complete();
                }
              }
            ]));
            if (isComplete_1) {
              subject.complete();
            }
            isAsync_1 = true;
          }
          return subs;
        });
      };
    }
    exports.bindCallbackInternals = bindCallbackInternals;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/bindCallback.js
var require_bindCallback = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/bindCallback.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bindCallback = void 0;
    var bindCallbackInternals_1 = require_bindCallbackInternals();
    function bindCallback(callbackFunc, resultSelector, scheduler) {
      return bindCallbackInternals_1.bindCallbackInternals(false, callbackFunc, resultSelector, scheduler);
    }
    exports.bindCallback = bindCallback;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/bindNodeCallback.js
var require_bindNodeCallback = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/bindNodeCallback.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bindNodeCallback = void 0;
    var bindCallbackInternals_1 = require_bindCallbackInternals();
    function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
      return bindCallbackInternals_1.bindCallbackInternals(true, callbackFunc, resultSelector, scheduler);
    }
    exports.bindNodeCallback = bindNodeCallback;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/argsArgArrayOrObject.js
var require_argsArgArrayOrObject = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/argsArgArrayOrObject.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.argsArgArrayOrObject = void 0;
    var isArray = Array.isArray;
    var getPrototypeOf = Object.getPrototypeOf;
    var objectProto = Object.prototype;
    var getKeys = Object.keys;
    function argsArgArrayOrObject(args) {
      if (args.length === 1) {
        var first_1 = args[0];
        if (isArray(first_1)) {
          return { args: first_1, keys: null };
        }
        if (isPOJO(first_1)) {
          var keys = getKeys(first_1);
          return {
            args: keys.map(function(key) {
              return first_1[key];
            }),
            keys
          };
        }
      }
      return { args, keys: null };
    }
    exports.argsArgArrayOrObject = argsArgArrayOrObject;
    function isPOJO(obj) {
      return obj && typeof obj === "object" && getPrototypeOf(obj) === objectProto;
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/util/createObject.js
var require_createObject = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/createObject.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createObject = void 0;
    function createObject(keys, values) {
      return keys.reduce(function(result, key, i) {
        return result[key] = values[i], result;
      }, {});
    }
    exports.createObject = createObject;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/combineLatest.js
var require_combineLatest = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/combineLatest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineLatestInit = exports.combineLatest = void 0;
    var Observable_1 = require_Observable();
    var argsArgArrayOrObject_1 = require_argsArgArrayOrObject();
    var from_1 = require_from();
    var identity_1 = require_identity();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var args_1 = require_args();
    var createObject_1 = require_createObject();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var executeSchedule_1 = require_executeSchedule();
    function combineLatest() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      var resultSelector = args_1.popResultSelector(args);
      var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), observables = _a.args, keys = _a.keys;
      if (observables.length === 0) {
        return from_1.from([], scheduler);
      }
      var result = new Observable_1.Observable(combineLatestInit(observables, scheduler, keys ? function(values) {
        return createObject_1.createObject(keys, values);
      } : identity_1.identity));
      return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
    }
    exports.combineLatest = combineLatest;
    function combineLatestInit(observables, scheduler, valueTransform) {
      if (valueTransform === void 0) {
        valueTransform = identity_1.identity;
      }
      return function(subscriber) {
        maybeSchedule(scheduler, function() {
          var length = observables.length;
          var values = new Array(length);
          var active = length;
          var remainingFirstValues = length;
          var _loop_1 = function(i2) {
            maybeSchedule(scheduler, function() {
              var source = from_1.from(observables[i2], scheduler);
              var hasFirstValue = false;
              source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
                values[i2] = value;
                if (!hasFirstValue) {
                  hasFirstValue = true;
                  remainingFirstValues--;
                }
                if (!remainingFirstValues) {
                  subscriber.next(valueTransform(values.slice()));
                }
              }, function() {
                if (!--active) {
                  subscriber.complete();
                }
              }));
            }, subscriber);
          };
          for (var i = 0; i < length; i++) {
            _loop_1(i);
          }
        }, subscriber);
      };
    }
    exports.combineLatestInit = combineLatestInit;
    function maybeSchedule(scheduler, execute, subscription) {
      if (scheduler) {
        executeSchedule_1.executeSchedule(subscription, scheduler, execute);
      } else {
        execute();
      }
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeInternals.js
var require_mergeInternals = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/mergeInternals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeInternals = void 0;
    var innerFrom_1 = require_innerFrom();
    var executeSchedule_1 = require_executeSchedule();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
      var buffer = [];
      var active = 0;
      var index = 0;
      var isComplete = false;
      var checkComplete = function() {
        if (isComplete && !buffer.length && !active) {
          subscriber.complete();
        }
      };
      var outerNext = function(value) {
        return active < concurrent ? doInnerSub(value) : buffer.push(value);
      };
      var doInnerSub = function(value) {
        expand && subscriber.next(value);
        active++;
        var innerComplete = false;
        innerFrom_1.innerFrom(project(value, index++)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(innerValue) {
          onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
          if (expand) {
            outerNext(innerValue);
          } else {
            subscriber.next(innerValue);
          }
        }, function() {
          innerComplete = true;
        }, void 0, function() {
          if (innerComplete) {
            try {
              active--;
              var _loop_1 = function() {
                var bufferedValue = buffer.shift();
                if (innerSubScheduler) {
                  executeSchedule_1.executeSchedule(subscriber, innerSubScheduler, function() {
                    return doInnerSub(bufferedValue);
                  });
                } else {
                  doInnerSub(bufferedValue);
                }
              };
              while (buffer.length && active < concurrent) {
                _loop_1();
              }
              checkComplete();
            } catch (err) {
              subscriber.error(err);
            }
          }
        }));
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, outerNext, function() {
        isComplete = true;
        checkComplete();
      }));
      return function() {
        additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
      };
    }
    exports.mergeInternals = mergeInternals;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeMap.js
var require_mergeMap = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/mergeMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeMap = void 0;
    var map_1 = require_map();
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var mergeInternals_1 = require_mergeInternals();
    var isFunction_1 = require_isFunction();
    function mergeMap(project, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      if (isFunction_1.isFunction(resultSelector)) {
        return mergeMap(function(a, i) {
          return map_1.map(function(b, ii) {
            return resultSelector(a, b, i, ii);
          })(innerFrom_1.innerFrom(project(a, i)));
        }, concurrent);
      } else if (typeof resultSelector === "number") {
        concurrent = resultSelector;
      }
      return lift_1.operate(function(source, subscriber) {
        return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent);
      });
    }
    exports.mergeMap = mergeMap;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeAll.js
var require_mergeAll = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/mergeAll.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeAll = void 0;
    var mergeMap_1 = require_mergeMap();
    var identity_1 = require_identity();
    function mergeAll(concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      return mergeMap_1.mergeMap(identity_1.identity, concurrent);
    }
    exports.mergeAll = mergeAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/concatAll.js
var require_concatAll = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/concatAll.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concatAll = void 0;
    var mergeAll_1 = require_mergeAll();
    function concatAll() {
      return mergeAll_1.mergeAll(1);
    }
    exports.concatAll = concatAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/concat.js
var require_concat = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/concat.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concat = void 0;
    var concatAll_1 = require_concatAll();
    var args_1 = require_args();
    var from_1 = require_from();
    function concat() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return concatAll_1.concatAll()(from_1.from(args, args_1.popScheduler(args)));
    }
    exports.concat = concat;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/defer.js
var require_defer = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/defer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defer = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    function defer(observableFactory) {
      return new Observable_1.Observable(function(subscriber) {
        innerFrom_1.innerFrom(observableFactory()).subscribe(subscriber);
      });
    }
    exports.defer = defer;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/connectable.js
var require_connectable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/connectable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connectable = void 0;
    var Subject_1 = require_Subject();
    var Observable_1 = require_Observable();
    var defer_1 = require_defer();
    var DEFAULT_CONFIG = {
      connector: function() {
        return new Subject_1.Subject();
      },
      resetOnDisconnect: true
    };
    function connectable(source, config) {
      if (config === void 0) {
        config = DEFAULT_CONFIG;
      }
      var connection = null;
      var connector = config.connector, _a = config.resetOnDisconnect, resetOnDisconnect = _a === void 0 ? true : _a;
      var subject = connector();
      var result = new Observable_1.Observable(function(subscriber) {
        return subject.subscribe(subscriber);
      });
      result.connect = function() {
        if (!connection || connection.closed) {
          connection = defer_1.defer(function() {
            return source;
          }).subscribe(subject);
          if (resetOnDisconnect) {
            connection.add(function() {
              return subject = connector();
            });
          }
        }
        return connection;
      };
      return result;
    }
    exports.connectable = connectable;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/forkJoin.js
var require_forkJoin = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/forkJoin.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.forkJoin = void 0;
    var Observable_1 = require_Observable();
    var argsArgArrayOrObject_1 = require_argsArgArrayOrObject();
    var innerFrom_1 = require_innerFrom();
    var args_1 = require_args();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var createObject_1 = require_createObject();
    function forkJoin() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var resultSelector = args_1.popResultSelector(args);
      var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), sources = _a.args, keys = _a.keys;
      var result = new Observable_1.Observable(function(subscriber) {
        var length = sources.length;
        if (!length) {
          subscriber.complete();
          return;
        }
        var values = new Array(length);
        var remainingCompletions = length;
        var remainingEmissions = length;
        var _loop_1 = function(sourceIndex2) {
          var hasValue = false;
          innerFrom_1.innerFrom(sources[sourceIndex2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            if (!hasValue) {
              hasValue = true;
              remainingEmissions--;
            }
            values[sourceIndex2] = value;
          }, function() {
            return remainingCompletions--;
          }, void 0, function() {
            if (!remainingCompletions || !hasValue) {
              if (!remainingEmissions) {
                subscriber.next(keys ? createObject_1.createObject(keys, values) : values);
              }
              subscriber.complete();
            }
          }));
        };
        for (var sourceIndex = 0; sourceIndex < length; sourceIndex++) {
          _loop_1(sourceIndex);
        }
      });
      return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
    }
    exports.forkJoin = forkJoin;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/fromEvent.js
var require_fromEvent = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/fromEvent.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromEvent = void 0;
    var innerFrom_1 = require_innerFrom();
    var Observable_1 = require_Observable();
    var mergeMap_1 = require_mergeMap();
    var isArrayLike_1 = require_isArrayLike();
    var isFunction_1 = require_isFunction();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var nodeEventEmitterMethods = ["addListener", "removeListener"];
    var eventTargetMethods = ["addEventListener", "removeEventListener"];
    var jqueryMethods = ["on", "off"];
    function fromEvent(target, eventName, options, resultSelector) {
      if (isFunction_1.isFunction(options)) {
        resultSelector = options;
        options = void 0;
      }
      if (resultSelector) {
        return fromEvent(target, eventName, options).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
      }
      var _a = __read(isEventTarget(target) ? eventTargetMethods.map(function(methodName) {
        return function(handler) {
          return target[methodName](eventName, handler, options);
        };
      }) : isNodeStyleEventEmitter(target) ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName)) : isJQueryStyleEventEmitter(target) ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName)) : [], 2), add = _a[0], remove = _a[1];
      if (!add) {
        if (isArrayLike_1.isArrayLike(target)) {
          return mergeMap_1.mergeMap(function(subTarget) {
            return fromEvent(subTarget, eventName, options);
          })(innerFrom_1.innerFrom(target));
        }
      }
      if (!add) {
        throw new TypeError("Invalid event target");
      }
      return new Observable_1.Observable(function(subscriber) {
        var handler = function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          return subscriber.next(1 < args.length ? args : args[0]);
        };
        add(handler);
        return function() {
          return remove(handler);
        };
      });
    }
    exports.fromEvent = fromEvent;
    function toCommonHandlerRegistry(target, eventName) {
      return function(methodName) {
        return function(handler) {
          return target[methodName](eventName, handler);
        };
      };
    }
    function isNodeStyleEventEmitter(target) {
      return isFunction_1.isFunction(target.addListener) && isFunction_1.isFunction(target.removeListener);
    }
    function isJQueryStyleEventEmitter(target) {
      return isFunction_1.isFunction(target.on) && isFunction_1.isFunction(target.off);
    }
    function isEventTarget(target) {
      return isFunction_1.isFunction(target.addEventListener) && isFunction_1.isFunction(target.removeEventListener);
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/fromEventPattern.js
var require_fromEventPattern = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/fromEventPattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromEventPattern = void 0;
    var Observable_1 = require_Observable();
    var isFunction_1 = require_isFunction();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    function fromEventPattern(addHandler, removeHandler, resultSelector) {
      if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
      }
      return new Observable_1.Observable(function(subscriber) {
        var handler = function() {
          var e = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            e[_i] = arguments[_i];
          }
          return subscriber.next(e.length === 1 ? e[0] : e);
        };
        var retValue = addHandler(handler);
        return isFunction_1.isFunction(removeHandler) ? function() {
          return removeHandler(handler, retValue);
        } : void 0;
      });
    }
    exports.fromEventPattern = fromEventPattern;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/generate.js
var require_generate = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/generate.js"(exports) {
    "use strict";
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generate = void 0;
    var identity_1 = require_identity();
    var isScheduler_1 = require_isScheduler();
    var defer_1 = require_defer();
    var scheduleIterable_1 = require_scheduleIterable();
    function generate(initialStateOrOptions, condition, iterate, resultSelectorOrScheduler, scheduler) {
      var _a, _b;
      var resultSelector;
      var initialState;
      if (arguments.length === 1) {
        _a = initialStateOrOptions, initialState = _a.initialState, condition = _a.condition, iterate = _a.iterate, _b = _a.resultSelector, resultSelector = _b === void 0 ? identity_1.identity : _b, scheduler = _a.scheduler;
      } else {
        initialState = initialStateOrOptions;
        if (!resultSelectorOrScheduler || isScheduler_1.isScheduler(resultSelectorOrScheduler)) {
          resultSelector = identity_1.identity;
          scheduler = resultSelectorOrScheduler;
        } else {
          resultSelector = resultSelectorOrScheduler;
        }
      }
      function gen() {
        var state;
        return __generator(this, function(_a2) {
          switch (_a2.label) {
            case 0:
              state = initialState;
              _a2.label = 1;
            case 1:
              if (!(!condition || condition(state))) return [3, 4];
              return [4, resultSelector(state)];
            case 2:
              _a2.sent();
              _a2.label = 3;
            case 3:
              state = iterate(state);
              return [3, 1];
            case 4:
              return [2];
          }
        });
      }
      return defer_1.defer(scheduler ? function() {
        return scheduleIterable_1.scheduleIterable(gen(), scheduler);
      } : gen);
    }
    exports.generate = generate;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/iif.js
var require_iif = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/iif.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.iif = void 0;
    var defer_1 = require_defer();
    function iif(condition, trueResult, falseResult) {
      return defer_1.defer(function() {
        return condition() ? trueResult : falseResult;
      });
    }
    exports.iif = iif;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/timer.js
var require_timer = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/timer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timer = void 0;
    var Observable_1 = require_Observable();
    var async_1 = require_async();
    var isScheduler_1 = require_isScheduler();
    var isDate_1 = require_isDate();
    function timer(dueTime, intervalOrScheduler, scheduler) {
      if (dueTime === void 0) {
        dueTime = 0;
      }
      if (scheduler === void 0) {
        scheduler = async_1.async;
      }
      var intervalDuration = -1;
      if (intervalOrScheduler != null) {
        if (isScheduler_1.isScheduler(intervalOrScheduler)) {
          scheduler = intervalOrScheduler;
        } else {
          intervalDuration = intervalOrScheduler;
        }
      }
      return new Observable_1.Observable(function(subscriber) {
        var due = isDate_1.isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
        if (due < 0) {
          due = 0;
        }
        var n = 0;
        return scheduler.schedule(function() {
          if (!subscriber.closed) {
            subscriber.next(n++);
            if (0 <= intervalDuration) {
              this.schedule(void 0, intervalDuration);
            } else {
              subscriber.complete();
            }
          }
        }, due);
      });
    }
    exports.timer = timer;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/interval.js
var require_interval = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/interval.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.interval = void 0;
    var async_1 = require_async();
    var timer_1 = require_timer();
    function interval(period, scheduler) {
      if (period === void 0) {
        period = 0;
      }
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      if (period < 0) {
        period = 0;
      }
      return timer_1.timer(period, period, scheduler);
    }
    exports.interval = interval;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/merge.js
var require_merge = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/merge.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    var mergeAll_1 = require_mergeAll();
    var innerFrom_1 = require_innerFrom();
    var empty_1 = require_empty();
    var args_1 = require_args();
    var from_1 = require_from();
    function merge() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      var concurrent = args_1.popNumber(args, Infinity);
      var sources = args;
      return !sources.length ? empty_1.EMPTY : sources.length === 1 ? innerFrom_1.innerFrom(sources[0]) : mergeAll_1.mergeAll(concurrent)(from_1.from(sources, scheduler));
    }
    exports.merge = merge;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/never.js
var require_never = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/never.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.never = exports.NEVER = void 0;
    var Observable_1 = require_Observable();
    var noop_1 = require_noop();
    exports.NEVER = new Observable_1.Observable(noop_1.noop);
    function never() {
      return exports.NEVER;
    }
    exports.never = never;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/argsOrArgArray.js
var require_argsOrArgArray = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/argsOrArgArray.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.argsOrArgArray = void 0;
    var isArray = Array.isArray;
    function argsOrArgArray(args) {
      return args.length === 1 && isArray(args[0]) ? args[0] : args;
    }
    exports.argsOrArgArray = argsOrArgArray;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/onErrorResumeNext.js
var require_onErrorResumeNext = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/onErrorResumeNext.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onErrorResumeNext = void 0;
    var Observable_1 = require_Observable();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var innerFrom_1 = require_innerFrom();
    function onErrorResumeNext() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
      return new Observable_1.Observable(function(subscriber) {
        var sourceIndex = 0;
        var subscribeNext = function() {
          if (sourceIndex < nextSources.length) {
            var nextSource = void 0;
            try {
              nextSource = innerFrom_1.innerFrom(nextSources[sourceIndex++]);
            } catch (err) {
              subscribeNext();
              return;
            }
            var innerSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, void 0, noop_1.noop, noop_1.noop);
            nextSource.subscribe(innerSubscriber);
            innerSubscriber.add(subscribeNext);
          } else {
            subscriber.complete();
          }
        };
        subscribeNext();
      });
    }
    exports.onErrorResumeNext = onErrorResumeNext;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/pairs.js
var require_pairs = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/pairs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pairs = void 0;
    var from_1 = require_from();
    function pairs(obj, scheduler) {
      return from_1.from(Object.entries(obj), scheduler);
    }
    exports.pairs = pairs;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/not.js
var require_not = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/util/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.not = void 0;
    function not(pred, thisArg) {
      return function(value, index) {
        return !pred.call(thisArg, value, index);
      };
    }
    exports.not = not;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/filter.js
var require_filter = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/filter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.filter = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function filter(predicate, thisArg) {
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return predicate.call(thisArg, value, index++) && subscriber.next(value);
        }));
      });
    }
    exports.filter = filter;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/partition.js
var require_partition = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/partition.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.partition = void 0;
    var not_1 = require_not();
    var filter_1 = require_filter();
    var innerFrom_1 = require_innerFrom();
    function partition(source, predicate, thisArg) {
      return [filter_1.filter(predicate, thisArg)(innerFrom_1.innerFrom(source)), filter_1.filter(not_1.not(predicate, thisArg))(innerFrom_1.innerFrom(source))];
    }
    exports.partition = partition;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/race.js
var require_race = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/race.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.raceInit = exports.race = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function race() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      sources = argsOrArgArray_1.argsOrArgArray(sources);
      return sources.length === 1 ? innerFrom_1.innerFrom(sources[0]) : new Observable_1.Observable(raceInit(sources));
    }
    exports.race = race;
    function raceInit(sources) {
      return function(subscriber) {
        var subscriptions = [];
        var _loop_1 = function(i2) {
          subscriptions.push(innerFrom_1.innerFrom(sources[i2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            if (subscriptions) {
              for (var s = 0; s < subscriptions.length; s++) {
                s !== i2 && subscriptions[s].unsubscribe();
              }
              subscriptions = null;
            }
            subscriber.next(value);
          })));
        };
        for (var i = 0; subscriptions && !subscriber.closed && i < sources.length; i++) {
          _loop_1(i);
        }
      };
    }
    exports.raceInit = raceInit;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/range.js
var require_range = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/range.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.range = void 0;
    var Observable_1 = require_Observable();
    var empty_1 = require_empty();
    function range(start, count, scheduler) {
      if (count == null) {
        count = start;
        start = 0;
      }
      if (count <= 0) {
        return empty_1.EMPTY;
      }
      var end = count + start;
      return new Observable_1.Observable(scheduler ? function(subscriber) {
        var n = start;
        return scheduler.schedule(function() {
          if (n < end) {
            subscriber.next(n++);
            this.schedule();
          } else {
            subscriber.complete();
          }
        });
      } : function(subscriber) {
        var n = start;
        while (n < end && !subscriber.closed) {
          subscriber.next(n++);
        }
        subscriber.complete();
      });
    }
    exports.range = range;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/using.js
var require_using = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/using.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.using = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var empty_1 = require_empty();
    function using(resourceFactory, observableFactory) {
      return new Observable_1.Observable(function(subscriber) {
        var resource2 = resourceFactory();
        var result = observableFactory(resource2);
        var source = result ? innerFrom_1.innerFrom(result) : empty_1.EMPTY;
        source.subscribe(subscriber);
        return function() {
          if (resource2) {
            resource2.unsubscribe();
          }
        };
      });
    }
    exports.using = using;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/zip.js
var require_zip = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/zip.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.zip = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var empty_1 = require_empty();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var args_1 = require_args();
    function zip() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var resultSelector = args_1.popResultSelector(args);
      var sources = argsOrArgArray_1.argsOrArgArray(args);
      return sources.length ? new Observable_1.Observable(function(subscriber) {
        var buffers = sources.map(function() {
          return [];
        });
        var completed = sources.map(function() {
          return false;
        });
        subscriber.add(function() {
          buffers = completed = null;
        });
        var _loop_1 = function(sourceIndex2) {
          innerFrom_1.innerFrom(sources[sourceIndex2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            buffers[sourceIndex2].push(value);
            if (buffers.every(function(buffer) {
              return buffer.length;
            })) {
              var result = buffers.map(function(buffer) {
                return buffer.shift();
              });
              subscriber.next(resultSelector ? resultSelector.apply(void 0, __spreadArray([], __read(result))) : result);
              if (buffers.some(function(buffer, i) {
                return !buffer.length && completed[i];
              })) {
                subscriber.complete();
              }
            }
          }, function() {
            completed[sourceIndex2] = true;
            !buffers[sourceIndex2].length && subscriber.complete();
          }));
        };
        for (var sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
          _loop_1(sourceIndex);
        }
        return function() {
          buffers = completed = null;
        };
      }) : empty_1.EMPTY;
    }
    exports.zip = zip;
  }
});

// node_modules/rxjs/dist/cjs/internal/types.js
var require_types = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/audit.js
var require_audit = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/audit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.audit = void 0;
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function audit(durationSelector) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var isComplete = false;
        var endDuration = function() {
          durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
          durationSubscriber = null;
          if (hasValue) {
            hasValue = false;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
          isComplete && subscriber.complete();
        };
        var cleanupDuration = function() {
          durationSubscriber = null;
          isComplete && subscriber.complete();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          lastValue = value;
          if (!durationSubscriber) {
            innerFrom_1.innerFrom(durationSelector(value)).subscribe(durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, endDuration, cleanupDuration));
          }
        }, function() {
          isComplete = true;
          (!hasValue || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
        }));
      });
    }
    exports.audit = audit;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/auditTime.js
var require_auditTime = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/auditTime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.auditTime = void 0;
    var async_1 = require_async();
    var audit_1 = require_audit();
    var timer_1 = require_timer();
    function auditTime(duration, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return audit_1.audit(function() {
        return timer_1.timer(duration, scheduler);
      });
    }
    exports.auditTime = auditTime;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/buffer.js
var require_buffer = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/buffer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buffer = void 0;
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function buffer(closingNotifier) {
      return lift_1.operate(function(source, subscriber) {
        var currentBuffer = [];
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return currentBuffer.push(value);
        }, function() {
          subscriber.next(currentBuffer);
          subscriber.complete();
        }));
        innerFrom_1.innerFrom(closingNotifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          var b = currentBuffer;
          currentBuffer = [];
          subscriber.next(b);
        }, noop_1.noop));
        return function() {
          currentBuffer = null;
        };
      });
    }
    exports.buffer = buffer;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferCount.js
var require_bufferCount = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/bufferCount.js"(exports) {
    "use strict";
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bufferCount = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var arrRemove_1 = require_arrRemove();
    function bufferCount(bufferSize, startBufferEvery) {
      if (startBufferEvery === void 0) {
        startBufferEvery = null;
      }
      startBufferEvery = startBufferEvery !== null && startBufferEvery !== void 0 ? startBufferEvery : bufferSize;
      return lift_1.operate(function(source, subscriber) {
        var buffers = [];
        var count = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a, e_2, _b;
          var toEmit = null;
          if (count++ % startBufferEvery === 0) {
            buffers.push([]);
          }
          try {
            for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
              var buffer = buffers_1_1.value;
              buffer.push(value);
              if (bufferSize <= buffer.length) {
                toEmit = toEmit !== null && toEmit !== void 0 ? toEmit : [];
                toEmit.push(buffer);
              }
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          if (toEmit) {
            try {
              for (var toEmit_1 = __values(toEmit), toEmit_1_1 = toEmit_1.next(); !toEmit_1_1.done; toEmit_1_1 = toEmit_1.next()) {
                var buffer = toEmit_1_1.value;
                arrRemove_1.arrRemove(buffers, buffer);
                subscriber.next(buffer);
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (toEmit_1_1 && !toEmit_1_1.done && (_b = toEmit_1.return)) _b.call(toEmit_1);
              } finally {
                if (e_2) throw e_2.error;
              }
            }
          }
        }, function() {
          var e_3, _a;
          try {
            for (var buffers_2 = __values(buffers), buffers_2_1 = buffers_2.next(); !buffers_2_1.done; buffers_2_1 = buffers_2.next()) {
              var buffer = buffers_2_1.value;
              subscriber.next(buffer);
            }
          } catch (e_3_1) {
            e_3 = { error: e_3_1 };
          } finally {
            try {
              if (buffers_2_1 && !buffers_2_1.done && (_a = buffers_2.return)) _a.call(buffers_2);
            } finally {
              if (e_3) throw e_3.error;
            }
          }
          subscriber.complete();
        }, void 0, function() {
          buffers = null;
        }));
      });
    }
    exports.bufferCount = bufferCount;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferTime.js
var require_bufferTime = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/bufferTime.js"(exports) {
    "use strict";
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bufferTime = void 0;
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var arrRemove_1 = require_arrRemove();
    var async_1 = require_async();
    var args_1 = require_args();
    var executeSchedule_1 = require_executeSchedule();
    function bufferTime(bufferTimeSpan) {
      var _a, _b;
      var otherArgs = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
      }
      var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : async_1.asyncScheduler;
      var bufferCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
      var maxBufferSize = otherArgs[1] || Infinity;
      return lift_1.operate(function(source, subscriber) {
        var bufferRecords = [];
        var restartOnEmit = false;
        var emit = function(record) {
          var buffer = record.buffer, subs = record.subs;
          subs.unsubscribe();
          arrRemove_1.arrRemove(bufferRecords, record);
          subscriber.next(buffer);
          restartOnEmit && startBuffer();
        };
        var startBuffer = function() {
          if (bufferRecords) {
            var subs = new Subscription_1.Subscription();
            subscriber.add(subs);
            var buffer = [];
            var record_1 = {
              buffer,
              subs
            };
            bufferRecords.push(record_1);
            executeSchedule_1.executeSchedule(subs, scheduler, function() {
              return emit(record_1);
            }, bufferTimeSpan);
          }
        };
        if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
          executeSchedule_1.executeSchedule(subscriber, scheduler, startBuffer, bufferCreationInterval, true);
        } else {
          restartOnEmit = true;
        }
        startBuffer();
        var bufferTimeSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a2;
          var recordsCopy = bufferRecords.slice();
          try {
            for (var recordsCopy_1 = __values(recordsCopy), recordsCopy_1_1 = recordsCopy_1.next(); !recordsCopy_1_1.done; recordsCopy_1_1 = recordsCopy_1.next()) {
              var record = recordsCopy_1_1.value;
              var buffer = record.buffer;
              buffer.push(value);
              maxBufferSize <= buffer.length && emit(record);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (recordsCopy_1_1 && !recordsCopy_1_1.done && (_a2 = recordsCopy_1.return)) _a2.call(recordsCopy_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }, function() {
          while (bufferRecords === null || bufferRecords === void 0 ? void 0 : bufferRecords.length) {
            subscriber.next(bufferRecords.shift().buffer);
          }
          bufferTimeSubscriber === null || bufferTimeSubscriber === void 0 ? void 0 : bufferTimeSubscriber.unsubscribe();
          subscriber.complete();
          subscriber.unsubscribe();
        }, void 0, function() {
          return bufferRecords = null;
        });
        source.subscribe(bufferTimeSubscriber);
      });
    }
    exports.bufferTime = bufferTime;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferToggle.js
var require_bufferToggle = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/bufferToggle.js"(exports) {
    "use strict";
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bufferToggle = void 0;
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var arrRemove_1 = require_arrRemove();
    function bufferToggle(openings, closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var buffers = [];
        innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(openValue) {
          var buffer = [];
          buffers.push(buffer);
          var closingSubscription = new Subscription_1.Subscription();
          var emitBuffer = function() {
            arrRemove_1.arrRemove(buffers, buffer);
            subscriber.next(buffer);
            closingSubscription.unsubscribe();
          };
          closingSubscription.add(innerFrom_1.innerFrom(closingSelector(openValue)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, emitBuffer, noop_1.noop)));
        }, noop_1.noop));
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a;
          try {
            for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
              var buffer = buffers_1_1.value;
              buffer.push(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }, function() {
          while (buffers.length > 0) {
            subscriber.next(buffers.shift());
          }
          subscriber.complete();
        }));
      });
    }
    exports.bufferToggle = bufferToggle;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferWhen.js
var require_bufferWhen = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/bufferWhen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bufferWhen = void 0;
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function bufferWhen(closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var buffer = null;
        var closingSubscriber = null;
        var openBuffer = function() {
          closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
          var b = buffer;
          buffer = [];
          b && subscriber.next(b);
          innerFrom_1.innerFrom(closingSelector()).subscribe(closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openBuffer, noop_1.noop));
        };
        openBuffer();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return buffer === null || buffer === void 0 ? void 0 : buffer.push(value);
        }, function() {
          buffer && subscriber.next(buffer);
          subscriber.complete();
        }, void 0, function() {
          return buffer = closingSubscriber = null;
        }));
      });
    }
    exports.bufferWhen = bufferWhen;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/catchError.js
var require_catchError = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/catchError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.catchError = void 0;
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var lift_1 = require_lift();
    function catchError(selector) {
      return lift_1.operate(function(source, subscriber) {
        var innerSub = null;
        var syncUnsub = false;
        var handledResult;
        innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
          handledResult = innerFrom_1.innerFrom(selector(err, catchError(selector)(source)));
          if (innerSub) {
            innerSub.unsubscribe();
            innerSub = null;
            handledResult.subscribe(subscriber);
          } else {
            syncUnsub = true;
          }
        }));
        if (syncUnsub) {
          innerSub.unsubscribe();
          innerSub = null;
          handledResult.subscribe(subscriber);
        }
      });
    }
    exports.catchError = catchError;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/scanInternals.js
var require_scanInternals = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/scanInternals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scanInternals = void 0;
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function scanInternals(accumulator, seed, hasSeed, emitOnNext, emitBeforeComplete) {
      return function(source, subscriber) {
        var hasState = hasSeed;
        var state = seed;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var i = index++;
          state = hasState ? accumulator(state, value, i) : (hasState = true, value);
          emitOnNext && subscriber.next(state);
        }, emitBeforeComplete && (function() {
          hasState && subscriber.next(state);
          subscriber.complete();
        })));
      };
    }
    exports.scanInternals = scanInternals;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/reduce.js
var require_reduce = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/reduce.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reduce = void 0;
    var scanInternals_1 = require_scanInternals();
    var lift_1 = require_lift();
    function reduce(accumulator, seed) {
      return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, false, true));
    }
    exports.reduce = reduce;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/toArray.js
var require_toArray = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/toArray.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toArray = void 0;
    var reduce_1 = require_reduce();
    var lift_1 = require_lift();
    var arrReducer = function(arr, value) {
      return arr.push(value), arr;
    };
    function toArray() {
      return lift_1.operate(function(source, subscriber) {
        reduce_1.reduce(arrReducer, [])(source).subscribe(subscriber);
      });
    }
    exports.toArray = toArray;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/joinAllInternals.js
var require_joinAllInternals = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/joinAllInternals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.joinAllInternals = void 0;
    var identity_1 = require_identity();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var pipe_1 = require_pipe();
    var mergeMap_1 = require_mergeMap();
    var toArray_1 = require_toArray();
    function joinAllInternals(joinFn, project) {
      return pipe_1.pipe(toArray_1.toArray(), mergeMap_1.mergeMap(function(sources) {
        return joinFn(sources);
      }), project ? mapOneOrManyArgs_1.mapOneOrManyArgs(project) : identity_1.identity);
    }
    exports.joinAllInternals = joinAllInternals;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/combineLatestAll.js
var require_combineLatestAll = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/combineLatestAll.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineLatestAll = void 0;
    var combineLatest_1 = require_combineLatest();
    var joinAllInternals_1 = require_joinAllInternals();
    function combineLatestAll(project) {
      return joinAllInternals_1.joinAllInternals(combineLatest_1.combineLatest, project);
    }
    exports.combineLatestAll = combineLatestAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/combineAll.js
var require_combineAll = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/combineAll.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineAll = void 0;
    var combineLatestAll_1 = require_combineLatestAll();
    exports.combineAll = combineLatestAll_1.combineLatestAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/combineLatest.js
var require_combineLatest2 = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/combineLatest.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineLatest = void 0;
    var combineLatest_1 = require_combineLatest();
    var lift_1 = require_lift();
    var argsOrArgArray_1 = require_argsOrArgArray();
    var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
    var pipe_1 = require_pipe();
    var args_1 = require_args();
    function combineLatest() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var resultSelector = args_1.popResultSelector(args);
      return resultSelector ? pipe_1.pipe(combineLatest.apply(void 0, __spreadArray([], __read(args))), mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : lift_1.operate(function(source, subscriber) {
        combineLatest_1.combineLatestInit(__spreadArray([source], __read(argsOrArgArray_1.argsOrArgArray(args))))(subscriber);
      });
    }
    exports.combineLatest = combineLatest;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/combineLatestWith.js
var require_combineLatestWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/combineLatestWith.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineLatestWith = void 0;
    var combineLatest_1 = require_combineLatest2();
    function combineLatestWith() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return combineLatest_1.combineLatest.apply(void 0, __spreadArray([], __read(otherSources)));
    }
    exports.combineLatestWith = combineLatestWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/concatMap.js
var require_concatMap = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/concatMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concatMap = void 0;
    var mergeMap_1 = require_mergeMap();
    var isFunction_1 = require_isFunction();
    function concatMap(project, resultSelector) {
      return isFunction_1.isFunction(resultSelector) ? mergeMap_1.mergeMap(project, resultSelector, 1) : mergeMap_1.mergeMap(project, 1);
    }
    exports.concatMap = concatMap;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/concatMapTo.js
var require_concatMapTo = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/concatMapTo.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concatMapTo = void 0;
    var concatMap_1 = require_concatMap();
    var isFunction_1 = require_isFunction();
    function concatMapTo(innerObservable, resultSelector) {
      return isFunction_1.isFunction(resultSelector) ? concatMap_1.concatMap(function() {
        return innerObservable;
      }, resultSelector) : concatMap_1.concatMap(function() {
        return innerObservable;
      });
    }
    exports.concatMapTo = concatMapTo;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/concat.js
var require_concat2 = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/concat.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concat = void 0;
    var lift_1 = require_lift();
    var concatAll_1 = require_concatAll();
    var args_1 = require_args();
    var from_1 = require_from();
    function concat() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      return lift_1.operate(function(source, subscriber) {
        concatAll_1.concatAll()(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
      });
    }
    exports.concat = concat;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/concatWith.js
var require_concatWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/concatWith.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concatWith = void 0;
    var concat_1 = require_concat2();
    function concatWith() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return concat_1.concat.apply(void 0, __spreadArray([], __read(otherSources)));
    }
    exports.concatWith = concatWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/fromSubscribable.js
var require_fromSubscribable = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/observable/fromSubscribable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromSubscribable = void 0;
    var Observable_1 = require_Observable();
    function fromSubscribable(subscribable) {
      return new Observable_1.Observable(function(subscriber) {
        return subscribable.subscribe(subscriber);
      });
    }
    exports.fromSubscribable = fromSubscribable;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/connect.js
var require_connect = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/connect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connect = void 0;
    var Subject_1 = require_Subject();
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var fromSubscribable_1 = require_fromSubscribable();
    var DEFAULT_CONFIG = {
      connector: function() {
        return new Subject_1.Subject();
      }
    };
    function connect(selector, config) {
      if (config === void 0) {
        config = DEFAULT_CONFIG;
      }
      var connector = config.connector;
      return lift_1.operate(function(source, subscriber) {
        var subject = connector();
        innerFrom_1.innerFrom(selector(fromSubscribable_1.fromSubscribable(subject))).subscribe(subscriber);
        subscriber.add(source.subscribe(subject));
      });
    }
    exports.connect = connect;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/count.js
var require_count = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/count.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.count = void 0;
    var reduce_1 = require_reduce();
    function count(predicate) {
      return reduce_1.reduce(function(total, value, i) {
        return !predicate || predicate(value, i) ? total + 1 : total;
      }, 0);
    }
    exports.count = count;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/debounce.js
var require_debounce = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/debounce.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.debounce = void 0;
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function debounce(durationSelector) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var emit = function() {
          durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
          durationSubscriber = null;
          if (hasValue) {
            hasValue = false;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
          hasValue = true;
          lastValue = value;
          durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, emit, noop_1.noop);
          innerFrom_1.innerFrom(durationSelector(value)).subscribe(durationSubscriber);
        }, function() {
          emit();
          subscriber.complete();
        }, void 0, function() {
          lastValue = durationSubscriber = null;
        }));
      });
    }
    exports.debounce = debounce;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/debounceTime.js
var require_debounceTime = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/debounceTime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.debounceTime = void 0;
    var async_1 = require_async();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function debounceTime(dueTime, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return lift_1.operate(function(source, subscriber) {
        var activeTask = null;
        var lastValue = null;
        var lastTime = null;
        var emit = function() {
          if (activeTask) {
            activeTask.unsubscribe();
            activeTask = null;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
        };
        function emitWhenIdle() {
          var targetTime = lastTime + dueTime;
          var now = scheduler.now();
          if (now < targetTime) {
            activeTask = this.schedule(void 0, targetTime - now);
            subscriber.add(activeTask);
            return;
          }
          emit();
        }
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          lastValue = value;
          lastTime = scheduler.now();
          if (!activeTask) {
            activeTask = scheduler.schedule(emitWhenIdle, dueTime);
            subscriber.add(activeTask);
          }
        }, function() {
          emit();
          subscriber.complete();
        }, void 0, function() {
          lastValue = activeTask = null;
        }));
      });
    }
    exports.debounceTime = debounceTime;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/defaultIfEmpty.js
var require_defaultIfEmpty = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/defaultIfEmpty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultIfEmpty = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function defaultIfEmpty(defaultValue) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          subscriber.next(value);
        }, function() {
          if (!hasValue) {
            subscriber.next(defaultValue);
          }
          subscriber.complete();
        }));
      });
    }
    exports.defaultIfEmpty = defaultIfEmpty;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/take.js
var require_take = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/take.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.take = void 0;
    var empty_1 = require_empty();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function take(count) {
      return count <= 0 ? function() {
        return empty_1.EMPTY;
      } : lift_1.operate(function(source, subscriber) {
        var seen = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (++seen <= count) {
            subscriber.next(value);
            if (count <= seen) {
              subscriber.complete();
            }
          }
        }));
      });
    }
    exports.take = take;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/ignoreElements.js
var require_ignoreElements = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/ignoreElements.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ignoreElements = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    function ignoreElements() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, noop_1.noop));
      });
    }
    exports.ignoreElements = ignoreElements;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mapTo.js
var require_mapTo = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/mapTo.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mapTo = void 0;
    var map_1 = require_map();
    function mapTo(value) {
      return map_1.map(function() {
        return value;
      });
    }
    exports.mapTo = mapTo;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/delayWhen.js
var require_delayWhen = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/delayWhen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.delayWhen = void 0;
    var concat_1 = require_concat();
    var take_1 = require_take();
    var ignoreElements_1 = require_ignoreElements();
    var mapTo_1 = require_mapTo();
    var mergeMap_1 = require_mergeMap();
    var innerFrom_1 = require_innerFrom();
    function delayWhen(delayDurationSelector, subscriptionDelay) {
      if (subscriptionDelay) {
        return function(source) {
          return concat_1.concat(subscriptionDelay.pipe(take_1.take(1), ignoreElements_1.ignoreElements()), source.pipe(delayWhen(delayDurationSelector)));
        };
      }
      return mergeMap_1.mergeMap(function(value, index) {
        return innerFrom_1.innerFrom(delayDurationSelector(value, index)).pipe(take_1.take(1), mapTo_1.mapTo(value));
      });
    }
    exports.delayWhen = delayWhen;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/delay.js
var require_delay = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/delay.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.delay = void 0;
    var async_1 = require_async();
    var delayWhen_1 = require_delayWhen();
    var timer_1 = require_timer();
    function delay(due, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      var duration = timer_1.timer(due, scheduler);
      return delayWhen_1.delayWhen(function() {
        return duration;
      });
    }
    exports.delay = delay;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/dematerialize.js
var require_dematerialize = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/dematerialize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dematerialize = void 0;
    var Notification_1 = require_Notification();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function dematerialize() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(notification) {
          return Notification_1.observeNotification(notification, subscriber);
        }));
      });
    }
    exports.dematerialize = dematerialize;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/distinct.js
var require_distinct = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/distinct.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.distinct = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var innerFrom_1 = require_innerFrom();
    function distinct(keySelector, flushes) {
      return lift_1.operate(function(source, subscriber) {
        var distinctKeys = /* @__PURE__ */ new Set();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var key = keySelector ? keySelector(value) : value;
          if (!distinctKeys.has(key)) {
            distinctKeys.add(key);
            subscriber.next(value);
          }
        }));
        flushes && innerFrom_1.innerFrom(flushes).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          return distinctKeys.clear();
        }, noop_1.noop));
      });
    }
    exports.distinct = distinct;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/distinctUntilChanged.js
var require_distinctUntilChanged = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/distinctUntilChanged.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.distinctUntilChanged = void 0;
    var identity_1 = require_identity();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function distinctUntilChanged(comparator, keySelector) {
      if (keySelector === void 0) {
        keySelector = identity_1.identity;
      }
      comparator = comparator !== null && comparator !== void 0 ? comparator : defaultCompare;
      return lift_1.operate(function(source, subscriber) {
        var previousKey;
        var first = true;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var currentKey = keySelector(value);
          if (first || !comparator(previousKey, currentKey)) {
            first = false;
            previousKey = currentKey;
            subscriber.next(value);
          }
        }));
      });
    }
    exports.distinctUntilChanged = distinctUntilChanged;
    function defaultCompare(a, b) {
      return a === b;
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/distinctUntilKeyChanged.js
var require_distinctUntilKeyChanged = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/distinctUntilKeyChanged.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.distinctUntilKeyChanged = void 0;
    var distinctUntilChanged_1 = require_distinctUntilChanged();
    function distinctUntilKeyChanged(key, compare) {
      return distinctUntilChanged_1.distinctUntilChanged(function(x, y) {
        return compare ? compare(x[key], y[key]) : x[key] === y[key];
      });
    }
    exports.distinctUntilKeyChanged = distinctUntilKeyChanged;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/throwIfEmpty.js
var require_throwIfEmpty = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/throwIfEmpty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.throwIfEmpty = void 0;
    var EmptyError_1 = require_EmptyError();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function throwIfEmpty(errorFactory) {
      if (errorFactory === void 0) {
        errorFactory = defaultErrorFactory;
      }
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          subscriber.next(value);
        }, function() {
          return hasValue ? subscriber.complete() : subscriber.error(errorFactory());
        }));
      });
    }
    exports.throwIfEmpty = throwIfEmpty;
    function defaultErrorFactory() {
      return new EmptyError_1.EmptyError();
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/elementAt.js
var require_elementAt = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/elementAt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.elementAt = void 0;
    var ArgumentOutOfRangeError_1 = require_ArgumentOutOfRangeError();
    var filter_1 = require_filter();
    var throwIfEmpty_1 = require_throwIfEmpty();
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    var take_1 = require_take();
    function elementAt(index, defaultValue) {
      if (index < 0) {
        throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError();
      }
      var hasDefaultValue = arguments.length >= 2;
      return function(source) {
        return source.pipe(filter_1.filter(function(v, i) {
          return i === index;
        }), take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
          return new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError();
        }));
      };
    }
    exports.elementAt = elementAt;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/endWith.js
var require_endWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/endWith.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.endWith = void 0;
    var concat_1 = require_concat();
    var of_1 = require_of();
    function endWith() {
      var values = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
      }
      return function(source) {
        return concat_1.concat(source, of_1.of.apply(void 0, __spreadArray([], __read(values))));
      };
    }
    exports.endWith = endWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/every.js
var require_every = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/every.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.every = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function every(predicate, thisArg) {
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (!predicate.call(thisArg, value, index++, source)) {
            subscriber.next(false);
            subscriber.complete();
          }
        }, function() {
          subscriber.next(true);
          subscriber.complete();
        }));
      });
    }
    exports.every = every;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/exhaustMap.js
var require_exhaustMap = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/exhaustMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.exhaustMap = void 0;
    var map_1 = require_map();
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function exhaustMap(project, resultSelector) {
      if (resultSelector) {
        return function(source) {
          return source.pipe(exhaustMap(function(a, i) {
            return innerFrom_1.innerFrom(project(a, i)).pipe(map_1.map(function(b, ii) {
              return resultSelector(a, b, i, ii);
            }));
          }));
        };
      }
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        var innerSub = null;
        var isComplete = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(outerValue) {
          if (!innerSub) {
            innerSub = OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, function() {
              innerSub = null;
              isComplete && subscriber.complete();
            });
            innerFrom_1.innerFrom(project(outerValue, index++)).subscribe(innerSub);
          }
        }, function() {
          isComplete = true;
          !innerSub && subscriber.complete();
        }));
      });
    }
    exports.exhaustMap = exhaustMap;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/exhaustAll.js
var require_exhaustAll = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/exhaustAll.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.exhaustAll = void 0;
    var exhaustMap_1 = require_exhaustMap();
    var identity_1 = require_identity();
    function exhaustAll() {
      return exhaustMap_1.exhaustMap(identity_1.identity);
    }
    exports.exhaustAll = exhaustAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/exhaust.js
var require_exhaust = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/exhaust.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.exhaust = void 0;
    var exhaustAll_1 = require_exhaustAll();
    exports.exhaust = exhaustAll_1.exhaustAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/expand.js
var require_expand = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/expand.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.expand = void 0;
    var lift_1 = require_lift();
    var mergeInternals_1 = require_mergeInternals();
    function expand(project, concurrent, scheduler) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
      return lift_1.operate(function(source, subscriber) {
        return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent, void 0, true, scheduler);
      });
    }
    exports.expand = expand;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/finalize.js
var require_finalize = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/finalize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.finalize = void 0;
    var lift_1 = require_lift();
    function finalize(callback) {
      return lift_1.operate(function(source, subscriber) {
        try {
          source.subscribe(subscriber);
        } finally {
          subscriber.add(callback);
        }
      });
    }
    exports.finalize = finalize;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/find.js
var require_find = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/find.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFind = exports.find = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function find(predicate, thisArg) {
      return lift_1.operate(createFind(predicate, thisArg, "value"));
    }
    exports.find = find;
    function createFind(predicate, thisArg, emit) {
      var findIndex = emit === "index";
      return function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var i = index++;
          if (predicate.call(thisArg, value, i, source)) {
            subscriber.next(findIndex ? i : value);
            subscriber.complete();
          }
        }, function() {
          subscriber.next(findIndex ? -1 : void 0);
          subscriber.complete();
        }));
      };
    }
    exports.createFind = createFind;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/findIndex.js
var require_findIndex = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/findIndex.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findIndex = void 0;
    var lift_1 = require_lift();
    var find_1 = require_find();
    function findIndex(predicate, thisArg) {
      return lift_1.operate(find_1.createFind(predicate, thisArg, "index"));
    }
    exports.findIndex = findIndex;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/first.js
var require_first = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/first.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.first = void 0;
    var EmptyError_1 = require_EmptyError();
    var filter_1 = require_filter();
    var take_1 = require_take();
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    var throwIfEmpty_1 = require_throwIfEmpty();
    var identity_1 = require_identity();
    function first(predicate, defaultValue) {
      var hasDefaultValue = arguments.length >= 2;
      return function(source) {
        return source.pipe(predicate ? filter_1.filter(function(v, i) {
          return predicate(v, i, source);
        }) : identity_1.identity, take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
          return new EmptyError_1.EmptyError();
        }));
      };
    }
    exports.first = first;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/groupBy.js
var require_groupBy = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/groupBy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupBy = void 0;
    var Observable_1 = require_Observable();
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function groupBy(keySelector, elementOrOptions, duration, connector) {
      return lift_1.operate(function(source, subscriber) {
        var element;
        if (!elementOrOptions || typeof elementOrOptions === "function") {
          element = elementOrOptions;
        } else {
          duration = elementOrOptions.duration, element = elementOrOptions.element, connector = elementOrOptions.connector;
        }
        var groups = /* @__PURE__ */ new Map();
        var notify = function(cb) {
          groups.forEach(cb);
          cb(subscriber);
        };
        var handleError = function(err) {
          return notify(function(consumer) {
            return consumer.error(err);
          });
        };
        var activeGroups = 0;
        var teardownAttempted = false;
        var groupBySourceSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, function(value) {
          try {
            var key_1 = keySelector(value);
            var group_1 = groups.get(key_1);
            if (!group_1) {
              groups.set(key_1, group_1 = connector ? connector() : new Subject_1.Subject());
              var grouped = createGroupedObservable(key_1, group_1);
              subscriber.next(grouped);
              if (duration) {
                var durationSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(group_1, function() {
                  group_1.complete();
                  durationSubscriber_1 === null || durationSubscriber_1 === void 0 ? void 0 : durationSubscriber_1.unsubscribe();
                }, void 0, void 0, function() {
                  return groups.delete(key_1);
                });
                groupBySourceSubscriber.add(innerFrom_1.innerFrom(duration(grouped)).subscribe(durationSubscriber_1));
              }
            }
            group_1.next(element ? element(value) : value);
          } catch (err) {
            handleError(err);
          }
        }, function() {
          return notify(function(consumer) {
            return consumer.complete();
          });
        }, handleError, function() {
          return groups.clear();
        }, function() {
          teardownAttempted = true;
          return activeGroups === 0;
        });
        source.subscribe(groupBySourceSubscriber);
        function createGroupedObservable(key, groupSubject) {
          var result = new Observable_1.Observable(function(groupSubscriber) {
            activeGroups++;
            var innerSub = groupSubject.subscribe(groupSubscriber);
            return function() {
              innerSub.unsubscribe();
              --activeGroups === 0 && teardownAttempted && groupBySourceSubscriber.unsubscribe();
            };
          });
          result.key = key;
          return result;
        }
      });
    }
    exports.groupBy = groupBy;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/isEmpty.js
var require_isEmpty = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/isEmpty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isEmpty = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function isEmpty() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          subscriber.next(false);
          subscriber.complete();
        }, function() {
          subscriber.next(true);
          subscriber.complete();
        }));
      });
    }
    exports.isEmpty = isEmpty;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/takeLast.js
var require_takeLast = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/takeLast.js"(exports) {
    "use strict";
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.takeLast = void 0;
    var empty_1 = require_empty();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function takeLast(count) {
      return count <= 0 ? function() {
        return empty_1.EMPTY;
      } : lift_1.operate(function(source, subscriber) {
        var buffer = [];
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          buffer.push(value);
          count < buffer.length && buffer.shift();
        }, function() {
          var e_1, _a;
          try {
            for (var buffer_1 = __values(buffer), buffer_1_1 = buffer_1.next(); !buffer_1_1.done; buffer_1_1 = buffer_1.next()) {
              var value = buffer_1_1.value;
              subscriber.next(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (buffer_1_1 && !buffer_1_1.done && (_a = buffer_1.return)) _a.call(buffer_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          subscriber.complete();
        }, void 0, function() {
          buffer = null;
        }));
      });
    }
    exports.takeLast = takeLast;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/last.js
var require_last = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/last.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.last = void 0;
    var EmptyError_1 = require_EmptyError();
    var filter_1 = require_filter();
    var takeLast_1 = require_takeLast();
    var throwIfEmpty_1 = require_throwIfEmpty();
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    var identity_1 = require_identity();
    function last(predicate, defaultValue) {
      var hasDefaultValue = arguments.length >= 2;
      return function(source) {
        return source.pipe(predicate ? filter_1.filter(function(v, i) {
          return predicate(v, i, source);
        }) : identity_1.identity, takeLast_1.takeLast(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
          return new EmptyError_1.EmptyError();
        }));
      };
    }
    exports.last = last;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/materialize.js
var require_materialize = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/materialize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.materialize = void 0;
    var Notification_1 = require_Notification();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function materialize() {
      return lift_1.operate(function(source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          subscriber.next(Notification_1.Notification.createNext(value));
        }, function() {
          subscriber.next(Notification_1.Notification.createComplete());
          subscriber.complete();
        }, function(err) {
          subscriber.next(Notification_1.Notification.createError(err));
          subscriber.complete();
        }));
      });
    }
    exports.materialize = materialize;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/max.js
var require_max = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/max.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.max = void 0;
    var reduce_1 = require_reduce();
    var isFunction_1 = require_isFunction();
    function max(comparer) {
      return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function(x, y) {
        return comparer(x, y) > 0 ? x : y;
      } : function(x, y) {
        return x > y ? x : y;
      });
    }
    exports.max = max;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/flatMap.js
var require_flatMap = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/flatMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flatMap = void 0;
    var mergeMap_1 = require_mergeMap();
    exports.flatMap = mergeMap_1.mergeMap;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeMapTo.js
var require_mergeMapTo = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/mergeMapTo.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeMapTo = void 0;
    var mergeMap_1 = require_mergeMap();
    var isFunction_1 = require_isFunction();
    function mergeMapTo(innerObservable, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      if (isFunction_1.isFunction(resultSelector)) {
        return mergeMap_1.mergeMap(function() {
          return innerObservable;
        }, resultSelector, concurrent);
      }
      if (typeof resultSelector === "number") {
        concurrent = resultSelector;
      }
      return mergeMap_1.mergeMap(function() {
        return innerObservable;
      }, concurrent);
    }
    exports.mergeMapTo = mergeMapTo;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeScan.js
var require_mergeScan = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/mergeScan.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeScan = void 0;
    var lift_1 = require_lift();
    var mergeInternals_1 = require_mergeInternals();
    function mergeScan(accumulator, seed, concurrent) {
      if (concurrent === void 0) {
        concurrent = Infinity;
      }
      return lift_1.operate(function(source, subscriber) {
        var state = seed;
        return mergeInternals_1.mergeInternals(source, subscriber, function(value, index) {
          return accumulator(state, value, index);
        }, concurrent, function(value) {
          state = value;
        }, false, void 0, function() {
          return state = null;
        });
      });
    }
    exports.mergeScan = mergeScan;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/merge.js
var require_merge2 = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/merge.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    var lift_1 = require_lift();
    var mergeAll_1 = require_mergeAll();
    var args_1 = require_args();
    var from_1 = require_from();
    function merge() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(args);
      var concurrent = args_1.popNumber(args, Infinity);
      return lift_1.operate(function(source, subscriber) {
        mergeAll_1.mergeAll(concurrent)(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
      });
    }
    exports.merge = merge;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeWith.js
var require_mergeWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/mergeWith.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeWith = void 0;
    var merge_1 = require_merge2();
    function mergeWith() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return merge_1.merge.apply(void 0, __spreadArray([], __read(otherSources)));
    }
    exports.mergeWith = mergeWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/min.js
var require_min = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/min.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.min = void 0;
    var reduce_1 = require_reduce();
    var isFunction_1 = require_isFunction();
    function min(comparer) {
      return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function(x, y) {
        return comparer(x, y) < 0 ? x : y;
      } : function(x, y) {
        return x < y ? x : y;
      });
    }
    exports.min = min;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/multicast.js
var require_multicast = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/multicast.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.multicast = void 0;
    var ConnectableObservable_1 = require_ConnectableObservable();
    var isFunction_1 = require_isFunction();
    var connect_1 = require_connect();
    function multicast(subjectOrSubjectFactory, selector) {
      var subjectFactory = isFunction_1.isFunction(subjectOrSubjectFactory) ? subjectOrSubjectFactory : function() {
        return subjectOrSubjectFactory;
      };
      if (isFunction_1.isFunction(selector)) {
        return connect_1.connect(selector, {
          connector: subjectFactory
        });
      }
      return function(source) {
        return new ConnectableObservable_1.ConnectableObservable(source, subjectFactory);
      };
    }
    exports.multicast = multicast;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/onErrorResumeNextWith.js
var require_onErrorResumeNextWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/onErrorResumeNextWith.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onErrorResumeNext = exports.onErrorResumeNextWith = void 0;
    var argsOrArgArray_1 = require_argsOrArgArray();
    var onErrorResumeNext_1 = require_onErrorResumeNext();
    function onErrorResumeNextWith() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
      return function(source) {
        return onErrorResumeNext_1.onErrorResumeNext.apply(void 0, __spreadArray([source], __read(nextSources)));
      };
    }
    exports.onErrorResumeNextWith = onErrorResumeNextWith;
    exports.onErrorResumeNext = onErrorResumeNextWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/pairwise.js
var require_pairwise = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/pairwise.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pairwise = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function pairwise() {
      return lift_1.operate(function(source, subscriber) {
        var prev;
        var hasPrev = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var p = prev;
          prev = value;
          hasPrev && subscriber.next([p, value]);
          hasPrev = true;
        }));
      });
    }
    exports.pairwise = pairwise;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/pluck.js
var require_pluck = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/pluck.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pluck = void 0;
    var map_1 = require_map();
    function pluck() {
      var properties = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        properties[_i] = arguments[_i];
      }
      var length = properties.length;
      if (length === 0) {
        throw new Error("list of properties cannot be empty.");
      }
      return map_1.map(function(x) {
        var currentProp = x;
        for (var i = 0; i < length; i++) {
          var p = currentProp === null || currentProp === void 0 ? void 0 : currentProp[properties[i]];
          if (typeof p !== "undefined") {
            currentProp = p;
          } else {
            return void 0;
          }
        }
        return currentProp;
      });
    }
    exports.pluck = pluck;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/publish.js
var require_publish = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/publish.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.publish = void 0;
    var Subject_1 = require_Subject();
    var multicast_1 = require_multicast();
    var connect_1 = require_connect();
    function publish(selector) {
      return selector ? function(source) {
        return connect_1.connect(selector)(source);
      } : function(source) {
        return multicast_1.multicast(new Subject_1.Subject())(source);
      };
    }
    exports.publish = publish;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/publishBehavior.js
var require_publishBehavior = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/publishBehavior.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.publishBehavior = void 0;
    var BehaviorSubject_1 = require_BehaviorSubject();
    var ConnectableObservable_1 = require_ConnectableObservable();
    function publishBehavior(initialValue) {
      return function(source) {
        var subject = new BehaviorSubject_1.BehaviorSubject(initialValue);
        return new ConnectableObservable_1.ConnectableObservable(source, function() {
          return subject;
        });
      };
    }
    exports.publishBehavior = publishBehavior;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/publishLast.js
var require_publishLast = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/publishLast.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.publishLast = void 0;
    var AsyncSubject_1 = require_AsyncSubject();
    var ConnectableObservable_1 = require_ConnectableObservable();
    function publishLast() {
      return function(source) {
        var subject = new AsyncSubject_1.AsyncSubject();
        return new ConnectableObservable_1.ConnectableObservable(source, function() {
          return subject;
        });
      };
    }
    exports.publishLast = publishLast;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/publishReplay.js
var require_publishReplay = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/publishReplay.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.publishReplay = void 0;
    var ReplaySubject_1 = require_ReplaySubject();
    var multicast_1 = require_multicast();
    var isFunction_1 = require_isFunction();
    function publishReplay(bufferSize, windowTime, selectorOrScheduler, timestampProvider) {
      if (selectorOrScheduler && !isFunction_1.isFunction(selectorOrScheduler)) {
        timestampProvider = selectorOrScheduler;
      }
      var selector = isFunction_1.isFunction(selectorOrScheduler) ? selectorOrScheduler : void 0;
      return function(source) {
        return multicast_1.multicast(new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, timestampProvider), selector)(source);
      };
    }
    exports.publishReplay = publishReplay;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/raceWith.js
var require_raceWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/raceWith.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.raceWith = void 0;
    var race_1 = require_race();
    var lift_1 = require_lift();
    var identity_1 = require_identity();
    function raceWith() {
      var otherSources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
      }
      return !otherSources.length ? identity_1.identity : lift_1.operate(function(source, subscriber) {
        race_1.raceInit(__spreadArray([source], __read(otherSources)))(subscriber);
      });
    }
    exports.raceWith = raceWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/repeat.js
var require_repeat = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/repeat.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.repeat = void 0;
    var empty_1 = require_empty();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var timer_1 = require_timer();
    function repeat(countOrConfig) {
      var _a;
      var count = Infinity;
      var delay;
      if (countOrConfig != null) {
        if (typeof countOrConfig === "object") {
          _a = countOrConfig.count, count = _a === void 0 ? Infinity : _a, delay = countOrConfig.delay;
        } else {
          count = countOrConfig;
        }
      }
      return count <= 0 ? function() {
        return empty_1.EMPTY;
      } : lift_1.operate(function(source, subscriber) {
        var soFar = 0;
        var sourceSub;
        var resubscribe = function() {
          sourceSub === null || sourceSub === void 0 ? void 0 : sourceSub.unsubscribe();
          sourceSub = null;
          if (delay != null) {
            var notifier = typeof delay === "number" ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(soFar));
            var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
              notifierSubscriber_1.unsubscribe();
              subscribeToSource();
            });
            notifier.subscribe(notifierSubscriber_1);
          } else {
            subscribeToSource();
          }
        };
        var subscribeToSource = function() {
          var syncUnsub = false;
          sourceSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, function() {
            if (++soFar < count) {
              if (sourceSub) {
                resubscribe();
              } else {
                syncUnsub = true;
              }
            } else {
              subscriber.complete();
            }
          }));
          if (syncUnsub) {
            resubscribe();
          }
        };
        subscribeToSource();
      });
    }
    exports.repeat = repeat;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/repeatWhen.js
var require_repeatWhen = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/repeatWhen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.repeatWhen = void 0;
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function repeatWhen(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var innerSub;
        var syncResub = false;
        var completions$;
        var isNotifierComplete = false;
        var isMainComplete = false;
        var checkComplete = function() {
          return isMainComplete && isNotifierComplete && (subscriber.complete(), true);
        };
        var getCompletionSubject = function() {
          if (!completions$) {
            completions$ = new Subject_1.Subject();
            innerFrom_1.innerFrom(notifier(completions$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
              if (innerSub) {
                subscribeForRepeatWhen();
              } else {
                syncResub = true;
              }
            }, function() {
              isNotifierComplete = true;
              checkComplete();
            }));
          }
          return completions$;
        };
        var subscribeForRepeatWhen = function() {
          isMainComplete = false;
          innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, function() {
            isMainComplete = true;
            !checkComplete() && getCompletionSubject().next();
          }));
          if (syncResub) {
            innerSub.unsubscribe();
            innerSub = null;
            syncResub = false;
            subscribeForRepeatWhen();
          }
        };
        subscribeForRepeatWhen();
      });
    }
    exports.repeatWhen = repeatWhen;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/retry.js
var require_retry = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/retry.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.retry = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var identity_1 = require_identity();
    var timer_1 = require_timer();
    var innerFrom_1 = require_innerFrom();
    function retry(configOrCount) {
      if (configOrCount === void 0) {
        configOrCount = Infinity;
      }
      var config;
      if (configOrCount && typeof configOrCount === "object") {
        config = configOrCount;
      } else {
        config = {
          count: configOrCount
        };
      }
      var _a = config.count, count = _a === void 0 ? Infinity : _a, delay = config.delay, _b = config.resetOnSuccess, resetOnSuccess = _b === void 0 ? false : _b;
      return count <= 0 ? identity_1.identity : lift_1.operate(function(source, subscriber) {
        var soFar = 0;
        var innerSub;
        var subscribeForRetry = function() {
          var syncUnsub = false;
          innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            if (resetOnSuccess) {
              soFar = 0;
            }
            subscriber.next(value);
          }, void 0, function(err) {
            if (soFar++ < count) {
              var resub_1 = function() {
                if (innerSub) {
                  innerSub.unsubscribe();
                  innerSub = null;
                  subscribeForRetry();
                } else {
                  syncUnsub = true;
                }
              };
              if (delay != null) {
                var notifier = typeof delay === "number" ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(err, soFar));
                var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
                  notifierSubscriber_1.unsubscribe();
                  resub_1();
                }, function() {
                  subscriber.complete();
                });
                notifier.subscribe(notifierSubscriber_1);
              } else {
                resub_1();
              }
            } else {
              subscriber.error(err);
            }
          }));
          if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            subscribeForRetry();
          }
        };
        subscribeForRetry();
      });
    }
    exports.retry = retry;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/retryWhen.js
var require_retryWhen = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/retryWhen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.retryWhen = void 0;
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function retryWhen(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var innerSub;
        var syncResub = false;
        var errors$;
        var subscribeForRetryWhen = function() {
          innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
            if (!errors$) {
              errors$ = new Subject_1.Subject();
              innerFrom_1.innerFrom(notifier(errors$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
                return innerSub ? subscribeForRetryWhen() : syncResub = true;
              }));
            }
            if (errors$) {
              errors$.next(err);
            }
          }));
          if (syncResub) {
            innerSub.unsubscribe();
            innerSub = null;
            syncResub = false;
            subscribeForRetryWhen();
          }
        };
        subscribeForRetryWhen();
      });
    }
    exports.retryWhen = retryWhen;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/sample.js
var require_sample = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/sample.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sample = void 0;
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var noop_1 = require_noop();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function sample(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          lastValue = value;
        }));
        innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          if (hasValue) {
            hasValue = false;
            var value = lastValue;
            lastValue = null;
            subscriber.next(value);
          }
        }, noop_1.noop));
      });
    }
    exports.sample = sample;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/sampleTime.js
var require_sampleTime = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/sampleTime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sampleTime = void 0;
    var async_1 = require_async();
    var sample_1 = require_sample();
    var interval_1 = require_interval();
    function sampleTime(period, scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return sample_1.sample(interval_1.interval(period, scheduler));
    }
    exports.sampleTime = sampleTime;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/scan.js
var require_scan = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/scan.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scan = void 0;
    var lift_1 = require_lift();
    var scanInternals_1 = require_scanInternals();
    function scan(accumulator, seed) {
      return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, true));
    }
    exports.scan = scan;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/sequenceEqual.js
var require_sequenceEqual = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/sequenceEqual.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sequenceEqual = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function sequenceEqual(compareTo, comparator) {
      if (comparator === void 0) {
        comparator = function(a, b) {
          return a === b;
        };
      }
      return lift_1.operate(function(source, subscriber) {
        var aState = createState();
        var bState = createState();
        var emit = function(isEqual) {
          subscriber.next(isEqual);
          subscriber.complete();
        };
        var createSubscriber = function(selfState, otherState) {
          var sequenceEqualSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(a) {
            var buffer = otherState.buffer, complete = otherState.complete;
            if (buffer.length === 0) {
              complete ? emit(false) : selfState.buffer.push(a);
            } else {
              !comparator(a, buffer.shift()) && emit(false);
            }
          }, function() {
            selfState.complete = true;
            var complete = otherState.complete, buffer = otherState.buffer;
            complete && emit(buffer.length === 0);
            sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
          });
          return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom_1.innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
      });
    }
    exports.sequenceEqual = sequenceEqual;
    function createState() {
      return {
        buffer: [],
        complete: false
      };
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/share.js
var require_share = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/share.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.share = void 0;
    var innerFrom_1 = require_innerFrom();
    var Subject_1 = require_Subject();
    var Subscriber_1 = require_Subscriber();
    var lift_1 = require_lift();
    function share(options) {
      if (options === void 0) {
        options = {};
      }
      var _a = options.connector, connector = _a === void 0 ? function() {
        return new Subject_1.Subject();
      } : _a, _b = options.resetOnError, resetOnError = _b === void 0 ? true : _b, _c = options.resetOnComplete, resetOnComplete = _c === void 0 ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === void 0 ? true : _d;
      return function(wrapperSource) {
        var connection;
        var resetConnection;
        var subject;
        var refCount = 0;
        var hasCompleted = false;
        var hasErrored = false;
        var cancelReset = function() {
          resetConnection === null || resetConnection === void 0 ? void 0 : resetConnection.unsubscribe();
          resetConnection = void 0;
        };
        var reset = function() {
          cancelReset();
          connection = subject = void 0;
          hasCompleted = hasErrored = false;
        };
        var resetAndUnsubscribe = function() {
          var conn = connection;
          reset();
          conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
        };
        return lift_1.operate(function(source, subscriber) {
          refCount++;
          if (!hasErrored && !hasCompleted) {
            cancelReset();
          }
          var dest = subject = subject !== null && subject !== void 0 ? subject : connector();
          subscriber.add(function() {
            refCount--;
            if (refCount === 0 && !hasErrored && !hasCompleted) {
              resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
            }
          });
          dest.subscribe(subscriber);
          if (!connection && refCount > 0) {
            connection = new Subscriber_1.SafeSubscriber({
              next: function(value) {
                return dest.next(value);
              },
              error: function(err) {
                hasErrored = true;
                cancelReset();
                resetConnection = handleReset(reset, resetOnError, err);
                dest.error(err);
              },
              complete: function() {
                hasCompleted = true;
                cancelReset();
                resetConnection = handleReset(reset, resetOnComplete);
                dest.complete();
              }
            });
            innerFrom_1.innerFrom(source).subscribe(connection);
          }
        })(wrapperSource);
      };
    }
    exports.share = share;
    function handleReset(reset, on) {
      var args = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
      }
      if (on === true) {
        reset();
        return;
      }
      if (on === false) {
        return;
      }
      var onSubscriber = new Subscriber_1.SafeSubscriber({
        next: function() {
          onSubscriber.unsubscribe();
          reset();
        }
      });
      return innerFrom_1.innerFrom(on.apply(void 0, __spreadArray([], __read(args)))).subscribe(onSubscriber);
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/shareReplay.js
var require_shareReplay = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/shareReplay.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shareReplay = void 0;
    var ReplaySubject_1 = require_ReplaySubject();
    var share_1 = require_share();
    function shareReplay(configOrBufferSize, windowTime, scheduler) {
      var _a, _b, _c;
      var bufferSize;
      var refCount = false;
      if (configOrBufferSize && typeof configOrBufferSize === "object") {
        _a = configOrBufferSize.bufferSize, bufferSize = _a === void 0 ? Infinity : _a, _b = configOrBufferSize.windowTime, windowTime = _b === void 0 ? Infinity : _b, _c = configOrBufferSize.refCount, refCount = _c === void 0 ? false : _c, scheduler = configOrBufferSize.scheduler;
      } else {
        bufferSize = configOrBufferSize !== null && configOrBufferSize !== void 0 ? configOrBufferSize : Infinity;
      }
      return share_1.share({
        connector: function() {
          return new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, scheduler);
        },
        resetOnError: true,
        resetOnComplete: false,
        resetOnRefCountZero: refCount
      });
    }
    exports.shareReplay = shareReplay;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/single.js
var require_single = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/single.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.single = void 0;
    var EmptyError_1 = require_EmptyError();
    var SequenceError_1 = require_SequenceError();
    var NotFoundError_1 = require_NotFoundError();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function single(predicate) {
      return lift_1.operate(function(source, subscriber) {
        var hasValue = false;
        var singleValue;
        var seenValue = false;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          seenValue = true;
          if (!predicate || predicate(value, index++, source)) {
            hasValue && subscriber.error(new SequenceError_1.SequenceError("Too many matching values"));
            hasValue = true;
            singleValue = value;
          }
        }, function() {
          if (hasValue) {
            subscriber.next(singleValue);
            subscriber.complete();
          } else {
            subscriber.error(seenValue ? new NotFoundError_1.NotFoundError("No matching values") : new EmptyError_1.EmptyError());
          }
        }));
      });
    }
    exports.single = single;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/skip.js
var require_skip = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/skip.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skip = void 0;
    var filter_1 = require_filter();
    function skip(count) {
      return filter_1.filter(function(_, index) {
        return count <= index;
      });
    }
    exports.skip = skip;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/skipLast.js
var require_skipLast = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/skipLast.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skipLast = void 0;
    var identity_1 = require_identity();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function skipLast(skipCount) {
      return skipCount <= 0 ? identity_1.identity : lift_1.operate(function(source, subscriber) {
        var ring = new Array(skipCount);
        var seen = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var valueIndex = seen++;
          if (valueIndex < skipCount) {
            ring[valueIndex] = value;
          } else {
            var index = valueIndex % skipCount;
            var oldValue = ring[index];
            ring[index] = value;
            subscriber.next(oldValue);
          }
        }));
        return function() {
          ring = null;
        };
      });
    }
    exports.skipLast = skipLast;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/skipUntil.js
var require_skipUntil = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/skipUntil.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skipUntil = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var noop_1 = require_noop();
    function skipUntil(notifier) {
      return lift_1.operate(function(source, subscriber) {
        var taking = false;
        var skipSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
          taking = true;
        }, noop_1.noop);
        innerFrom_1.innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return taking && subscriber.next(value);
        }));
      });
    }
    exports.skipUntil = skipUntil;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/skipWhile.js
var require_skipWhile = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/skipWhile.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skipWhile = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function skipWhile(predicate) {
      return lift_1.operate(function(source, subscriber) {
        var taking = false;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return (taking || (taking = !predicate(value, index++))) && subscriber.next(value);
        }));
      });
    }
    exports.skipWhile = skipWhile;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/startWith.js
var require_startWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/startWith.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.startWith = void 0;
    var concat_1 = require_concat();
    var args_1 = require_args();
    var lift_1 = require_lift();
    function startWith() {
      var values = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
      }
      var scheduler = args_1.popScheduler(values);
      return lift_1.operate(function(source, subscriber) {
        (scheduler ? concat_1.concat(values, source, scheduler) : concat_1.concat(values, source)).subscribe(subscriber);
      });
    }
    exports.startWith = startWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/switchMap.js
var require_switchMap = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/switchMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.switchMap = void 0;
    var innerFrom_1 = require_innerFrom();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function switchMap(project, resultSelector) {
      return lift_1.operate(function(source, subscriber) {
        var innerSubscriber = null;
        var index = 0;
        var isComplete = false;
        var checkComplete = function() {
          return isComplete && !innerSubscriber && subscriber.complete();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
          var innerIndex = 0;
          var outerIndex = index++;
          innerFrom_1.innerFrom(project(value, outerIndex)).subscribe(innerSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(innerValue) {
            return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue);
          }, function() {
            innerSubscriber = null;
            checkComplete();
          }));
        }, function() {
          isComplete = true;
          checkComplete();
        }));
      });
    }
    exports.switchMap = switchMap;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/switchAll.js
var require_switchAll = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/switchAll.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.switchAll = void 0;
    var switchMap_1 = require_switchMap();
    var identity_1 = require_identity();
    function switchAll() {
      return switchMap_1.switchMap(identity_1.identity);
    }
    exports.switchAll = switchAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/switchMapTo.js
var require_switchMapTo = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/switchMapTo.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.switchMapTo = void 0;
    var switchMap_1 = require_switchMap();
    var isFunction_1 = require_isFunction();
    function switchMapTo(innerObservable, resultSelector) {
      return isFunction_1.isFunction(resultSelector) ? switchMap_1.switchMap(function() {
        return innerObservable;
      }, resultSelector) : switchMap_1.switchMap(function() {
        return innerObservable;
      });
    }
    exports.switchMapTo = switchMapTo;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/switchScan.js
var require_switchScan = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/switchScan.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.switchScan = void 0;
    var switchMap_1 = require_switchMap();
    var lift_1 = require_lift();
    function switchScan(accumulator, seed) {
      return lift_1.operate(function(source, subscriber) {
        var state = seed;
        switchMap_1.switchMap(function(value, index) {
          return accumulator(state, value, index);
        }, function(_, innerValue) {
          return state = innerValue, innerValue;
        })(source).subscribe(subscriber);
        return function() {
          state = null;
        };
      });
    }
    exports.switchScan = switchScan;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/takeUntil.js
var require_takeUntil = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/takeUntil.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.takeUntil = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var noop_1 = require_noop();
    function takeUntil(notifier) {
      return lift_1.operate(function(source, subscriber) {
        innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          return subscriber.complete();
        }, noop_1.noop));
        !subscriber.closed && source.subscribe(subscriber);
      });
    }
    exports.takeUntil = takeUntil;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/takeWhile.js
var require_takeWhile = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/takeWhile.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.takeWhile = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function takeWhile(predicate, inclusive) {
      if (inclusive === void 0) {
        inclusive = false;
      }
      return lift_1.operate(function(source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var result = predicate(value, index++);
          (result || inclusive) && subscriber.next(value);
          !result && subscriber.complete();
        }));
      });
    }
    exports.takeWhile = takeWhile;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/tap.js
var require_tap = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/tap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tap = void 0;
    var isFunction_1 = require_isFunction();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var identity_1 = require_identity();
    function tap(observerOrNext, error, complete) {
      var tapObserver = isFunction_1.isFunction(observerOrNext) || error || complete ? { next: observerOrNext, error, complete } : observerOrNext;
      return tapObserver ? lift_1.operate(function(source, subscriber) {
        var _a;
        (_a = tapObserver.subscribe) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
        var isUnsub = true;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var _a2;
          (_a2 = tapObserver.next) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver, value);
          subscriber.next(value);
        }, function() {
          var _a2;
          isUnsub = false;
          (_a2 = tapObserver.complete) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver);
          subscriber.complete();
        }, function(err) {
          var _a2;
          isUnsub = false;
          (_a2 = tapObserver.error) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver, err);
          subscriber.error(err);
        }, function() {
          var _a2, _b;
          if (isUnsub) {
            (_a2 = tapObserver.unsubscribe) === null || _a2 === void 0 ? void 0 : _a2.call(tapObserver);
          }
          (_b = tapObserver.finalize) === null || _b === void 0 ? void 0 : _b.call(tapObserver);
        }));
      }) : identity_1.identity;
    }
    exports.tap = tap;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/throttle.js
var require_throttle = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/throttle.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.throttle = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function throttle(durationSelector, config) {
      return lift_1.operate(function(source, subscriber) {
        var _a = config !== null && config !== void 0 ? config : {}, _b = _a.leading, leading = _b === void 0 ? true : _b, _c = _a.trailing, trailing = _c === void 0 ? false : _c;
        var hasValue = false;
        var sendValue = null;
        var throttled = null;
        var isComplete = false;
        var endThrottling = function() {
          throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
          throttled = null;
          if (trailing) {
            send();
            isComplete && subscriber.complete();
          }
        };
        var cleanupThrottling = function() {
          throttled = null;
          isComplete && subscriber.complete();
        };
        var startThrottle = function(value) {
          return throttled = innerFrom_1.innerFrom(durationSelector(value)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling));
        };
        var send = function() {
          if (hasValue) {
            hasValue = false;
            var value = sendValue;
            sendValue = null;
            subscriber.next(value);
            !isComplete && startThrottle(value);
          }
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          hasValue = true;
          sendValue = value;
          !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, function() {
          isComplete = true;
          !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
      });
    }
    exports.throttle = throttle;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/throttleTime.js
var require_throttleTime = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/throttleTime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.throttleTime = void 0;
    var async_1 = require_async();
    var throttle_1 = require_throttle();
    var timer_1 = require_timer();
    function throttleTime(duration, scheduler, config) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      var duration$ = timer_1.timer(duration, scheduler);
      return throttle_1.throttle(function() {
        return duration$;
      }, config);
    }
    exports.throttleTime = throttleTime;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/timeInterval.js
var require_timeInterval = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/timeInterval.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimeInterval = exports.timeInterval = void 0;
    var async_1 = require_async();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function timeInterval(scheduler) {
      if (scheduler === void 0) {
        scheduler = async_1.asyncScheduler;
      }
      return lift_1.operate(function(source, subscriber) {
        var last = scheduler.now();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var now = scheduler.now();
          var interval = now - last;
          last = now;
          subscriber.next(new TimeInterval(value, interval));
        }));
      });
    }
    exports.timeInterval = timeInterval;
    var TimeInterval = /* @__PURE__ */ (function() {
      function TimeInterval2(value, interval) {
        this.value = value;
        this.interval = interval;
      }
      return TimeInterval2;
    })();
    exports.TimeInterval = TimeInterval;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/timeoutWith.js
var require_timeoutWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/timeoutWith.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timeoutWith = void 0;
    var async_1 = require_async();
    var isDate_1 = require_isDate();
    var timeout_1 = require_timeout();
    function timeoutWith(due, withObservable, scheduler) {
      var first;
      var each;
      var _with;
      scheduler = scheduler !== null && scheduler !== void 0 ? scheduler : async_1.async;
      if (isDate_1.isValidDate(due)) {
        first = due;
      } else if (typeof due === "number") {
        each = due;
      }
      if (withObservable) {
        _with = function() {
          return withObservable;
        };
      } else {
        throw new TypeError("No observable provided to switch to");
      }
      if (first == null && each == null) {
        throw new TypeError("No timeout provided.");
      }
      return timeout_1.timeout({
        first,
        each,
        scheduler,
        with: _with
      });
    }
    exports.timeoutWith = timeoutWith;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/timestamp.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timestamp = void 0;
    var dateTimestampProvider_1 = require_dateTimestampProvider();
    var map_1 = require_map();
    function timestamp(timestampProvider) {
      if (timestampProvider === void 0) {
        timestampProvider = dateTimestampProvider_1.dateTimestampProvider;
      }
      return map_1.map(function(value) {
        return { value, timestamp: timestampProvider.now() };
      });
    }
    exports.timestamp = timestamp;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/window.js
var require_window = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/window.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.window = void 0;
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var innerFrom_1 = require_innerFrom();
    function window(windowBoundaries) {
      return lift_1.operate(function(source, subscriber) {
        var windowSubject = new Subject_1.Subject();
        subscriber.next(windowSubject.asObservable());
        var errorHandler = function(err) {
          windowSubject.error(err);
          subscriber.error(err);
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.next(value);
        }, function() {
          windowSubject.complete();
          subscriber.complete();
        }, errorHandler));
        innerFrom_1.innerFrom(windowBoundaries).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
          windowSubject.complete();
          subscriber.next(windowSubject = new Subject_1.Subject());
        }, noop_1.noop, errorHandler));
        return function() {
          windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.unsubscribe();
          windowSubject = null;
        };
      });
    }
    exports.window = window;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/windowCount.js
var require_windowCount = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/windowCount.js"(exports) {
    "use strict";
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.windowCount = void 0;
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    function windowCount(windowSize, startWindowEvery) {
      if (startWindowEvery === void 0) {
        startWindowEvery = 0;
      }
      var startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;
      return lift_1.operate(function(source, subscriber) {
        var windows = [new Subject_1.Subject()];
        var starts = [];
        var count = 0;
        subscriber.next(windows[0].asObservable());
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a;
          try {
            for (var windows_1 = __values(windows), windows_1_1 = windows_1.next(); !windows_1_1.done; windows_1_1 = windows_1.next()) {
              var window_1 = windows_1_1.value;
              window_1.next(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (windows_1_1 && !windows_1_1.done && (_a = windows_1.return)) _a.call(windows_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          var c = count - windowSize + 1;
          if (c >= 0 && c % startEvery === 0) {
            windows.shift().complete();
          }
          if (++count % startEvery === 0) {
            var window_2 = new Subject_1.Subject();
            windows.push(window_2);
            subscriber.next(window_2.asObservable());
          }
        }, function() {
          while (windows.length > 0) {
            windows.shift().complete();
          }
          subscriber.complete();
        }, function(err) {
          while (windows.length > 0) {
            windows.shift().error(err);
          }
          subscriber.error(err);
        }, function() {
          starts = null;
          windows = null;
        }));
      });
    }
    exports.windowCount = windowCount;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/windowTime.js
var require_windowTime = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/windowTime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.windowTime = void 0;
    var Subject_1 = require_Subject();
    var async_1 = require_async();
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var arrRemove_1 = require_arrRemove();
    var args_1 = require_args();
    var executeSchedule_1 = require_executeSchedule();
    function windowTime(windowTimeSpan) {
      var _a, _b;
      var otherArgs = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
      }
      var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : async_1.asyncScheduler;
      var windowCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
      var maxWindowSize = otherArgs[1] || Infinity;
      return lift_1.operate(function(source, subscriber) {
        var windowRecords = [];
        var restartOnClose = false;
        var closeWindow = function(record) {
          var window = record.window, subs = record.subs;
          window.complete();
          subs.unsubscribe();
          arrRemove_1.arrRemove(windowRecords, record);
          restartOnClose && startWindow();
        };
        var startWindow = function() {
          if (windowRecords) {
            var subs = new Subscription_1.Subscription();
            subscriber.add(subs);
            var window_1 = new Subject_1.Subject();
            var record_1 = {
              window: window_1,
              subs,
              seen: 0
            };
            windowRecords.push(record_1);
            subscriber.next(window_1.asObservable());
            executeSchedule_1.executeSchedule(subs, scheduler, function() {
              return closeWindow(record_1);
            }, windowTimeSpan);
          }
        };
        if (windowCreationInterval !== null && windowCreationInterval >= 0) {
          executeSchedule_1.executeSchedule(subscriber, scheduler, startWindow, windowCreationInterval, true);
        } else {
          restartOnClose = true;
        }
        startWindow();
        var loop = function(cb) {
          return windowRecords.slice().forEach(cb);
        };
        var terminate = function(cb) {
          loop(function(_a2) {
            var window = _a2.window;
            return cb(window);
          });
          cb(subscriber);
          subscriber.unsubscribe();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          loop(function(record) {
            record.window.next(value);
            maxWindowSize <= ++record.seen && closeWindow(record);
          });
        }, function() {
          return terminate(function(consumer) {
            return consumer.complete();
          });
        }, function(err) {
          return terminate(function(consumer) {
            return consumer.error(err);
          });
        }));
        return function() {
          windowRecords = null;
        };
      });
    }
    exports.windowTime = windowTime;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/windowToggle.js
var require_windowToggle = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/windowToggle.js"(exports) {
    "use strict";
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.windowToggle = void 0;
    var Subject_1 = require_Subject();
    var Subscription_1 = require_Subscription();
    var lift_1 = require_lift();
    var innerFrom_1 = require_innerFrom();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var noop_1 = require_noop();
    var arrRemove_1 = require_arrRemove();
    function windowToggle(openings, closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var windows = [];
        var handleError = function(err) {
          while (0 < windows.length) {
            windows.shift().error(err);
          }
          subscriber.error(err);
        };
        innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(openValue) {
          var window = new Subject_1.Subject();
          windows.push(window);
          var closingSubscription = new Subscription_1.Subscription();
          var closeWindow = function() {
            arrRemove_1.arrRemove(windows, window);
            window.complete();
            closingSubscription.unsubscribe();
          };
          var closingNotifier;
          try {
            closingNotifier = innerFrom_1.innerFrom(closingSelector(openValue));
          } catch (err) {
            handleError(err);
            return;
          }
          subscriber.next(window.asObservable());
          closingSubscription.add(closingNotifier.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, closeWindow, noop_1.noop, handleError)));
        }, noop_1.noop));
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          var e_1, _a;
          var windowsCopy = windows.slice();
          try {
            for (var windowsCopy_1 = __values(windowsCopy), windowsCopy_1_1 = windowsCopy_1.next(); !windowsCopy_1_1.done; windowsCopy_1_1 = windowsCopy_1.next()) {
              var window_1 = windowsCopy_1_1.value;
              window_1.next(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (windowsCopy_1_1 && !windowsCopy_1_1.done && (_a = windowsCopy_1.return)) _a.call(windowsCopy_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }, function() {
          while (0 < windows.length) {
            windows.shift().complete();
          }
          subscriber.complete();
        }, handleError, function() {
          while (0 < windows.length) {
            windows.shift().unsubscribe();
          }
        }));
      });
    }
    exports.windowToggle = windowToggle;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/windowWhen.js
var require_windowWhen = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/windowWhen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.windowWhen = void 0;
    var Subject_1 = require_Subject();
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    function windowWhen(closingSelector) {
      return lift_1.operate(function(source, subscriber) {
        var window;
        var closingSubscriber;
        var handleError = function(err) {
          window.error(err);
          subscriber.error(err);
        };
        var openWindow = function() {
          closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
          window === null || window === void 0 ? void 0 : window.complete();
          window = new Subject_1.Subject();
          subscriber.next(window.asObservable());
          var closingNotifier;
          try {
            closingNotifier = innerFrom_1.innerFrom(closingSelector());
          } catch (err) {
            handleError(err);
            return;
          }
          closingNotifier.subscribe(closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openWindow, openWindow, handleError));
        };
        openWindow();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          return window.next(value);
        }, function() {
          window.complete();
          subscriber.complete();
        }, handleError, function() {
          closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
          window = null;
        }));
      });
    }
    exports.windowWhen = windowWhen;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/withLatestFrom.js
var require_withLatestFrom = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/withLatestFrom.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.withLatestFrom = void 0;
    var lift_1 = require_lift();
    var OperatorSubscriber_1 = require_OperatorSubscriber();
    var innerFrom_1 = require_innerFrom();
    var identity_1 = require_identity();
    var noop_1 = require_noop();
    var args_1 = require_args();
    function withLatestFrom() {
      var inputs = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
      }
      var project = args_1.popResultSelector(inputs);
      return lift_1.operate(function(source, subscriber) {
        var len = inputs.length;
        var otherValues = new Array(len);
        var hasValue = inputs.map(function() {
          return false;
        });
        var ready = false;
        var _loop_1 = function(i2) {
          innerFrom_1.innerFrom(inputs[i2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
            otherValues[i2] = value;
            if (!ready && !hasValue[i2]) {
              hasValue[i2] = true;
              (ready = hasValue.every(identity_1.identity)) && (hasValue = null);
            }
          }, noop_1.noop));
        };
        for (var i = 0; i < len; i++) {
          _loop_1(i);
        }
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (ready) {
            var values = __spreadArray([value], __read(otherValues));
            subscriber.next(project ? project.apply(void 0, __spreadArray([], __read(values))) : values);
          }
        }));
      });
    }
    exports.withLatestFrom = withLatestFrom;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/zipAll.js
var require_zipAll = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/zipAll.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.zipAll = void 0;
    var zip_1 = require_zip();
    var joinAllInternals_1 = require_joinAllInternals();
    function zipAll(project) {
      return joinAllInternals_1.joinAllInternals(zip_1.zip, project);
    }
    exports.zipAll = zipAll;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/zip.js
var require_zip2 = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/zip.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.zip = void 0;
    var zip_1 = require_zip();
    var lift_1 = require_lift();
    function zip() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
      }
      return lift_1.operate(function(source, subscriber) {
        zip_1.zip.apply(void 0, __spreadArray([source], __read(sources))).subscribe(subscriber);
      });
    }
    exports.zip = zip;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/zipWith.js
var require_zipWith = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/zipWith.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.zipWith = void 0;
    var zip_1 = require_zip2();
    function zipWith() {
      var otherInputs = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        otherInputs[_i] = arguments[_i];
      }
      return zip_1.zip.apply(void 0, __spreadArray([], __read(otherInputs)));
    }
    exports.zipWith = zipWith;
  }
});

// node_modules/rxjs/dist/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/rxjs/dist/cjs/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.interval = exports.iif = exports.generate = exports.fromEventPattern = exports.fromEvent = exports.from = exports.forkJoin = exports.empty = exports.defer = exports.connectable = exports.concat = exports.combineLatest = exports.bindNodeCallback = exports.bindCallback = exports.UnsubscriptionError = exports.TimeoutError = exports.SequenceError = exports.ObjectUnsubscribedError = exports.NotFoundError = exports.EmptyError = exports.ArgumentOutOfRangeError = exports.firstValueFrom = exports.lastValueFrom = exports.isObservable = exports.identity = exports.noop = exports.pipe = exports.NotificationKind = exports.Notification = exports.Subscriber = exports.Subscription = exports.Scheduler = exports.VirtualAction = exports.VirtualTimeScheduler = exports.animationFrameScheduler = exports.animationFrame = exports.queueScheduler = exports.queue = exports.asyncScheduler = exports.async = exports.asapScheduler = exports.asap = exports.AsyncSubject = exports.ReplaySubject = exports.BehaviorSubject = exports.Subject = exports.animationFrames = exports.observable = exports.ConnectableObservable = exports.Observable = void 0;
    exports.filter = exports.expand = exports.exhaustMap = exports.exhaustAll = exports.exhaust = exports.every = exports.endWith = exports.elementAt = exports.distinctUntilKeyChanged = exports.distinctUntilChanged = exports.distinct = exports.dematerialize = exports.delayWhen = exports.delay = exports.defaultIfEmpty = exports.debounceTime = exports.debounce = exports.count = exports.connect = exports.concatWith = exports.concatMapTo = exports.concatMap = exports.concatAll = exports.combineLatestWith = exports.combineLatestAll = exports.combineAll = exports.catchError = exports.bufferWhen = exports.bufferToggle = exports.bufferTime = exports.bufferCount = exports.buffer = exports.auditTime = exports.audit = exports.config = exports.NEVER = exports.EMPTY = exports.scheduled = exports.zip = exports.using = exports.timer = exports.throwError = exports.range = exports.race = exports.partition = exports.pairs = exports.onErrorResumeNext = exports.of = exports.never = exports.merge = void 0;
    exports.switchMap = exports.switchAll = exports.subscribeOn = exports.startWith = exports.skipWhile = exports.skipUntil = exports.skipLast = exports.skip = exports.single = exports.shareReplay = exports.share = exports.sequenceEqual = exports.scan = exports.sampleTime = exports.sample = exports.refCount = exports.retryWhen = exports.retry = exports.repeatWhen = exports.repeat = exports.reduce = exports.raceWith = exports.publishReplay = exports.publishLast = exports.publishBehavior = exports.publish = exports.pluck = exports.pairwise = exports.onErrorResumeNextWith = exports.observeOn = exports.multicast = exports.min = exports.mergeWith = exports.mergeScan = exports.mergeMapTo = exports.mergeMap = exports.flatMap = exports.mergeAll = exports.max = exports.materialize = exports.mapTo = exports.map = exports.last = exports.isEmpty = exports.ignoreElements = exports.groupBy = exports.first = exports.findIndex = exports.find = exports.finalize = void 0;
    exports.zipWith = exports.zipAll = exports.withLatestFrom = exports.windowWhen = exports.windowToggle = exports.windowTime = exports.windowCount = exports.window = exports.toArray = exports.timestamp = exports.timeoutWith = exports.timeout = exports.timeInterval = exports.throwIfEmpty = exports.throttleTime = exports.throttle = exports.tap = exports.takeWhile = exports.takeUntil = exports.takeLast = exports.take = exports.switchScan = exports.switchMapTo = void 0;
    var Observable_1 = require_Observable();
    Object.defineProperty(exports, "Observable", { enumerable: true, get: function() {
      return Observable_1.Observable;
    } });
    var ConnectableObservable_1 = require_ConnectableObservable();
    Object.defineProperty(exports, "ConnectableObservable", { enumerable: true, get: function() {
      return ConnectableObservable_1.ConnectableObservable;
    } });
    var observable_1 = require_observable();
    Object.defineProperty(exports, "observable", { enumerable: true, get: function() {
      return observable_1.observable;
    } });
    var animationFrames_1 = require_animationFrames();
    Object.defineProperty(exports, "animationFrames", { enumerable: true, get: function() {
      return animationFrames_1.animationFrames;
    } });
    var Subject_1 = require_Subject();
    Object.defineProperty(exports, "Subject", { enumerable: true, get: function() {
      return Subject_1.Subject;
    } });
    var BehaviorSubject_1 = require_BehaviorSubject();
    Object.defineProperty(exports, "BehaviorSubject", { enumerable: true, get: function() {
      return BehaviorSubject_1.BehaviorSubject;
    } });
    var ReplaySubject_1 = require_ReplaySubject();
    Object.defineProperty(exports, "ReplaySubject", { enumerable: true, get: function() {
      return ReplaySubject_1.ReplaySubject;
    } });
    var AsyncSubject_1 = require_AsyncSubject();
    Object.defineProperty(exports, "AsyncSubject", { enumerable: true, get: function() {
      return AsyncSubject_1.AsyncSubject;
    } });
    var asap_1 = require_asap();
    Object.defineProperty(exports, "asap", { enumerable: true, get: function() {
      return asap_1.asap;
    } });
    Object.defineProperty(exports, "asapScheduler", { enumerable: true, get: function() {
      return asap_1.asapScheduler;
    } });
    var async_1 = require_async();
    Object.defineProperty(exports, "async", { enumerable: true, get: function() {
      return async_1.async;
    } });
    Object.defineProperty(exports, "asyncScheduler", { enumerable: true, get: function() {
      return async_1.asyncScheduler;
    } });
    var queue_1 = require_queue();
    Object.defineProperty(exports, "queue", { enumerable: true, get: function() {
      return queue_1.queue;
    } });
    Object.defineProperty(exports, "queueScheduler", { enumerable: true, get: function() {
      return queue_1.queueScheduler;
    } });
    var animationFrame_1 = require_animationFrame();
    Object.defineProperty(exports, "animationFrame", { enumerable: true, get: function() {
      return animationFrame_1.animationFrame;
    } });
    Object.defineProperty(exports, "animationFrameScheduler", { enumerable: true, get: function() {
      return animationFrame_1.animationFrameScheduler;
    } });
    var VirtualTimeScheduler_1 = require_VirtualTimeScheduler();
    Object.defineProperty(exports, "VirtualTimeScheduler", { enumerable: true, get: function() {
      return VirtualTimeScheduler_1.VirtualTimeScheduler;
    } });
    Object.defineProperty(exports, "VirtualAction", { enumerable: true, get: function() {
      return VirtualTimeScheduler_1.VirtualAction;
    } });
    var Scheduler_1 = require_Scheduler();
    Object.defineProperty(exports, "Scheduler", { enumerable: true, get: function() {
      return Scheduler_1.Scheduler;
    } });
    var Subscription_1 = require_Subscription();
    Object.defineProperty(exports, "Subscription", { enumerable: true, get: function() {
      return Subscription_1.Subscription;
    } });
    var Subscriber_1 = require_Subscriber();
    Object.defineProperty(exports, "Subscriber", { enumerable: true, get: function() {
      return Subscriber_1.Subscriber;
    } });
    var Notification_1 = require_Notification();
    Object.defineProperty(exports, "Notification", { enumerable: true, get: function() {
      return Notification_1.Notification;
    } });
    Object.defineProperty(exports, "NotificationKind", { enumerable: true, get: function() {
      return Notification_1.NotificationKind;
    } });
    var pipe_1 = require_pipe();
    Object.defineProperty(exports, "pipe", { enumerable: true, get: function() {
      return pipe_1.pipe;
    } });
    var noop_1 = require_noop();
    Object.defineProperty(exports, "noop", { enumerable: true, get: function() {
      return noop_1.noop;
    } });
    var identity_1 = require_identity();
    Object.defineProperty(exports, "identity", { enumerable: true, get: function() {
      return identity_1.identity;
    } });
    var isObservable_1 = require_isObservable();
    Object.defineProperty(exports, "isObservable", { enumerable: true, get: function() {
      return isObservable_1.isObservable;
    } });
    var lastValueFrom_1 = require_lastValueFrom();
    Object.defineProperty(exports, "lastValueFrom", { enumerable: true, get: function() {
      return lastValueFrom_1.lastValueFrom;
    } });
    var firstValueFrom_1 = require_firstValueFrom();
    Object.defineProperty(exports, "firstValueFrom", { enumerable: true, get: function() {
      return firstValueFrom_1.firstValueFrom;
    } });
    var ArgumentOutOfRangeError_1 = require_ArgumentOutOfRangeError();
    Object.defineProperty(exports, "ArgumentOutOfRangeError", { enumerable: true, get: function() {
      return ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
    } });
    var EmptyError_1 = require_EmptyError();
    Object.defineProperty(exports, "EmptyError", { enumerable: true, get: function() {
      return EmptyError_1.EmptyError;
    } });
    var NotFoundError_1 = require_NotFoundError();
    Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function() {
      return NotFoundError_1.NotFoundError;
    } });
    var ObjectUnsubscribedError_1 = require_ObjectUnsubscribedError();
    Object.defineProperty(exports, "ObjectUnsubscribedError", { enumerable: true, get: function() {
      return ObjectUnsubscribedError_1.ObjectUnsubscribedError;
    } });
    var SequenceError_1 = require_SequenceError();
    Object.defineProperty(exports, "SequenceError", { enumerable: true, get: function() {
      return SequenceError_1.SequenceError;
    } });
    var timeout_1 = require_timeout();
    Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function() {
      return timeout_1.TimeoutError;
    } });
    var UnsubscriptionError_1 = require_UnsubscriptionError();
    Object.defineProperty(exports, "UnsubscriptionError", { enumerable: true, get: function() {
      return UnsubscriptionError_1.UnsubscriptionError;
    } });
    var bindCallback_1 = require_bindCallback();
    Object.defineProperty(exports, "bindCallback", { enumerable: true, get: function() {
      return bindCallback_1.bindCallback;
    } });
    var bindNodeCallback_1 = require_bindNodeCallback();
    Object.defineProperty(exports, "bindNodeCallback", { enumerable: true, get: function() {
      return bindNodeCallback_1.bindNodeCallback;
    } });
    var combineLatest_1 = require_combineLatest();
    Object.defineProperty(exports, "combineLatest", { enumerable: true, get: function() {
      return combineLatest_1.combineLatest;
    } });
    var concat_1 = require_concat();
    Object.defineProperty(exports, "concat", { enumerable: true, get: function() {
      return concat_1.concat;
    } });
    var connectable_1 = require_connectable();
    Object.defineProperty(exports, "connectable", { enumerable: true, get: function() {
      return connectable_1.connectable;
    } });
    var defer_1 = require_defer();
    Object.defineProperty(exports, "defer", { enumerable: true, get: function() {
      return defer_1.defer;
    } });
    var empty_1 = require_empty();
    Object.defineProperty(exports, "empty", { enumerable: true, get: function() {
      return empty_1.empty;
    } });
    var forkJoin_1 = require_forkJoin();
    Object.defineProperty(exports, "forkJoin", { enumerable: true, get: function() {
      return forkJoin_1.forkJoin;
    } });
    var from_1 = require_from();
    Object.defineProperty(exports, "from", { enumerable: true, get: function() {
      return from_1.from;
    } });
    var fromEvent_1 = require_fromEvent();
    Object.defineProperty(exports, "fromEvent", { enumerable: true, get: function() {
      return fromEvent_1.fromEvent;
    } });
    var fromEventPattern_1 = require_fromEventPattern();
    Object.defineProperty(exports, "fromEventPattern", { enumerable: true, get: function() {
      return fromEventPattern_1.fromEventPattern;
    } });
    var generate_1 = require_generate();
    Object.defineProperty(exports, "generate", { enumerable: true, get: function() {
      return generate_1.generate;
    } });
    var iif_1 = require_iif();
    Object.defineProperty(exports, "iif", { enumerable: true, get: function() {
      return iif_1.iif;
    } });
    var interval_1 = require_interval();
    Object.defineProperty(exports, "interval", { enumerable: true, get: function() {
      return interval_1.interval;
    } });
    var merge_1 = require_merge();
    Object.defineProperty(exports, "merge", { enumerable: true, get: function() {
      return merge_1.merge;
    } });
    var never_1 = require_never();
    Object.defineProperty(exports, "never", { enumerable: true, get: function() {
      return never_1.never;
    } });
    var of_1 = require_of();
    Object.defineProperty(exports, "of", { enumerable: true, get: function() {
      return of_1.of;
    } });
    var onErrorResumeNext_1 = require_onErrorResumeNext();
    Object.defineProperty(exports, "onErrorResumeNext", { enumerable: true, get: function() {
      return onErrorResumeNext_1.onErrorResumeNext;
    } });
    var pairs_1 = require_pairs();
    Object.defineProperty(exports, "pairs", { enumerable: true, get: function() {
      return pairs_1.pairs;
    } });
    var partition_1 = require_partition();
    Object.defineProperty(exports, "partition", { enumerable: true, get: function() {
      return partition_1.partition;
    } });
    var race_1 = require_race();
    Object.defineProperty(exports, "race", { enumerable: true, get: function() {
      return race_1.race;
    } });
    var range_1 = require_range();
    Object.defineProperty(exports, "range", { enumerable: true, get: function() {
      return range_1.range;
    } });
    var throwError_1 = require_throwError();
    Object.defineProperty(exports, "throwError", { enumerable: true, get: function() {
      return throwError_1.throwError;
    } });
    var timer_1 = require_timer();
    Object.defineProperty(exports, "timer", { enumerable: true, get: function() {
      return timer_1.timer;
    } });
    var using_1 = require_using();
    Object.defineProperty(exports, "using", { enumerable: true, get: function() {
      return using_1.using;
    } });
    var zip_1 = require_zip();
    Object.defineProperty(exports, "zip", { enumerable: true, get: function() {
      return zip_1.zip;
    } });
    var scheduled_1 = require_scheduled();
    Object.defineProperty(exports, "scheduled", { enumerable: true, get: function() {
      return scheduled_1.scheduled;
    } });
    var empty_2 = require_empty();
    Object.defineProperty(exports, "EMPTY", { enumerable: true, get: function() {
      return empty_2.EMPTY;
    } });
    var never_2 = require_never();
    Object.defineProperty(exports, "NEVER", { enumerable: true, get: function() {
      return never_2.NEVER;
    } });
    __exportStar(require_types(), exports);
    var config_1 = require_config();
    Object.defineProperty(exports, "config", { enumerable: true, get: function() {
      return config_1.config;
    } });
    var audit_1 = require_audit();
    Object.defineProperty(exports, "audit", { enumerable: true, get: function() {
      return audit_1.audit;
    } });
    var auditTime_1 = require_auditTime();
    Object.defineProperty(exports, "auditTime", { enumerable: true, get: function() {
      return auditTime_1.auditTime;
    } });
    var buffer_1 = require_buffer();
    Object.defineProperty(exports, "buffer", { enumerable: true, get: function() {
      return buffer_1.buffer;
    } });
    var bufferCount_1 = require_bufferCount();
    Object.defineProperty(exports, "bufferCount", { enumerable: true, get: function() {
      return bufferCount_1.bufferCount;
    } });
    var bufferTime_1 = require_bufferTime();
    Object.defineProperty(exports, "bufferTime", { enumerable: true, get: function() {
      return bufferTime_1.bufferTime;
    } });
    var bufferToggle_1 = require_bufferToggle();
    Object.defineProperty(exports, "bufferToggle", { enumerable: true, get: function() {
      return bufferToggle_1.bufferToggle;
    } });
    var bufferWhen_1 = require_bufferWhen();
    Object.defineProperty(exports, "bufferWhen", { enumerable: true, get: function() {
      return bufferWhen_1.bufferWhen;
    } });
    var catchError_1 = require_catchError();
    Object.defineProperty(exports, "catchError", { enumerable: true, get: function() {
      return catchError_1.catchError;
    } });
    var combineAll_1 = require_combineAll();
    Object.defineProperty(exports, "combineAll", { enumerable: true, get: function() {
      return combineAll_1.combineAll;
    } });
    var combineLatestAll_1 = require_combineLatestAll();
    Object.defineProperty(exports, "combineLatestAll", { enumerable: true, get: function() {
      return combineLatestAll_1.combineLatestAll;
    } });
    var combineLatestWith_1 = require_combineLatestWith();
    Object.defineProperty(exports, "combineLatestWith", { enumerable: true, get: function() {
      return combineLatestWith_1.combineLatestWith;
    } });
    var concatAll_1 = require_concatAll();
    Object.defineProperty(exports, "concatAll", { enumerable: true, get: function() {
      return concatAll_1.concatAll;
    } });
    var concatMap_1 = require_concatMap();
    Object.defineProperty(exports, "concatMap", { enumerable: true, get: function() {
      return concatMap_1.concatMap;
    } });
    var concatMapTo_1 = require_concatMapTo();
    Object.defineProperty(exports, "concatMapTo", { enumerable: true, get: function() {
      return concatMapTo_1.concatMapTo;
    } });
    var concatWith_1 = require_concatWith();
    Object.defineProperty(exports, "concatWith", { enumerable: true, get: function() {
      return concatWith_1.concatWith;
    } });
    var connect_1 = require_connect();
    Object.defineProperty(exports, "connect", { enumerable: true, get: function() {
      return connect_1.connect;
    } });
    var count_1 = require_count();
    Object.defineProperty(exports, "count", { enumerable: true, get: function() {
      return count_1.count;
    } });
    var debounce_1 = require_debounce();
    Object.defineProperty(exports, "debounce", { enumerable: true, get: function() {
      return debounce_1.debounce;
    } });
    var debounceTime_1 = require_debounceTime();
    Object.defineProperty(exports, "debounceTime", { enumerable: true, get: function() {
      return debounceTime_1.debounceTime;
    } });
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    Object.defineProperty(exports, "defaultIfEmpty", { enumerable: true, get: function() {
      return defaultIfEmpty_1.defaultIfEmpty;
    } });
    var delay_1 = require_delay();
    Object.defineProperty(exports, "delay", { enumerable: true, get: function() {
      return delay_1.delay;
    } });
    var delayWhen_1 = require_delayWhen();
    Object.defineProperty(exports, "delayWhen", { enumerable: true, get: function() {
      return delayWhen_1.delayWhen;
    } });
    var dematerialize_1 = require_dematerialize();
    Object.defineProperty(exports, "dematerialize", { enumerable: true, get: function() {
      return dematerialize_1.dematerialize;
    } });
    var distinct_1 = require_distinct();
    Object.defineProperty(exports, "distinct", { enumerable: true, get: function() {
      return distinct_1.distinct;
    } });
    var distinctUntilChanged_1 = require_distinctUntilChanged();
    Object.defineProperty(exports, "distinctUntilChanged", { enumerable: true, get: function() {
      return distinctUntilChanged_1.distinctUntilChanged;
    } });
    var distinctUntilKeyChanged_1 = require_distinctUntilKeyChanged();
    Object.defineProperty(exports, "distinctUntilKeyChanged", { enumerable: true, get: function() {
      return distinctUntilKeyChanged_1.distinctUntilKeyChanged;
    } });
    var elementAt_1 = require_elementAt();
    Object.defineProperty(exports, "elementAt", { enumerable: true, get: function() {
      return elementAt_1.elementAt;
    } });
    var endWith_1 = require_endWith();
    Object.defineProperty(exports, "endWith", { enumerable: true, get: function() {
      return endWith_1.endWith;
    } });
    var every_1 = require_every();
    Object.defineProperty(exports, "every", { enumerable: true, get: function() {
      return every_1.every;
    } });
    var exhaust_1 = require_exhaust();
    Object.defineProperty(exports, "exhaust", { enumerable: true, get: function() {
      return exhaust_1.exhaust;
    } });
    var exhaustAll_1 = require_exhaustAll();
    Object.defineProperty(exports, "exhaustAll", { enumerable: true, get: function() {
      return exhaustAll_1.exhaustAll;
    } });
    var exhaustMap_1 = require_exhaustMap();
    Object.defineProperty(exports, "exhaustMap", { enumerable: true, get: function() {
      return exhaustMap_1.exhaustMap;
    } });
    var expand_1 = require_expand();
    Object.defineProperty(exports, "expand", { enumerable: true, get: function() {
      return expand_1.expand;
    } });
    var filter_1 = require_filter();
    Object.defineProperty(exports, "filter", { enumerable: true, get: function() {
      return filter_1.filter;
    } });
    var finalize_1 = require_finalize();
    Object.defineProperty(exports, "finalize", { enumerable: true, get: function() {
      return finalize_1.finalize;
    } });
    var find_1 = require_find();
    Object.defineProperty(exports, "find", { enumerable: true, get: function() {
      return find_1.find;
    } });
    var findIndex_1 = require_findIndex();
    Object.defineProperty(exports, "findIndex", { enumerable: true, get: function() {
      return findIndex_1.findIndex;
    } });
    var first_1 = require_first();
    Object.defineProperty(exports, "first", { enumerable: true, get: function() {
      return first_1.first;
    } });
    var groupBy_1 = require_groupBy();
    Object.defineProperty(exports, "groupBy", { enumerable: true, get: function() {
      return groupBy_1.groupBy;
    } });
    var ignoreElements_1 = require_ignoreElements();
    Object.defineProperty(exports, "ignoreElements", { enumerable: true, get: function() {
      return ignoreElements_1.ignoreElements;
    } });
    var isEmpty_1 = require_isEmpty();
    Object.defineProperty(exports, "isEmpty", { enumerable: true, get: function() {
      return isEmpty_1.isEmpty;
    } });
    var last_1 = require_last();
    Object.defineProperty(exports, "last", { enumerable: true, get: function() {
      return last_1.last;
    } });
    var map_1 = require_map();
    Object.defineProperty(exports, "map", { enumerable: true, get: function() {
      return map_1.map;
    } });
    var mapTo_1 = require_mapTo();
    Object.defineProperty(exports, "mapTo", { enumerable: true, get: function() {
      return mapTo_1.mapTo;
    } });
    var materialize_1 = require_materialize();
    Object.defineProperty(exports, "materialize", { enumerable: true, get: function() {
      return materialize_1.materialize;
    } });
    var max_1 = require_max();
    Object.defineProperty(exports, "max", { enumerable: true, get: function() {
      return max_1.max;
    } });
    var mergeAll_1 = require_mergeAll();
    Object.defineProperty(exports, "mergeAll", { enumerable: true, get: function() {
      return mergeAll_1.mergeAll;
    } });
    var flatMap_1 = require_flatMap();
    Object.defineProperty(exports, "flatMap", { enumerable: true, get: function() {
      return flatMap_1.flatMap;
    } });
    var mergeMap_1 = require_mergeMap();
    Object.defineProperty(exports, "mergeMap", { enumerable: true, get: function() {
      return mergeMap_1.mergeMap;
    } });
    var mergeMapTo_1 = require_mergeMapTo();
    Object.defineProperty(exports, "mergeMapTo", { enumerable: true, get: function() {
      return mergeMapTo_1.mergeMapTo;
    } });
    var mergeScan_1 = require_mergeScan();
    Object.defineProperty(exports, "mergeScan", { enumerable: true, get: function() {
      return mergeScan_1.mergeScan;
    } });
    var mergeWith_1 = require_mergeWith();
    Object.defineProperty(exports, "mergeWith", { enumerable: true, get: function() {
      return mergeWith_1.mergeWith;
    } });
    var min_1 = require_min();
    Object.defineProperty(exports, "min", { enumerable: true, get: function() {
      return min_1.min;
    } });
    var multicast_1 = require_multicast();
    Object.defineProperty(exports, "multicast", { enumerable: true, get: function() {
      return multicast_1.multicast;
    } });
    var observeOn_1 = require_observeOn();
    Object.defineProperty(exports, "observeOn", { enumerable: true, get: function() {
      return observeOn_1.observeOn;
    } });
    var onErrorResumeNextWith_1 = require_onErrorResumeNextWith();
    Object.defineProperty(exports, "onErrorResumeNextWith", { enumerable: true, get: function() {
      return onErrorResumeNextWith_1.onErrorResumeNextWith;
    } });
    var pairwise_1 = require_pairwise();
    Object.defineProperty(exports, "pairwise", { enumerable: true, get: function() {
      return pairwise_1.pairwise;
    } });
    var pluck_1 = require_pluck();
    Object.defineProperty(exports, "pluck", { enumerable: true, get: function() {
      return pluck_1.pluck;
    } });
    var publish_1 = require_publish();
    Object.defineProperty(exports, "publish", { enumerable: true, get: function() {
      return publish_1.publish;
    } });
    var publishBehavior_1 = require_publishBehavior();
    Object.defineProperty(exports, "publishBehavior", { enumerable: true, get: function() {
      return publishBehavior_1.publishBehavior;
    } });
    var publishLast_1 = require_publishLast();
    Object.defineProperty(exports, "publishLast", { enumerable: true, get: function() {
      return publishLast_1.publishLast;
    } });
    var publishReplay_1 = require_publishReplay();
    Object.defineProperty(exports, "publishReplay", { enumerable: true, get: function() {
      return publishReplay_1.publishReplay;
    } });
    var raceWith_1 = require_raceWith();
    Object.defineProperty(exports, "raceWith", { enumerable: true, get: function() {
      return raceWith_1.raceWith;
    } });
    var reduce_1 = require_reduce();
    Object.defineProperty(exports, "reduce", { enumerable: true, get: function() {
      return reduce_1.reduce;
    } });
    var repeat_1 = require_repeat();
    Object.defineProperty(exports, "repeat", { enumerable: true, get: function() {
      return repeat_1.repeat;
    } });
    var repeatWhen_1 = require_repeatWhen();
    Object.defineProperty(exports, "repeatWhen", { enumerable: true, get: function() {
      return repeatWhen_1.repeatWhen;
    } });
    var retry_1 = require_retry();
    Object.defineProperty(exports, "retry", { enumerable: true, get: function() {
      return retry_1.retry;
    } });
    var retryWhen_1 = require_retryWhen();
    Object.defineProperty(exports, "retryWhen", { enumerable: true, get: function() {
      return retryWhen_1.retryWhen;
    } });
    var refCount_1 = require_refCount();
    Object.defineProperty(exports, "refCount", { enumerable: true, get: function() {
      return refCount_1.refCount;
    } });
    var sample_1 = require_sample();
    Object.defineProperty(exports, "sample", { enumerable: true, get: function() {
      return sample_1.sample;
    } });
    var sampleTime_1 = require_sampleTime();
    Object.defineProperty(exports, "sampleTime", { enumerable: true, get: function() {
      return sampleTime_1.sampleTime;
    } });
    var scan_1 = require_scan();
    Object.defineProperty(exports, "scan", { enumerable: true, get: function() {
      return scan_1.scan;
    } });
    var sequenceEqual_1 = require_sequenceEqual();
    Object.defineProperty(exports, "sequenceEqual", { enumerable: true, get: function() {
      return sequenceEqual_1.sequenceEqual;
    } });
    var share_1 = require_share();
    Object.defineProperty(exports, "share", { enumerable: true, get: function() {
      return share_1.share;
    } });
    var shareReplay_1 = require_shareReplay();
    Object.defineProperty(exports, "shareReplay", { enumerable: true, get: function() {
      return shareReplay_1.shareReplay;
    } });
    var single_1 = require_single();
    Object.defineProperty(exports, "single", { enumerable: true, get: function() {
      return single_1.single;
    } });
    var skip_1 = require_skip();
    Object.defineProperty(exports, "skip", { enumerable: true, get: function() {
      return skip_1.skip;
    } });
    var skipLast_1 = require_skipLast();
    Object.defineProperty(exports, "skipLast", { enumerable: true, get: function() {
      return skipLast_1.skipLast;
    } });
    var skipUntil_1 = require_skipUntil();
    Object.defineProperty(exports, "skipUntil", { enumerable: true, get: function() {
      return skipUntil_1.skipUntil;
    } });
    var skipWhile_1 = require_skipWhile();
    Object.defineProperty(exports, "skipWhile", { enumerable: true, get: function() {
      return skipWhile_1.skipWhile;
    } });
    var startWith_1 = require_startWith();
    Object.defineProperty(exports, "startWith", { enumerable: true, get: function() {
      return startWith_1.startWith;
    } });
    var subscribeOn_1 = require_subscribeOn();
    Object.defineProperty(exports, "subscribeOn", { enumerable: true, get: function() {
      return subscribeOn_1.subscribeOn;
    } });
    var switchAll_1 = require_switchAll();
    Object.defineProperty(exports, "switchAll", { enumerable: true, get: function() {
      return switchAll_1.switchAll;
    } });
    var switchMap_1 = require_switchMap();
    Object.defineProperty(exports, "switchMap", { enumerable: true, get: function() {
      return switchMap_1.switchMap;
    } });
    var switchMapTo_1 = require_switchMapTo();
    Object.defineProperty(exports, "switchMapTo", { enumerable: true, get: function() {
      return switchMapTo_1.switchMapTo;
    } });
    var switchScan_1 = require_switchScan();
    Object.defineProperty(exports, "switchScan", { enumerable: true, get: function() {
      return switchScan_1.switchScan;
    } });
    var take_1 = require_take();
    Object.defineProperty(exports, "take", { enumerable: true, get: function() {
      return take_1.take;
    } });
    var takeLast_1 = require_takeLast();
    Object.defineProperty(exports, "takeLast", { enumerable: true, get: function() {
      return takeLast_1.takeLast;
    } });
    var takeUntil_1 = require_takeUntil();
    Object.defineProperty(exports, "takeUntil", { enumerable: true, get: function() {
      return takeUntil_1.takeUntil;
    } });
    var takeWhile_1 = require_takeWhile();
    Object.defineProperty(exports, "takeWhile", { enumerable: true, get: function() {
      return takeWhile_1.takeWhile;
    } });
    var tap_1 = require_tap();
    Object.defineProperty(exports, "tap", { enumerable: true, get: function() {
      return tap_1.tap;
    } });
    var throttle_1 = require_throttle();
    Object.defineProperty(exports, "throttle", { enumerable: true, get: function() {
      return throttle_1.throttle;
    } });
    var throttleTime_1 = require_throttleTime();
    Object.defineProperty(exports, "throttleTime", { enumerable: true, get: function() {
      return throttleTime_1.throttleTime;
    } });
    var throwIfEmpty_1 = require_throwIfEmpty();
    Object.defineProperty(exports, "throwIfEmpty", { enumerable: true, get: function() {
      return throwIfEmpty_1.throwIfEmpty;
    } });
    var timeInterval_1 = require_timeInterval();
    Object.defineProperty(exports, "timeInterval", { enumerable: true, get: function() {
      return timeInterval_1.timeInterval;
    } });
    var timeout_2 = require_timeout();
    Object.defineProperty(exports, "timeout", { enumerable: true, get: function() {
      return timeout_2.timeout;
    } });
    var timeoutWith_1 = require_timeoutWith();
    Object.defineProperty(exports, "timeoutWith", { enumerable: true, get: function() {
      return timeoutWith_1.timeoutWith;
    } });
    var timestamp_1 = require_timestamp();
    Object.defineProperty(exports, "timestamp", { enumerable: true, get: function() {
      return timestamp_1.timestamp;
    } });
    var toArray_1 = require_toArray();
    Object.defineProperty(exports, "toArray", { enumerable: true, get: function() {
      return toArray_1.toArray;
    } });
    var window_1 = require_window();
    Object.defineProperty(exports, "window", { enumerable: true, get: function() {
      return window_1.window;
    } });
    var windowCount_1 = require_windowCount();
    Object.defineProperty(exports, "windowCount", { enumerable: true, get: function() {
      return windowCount_1.windowCount;
    } });
    var windowTime_1 = require_windowTime();
    Object.defineProperty(exports, "windowTime", { enumerable: true, get: function() {
      return windowTime_1.windowTime;
    } });
    var windowToggle_1 = require_windowToggle();
    Object.defineProperty(exports, "windowToggle", { enumerable: true, get: function() {
      return windowToggle_1.windowToggle;
    } });
    var windowWhen_1 = require_windowWhen();
    Object.defineProperty(exports, "windowWhen", { enumerable: true, get: function() {
      return windowWhen_1.windowWhen;
    } });
    var withLatestFrom_1 = require_withLatestFrom();
    Object.defineProperty(exports, "withLatestFrom", { enumerable: true, get: function() {
      return withLatestFrom_1.withLatestFrom;
    } });
    var zipAll_1 = require_zipAll();
    Object.defineProperty(exports, "zipAll", { enumerable: true, get: function() {
      return zipAll_1.zipAll;
    } });
    var zipWith_1 = require_zipWith();
    Object.defineProperty(exports, "zipWith", { enumerable: true, get: function() {
      return zipWith_1.zipWith;
    } });
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/partition.js
var require_partition2 = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/partition.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.partition = void 0;
    var not_1 = require_not();
    var filter_1 = require_filter();
    function partition(predicate, thisArg) {
      return function(source) {
        return [filter_1.filter(predicate, thisArg)(source), filter_1.filter(not_1.not(predicate, thisArg))(source)];
      };
    }
    exports.partition = partition;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/race.js
var require_race2 = __commonJS({
  "node_modules/rxjs/dist/cjs/internal/operators/race.js"(exports) {
    "use strict";
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from) {
      for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
      return to;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.race = void 0;
    var argsOrArgArray_1 = require_argsOrArgArray();
    var raceWith_1 = require_raceWith();
    function race() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return raceWith_1.raceWith.apply(void 0, __spreadArray([], __read(argsOrArgArray_1.argsOrArgArray(args))));
    }
    exports.race = race;
  }
});

// node_modules/rxjs/dist/cjs/operators/index.js
var require_operators = __commonJS({
  "node_modules/rxjs/dist/cjs/operators/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergeAll = exports.merge = exports.max = exports.materialize = exports.mapTo = exports.map = exports.last = exports.isEmpty = exports.ignoreElements = exports.groupBy = exports.first = exports.findIndex = exports.find = exports.finalize = exports.filter = exports.expand = exports.exhaustMap = exports.exhaustAll = exports.exhaust = exports.every = exports.endWith = exports.elementAt = exports.distinctUntilKeyChanged = exports.distinctUntilChanged = exports.distinct = exports.dematerialize = exports.delayWhen = exports.delay = exports.defaultIfEmpty = exports.debounceTime = exports.debounce = exports.count = exports.connect = exports.concatWith = exports.concatMapTo = exports.concatMap = exports.concatAll = exports.concat = exports.combineLatestWith = exports.combineLatest = exports.combineLatestAll = exports.combineAll = exports.catchError = exports.bufferWhen = exports.bufferToggle = exports.bufferTime = exports.bufferCount = exports.buffer = exports.auditTime = exports.audit = void 0;
    exports.timeInterval = exports.throwIfEmpty = exports.throttleTime = exports.throttle = exports.tap = exports.takeWhile = exports.takeUntil = exports.takeLast = exports.take = exports.switchScan = exports.switchMapTo = exports.switchMap = exports.switchAll = exports.subscribeOn = exports.startWith = exports.skipWhile = exports.skipUntil = exports.skipLast = exports.skip = exports.single = exports.shareReplay = exports.share = exports.sequenceEqual = exports.scan = exports.sampleTime = exports.sample = exports.refCount = exports.retryWhen = exports.retry = exports.repeatWhen = exports.repeat = exports.reduce = exports.raceWith = exports.race = exports.publishReplay = exports.publishLast = exports.publishBehavior = exports.publish = exports.pluck = exports.partition = exports.pairwise = exports.onErrorResumeNext = exports.observeOn = exports.multicast = exports.min = exports.mergeWith = exports.mergeScan = exports.mergeMapTo = exports.mergeMap = exports.flatMap = void 0;
    exports.zipWith = exports.zipAll = exports.zip = exports.withLatestFrom = exports.windowWhen = exports.windowToggle = exports.windowTime = exports.windowCount = exports.window = exports.toArray = exports.timestamp = exports.timeoutWith = exports.timeout = void 0;
    var audit_1 = require_audit();
    Object.defineProperty(exports, "audit", { enumerable: true, get: function() {
      return audit_1.audit;
    } });
    var auditTime_1 = require_auditTime();
    Object.defineProperty(exports, "auditTime", { enumerable: true, get: function() {
      return auditTime_1.auditTime;
    } });
    var buffer_1 = require_buffer();
    Object.defineProperty(exports, "buffer", { enumerable: true, get: function() {
      return buffer_1.buffer;
    } });
    var bufferCount_1 = require_bufferCount();
    Object.defineProperty(exports, "bufferCount", { enumerable: true, get: function() {
      return bufferCount_1.bufferCount;
    } });
    var bufferTime_1 = require_bufferTime();
    Object.defineProperty(exports, "bufferTime", { enumerable: true, get: function() {
      return bufferTime_1.bufferTime;
    } });
    var bufferToggle_1 = require_bufferToggle();
    Object.defineProperty(exports, "bufferToggle", { enumerable: true, get: function() {
      return bufferToggle_1.bufferToggle;
    } });
    var bufferWhen_1 = require_bufferWhen();
    Object.defineProperty(exports, "bufferWhen", { enumerable: true, get: function() {
      return bufferWhen_1.bufferWhen;
    } });
    var catchError_1 = require_catchError();
    Object.defineProperty(exports, "catchError", { enumerable: true, get: function() {
      return catchError_1.catchError;
    } });
    var combineAll_1 = require_combineAll();
    Object.defineProperty(exports, "combineAll", { enumerable: true, get: function() {
      return combineAll_1.combineAll;
    } });
    var combineLatestAll_1 = require_combineLatestAll();
    Object.defineProperty(exports, "combineLatestAll", { enumerable: true, get: function() {
      return combineLatestAll_1.combineLatestAll;
    } });
    var combineLatest_1 = require_combineLatest2();
    Object.defineProperty(exports, "combineLatest", { enumerable: true, get: function() {
      return combineLatest_1.combineLatest;
    } });
    var combineLatestWith_1 = require_combineLatestWith();
    Object.defineProperty(exports, "combineLatestWith", { enumerable: true, get: function() {
      return combineLatestWith_1.combineLatestWith;
    } });
    var concat_1 = require_concat2();
    Object.defineProperty(exports, "concat", { enumerable: true, get: function() {
      return concat_1.concat;
    } });
    var concatAll_1 = require_concatAll();
    Object.defineProperty(exports, "concatAll", { enumerable: true, get: function() {
      return concatAll_1.concatAll;
    } });
    var concatMap_1 = require_concatMap();
    Object.defineProperty(exports, "concatMap", { enumerable: true, get: function() {
      return concatMap_1.concatMap;
    } });
    var concatMapTo_1 = require_concatMapTo();
    Object.defineProperty(exports, "concatMapTo", { enumerable: true, get: function() {
      return concatMapTo_1.concatMapTo;
    } });
    var concatWith_1 = require_concatWith();
    Object.defineProperty(exports, "concatWith", { enumerable: true, get: function() {
      return concatWith_1.concatWith;
    } });
    var connect_1 = require_connect();
    Object.defineProperty(exports, "connect", { enumerable: true, get: function() {
      return connect_1.connect;
    } });
    var count_1 = require_count();
    Object.defineProperty(exports, "count", { enumerable: true, get: function() {
      return count_1.count;
    } });
    var debounce_1 = require_debounce();
    Object.defineProperty(exports, "debounce", { enumerable: true, get: function() {
      return debounce_1.debounce;
    } });
    var debounceTime_1 = require_debounceTime();
    Object.defineProperty(exports, "debounceTime", { enumerable: true, get: function() {
      return debounceTime_1.debounceTime;
    } });
    var defaultIfEmpty_1 = require_defaultIfEmpty();
    Object.defineProperty(exports, "defaultIfEmpty", { enumerable: true, get: function() {
      return defaultIfEmpty_1.defaultIfEmpty;
    } });
    var delay_1 = require_delay();
    Object.defineProperty(exports, "delay", { enumerable: true, get: function() {
      return delay_1.delay;
    } });
    var delayWhen_1 = require_delayWhen();
    Object.defineProperty(exports, "delayWhen", { enumerable: true, get: function() {
      return delayWhen_1.delayWhen;
    } });
    var dematerialize_1 = require_dematerialize();
    Object.defineProperty(exports, "dematerialize", { enumerable: true, get: function() {
      return dematerialize_1.dematerialize;
    } });
    var distinct_1 = require_distinct();
    Object.defineProperty(exports, "distinct", { enumerable: true, get: function() {
      return distinct_1.distinct;
    } });
    var distinctUntilChanged_1 = require_distinctUntilChanged();
    Object.defineProperty(exports, "distinctUntilChanged", { enumerable: true, get: function() {
      return distinctUntilChanged_1.distinctUntilChanged;
    } });
    var distinctUntilKeyChanged_1 = require_distinctUntilKeyChanged();
    Object.defineProperty(exports, "distinctUntilKeyChanged", { enumerable: true, get: function() {
      return distinctUntilKeyChanged_1.distinctUntilKeyChanged;
    } });
    var elementAt_1 = require_elementAt();
    Object.defineProperty(exports, "elementAt", { enumerable: true, get: function() {
      return elementAt_1.elementAt;
    } });
    var endWith_1 = require_endWith();
    Object.defineProperty(exports, "endWith", { enumerable: true, get: function() {
      return endWith_1.endWith;
    } });
    var every_1 = require_every();
    Object.defineProperty(exports, "every", { enumerable: true, get: function() {
      return every_1.every;
    } });
    var exhaust_1 = require_exhaust();
    Object.defineProperty(exports, "exhaust", { enumerable: true, get: function() {
      return exhaust_1.exhaust;
    } });
    var exhaustAll_1 = require_exhaustAll();
    Object.defineProperty(exports, "exhaustAll", { enumerable: true, get: function() {
      return exhaustAll_1.exhaustAll;
    } });
    var exhaustMap_1 = require_exhaustMap();
    Object.defineProperty(exports, "exhaustMap", { enumerable: true, get: function() {
      return exhaustMap_1.exhaustMap;
    } });
    var expand_1 = require_expand();
    Object.defineProperty(exports, "expand", { enumerable: true, get: function() {
      return expand_1.expand;
    } });
    var filter_1 = require_filter();
    Object.defineProperty(exports, "filter", { enumerable: true, get: function() {
      return filter_1.filter;
    } });
    var finalize_1 = require_finalize();
    Object.defineProperty(exports, "finalize", { enumerable: true, get: function() {
      return finalize_1.finalize;
    } });
    var find_1 = require_find();
    Object.defineProperty(exports, "find", { enumerable: true, get: function() {
      return find_1.find;
    } });
    var findIndex_1 = require_findIndex();
    Object.defineProperty(exports, "findIndex", { enumerable: true, get: function() {
      return findIndex_1.findIndex;
    } });
    var first_1 = require_first();
    Object.defineProperty(exports, "first", { enumerable: true, get: function() {
      return first_1.first;
    } });
    var groupBy_1 = require_groupBy();
    Object.defineProperty(exports, "groupBy", { enumerable: true, get: function() {
      return groupBy_1.groupBy;
    } });
    var ignoreElements_1 = require_ignoreElements();
    Object.defineProperty(exports, "ignoreElements", { enumerable: true, get: function() {
      return ignoreElements_1.ignoreElements;
    } });
    var isEmpty_1 = require_isEmpty();
    Object.defineProperty(exports, "isEmpty", { enumerable: true, get: function() {
      return isEmpty_1.isEmpty;
    } });
    var last_1 = require_last();
    Object.defineProperty(exports, "last", { enumerable: true, get: function() {
      return last_1.last;
    } });
    var map_1 = require_map();
    Object.defineProperty(exports, "map", { enumerable: true, get: function() {
      return map_1.map;
    } });
    var mapTo_1 = require_mapTo();
    Object.defineProperty(exports, "mapTo", { enumerable: true, get: function() {
      return mapTo_1.mapTo;
    } });
    var materialize_1 = require_materialize();
    Object.defineProperty(exports, "materialize", { enumerable: true, get: function() {
      return materialize_1.materialize;
    } });
    var max_1 = require_max();
    Object.defineProperty(exports, "max", { enumerable: true, get: function() {
      return max_1.max;
    } });
    var merge_1 = require_merge2();
    Object.defineProperty(exports, "merge", { enumerable: true, get: function() {
      return merge_1.merge;
    } });
    var mergeAll_1 = require_mergeAll();
    Object.defineProperty(exports, "mergeAll", { enumerable: true, get: function() {
      return mergeAll_1.mergeAll;
    } });
    var flatMap_1 = require_flatMap();
    Object.defineProperty(exports, "flatMap", { enumerable: true, get: function() {
      return flatMap_1.flatMap;
    } });
    var mergeMap_1 = require_mergeMap();
    Object.defineProperty(exports, "mergeMap", { enumerable: true, get: function() {
      return mergeMap_1.mergeMap;
    } });
    var mergeMapTo_1 = require_mergeMapTo();
    Object.defineProperty(exports, "mergeMapTo", { enumerable: true, get: function() {
      return mergeMapTo_1.mergeMapTo;
    } });
    var mergeScan_1 = require_mergeScan();
    Object.defineProperty(exports, "mergeScan", { enumerable: true, get: function() {
      return mergeScan_1.mergeScan;
    } });
    var mergeWith_1 = require_mergeWith();
    Object.defineProperty(exports, "mergeWith", { enumerable: true, get: function() {
      return mergeWith_1.mergeWith;
    } });
    var min_1 = require_min();
    Object.defineProperty(exports, "min", { enumerable: true, get: function() {
      return min_1.min;
    } });
    var multicast_1 = require_multicast();
    Object.defineProperty(exports, "multicast", { enumerable: true, get: function() {
      return multicast_1.multicast;
    } });
    var observeOn_1 = require_observeOn();
    Object.defineProperty(exports, "observeOn", { enumerable: true, get: function() {
      return observeOn_1.observeOn;
    } });
    var onErrorResumeNextWith_1 = require_onErrorResumeNextWith();
    Object.defineProperty(exports, "onErrorResumeNext", { enumerable: true, get: function() {
      return onErrorResumeNextWith_1.onErrorResumeNext;
    } });
    var pairwise_1 = require_pairwise();
    Object.defineProperty(exports, "pairwise", { enumerable: true, get: function() {
      return pairwise_1.pairwise;
    } });
    var partition_1 = require_partition2();
    Object.defineProperty(exports, "partition", { enumerable: true, get: function() {
      return partition_1.partition;
    } });
    var pluck_1 = require_pluck();
    Object.defineProperty(exports, "pluck", { enumerable: true, get: function() {
      return pluck_1.pluck;
    } });
    var publish_1 = require_publish();
    Object.defineProperty(exports, "publish", { enumerable: true, get: function() {
      return publish_1.publish;
    } });
    var publishBehavior_1 = require_publishBehavior();
    Object.defineProperty(exports, "publishBehavior", { enumerable: true, get: function() {
      return publishBehavior_1.publishBehavior;
    } });
    var publishLast_1 = require_publishLast();
    Object.defineProperty(exports, "publishLast", { enumerable: true, get: function() {
      return publishLast_1.publishLast;
    } });
    var publishReplay_1 = require_publishReplay();
    Object.defineProperty(exports, "publishReplay", { enumerable: true, get: function() {
      return publishReplay_1.publishReplay;
    } });
    var race_1 = require_race2();
    Object.defineProperty(exports, "race", { enumerable: true, get: function() {
      return race_1.race;
    } });
    var raceWith_1 = require_raceWith();
    Object.defineProperty(exports, "raceWith", { enumerable: true, get: function() {
      return raceWith_1.raceWith;
    } });
    var reduce_1 = require_reduce();
    Object.defineProperty(exports, "reduce", { enumerable: true, get: function() {
      return reduce_1.reduce;
    } });
    var repeat_1 = require_repeat();
    Object.defineProperty(exports, "repeat", { enumerable: true, get: function() {
      return repeat_1.repeat;
    } });
    var repeatWhen_1 = require_repeatWhen();
    Object.defineProperty(exports, "repeatWhen", { enumerable: true, get: function() {
      return repeatWhen_1.repeatWhen;
    } });
    var retry_1 = require_retry();
    Object.defineProperty(exports, "retry", { enumerable: true, get: function() {
      return retry_1.retry;
    } });
    var retryWhen_1 = require_retryWhen();
    Object.defineProperty(exports, "retryWhen", { enumerable: true, get: function() {
      return retryWhen_1.retryWhen;
    } });
    var refCount_1 = require_refCount();
    Object.defineProperty(exports, "refCount", { enumerable: true, get: function() {
      return refCount_1.refCount;
    } });
    var sample_1 = require_sample();
    Object.defineProperty(exports, "sample", { enumerable: true, get: function() {
      return sample_1.sample;
    } });
    var sampleTime_1 = require_sampleTime();
    Object.defineProperty(exports, "sampleTime", { enumerable: true, get: function() {
      return sampleTime_1.sampleTime;
    } });
    var scan_1 = require_scan();
    Object.defineProperty(exports, "scan", { enumerable: true, get: function() {
      return scan_1.scan;
    } });
    var sequenceEqual_1 = require_sequenceEqual();
    Object.defineProperty(exports, "sequenceEqual", { enumerable: true, get: function() {
      return sequenceEqual_1.sequenceEqual;
    } });
    var share_1 = require_share();
    Object.defineProperty(exports, "share", { enumerable: true, get: function() {
      return share_1.share;
    } });
    var shareReplay_1 = require_shareReplay();
    Object.defineProperty(exports, "shareReplay", { enumerable: true, get: function() {
      return shareReplay_1.shareReplay;
    } });
    var single_1 = require_single();
    Object.defineProperty(exports, "single", { enumerable: true, get: function() {
      return single_1.single;
    } });
    var skip_1 = require_skip();
    Object.defineProperty(exports, "skip", { enumerable: true, get: function() {
      return skip_1.skip;
    } });
    var skipLast_1 = require_skipLast();
    Object.defineProperty(exports, "skipLast", { enumerable: true, get: function() {
      return skipLast_1.skipLast;
    } });
    var skipUntil_1 = require_skipUntil();
    Object.defineProperty(exports, "skipUntil", { enumerable: true, get: function() {
      return skipUntil_1.skipUntil;
    } });
    var skipWhile_1 = require_skipWhile();
    Object.defineProperty(exports, "skipWhile", { enumerable: true, get: function() {
      return skipWhile_1.skipWhile;
    } });
    var startWith_1 = require_startWith();
    Object.defineProperty(exports, "startWith", { enumerable: true, get: function() {
      return startWith_1.startWith;
    } });
    var subscribeOn_1 = require_subscribeOn();
    Object.defineProperty(exports, "subscribeOn", { enumerable: true, get: function() {
      return subscribeOn_1.subscribeOn;
    } });
    var switchAll_1 = require_switchAll();
    Object.defineProperty(exports, "switchAll", { enumerable: true, get: function() {
      return switchAll_1.switchAll;
    } });
    var switchMap_1 = require_switchMap();
    Object.defineProperty(exports, "switchMap", { enumerable: true, get: function() {
      return switchMap_1.switchMap;
    } });
    var switchMapTo_1 = require_switchMapTo();
    Object.defineProperty(exports, "switchMapTo", { enumerable: true, get: function() {
      return switchMapTo_1.switchMapTo;
    } });
    var switchScan_1 = require_switchScan();
    Object.defineProperty(exports, "switchScan", { enumerable: true, get: function() {
      return switchScan_1.switchScan;
    } });
    var take_1 = require_take();
    Object.defineProperty(exports, "take", { enumerable: true, get: function() {
      return take_1.take;
    } });
    var takeLast_1 = require_takeLast();
    Object.defineProperty(exports, "takeLast", { enumerable: true, get: function() {
      return takeLast_1.takeLast;
    } });
    var takeUntil_1 = require_takeUntil();
    Object.defineProperty(exports, "takeUntil", { enumerable: true, get: function() {
      return takeUntil_1.takeUntil;
    } });
    var takeWhile_1 = require_takeWhile();
    Object.defineProperty(exports, "takeWhile", { enumerable: true, get: function() {
      return takeWhile_1.takeWhile;
    } });
    var tap_1 = require_tap();
    Object.defineProperty(exports, "tap", { enumerable: true, get: function() {
      return tap_1.tap;
    } });
    var throttle_1 = require_throttle();
    Object.defineProperty(exports, "throttle", { enumerable: true, get: function() {
      return throttle_1.throttle;
    } });
    var throttleTime_1 = require_throttleTime();
    Object.defineProperty(exports, "throttleTime", { enumerable: true, get: function() {
      return throttleTime_1.throttleTime;
    } });
    var throwIfEmpty_1 = require_throwIfEmpty();
    Object.defineProperty(exports, "throwIfEmpty", { enumerable: true, get: function() {
      return throwIfEmpty_1.throwIfEmpty;
    } });
    var timeInterval_1 = require_timeInterval();
    Object.defineProperty(exports, "timeInterval", { enumerable: true, get: function() {
      return timeInterval_1.timeInterval;
    } });
    var timeout_1 = require_timeout();
    Object.defineProperty(exports, "timeout", { enumerable: true, get: function() {
      return timeout_1.timeout;
    } });
    var timeoutWith_1 = require_timeoutWith();
    Object.defineProperty(exports, "timeoutWith", { enumerable: true, get: function() {
      return timeoutWith_1.timeoutWith;
    } });
    var timestamp_1 = require_timestamp();
    Object.defineProperty(exports, "timestamp", { enumerable: true, get: function() {
      return timestamp_1.timestamp;
    } });
    var toArray_1 = require_toArray();
    Object.defineProperty(exports, "toArray", { enumerable: true, get: function() {
      return toArray_1.toArray;
    } });
    var window_1 = require_window();
    Object.defineProperty(exports, "window", { enumerable: true, get: function() {
      return window_1.window;
    } });
    var windowCount_1 = require_windowCount();
    Object.defineProperty(exports, "windowCount", { enumerable: true, get: function() {
      return windowCount_1.windowCount;
    } });
    var windowTime_1 = require_windowTime();
    Object.defineProperty(exports, "windowTime", { enumerable: true, get: function() {
      return windowTime_1.windowTime;
    } });
    var windowToggle_1 = require_windowToggle();
    Object.defineProperty(exports, "windowToggle", { enumerable: true, get: function() {
      return windowToggle_1.windowToggle;
    } });
    var windowWhen_1 = require_windowWhen();
    Object.defineProperty(exports, "windowWhen", { enumerable: true, get: function() {
      return windowWhen_1.windowWhen;
    } });
    var withLatestFrom_1 = require_withLatestFrom();
    Object.defineProperty(exports, "withLatestFrom", { enumerable: true, get: function() {
      return withLatestFrom_1.withLatestFrom;
    } });
    var zip_1 = require_zip2();
    Object.defineProperty(exports, "zip", { enumerable: true, get: function() {
      return zip_1.zip;
    } });
    var zipAll_1 = require_zipAll();
    Object.defineProperty(exports, "zipAll", { enumerable: true, get: function() {
      return zipAll_1.zipAll;
    } });
    var zipWith_1 = require_zipWith();
    Object.defineProperty(exports, "zipWith", { enumerable: true, get: function() {
      return zipWith_1.zipWith;
    } });
  }
});

// node_modules/@angular/core/fesm2022/not_found.mjs
var _currentInjector = void 0;
function getCurrentInjector() {
  return _currentInjector;
}
function setCurrentInjector(injector) {
  const former = _currentInjector;
  _currentInjector = injector;
  return former;
}
var NOT_FOUND = Symbol("NotFound");
function isNotFound(e) {
  return e === NOT_FOUND || e?.name === "ɵNotFound";
}

// node_modules/@angular/core/fesm2022/signal.mjs
var activeConsumer = null;
var inNotificationPhase = false;
var epoch = 1;
var postProducerCreatedFn = null;
var SIGNAL = Symbol("SIGNAL");
function setActiveConsumer(consumer) {
  const prev = activeConsumer;
  activeConsumer = consumer;
  return prev;
}
function getActiveConsumer() {
  return activeConsumer;
}
function isInNotificationPhase() {
  return inNotificationPhase;
}
var REACTIVE_NODE = {
  version: 0,
  lastCleanEpoch: 0,
  dirty: false,
  producers: void 0,
  producersTail: void 0,
  consumers: void 0,
  consumersTail: void 0,
  recomputing: false,
  consumerAllowSignalWrites: false,
  consumerIsAlwaysLive: false,
  kind: "unknown",
  producerMustRecompute: () => false,
  producerRecomputeValue: () => {
  },
  consumerMarkedDirty: () => {
  },
  consumerOnSignalRead: () => {
  }
};
function producerAccessed(node) {
  if (inNotificationPhase) {
    throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? `Assertion error: signal read during notification phase` : "");
  }
  if (activeConsumer === null) {
    return;
  }
  activeConsumer.consumerOnSignalRead(node);
  const prevProducerLink = activeConsumer.producersTail;
  if (prevProducerLink !== void 0 && prevProducerLink.producer === node) {
    return;
  }
  let nextProducerLink = void 0;
  const isRecomputing = activeConsumer.recomputing;
  if (isRecomputing) {
    nextProducerLink = prevProducerLink !== void 0 ? prevProducerLink.nextProducer : activeConsumer.producers;
    if (nextProducerLink !== void 0 && nextProducerLink.producer === node) {
      activeConsumer.producersTail = nextProducerLink;
      nextProducerLink.lastReadVersion = node.version;
      return;
    }
  }
  const prevConsumerLink = node.consumersTail;
  if (prevConsumerLink !== void 0 && prevConsumerLink.consumer === activeConsumer && // However, we have to make sure that the link we've discovered isn't from a node that is incrementally rebuilding its producer list
  (!isRecomputing || isValidLink(prevConsumerLink, activeConsumer))) {
    return;
  }
  const isLive = consumerIsLive(activeConsumer);
  const newLink = {
    producer: node,
    consumer: activeConsumer,
    // instead of eagerly destroying the previous link, we delay until we've finished recomputing
    // the producers list, so that we can destroy all of the old links at once.
    nextProducer: nextProducerLink,
    prevConsumer: prevConsumerLink,
    lastReadVersion: node.version,
    nextConsumer: void 0
  };
  activeConsumer.producersTail = newLink;
  if (prevProducerLink !== void 0) {
    prevProducerLink.nextProducer = newLink;
  } else {
    activeConsumer.producers = newLink;
  }
  if (isLive) {
    producerAddLiveConsumer(node, newLink);
  }
}
function producerIncrementEpoch() {
  epoch++;
}
function producerUpdateValueVersion(node) {
  if (consumerIsLive(node) && !node.dirty) {
    return;
  }
  if (!node.dirty && node.lastCleanEpoch === epoch) {
    return;
  }
  if (!node.producerMustRecompute(node) && !consumerPollProducersForChange(node)) {
    producerMarkClean(node);
    return;
  }
  node.producerRecomputeValue(node);
  producerMarkClean(node);
}
function producerNotifyConsumers(node) {
  if (node.consumers === void 0) {
    return;
  }
  const prev = inNotificationPhase;
  inNotificationPhase = true;
  try {
    for (let link = node.consumers; link !== void 0; link = link.nextConsumer) {
      const consumer = link.consumer;
      if (!consumer.dirty) {
        consumerMarkDirty(consumer);
      }
    }
  } finally {
    inNotificationPhase = prev;
  }
}
function producerUpdatesAllowed() {
  return activeConsumer?.consumerAllowSignalWrites !== false;
}
function consumerMarkDirty(node) {
  node.dirty = true;
  producerNotifyConsumers(node);
  node.consumerMarkedDirty?.(node);
}
function producerMarkClean(node) {
  node.dirty = false;
  node.lastCleanEpoch = epoch;
}
function consumerBeforeComputation(node) {
  if (node)
    resetConsumerBeforeComputation(node);
  return setActiveConsumer(node);
}
function resetConsumerBeforeComputation(node) {
  node.producersTail = void 0;
  node.recomputing = true;
}
function consumerAfterComputation(node, prevConsumer) {
  setActiveConsumer(prevConsumer);
  if (node)
    finalizeConsumerAfterComputation(node);
}
function finalizeConsumerAfterComputation(node) {
  node.recomputing = false;
  const producersTail = node.producersTail;
  let toRemove = producersTail !== void 0 ? producersTail.nextProducer : node.producers;
  if (toRemove !== void 0) {
    if (consumerIsLive(node)) {
      do {
        toRemove = producerRemoveLiveConsumerLink(toRemove);
      } while (toRemove !== void 0);
    }
    if (producersTail !== void 0) {
      producersTail.nextProducer = void 0;
    } else {
      node.producers = void 0;
    }
  }
}
function consumerPollProducersForChange(node) {
  for (let link = node.producers; link !== void 0; link = link.nextProducer) {
    const producer = link.producer;
    const seenVersion = link.lastReadVersion;
    if (seenVersion !== producer.version) {
      return true;
    }
    producerUpdateValueVersion(producer);
    if (seenVersion !== producer.version) {
      return true;
    }
  }
  return false;
}
function consumerDestroy(node) {
  if (consumerIsLive(node)) {
    let link = node.producers;
    while (link !== void 0) {
      link = producerRemoveLiveConsumerLink(link);
    }
  }
  node.producers = void 0;
  node.producersTail = void 0;
  node.consumers = void 0;
  node.consumersTail = void 0;
}
function producerAddLiveConsumer(node, link) {
  const consumersTail = node.consumersTail;
  const wasLive = consumerIsLive(node);
  if (consumersTail !== void 0) {
    link.nextConsumer = consumersTail.nextConsumer;
    consumersTail.nextConsumer = link;
  } else {
    link.nextConsumer = void 0;
    node.consumers = link;
  }
  link.prevConsumer = consumersTail;
  node.consumersTail = link;
  if (!wasLive) {
    for (let link2 = node.producers; link2 !== void 0; link2 = link2.nextProducer) {
      producerAddLiveConsumer(link2.producer, link2);
    }
  }
}
function producerRemoveLiveConsumerLink(link) {
  const producer = link.producer;
  const nextProducer = link.nextProducer;
  const nextConsumer = link.nextConsumer;
  const prevConsumer = link.prevConsumer;
  link.nextConsumer = void 0;
  link.prevConsumer = void 0;
  if (nextConsumer !== void 0) {
    nextConsumer.prevConsumer = prevConsumer;
  } else {
    producer.consumersTail = prevConsumer;
  }
  if (prevConsumer !== void 0) {
    prevConsumer.nextConsumer = nextConsumer;
  } else {
    producer.consumers = nextConsumer;
    if (!consumerIsLive(producer)) {
      let producerLink = producer.producers;
      while (producerLink !== void 0) {
        producerLink = producerRemoveLiveConsumerLink(producerLink);
      }
    }
  }
  return nextProducer;
}
function consumerIsLive(node) {
  return node.consumerIsAlwaysLive || node.consumers !== void 0;
}
function runPostProducerCreatedFn(node) {
  postProducerCreatedFn?.(node);
}
function isValidLink(checkLink, consumer) {
  const producersTail = consumer.producersTail;
  if (producersTail !== void 0) {
    let link = consumer.producers;
    do {
      if (link === checkLink) {
        return true;
      }
      if (link === producersTail) {
        break;
      }
      link = link.nextProducer;
    } while (link !== void 0);
  }
  return false;
}
function defaultEquals(a, b) {
  return Object.is(a, b);
}
function createComputed(computation, equal) {
  const node = Object.create(COMPUTED_NODE);
  node.computation = computation;
  if (equal !== void 0) {
    node.equal = equal;
  }
  const computed2 = () => {
    producerUpdateValueVersion(node);
    producerAccessed(node);
    if (node.value === ERRORED) {
      throw node.error;
    }
    return node.value;
  };
  computed2[SIGNAL] = node;
  if (typeof ngDevMode !== "undefined" && ngDevMode) {
    const debugName = node.debugName ? " (" + node.debugName + ")" : "";
    computed2.toString = () => `[Computed${debugName}: ${node.value}]`;
  }
  runPostProducerCreatedFn(node);
  return computed2;
}
var UNSET = Symbol("UNSET");
var COMPUTING = Symbol("COMPUTING");
var ERRORED = Symbol("ERRORED");
var COMPUTED_NODE = (() => {
  return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
    value: UNSET,
    dirty: true,
    error: null,
    equal: defaultEquals,
    kind: "computed",
    producerMustRecompute(node) {
      return node.value === UNSET || node.value === COMPUTING;
    },
    producerRecomputeValue(node) {
      if (node.value === COMPUTING) {
        throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? "Detected cycle in computations." : "");
      }
      const oldValue = node.value;
      node.value = COMPUTING;
      const prevConsumer = consumerBeforeComputation(node);
      let newValue;
      let wasEqual = false;
      try {
        newValue = node.computation();
        setActiveConsumer(null);
        wasEqual = oldValue !== UNSET && oldValue !== ERRORED && newValue !== ERRORED && node.equal(oldValue, newValue);
      } catch (err) {
        newValue = ERRORED;
        node.error = err;
      } finally {
        consumerAfterComputation(node, prevConsumer);
      }
      if (wasEqual) {
        node.value = oldValue;
        return;
      }
      node.value = newValue;
      node.version++;
    }
  });
})();
function defaultThrowError() {
  throw new Error();
}
var throwInvalidWriteToSignalErrorFn = defaultThrowError;
function throwInvalidWriteToSignalError(node) {
  throwInvalidWriteToSignalErrorFn(node);
}
function setThrowInvalidWriteToSignalError(fn) {
  throwInvalidWriteToSignalErrorFn = fn;
}
var postSignalSetFn = null;
function createSignal(initialValue, equal) {
  const node = Object.create(SIGNAL_NODE);
  node.value = initialValue;
  if (equal !== void 0) {
    node.equal = equal;
  }
  const getter = (() => signalGetFn(node));
  getter[SIGNAL] = node;
  if (typeof ngDevMode !== "undefined" && ngDevMode) {
    const debugName = node.debugName ? " (" + node.debugName + ")" : "";
    getter.toString = () => `[Signal${debugName}: ${node.value}]`;
  }
  runPostProducerCreatedFn(node);
  const set = (newValue) => signalSetFn(node, newValue);
  const update = (updateFn) => signalUpdateFn(node, updateFn);
  return [getter, set, update];
}
function signalGetFn(node) {
  producerAccessed(node);
  return node.value;
}
function signalSetFn(node, newValue) {
  if (!producerUpdatesAllowed()) {
    throwInvalidWriteToSignalError(node);
  }
  if (!node.equal(node.value, newValue)) {
    node.value = newValue;
    signalValueChanged(node);
  }
}
function signalUpdateFn(node, updater) {
  if (!producerUpdatesAllowed()) {
    throwInvalidWriteToSignalError(node);
  }
  signalSetFn(node, updater(node.value));
}
var SIGNAL_NODE = (() => {
  return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
    equal: defaultEquals,
    value: void 0,
    kind: "signal"
  });
})();
function signalValueChanged(node) {
  node.version++;
  producerIncrementEpoch();
  producerNotifyConsumers(node);
  postSignalSetFn?.(node);
}

// node_modules/@angular/core/fesm2022/effect.mjs
function createLinkedSignal(sourceFn, computationFn, equalityFn) {
  const node = Object.create(LINKED_SIGNAL_NODE);
  node.source = sourceFn;
  node.computation = computationFn;
  if (equalityFn != void 0) {
    node.equal = equalityFn;
  }
  const linkedSignalGetter = () => {
    producerUpdateValueVersion(node);
    producerAccessed(node);
    if (node.value === ERRORED) {
      throw node.error;
    }
    return node.value;
  };
  const getter = linkedSignalGetter;
  getter[SIGNAL] = node;
  if (typeof ngDevMode !== "undefined" && ngDevMode) {
    const debugName = node.debugName ? " (" + node.debugName + ")" : "";
    getter.toString = () => `[LinkedSignal${debugName}: ${node.value}]`;
  }
  runPostProducerCreatedFn(node);
  return getter;
}
function linkedSignalSetFn(node, newValue) {
  producerUpdateValueVersion(node);
  signalSetFn(node, newValue);
  producerMarkClean(node);
}
function linkedSignalUpdateFn(node, updater) {
  producerUpdateValueVersion(node);
  signalUpdateFn(node, updater);
  producerMarkClean(node);
}
var LINKED_SIGNAL_NODE = (() => {
  return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
    value: UNSET,
    dirty: true,
    error: null,
    equal: defaultEquals,
    kind: "linkedSignal",
    producerMustRecompute(node) {
      return node.value === UNSET || node.value === COMPUTING;
    },
    producerRecomputeValue(node) {
      if (node.value === COMPUTING) {
        throw new Error(typeof ngDevMode !== "undefined" && ngDevMode ? "Detected cycle in computations." : "");
      }
      const oldValue = node.value;
      node.value = COMPUTING;
      const prevConsumer = consumerBeforeComputation(node);
      let newValue;
      try {
        const newSourceValue = node.source();
        const prev = oldValue === UNSET || oldValue === ERRORED ? void 0 : {
          source: node.sourceValue,
          value: oldValue
        };
        newValue = node.computation(newSourceValue, prev);
        node.sourceValue = newSourceValue;
      } catch (err) {
        newValue = ERRORED;
        node.error = err;
      } finally {
        consumerAfterComputation(node, prevConsumer);
      }
      if (oldValue !== UNSET && newValue !== ERRORED && node.equal(oldValue, newValue)) {
        node.value = oldValue;
        return;
      }
      node.value = newValue;
      node.version++;
    }
  });
})();
function untracked(nonReactiveReadsFn) {
  const prevConsumer = setActiveConsumer(null);
  try {
    return nonReactiveReadsFn();
  } finally {
    setActiveConsumer(prevConsumer);
  }
}
var BASE_EFFECT_NODE = (() => __spreadProps(__spreadValues({}, REACTIVE_NODE), {
  consumerIsAlwaysLive: true,
  consumerAllowSignalWrites: true,
  dirty: true,
  kind: "effect"
}))();
function runEffect(node) {
  node.dirty = false;
  if (node.version > 0 && !consumerPollProducersForChange(node)) {
    return;
  }
  node.version++;
  const prevNode = consumerBeforeComputation(node);
  try {
    node.cleanup();
    node.fn();
  } finally {
    consumerAfterComputation(node, prevNode);
  }
}

// node_modules/@angular/core/fesm2022/weak_ref.mjs
function setAlternateWeakRefImpl(impl) {
}

// node_modules/@angular/core/fesm2022/primitives/signals.mjs
var formatter = {
  /**
   *  If the function returns `null`, the formatter is not used for this reference
   */
  header: (sig, config) => {
    if (!isSignal(sig) || config?.ngSkipFormatting)
      return null;
    let value;
    try {
      value = sig();
    } catch {
      return ["span", "Signal(⚠️ Error)"];
    }
    const kind = "computation" in sig[SIGNAL] ? "Computed" : "Signal";
    const isPrimitive = value === null || !Array.isArray(value) && typeof value !== "object";
    return [
      "span",
      {},
      ["span", {}, `${kind}(`],
      (() => {
        if (isSignal(value)) {
          return formatter.header(value, config);
        } else if (isPrimitive && value !== void 0 && typeof value !== "function") {
          return ["object", { object: value }];
        } else {
          return prettifyPreview(value);
        }
      })(),
      ["span", {}, `)`]
    ];
  },
  hasBody: (sig, config) => {
    if (!isSignal(sig))
      return false;
    try {
      sig();
    } catch {
      return false;
    }
    return !config?.ngSkipFormatting;
  },
  body: (sig, config) => {
    const color = "var(--sys-color-primary)";
    return [
      "div",
      { style: `background: #FFFFFF10; padding-left: 4px; padding-top: 2px; padding-bottom: 2px;` },
      ["div", { style: `color: ${color}` }, "Signal value: "],
      ["div", { style: `padding-left: .5rem;` }, ["object", { object: sig(), config }]],
      ["div", { style: `color: ${color}` }, "Signal function: "],
      [
        "div",
        { style: `padding-left: .5rem;` },
        ["object", { object: sig, config: __spreadProps(__spreadValues({}, config), { skipFormatting: true }) }]
      ]
    ];
  }
};
function prettifyPreview(value) {
  if (value === null)
    return "null";
  if (Array.isArray(value))
    return `Array(${value.length})`;
  if (value instanceof Element)
    return `<${value.tagName.toLowerCase()}>`;
  if (value instanceof URL)
    return `URL`;
  switch (typeof value) {
    case "undefined": {
      return "undefined";
    }
    case "function": {
      if ("prototype" in value) {
        return "class";
      } else {
        return "() => {…}";
      }
    }
    case "object": {
      if (value.constructor.name === "Object") {
        return "{…}";
      } else {
        return `${value.constructor.name} {}`;
      }
    }
    default: {
      return ["object", { object: value, config: { skipFormatting: true } }];
    }
  }
}
function isSignal(value) {
  return value[SIGNAL] !== void 0;
}
function installDevToolsSignalFormatter() {
  globalThis.devtoolsFormatters ??= [];
  if (!globalThis.devtoolsFormatters.some((f) => f === formatter)) {
    globalThis.devtoolsFormatters.push(formatter);
  }
}
var NOOP_CLEANUP_FN = () => {
};
var WATCH_NODE = (() => {
  return __spreadProps(__spreadValues({}, REACTIVE_NODE), {
    consumerIsAlwaysLive: true,
    consumerAllowSignalWrites: false,
    consumerMarkedDirty: (node) => {
      if (node.schedule !== null) {
        node.schedule(node.ref);
      }
    },
    cleanupFn: NOOP_CLEANUP_FN
  });
})();
if (typeof ngDevMode !== "undefined" && ngDevMode) {
  installDevToolsSignalFormatter();
}

// node_modules/@angular/core/fesm2022/root_effect_scheduler.mjs
var import_rxjs = __toESM(require_cjs(), 1);
var Version = class {
  full;
  major;
  minor;
  patch;
  constructor(full) {
    this.full = full;
    const parts = full.split(".");
    this.major = parts[0];
    this.minor = parts[1];
    this.patch = parts.slice(2).join(".");
  }
};
var VERSION = new Version("20.3.18");
var ERROR_DETAILS_PAGE_BASE_URL = (() => {
  const versionSubDomain = VERSION.major !== "0" ? `v${VERSION.major}.` : "";
  return `https://${versionSubDomain}angular.dev/errors`;
})();
var XSS_SECURITY_URL = "https://angular.dev/best-practices/security#preventing-cross-site-scripting-xss";
var RuntimeError = class extends Error {
  code;
  constructor(code, message) {
    super(formatRuntimeError(code, message));
    this.code = code;
  }
};
function formatRuntimeErrorCode(code) {
  return `NG0${Math.abs(code)}`;
}
function formatRuntimeError(code, message) {
  const fullCode = formatRuntimeErrorCode(code);
  let errorMessage = `${fullCode}${message ? ": " + message : ""}`;
  if (ngDevMode && code < 0) {
    const addPeriodSeparator = !errorMessage.match(/[.,;!?\n]$/);
    const separator = addPeriodSeparator ? "." : "";
    errorMessage = `${errorMessage}${separator} Find more at ${ERROR_DETAILS_PAGE_BASE_URL}/${fullCode}`;
  }
  return errorMessage;
}
var _global = globalThis;
function ngDevModeResetPerfCounters() {
  const locationString = typeof location !== "undefined" ? location.toString() : "";
  const newCounters = {
    hydratedNodes: 0,
    hydratedComponents: 0,
    dehydratedViewsRemoved: 0,
    dehydratedViewsCleanupRuns: 0,
    componentsSkippedHydration: 0,
    deferBlocksWithIncrementalHydration: 0
  };
  const allowNgDevModeTrue = locationString.indexOf("ngDevMode=false") === -1;
  if (!allowNgDevModeTrue) {
    _global["ngDevMode"] = false;
  } else {
    if (typeof _global["ngDevMode"] !== "object") {
      _global["ngDevMode"] = {};
    }
    Object.assign(_global["ngDevMode"], newCounters);
  }
  return newCounters;
}
function initNgDevMode() {
  if (typeof ngDevMode === "undefined" || ngDevMode) {
    if (typeof ngDevMode !== "object" || Object.keys(ngDevMode).length === 0) {
      ngDevModeResetPerfCounters();
    }
    return typeof ngDevMode !== "undefined" && !!ngDevMode;
  }
  return false;
}
function getClosureSafeProperty(objWithPropertyToExtract) {
  for (let key in objWithPropertyToExtract) {
    if (objWithPropertyToExtract[key] === getClosureSafeProperty) {
      return key;
    }
  }
  throw Error(typeof ngDevMode !== "undefined" && ngDevMode ? "Could not find renamed property on target object." : "");
}
function fillProperties(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}
function stringify(token) {
  if (typeof token === "string") {
    return token;
  }
  if (Array.isArray(token)) {
    return `[${token.map(stringify).join(", ")}]`;
  }
  if (token == null) {
    return "" + token;
  }
  const name = token.overriddenName || token.name;
  if (name) {
    return `${name}`;
  }
  const result = token.toString();
  if (result == null) {
    return "" + result;
  }
  const newLineIndex = result.indexOf("\n");
  return newLineIndex >= 0 ? result.slice(0, newLineIndex) : result;
}
function concatStringsWithSpace(before, after) {
  if (!before)
    return after || "";
  if (!after)
    return before;
  return `${before} ${after}`;
}
function truncateMiddle(str, maxLength = 100) {
  if (!str || maxLength < 1 || str.length <= maxLength)
    return str;
  if (maxLength == 1)
    return str.substring(0, 1) + "...";
  const halfLimit = Math.round(maxLength / 2);
  return str.substring(0, halfLimit) + "..." + str.substring(str.length - halfLimit);
}
var __forward_ref__ = getClosureSafeProperty({ __forward_ref__: getClosureSafeProperty });
function forwardRef(forwardRefFn) {
  forwardRefFn.__forward_ref__ = forwardRef;
  forwardRefFn.toString = function() {
    return stringify(this());
  };
  return forwardRefFn;
}
function resolveForwardRef(type) {
  return isForwardRef(type) ? type() : type;
}
function isForwardRef(fn) {
  return typeof fn === "function" && fn.hasOwnProperty(__forward_ref__) && fn.__forward_ref__ === forwardRef;
}
function assertNumber(actual, msg) {
  if (!(typeof actual === "number")) {
    throwError(msg, typeof actual, "number", "===");
  }
}
function assertNumberInRange(actual, minInclusive, maxInclusive) {
  assertNumber(actual, "Expected a number");
  assertLessThanOrEqual(actual, maxInclusive, "Expected number to be less than or equal to");
  assertGreaterThanOrEqual(actual, minInclusive, "Expected number to be greater than or equal to");
}
function assertString(actual, msg) {
  if (!(typeof actual === "string")) {
    throwError(msg, actual === null ? "null" : typeof actual, "string", "===");
  }
}
function assertFunction(actual, msg) {
  if (!(typeof actual === "function")) {
    throwError(msg, actual === null ? "null" : typeof actual, "function", "===");
  }
}
function assertEqual(actual, expected, msg) {
  if (!(actual == expected)) {
    throwError(msg, actual, expected, "==");
  }
}
function assertNotEqual(actual, expected, msg) {
  if (!(actual != expected)) {
    throwError(msg, actual, expected, "!=");
  }
}
function assertSame(actual, expected, msg) {
  if (!(actual === expected)) {
    throwError(msg, actual, expected, "===");
  }
}
function assertNotSame(actual, expected, msg) {
  if (!(actual !== expected)) {
    throwError(msg, actual, expected, "!==");
  }
}
function assertLessThan(actual, expected, msg) {
  if (!(actual < expected)) {
    throwError(msg, actual, expected, "<");
  }
}
function assertLessThanOrEqual(actual, expected, msg) {
  if (!(actual <= expected)) {
    throwError(msg, actual, expected, "<=");
  }
}
function assertGreaterThan(actual, expected, msg) {
  if (!(actual > expected)) {
    throwError(msg, actual, expected, ">");
  }
}
function assertGreaterThanOrEqual(actual, expected, msg) {
  if (!(actual >= expected)) {
    throwError(msg, actual, expected, ">=");
  }
}
function assertNotDefined(actual, msg) {
  if (actual != null) {
    throwError(msg, actual, null, "==");
  }
}
function assertDefined(actual, msg) {
  if (actual == null) {
    throwError(msg, actual, null, "!=");
  }
}
function throwError(msg, actual, expected, comparison) {
  throw new Error(`ASSERTION ERROR: ${msg}` + (comparison == null ? "" : ` [Expected=> ${expected} ${comparison} ${actual} <=Actual]`));
}
function assertDomNode(node) {
  if (!(node instanceof Node)) {
    throwError(`The provided value must be an instance of a DOM Node but got ${stringify(node)}`);
  }
}
function assertElement(node) {
  if (!(node instanceof Element)) {
    throwError(`The provided value must be an element but got ${stringify(node)}`);
  }
}
function assertIndexInRange(arr, index) {
  assertDefined(arr, "Array must be defined.");
  const maxLen = arr.length;
  if (index < 0 || index >= maxLen) {
    throwError(`Index expected to be less than ${maxLen} but got ${index}`);
  }
}
function assertOneOf(value, ...validValues) {
  if (validValues.indexOf(value) !== -1)
    return true;
  throwError(`Expected value to be one of ${JSON.stringify(validValues)} but was ${JSON.stringify(value)}.`);
}
function assertNotReactive(fn) {
  if (getActiveConsumer() !== null) {
    throwError(`${fn}() should never be called in a reactive context.`);
  }
}
function ɵɵdefineInjectable(opts) {
  return {
    token: opts.token,
    providedIn: opts.providedIn || null,
    factory: opts.factory,
    value: void 0
  };
}
var defineInjectable = ɵɵdefineInjectable;
function ɵɵdefineInjector(options) {
  return { providers: options.providers || [], imports: options.imports || [] };
}
function getInjectableDef(type) {
  return getOwnDefinition(type, NG_PROV_DEF);
}
function isInjectable(type) {
  return getInjectableDef(type) !== null;
}
function getOwnDefinition(type, field) {
  return type.hasOwnProperty(field) && type[field] || null;
}
function getInheritedInjectableDef(type) {
  const def = type?.[NG_PROV_DEF] ?? null;
  if (def) {
    ngDevMode && console.warn(`DEPRECATED: DI is instantiating a token "${type.name}" that inherits its @Injectable decorator but does not provide one itself.
This will become an error in a future version of Angular. Please add @Injectable() to the "${type.name}" class.`);
    return def;
  } else {
    return null;
  }
}
function getInjectorDef(type) {
  return type && type.hasOwnProperty(NG_INJ_DEF) ? type[NG_INJ_DEF] : null;
}
var NG_PROV_DEF = getClosureSafeProperty({ ɵprov: getClosureSafeProperty });
var NG_INJ_DEF = getClosureSafeProperty({ ɵinj: getClosureSafeProperty });
var InjectionToken = class {
  _desc;
  /** @internal */
  ngMetadataName = "InjectionToken";
  ɵprov;
  /**
   * @param _desc   Description for the token,
   *                used only for debugging purposes,
   *                it should but does not need to be unique
   * @param options Options for the token's usage, as described above
   */
  constructor(_desc, options) {
    this._desc = _desc;
    this.ɵprov = void 0;
    if (typeof options == "number") {
      (typeof ngDevMode === "undefined" || ngDevMode) && assertLessThan(options, 0, "Only negative numbers are supported here");
      this.__NG_ELEMENT_ID__ = options;
    } else if (options !== void 0) {
      this.ɵprov = ɵɵdefineInjectable({
        token: this,
        providedIn: options.providedIn || "root",
        factory: options.factory
      });
    }
  }
  /**
   * @internal
   */
  get multi() {
    return this;
  }
  toString() {
    return `InjectionToken ${this._desc}`;
  }
};
var _injectorProfilerContext;
function getInjectorProfilerContext() {
  !ngDevMode && throwError("getInjectorProfilerContext should never be called in production mode");
  return _injectorProfilerContext;
}
function setInjectorProfilerContext(context) {
  !ngDevMode && throwError("setInjectorProfilerContext should never be called in production mode");
  const previous = _injectorProfilerContext;
  _injectorProfilerContext = context;
  return previous;
}
var injectorProfilerCallbacks = [];
var NOOP_PROFILER_REMOVAL = () => {
};
function removeProfiler(profiler) {
  const profilerIdx = injectorProfilerCallbacks.indexOf(profiler);
  if (profilerIdx !== -1) {
    injectorProfilerCallbacks.splice(profilerIdx, 1);
  }
}
function setInjectorProfiler(injectorProfiler2) {
  !ngDevMode && throwError("setInjectorProfiler should never be called in production mode");
  if (injectorProfiler2 !== null) {
    if (!injectorProfilerCallbacks.includes(injectorProfiler2)) {
      injectorProfilerCallbacks.push(injectorProfiler2);
    }
    return () => removeProfiler(injectorProfiler2);
  } else {
    injectorProfilerCallbacks.length = 0;
    return NOOP_PROFILER_REMOVAL;
  }
}
function injectorProfiler(event) {
  !ngDevMode && throwError("Injector profiler should never be called in production mode");
  for (let i = 0; i < injectorProfilerCallbacks.length; i++) {
    const injectorProfilerCallback = injectorProfilerCallbacks[i];
    injectorProfilerCallback(event);
  }
}
function emitProviderConfiguredEvent(eventProvider, isViewProvider = false) {
  !ngDevMode && throwError("Injector profiler should never be called in production mode");
  let token;
  if (typeof eventProvider === "function") {
    token = eventProvider;
  } else if (eventProvider instanceof InjectionToken) {
    token = eventProvider;
  } else {
    token = resolveForwardRef(eventProvider.provide);
  }
  let provider = eventProvider;
  if (eventProvider instanceof InjectionToken) {
    provider = eventProvider.ɵprov || eventProvider;
  }
  injectorProfiler({
    type: 2,
    context: getInjectorProfilerContext(),
    providerRecord: { token, provider, isViewProvider }
  });
}
function emitInjectorToCreateInstanceEvent(token) {
  !ngDevMode && throwError("Injector profiler should never be called in production mode");
  injectorProfiler({
    type: 4,
    context: getInjectorProfilerContext(),
    token
  });
}
function emitInstanceCreatedByInjectorEvent(instance) {
  !ngDevMode && throwError("Injector profiler should never be called in production mode");
  injectorProfiler({
    type: 1,
    context: getInjectorProfilerContext(),
    instance: { value: instance }
  });
}
function emitInjectEvent(token, value, flags) {
  !ngDevMode && throwError("Injector profiler should never be called in production mode");
  injectorProfiler({
    type: 0,
    context: getInjectorProfilerContext(),
    service: { token, value, flags }
  });
}
function emitEffectCreatedEvent(effect2) {
  !ngDevMode && throwError("Injector profiler should never be called in production mode");
  injectorProfiler({
    type: 3,
    context: getInjectorProfilerContext(),
    effect: effect2
  });
}
function runInInjectorProfilerContext(injector, token, callback) {
  !ngDevMode && throwError("runInInjectorProfilerContext should never be called in production mode");
  const prevInjectContext = setInjectorProfilerContext({ injector, token });
  try {
    callback();
  } finally {
    setInjectorProfilerContext(prevInjectContext);
  }
}
function isEnvironmentProviders(value) {
  return value && !!value.ɵproviders;
}
var NG_COMP_DEF = getClosureSafeProperty({ ɵcmp: getClosureSafeProperty });
var NG_DIR_DEF = getClosureSafeProperty({ ɵdir: getClosureSafeProperty });
var NG_PIPE_DEF = getClosureSafeProperty({ ɵpipe: getClosureSafeProperty });
var NG_MOD_DEF = getClosureSafeProperty({ ɵmod: getClosureSafeProperty });
var NG_FACTORY_DEF = getClosureSafeProperty({ ɵfac: getClosureSafeProperty });
var NG_ELEMENT_ID = getClosureSafeProperty({
  __NG_ELEMENT_ID__: getClosureSafeProperty
});
var NG_ENV_ID = getClosureSafeProperty({ __NG_ENV_ID__: getClosureSafeProperty });
function renderStringify(value) {
  if (typeof value === "string")
    return value;
  if (value == null)
    return "";
  return String(value);
}
function stringifyForError(value) {
  if (typeof value === "function")
    return value.name || value.toString();
  if (typeof value === "object" && value != null && typeof value.type === "function") {
    return value.type.name || value.type.toString();
  }
  return renderStringify(value);
}
var NG_RUNTIME_ERROR_CODE = getClosureSafeProperty({ "ngErrorCode": getClosureSafeProperty });
var NG_RUNTIME_ERROR_MESSAGE = getClosureSafeProperty({ "ngErrorMessage": getClosureSafeProperty });
var NG_TOKEN_PATH = getClosureSafeProperty({ "ngTokenPath": getClosureSafeProperty });
function cyclicDependencyError(token, path) {
  const message = ngDevMode ? `Circular dependency detected for \`${token}\`.` : "";
  return createRuntimeError(message, -200, path);
}
function cyclicDependencyErrorWithDetails(token, path) {
  return augmentRuntimeError(cyclicDependencyError(token, path), null);
}
function throwMixedMultiProviderError() {
  throw new Error(`Cannot mix multi providers and regular providers`);
}
function throwInvalidProviderError(ngModuleType, providers, provider) {
  if (ngModuleType && providers) {
    const providerDetail = providers.map((v) => v == provider ? "?" + provider + "?" : "...");
    throw new Error(`Invalid provider for the NgModule '${stringify(ngModuleType)}' - only instances of Provider and Type are allowed, got: [${providerDetail.join(", ")}]`);
  } else if (isEnvironmentProviders(provider)) {
    if (provider.ɵfromNgModule) {
      throw new RuntimeError(207, `Invalid providers from 'importProvidersFrom' present in a non-environment injector. 'importProvidersFrom' can't be used for component providers.`);
    } else {
      throw new RuntimeError(207, `Invalid providers present in a non-environment injector. 'EnvironmentProviders' can't be used for component providers.`);
    }
  } else {
    throw new Error("Invalid provider");
  }
}
function throwProviderNotFoundError(token, injectorName) {
  const errorMessage = ngDevMode && `No provider for ${stringifyForError(token)} found${injectorName ? ` in ${injectorName}` : ""}`;
  throw new RuntimeError(-201, errorMessage);
}
function prependTokenToDependencyPath(error, token) {
  error[NG_TOKEN_PATH] ??= [];
  const currentPath = error[NG_TOKEN_PATH];
  let pathStr;
  if (typeof token === "object" && "multi" in token && token?.multi === true) {
    assertDefined(token.provide, "Token with multi: true should have a provide property");
    pathStr = stringifyForError(token.provide);
  } else {
    pathStr = stringifyForError(token);
  }
  if (currentPath[0] !== pathStr) {
    error[NG_TOKEN_PATH].unshift(pathStr);
  }
}
function augmentRuntimeError(error, source) {
  const tokenPath = error[NG_TOKEN_PATH];
  const errorCode = error[NG_RUNTIME_ERROR_CODE];
  const message = error[NG_RUNTIME_ERROR_MESSAGE] || error.message;
  error.message = formatErrorMessage(message, errorCode, tokenPath, source);
  return error;
}
function createRuntimeError(message, code, path) {
  const error = new RuntimeError(code, message);
  error[NG_RUNTIME_ERROR_CODE] = code;
  error[NG_RUNTIME_ERROR_MESSAGE] = message;
  if (path) {
    error[NG_TOKEN_PATH] = path;
  }
  return error;
}
function getRuntimeErrorCode(error) {
  return error[NG_RUNTIME_ERROR_CODE];
}
function formatErrorMessage(text, code, path = [], source = null) {
  let pathDetails = "";
  if (path && path.length > 1) {
    pathDetails = ` Path: ${path.join(" -> ")}.`;
  }
  const sourceDetails = source ? ` Source: ${source}.` : "";
  return formatRuntimeError(code, `${text}${sourceDetails}${pathDetails}`);
}
var _injectImplementation;
function getInjectImplementation() {
  return _injectImplementation;
}
function setInjectImplementation(impl) {
  const previous = _injectImplementation;
  _injectImplementation = impl;
  return previous;
}
function injectRootLimpMode(token, notFoundValue, flags) {
  const injectableDef = getInjectableDef(token);
  if (injectableDef && injectableDef.providedIn == "root") {
    return injectableDef.value === void 0 ? injectableDef.value = injectableDef.factory() : injectableDef.value;
  }
  if (flags & 8)
    return null;
  if (notFoundValue !== void 0)
    return notFoundValue;
  throwProviderNotFoundError(token, "Injector");
}
function assertInjectImplementationNotEqual(fn) {
  ngDevMode && assertNotEqual(_injectImplementation, fn, "Calling ɵɵinject would cause infinite recursion");
}
var _THROW_IF_NOT_FOUND = {};
var THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
var DI_DECORATOR_FLAG = "__NG_DI_FLAG__";
var RetrievingInjector = class {
  injector;
  constructor(injector) {
    this.injector = injector;
  }
  retrieve(token, options) {
    const flags = convertToBitFlags(options) || 0;
    try {
      return this.injector.get(
        token,
        // When a dependency is requested with an optional flag, DI returns null as the default value.
        flags & 8 ? null : THROW_IF_NOT_FOUND,
        flags
      );
    } catch (e) {
      if (isNotFound(e)) {
        return e;
      }
      throw e;
    }
  }
};
function injectInjectorOnly(token, flags = 0) {
  const currentInjector = getCurrentInjector();
  if (currentInjector === void 0) {
    throw new RuntimeError(-203, ngDevMode && `The \`${stringify(token)}\` token injection failed. \`inject()\` function must be called from an injection context such as a constructor, a factory function, a field initializer, or a function used with \`runInInjectionContext\`.`);
  } else if (currentInjector === null) {
    return injectRootLimpMode(token, void 0, flags);
  } else {
    const options = convertToInjectOptions(flags);
    const value = currentInjector.retrieve(token, options);
    ngDevMode && emitInjectEvent(token, value, flags);
    if (isNotFound(value)) {
      if (options.optional) {
        return null;
      }
      throw value;
    }
    return value;
  }
}
function ɵɵinject(token, flags = 0) {
  return (getInjectImplementation() || injectInjectorOnly)(resolveForwardRef(token), flags);
}
function ɵɵinvalidFactoryDep(index) {
  throw new RuntimeError(202, ngDevMode && `This constructor is not compatible with Angular Dependency Injection because its dependency at index ${index} of the parameter list is invalid.
This can happen if the dependency type is a primitive like a string or if an ancestor of this class is missing an Angular decorator.

Please check that 1) the type for the parameter at index ${index} is correct and 2) the correct Angular decorators are defined for this class and its ancestors.`);
}
function inject2(token, options) {
  return ɵɵinject(token, convertToBitFlags(options));
}
function convertToBitFlags(flags) {
  if (typeof flags === "undefined" || typeof flags === "number") {
    return flags;
  }
  return 0 | // comment to force a line break in the formatter
  (flags.optional && 8) | (flags.host && 1) | (flags.self && 2) | (flags.skipSelf && 4);
}
function convertToInjectOptions(flags) {
  return {
    optional: !!(flags & 8),
    host: !!(flags & 1),
    self: !!(flags & 2),
    skipSelf: !!(flags & 4)
  };
}
function injectArgs(types) {
  const args = [];
  for (let i = 0; i < types.length; i++) {
    const arg = resolveForwardRef(types[i]);
    if (Array.isArray(arg)) {
      if (arg.length === 0) {
        throw new RuntimeError(900, ngDevMode && "Arguments array must have arguments.");
      }
      let type = void 0;
      let flags = 0;
      for (let j = 0; j < arg.length; j++) {
        const meta = arg[j];
        const flag = getInjectFlag(meta);
        if (typeof flag === "number") {
          if (flag === -1) {
            type = meta.token;
          } else {
            flags |= flag;
          }
        } else {
          type = meta;
        }
      }
      args.push(ɵɵinject(type, flags));
    } else {
      args.push(ɵɵinject(arg));
    }
  }
  return args;
}
function attachInjectFlag(decorator, flag) {
  decorator[DI_DECORATOR_FLAG] = flag;
  decorator.prototype[DI_DECORATOR_FLAG] = flag;
  return decorator;
}
function getInjectFlag(token) {
  return token[DI_DECORATOR_FLAG];
}
function getFactoryDef(type, throwNotFound) {
  const hasFactoryDef = type.hasOwnProperty(NG_FACTORY_DEF);
  if (!hasFactoryDef && throwNotFound === true && ngDevMode) {
    throw new Error(`Type ${stringify(type)} does not have 'ɵfac' property.`);
  }
  return hasFactoryDef ? type[NG_FACTORY_DEF] : null;
}
function arrayEquals(a, b, identityAccessor) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++) {
    let valueA = a[i];
    let valueB = b[i];
    if (identityAccessor) {
      valueA = identityAccessor(valueA);
      valueB = identityAccessor(valueB);
    }
    if (valueB !== valueA) {
      return false;
    }
  }
  return true;
}
function flatten(list) {
  return list.flat(Number.POSITIVE_INFINITY);
}
function deepForEach(input, fn) {
  input.forEach((value) => Array.isArray(value) ? deepForEach(value, fn) : fn(value));
}
function addToArray(arr, index, value) {
  if (index >= arr.length) {
    arr.push(value);
  } else {
    arr.splice(index, 0, value);
  }
}
function removeFromArray(arr, index) {
  if (index >= arr.length - 1) {
    return arr.pop();
  } else {
    return arr.splice(index, 1)[0];
  }
}
function newArray(size, value) {
  const list = [];
  for (let i = 0; i < size; i++) {
    list.push(value);
  }
  return list;
}
function arraySplice(array, index, count) {
  const length = array.length - count;
  while (index < length) {
    array[index] = array[index + count];
    index++;
  }
  while (count--) {
    array.pop();
  }
}
function arrayInsert2(array, index, value1, value2) {
  ngDevMode && assertLessThanOrEqual(index, array.length, "Can't insert past array end.");
  let end = array.length;
  if (end == index) {
    array.push(value1, value2);
  } else if (end === 1) {
    array.push(value2, array[0]);
    array[0] = value1;
  } else {
    end--;
    array.push(array[end - 1], array[end]);
    while (end > index) {
      const previousEnd = end - 2;
      array[end] = array[previousEnd];
      end--;
    }
    array[index] = value1;
    array[index + 1] = value2;
  }
}
function keyValueArraySet(keyValueArray, key, value) {
  let index = keyValueArrayIndexOf(keyValueArray, key);
  if (index >= 0) {
    keyValueArray[index | 1] = value;
  } else {
    index = ~index;
    arrayInsert2(keyValueArray, index, key, value);
  }
  return index;
}
function keyValueArrayGet(keyValueArray, key) {
  const index = keyValueArrayIndexOf(keyValueArray, key);
  if (index >= 0) {
    return keyValueArray[index | 1];
  }
  return void 0;
}
function keyValueArrayIndexOf(keyValueArray, key) {
  return _arrayIndexOfSorted(keyValueArray, key, 1);
}
function _arrayIndexOfSorted(array, value, shift) {
  ngDevMode && assertEqual(Array.isArray(array), true, "Expecting an array");
  let start = 0;
  let end = array.length >> shift;
  while (end !== start) {
    const middle = start + (end - start >> 1);
    const current = array[middle << shift];
    if (value === current) {
      return middle << shift;
    } else if (current > value) {
      end = middle;
    } else {
      start = middle + 1;
    }
  }
  return ~(end << shift);
}
var EMPTY_OBJ = {};
var EMPTY_ARRAY = [];
if ((typeof ngDevMode === "undefined" || ngDevMode) && initNgDevMode()) {
  Object.freeze(EMPTY_OBJ);
  Object.freeze(EMPTY_ARRAY);
}
var ENVIRONMENT_INITIALIZER = new InjectionToken(ngDevMode ? "ENVIRONMENT_INITIALIZER" : "");
var INJECTOR$1 = new InjectionToken(
  ngDevMode ? "INJECTOR" : "",
  // Disable tslint because this is const enum which gets inlined not top level prop access.
  // tslint:disable-next-line: no-toplevel-property-access
  -1
  /* InjectorMarkers.Injector */
);
var INJECTOR_DEF_TYPES = new InjectionToken(ngDevMode ? "INJECTOR_DEF_TYPES" : "");
var NullInjector = class {
  get(token, notFoundValue = THROW_IF_NOT_FOUND) {
    if (notFoundValue === THROW_IF_NOT_FOUND) {
      const message = ngDevMode ? `No provider found for \`${stringify(token)}\`.` : "";
      const error = createRuntimeError(
        message,
        -201
        /* RuntimeErrorCode.PROVIDER_NOT_FOUND */
      );
      error.name = "ɵNotFound";
      throw error;
    }
    return notFoundValue;
  }
};
function getNgModuleDef(type) {
  return type[NG_MOD_DEF] || null;
}
function getNgModuleDefOrThrow(type) {
  const ngModuleDef = getNgModuleDef(type);
  if (!ngModuleDef) {
    throw new RuntimeError(915, (typeof ngDevMode === "undefined" || ngDevMode) && `Type ${stringify(type)} does not have 'ɵmod' property.`);
  }
  return ngModuleDef;
}
function getComponentDef(type) {
  return type[NG_COMP_DEF] || null;
}
function getDirectiveDefOrThrow(type) {
  const def = getDirectiveDef(type);
  if (!def) {
    throw new RuntimeError(916, (typeof ngDevMode === "undefined" || ngDevMode) && `Type ${stringify(type)} does not have 'ɵdir' property.`);
  }
  return def;
}
function getDirectiveDef(type) {
  return type[NG_DIR_DEF] || null;
}
function getPipeDef(type) {
  return type[NG_PIPE_DEF] || null;
}
function isStandalone(type) {
  const def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
  return def !== null && def.standalone;
}
function makeEnvironmentProviders(providers) {
  return {
    ɵproviders: providers
  };
}
function provideEnvironmentInitializer(initializerFn) {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: initializerFn
    }
  ]);
}
function importProvidersFrom(...sources) {
  return {
    ɵproviders: internalImportProvidersFrom(true, sources),
    ɵfromNgModule: true
  };
}
function internalImportProvidersFrom(checkForStandaloneCmp, ...sources) {
  const providersOut = [];
  const dedup = /* @__PURE__ */ new Set();
  let injectorTypesWithProviders;
  const collectProviders = (provider) => {
    providersOut.push(provider);
  };
  deepForEach(sources, (source) => {
    if ((typeof ngDevMode === "undefined" || ngDevMode) && checkForStandaloneCmp) {
      const cmpDef = getComponentDef(source);
      if (cmpDef?.standalone) {
        throw new RuntimeError(800, `Importing providers supports NgModule or ModuleWithProviders but got a standalone component "${stringifyForError(source)}"`);
      }
    }
    const internalSource = source;
    if (walkProviderTree(internalSource, collectProviders, [], dedup)) {
      injectorTypesWithProviders ||= [];
      injectorTypesWithProviders.push(internalSource);
    }
  });
  if (injectorTypesWithProviders !== void 0) {
    processInjectorTypesWithProviders(injectorTypesWithProviders, collectProviders);
  }
  return providersOut;
}
function processInjectorTypesWithProviders(typesWithProviders, visitor) {
  for (let i = 0; i < typesWithProviders.length; i++) {
    const { ngModule, providers } = typesWithProviders[i];
    deepForEachProvider(providers, (provider) => {
      ngDevMode && validateProvider(provider, providers || EMPTY_ARRAY, ngModule);
      visitor(provider, ngModule);
    });
  }
}
function walkProviderTree(container, visitor, parents, dedup) {
  container = resolveForwardRef(container);
  if (!container)
    return false;
  let defType = null;
  let injDef = getInjectorDef(container);
  const cmpDef = !injDef && getComponentDef(container);
  if (!injDef && !cmpDef) {
    const ngModule = container.ngModule;
    injDef = getInjectorDef(ngModule);
    if (injDef) {
      defType = ngModule;
    } else {
      return false;
    }
  } else if (cmpDef && !cmpDef.standalone) {
    return false;
  } else {
    defType = container;
  }
  if (ngDevMode && parents.indexOf(defType) !== -1) {
    const defName = stringify(defType);
    const path = parents.map(stringify).concat(defName);
    throw cyclicDependencyErrorWithDetails(defName, path);
  }
  const isDuplicate = dedup.has(defType);
  if (cmpDef) {
    if (isDuplicate) {
      return false;
    }
    dedup.add(defType);
    if (cmpDef.dependencies) {
      const deps = typeof cmpDef.dependencies === "function" ? cmpDef.dependencies() : cmpDef.dependencies;
      for (const dep of deps) {
        walkProviderTree(dep, visitor, parents, dedup);
      }
    }
  } else if (injDef) {
    if (injDef.imports != null && !isDuplicate) {
      ngDevMode && parents.push(defType);
      dedup.add(defType);
      let importTypesWithProviders;
      try {
        deepForEach(injDef.imports, (imported) => {
          if (walkProviderTree(imported, visitor, parents, dedup)) {
            importTypesWithProviders ||= [];
            importTypesWithProviders.push(imported);
          }
        });
      } finally {
        ngDevMode && parents.pop();
      }
      if (importTypesWithProviders !== void 0) {
        processInjectorTypesWithProviders(importTypesWithProviders, visitor);
      }
    }
    if (!isDuplicate) {
      const factory = getFactoryDef(defType) || (() => new defType());
      visitor({ provide: defType, useFactory: factory, deps: EMPTY_ARRAY }, defType);
      visitor({ provide: INJECTOR_DEF_TYPES, useValue: defType, multi: true }, defType);
      visitor({ provide: ENVIRONMENT_INITIALIZER, useValue: () => ɵɵinject(defType), multi: true }, defType);
    }
    const defProviders = injDef.providers;
    if (defProviders != null && !isDuplicate) {
      const injectorType = container;
      deepForEachProvider(defProviders, (provider) => {
        ngDevMode && validateProvider(provider, defProviders, injectorType);
        visitor(provider, injectorType);
      });
    }
  } else {
    return false;
  }
  return defType !== container && container.providers !== void 0;
}
function validateProvider(provider, providers, containerType) {
  if (isTypeProvider(provider) || isValueProvider(provider) || isFactoryProvider(provider) || isExistingProvider(provider)) {
    return;
  }
  const classRef = resolveForwardRef(provider && (provider.useClass || provider.provide));
  if (!classRef) {
    throwInvalidProviderError(containerType, providers, provider);
  }
}
function deepForEachProvider(providers, fn) {
  for (let provider of providers) {
    if (isEnvironmentProviders(provider)) {
      provider = provider.ɵproviders;
    }
    if (Array.isArray(provider)) {
      deepForEachProvider(provider, fn);
    } else {
      fn(provider);
    }
  }
}
var USE_VALUE = getClosureSafeProperty({
  provide: String,
  useValue: getClosureSafeProperty
});
function isValueProvider(value) {
  return value !== null && typeof value == "object" && USE_VALUE in value;
}
function isExistingProvider(value) {
  return !!(value && value.useExisting);
}
function isFactoryProvider(value) {
  return !!(value && value.useFactory);
}
function isTypeProvider(value) {
  return typeof value === "function";
}
function isClassProvider(value) {
  return !!value.useClass;
}
var INJECTOR_SCOPE = new InjectionToken(ngDevMode ? "Set Injector scope." : "");
var NOT_YET = {};
var CIRCULAR = {};
var NULL_INJECTOR = void 0;
function getNullInjector() {
  if (NULL_INJECTOR === void 0) {
    NULL_INJECTOR = new NullInjector();
  }
  return NULL_INJECTOR;
}
var EnvironmentInjector = class {
};
var R3Injector = class extends EnvironmentInjector {
  parent;
  source;
  scopes;
  /**
   * Map of tokens to records which contain the instances of those tokens.
   * - `null` value implies that we don't have the record. Used by tree-shakable injectors
   * to prevent further searches.
   */
  records = /* @__PURE__ */ new Map();
  /**
   * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
   */
  _ngOnDestroyHooks = /* @__PURE__ */ new Set();
  _onDestroyHooks = [];
  /**
   * Flag indicating that this injector was previously destroyed.
   */
  get destroyed() {
    return this._destroyed;
  }
  _destroyed = false;
  injectorDefTypes;
  constructor(providers, parent, source, scopes) {
    super();
    this.parent = parent;
    this.source = source;
    this.scopes = scopes;
    forEachSingleProvider(providers, (provider) => this.processProvider(provider));
    this.records.set(INJECTOR$1, makeRecord(void 0, this));
    if (scopes.has("environment")) {
      this.records.set(EnvironmentInjector, makeRecord(void 0, this));
    }
    const record = this.records.get(INJECTOR_SCOPE);
    if (record != null && typeof record.value === "string") {
      this.scopes.add(record.value);
    }
    this.injectorDefTypes = new Set(this.get(INJECTOR_DEF_TYPES, EMPTY_ARRAY, { self: true }));
  }
  retrieve(token, options) {
    const flags = convertToBitFlags(options) || 0;
    try {
      return this.get(
        token,
        // When a dependency is requested with an optional flag, DI returns null as the default value.
        THROW_IF_NOT_FOUND,
        flags
      );
    } catch (e) {
      if (isNotFound(e)) {
        return e;
      }
      throw e;
    }
  }
  /**
   * Destroy the injector and release references to every instance or provider associated with it.
   *
   * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
   * hook was found.
   */
  destroy() {
    assertNotDestroyed(this);
    this._destroyed = true;
    const prevConsumer = setActiveConsumer(null);
    try {
      for (const service of this._ngOnDestroyHooks) {
        service.ngOnDestroy();
      }
      const onDestroyHooks = this._onDestroyHooks;
      this._onDestroyHooks = [];
      for (const hook of onDestroyHooks) {
        hook();
      }
    } finally {
      this.records.clear();
      this._ngOnDestroyHooks.clear();
      this.injectorDefTypes.clear();
      setActiveConsumer(prevConsumer);
    }
  }
  onDestroy(callback) {
    assertNotDestroyed(this);
    this._onDestroyHooks.push(callback);
    return () => this.removeOnDestroy(callback);
  }
  runInContext(fn) {
    assertNotDestroyed(this);
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(void 0);
    let prevInjectContext;
    if (ngDevMode) {
      prevInjectContext = setInjectorProfilerContext({ injector: this, token: null });
    }
    try {
      return fn();
    } finally {
      setCurrentInjector(previousInjector);
      setInjectImplementation(previousInjectImplementation);
      ngDevMode && setInjectorProfilerContext(prevInjectContext);
    }
  }
  get(token, notFoundValue = THROW_IF_NOT_FOUND, options) {
    assertNotDestroyed(this);
    if (token.hasOwnProperty(NG_ENV_ID)) {
      return token[NG_ENV_ID](this);
    }
    const flags = convertToBitFlags(options);
    let prevInjectContext;
    if (ngDevMode) {
      prevInjectContext = setInjectorProfilerContext({ injector: this, token });
    }
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(void 0);
    try {
      if (!(flags & 4)) {
        let record = this.records.get(token);
        if (record === void 0) {
          const def = couldBeInjectableType(token) && getInjectableDef(token);
          if (def && this.injectableDefInScope(def)) {
            if (ngDevMode) {
              runInInjectorProfilerContext(this, token, () => {
                emitProviderConfiguredEvent(token);
              });
            }
            record = makeRecord(injectableDefOrInjectorDefFactory(token), NOT_YET);
          } else {
            record = null;
          }
          this.records.set(token, record);
        }
        if (record != null) {
          return this.hydrate(token, record, flags);
        }
      }
      const nextInjector = !(flags & 2) ? this.parent : getNullInjector();
      notFoundValue = flags & 8 && notFoundValue === THROW_IF_NOT_FOUND ? null : notFoundValue;
      return nextInjector.get(token, notFoundValue);
    } catch (error) {
      const errorCode = getRuntimeErrorCode(error);
      if (errorCode === -200 || errorCode === -201) {
        if (ngDevMode) {
          prependTokenToDependencyPath(error, token);
          if (previousInjector) {
            throw error;
          } else {
            throw augmentRuntimeError(error, this.source);
          }
        } else {
          throw new RuntimeError(errorCode, null);
        }
      } else {
        throw error;
      }
    } finally {
      setInjectImplementation(previousInjectImplementation);
      setCurrentInjector(previousInjector);
      ngDevMode && setInjectorProfilerContext(prevInjectContext);
    }
  }
  /** @internal */
  resolveInjectorInitializers() {
    const prevConsumer = setActiveConsumer(null);
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(void 0);
    let prevInjectContext;
    if (ngDevMode) {
      prevInjectContext = setInjectorProfilerContext({ injector: this, token: null });
    }
    try {
      const initializers = this.get(ENVIRONMENT_INITIALIZER, EMPTY_ARRAY, { self: true });
      if (ngDevMode && !Array.isArray(initializers)) {
        throw new RuntimeError(-209, `Unexpected type of the \`ENVIRONMENT_INITIALIZER\` token value (expected an array, but got ${typeof initializers}). Please check that the \`ENVIRONMENT_INITIALIZER\` token is configured as a \`multi: true\` provider.`);
      }
      for (const initializer of initializers) {
        initializer();
      }
    } finally {
      setCurrentInjector(previousInjector);
      setInjectImplementation(previousInjectImplementation);
      ngDevMode && setInjectorProfilerContext(prevInjectContext);
      setActiveConsumer(prevConsumer);
    }
  }
  toString() {
    const tokens = [];
    const records = this.records;
    for (const token of records.keys()) {
      tokens.push(stringify(token));
    }
    return `R3Injector[${tokens.join(", ")}]`;
  }
  /**
   * Process a `SingleProvider` and add it.
   */
  processProvider(provider) {
    provider = resolveForwardRef(provider);
    let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider && provider.provide);
    const record = providerToRecord(provider);
    if (ngDevMode) {
      runInInjectorProfilerContext(this, token, () => {
        if (isValueProvider(provider)) {
          emitInjectorToCreateInstanceEvent(token);
          emitInstanceCreatedByInjectorEvent(provider.useValue);
        }
        emitProviderConfiguredEvent(provider);
      });
    }
    if (!isTypeProvider(provider) && provider.multi === true) {
      let multiRecord = this.records.get(token);
      if (multiRecord) {
        if (ngDevMode && multiRecord.multi === void 0) {
          throwMixedMultiProviderError();
        }
      } else {
        multiRecord = makeRecord(void 0, NOT_YET, true);
        multiRecord.factory = () => injectArgs(multiRecord.multi);
        this.records.set(token, multiRecord);
      }
      token = provider;
      multiRecord.multi.push(provider);
    } else {
      if (ngDevMode) {
        const existing = this.records.get(token);
        if (existing && existing.multi !== void 0) {
          throwMixedMultiProviderError();
        }
      }
    }
    this.records.set(token, record);
  }
  hydrate(token, record, flags) {
    const prevConsumer = setActiveConsumer(null);
    try {
      if (record.value === CIRCULAR) {
        throw cyclicDependencyError(stringify(token));
      } else if (record.value === NOT_YET) {
        record.value = CIRCULAR;
        if (ngDevMode) {
          runInInjectorProfilerContext(this, token, () => {
            emitInjectorToCreateInstanceEvent(token);
            record.value = record.factory(void 0, flags);
            emitInstanceCreatedByInjectorEvent(record.value);
          });
        } else {
          record.value = record.factory(void 0, flags);
        }
      }
      if (typeof record.value === "object" && record.value && hasOnDestroy(record.value)) {
        this._ngOnDestroyHooks.add(record.value);
      }
      return record.value;
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
  injectableDefInScope(def) {
    if (!def.providedIn) {
      return false;
    }
    const providedIn = resolveForwardRef(def.providedIn);
    if (typeof providedIn === "string") {
      return providedIn === "any" || this.scopes.has(providedIn);
    } else {
      return this.injectorDefTypes.has(providedIn);
    }
  }
  removeOnDestroy(callback) {
    const destroyCBIdx = this._onDestroyHooks.indexOf(callback);
    if (destroyCBIdx !== -1) {
      this._onDestroyHooks.splice(destroyCBIdx, 1);
    }
  }
};
function injectableDefOrInjectorDefFactory(token) {
  const injectableDef = getInjectableDef(token);
  const factory = injectableDef !== null ? injectableDef.factory : getFactoryDef(token);
  if (factory !== null) {
    return factory;
  }
  if (token instanceof InjectionToken) {
    throw new RuntimeError(204, ngDevMode && `Token ${stringify(token)} is missing a ɵprov definition.`);
  }
  if (token instanceof Function) {
    return getUndecoratedInjectableFactory(token);
  }
  throw new RuntimeError(204, ngDevMode && "unreachable");
}
function getUndecoratedInjectableFactory(token) {
  const paramLength = token.length;
  if (paramLength > 0) {
    throw new RuntimeError(204, ngDevMode && `Can't resolve all parameters for ${stringify(token)}: (${newArray(paramLength, "?").join(", ")}).`);
  }
  const inheritedInjectableDef = getInheritedInjectableDef(token);
  if (inheritedInjectableDef !== null) {
    return () => inheritedInjectableDef.factory(token);
  } else {
    return () => new token();
  }
}
function providerToRecord(provider) {
  if (isValueProvider(provider)) {
    return makeRecord(void 0, provider.useValue);
  } else {
    const factory = providerToFactory(provider);
    return makeRecord(factory, NOT_YET);
  }
}
function providerToFactory(provider, ngModuleType, providers) {
  let factory = void 0;
  if (ngDevMode && isEnvironmentProviders(provider)) {
    throwInvalidProviderError(void 0, providers, provider);
  }
  if (isTypeProvider(provider)) {
    const unwrappedProvider = resolveForwardRef(provider);
    return getFactoryDef(unwrappedProvider) || injectableDefOrInjectorDefFactory(unwrappedProvider);
  } else {
    if (isValueProvider(provider)) {
      factory = () => resolveForwardRef(provider.useValue);
    } else if (isFactoryProvider(provider)) {
      factory = () => provider.useFactory(...injectArgs(provider.deps || []));
    } else if (isExistingProvider(provider)) {
      factory = (_, flags) => ɵɵinject(resolveForwardRef(provider.useExisting), flags !== void 0 && flags & 8 ? 8 : void 0);
    } else {
      const classRef = resolveForwardRef(provider && (provider.useClass || provider.provide));
      if (ngDevMode && !classRef) {
        throwInvalidProviderError(ngModuleType, providers, provider);
      }
      if (hasDeps(provider)) {
        factory = () => new classRef(...injectArgs(provider.deps));
      } else {
        return getFactoryDef(classRef) || injectableDefOrInjectorDefFactory(classRef);
      }
    }
  }
  return factory;
}
function assertNotDestroyed(injector) {
  if (injector.destroyed) {
    throw new RuntimeError(205, ngDevMode && "Injector has already been destroyed.");
  }
}
function makeRecord(factory, value, multi = false) {
  return {
    factory,
    value,
    multi: multi ? [] : void 0
  };
}
function hasDeps(value) {
  return !!value.deps;
}
function hasOnDestroy(value) {
  return value !== null && typeof value === "object" && typeof value.ngOnDestroy === "function";
}
function couldBeInjectableType(value) {
  return typeof value === "function" || typeof value === "object" && value.ngMetadataName === "InjectionToken";
}
function forEachSingleProvider(providers, fn) {
  for (const provider of providers) {
    if (Array.isArray(provider)) {
      forEachSingleProvider(provider, fn);
    } else if (provider && isEnvironmentProviders(provider)) {
      forEachSingleProvider(provider.ɵproviders, fn);
    } else {
      fn(provider);
    }
  }
}
function runInInjectionContext(injector, fn) {
  let internalInjector;
  if (injector instanceof R3Injector) {
    assertNotDestroyed(injector);
    internalInjector = injector;
  } else {
    internalInjector = new RetrievingInjector(injector);
  }
  let prevInjectorProfilerContext;
  if (ngDevMode) {
    prevInjectorProfilerContext = setInjectorProfilerContext({ injector, token: null });
  }
  const prevInjector = setCurrentInjector(internalInjector);
  const previousInjectImplementation = setInjectImplementation(void 0);
  try {
    return fn();
  } finally {
    setCurrentInjector(prevInjector);
    ngDevMode && setInjectorProfilerContext(prevInjectorProfilerContext);
    setInjectImplementation(previousInjectImplementation);
  }
}
function isInInjectionContext() {
  return getInjectImplementation() !== void 0 || getCurrentInjector() != null;
}
function assertInInjectionContext(debugFn) {
  if (!isInInjectionContext()) {
    throw new RuntimeError(-203, ngDevMode && debugFn.name + "() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`");
  }
}
var HOST = 0;
var TVIEW = 1;
var FLAGS = 2;
var PARENT = 3;
var NEXT = 4;
var T_HOST = 5;
var HYDRATION = 6;
var CLEANUP = 7;
var CONTEXT = 8;
var INJECTOR = 9;
var ENVIRONMENT = 10;
var RENDERER = 11;
var CHILD_HEAD = 12;
var CHILD_TAIL = 13;
var DECLARATION_VIEW = 14;
var DECLARATION_COMPONENT_VIEW = 15;
var DECLARATION_LCONTAINER = 16;
var PREORDER_HOOK_FLAGS = 17;
var QUERIES = 18;
var ID = 19;
var EMBEDDED_VIEW_INJECTOR = 20;
var ON_DESTROY_HOOKS = 21;
var EFFECTS_TO_SCHEDULE = 22;
var EFFECTS = 23;
var REACTIVE_TEMPLATE_CONSUMER = 24;
var AFTER_RENDER_SEQUENCES_TO_ADD = 25;
var ANIMATIONS = 26;
var HEADER_OFFSET = 27;
var TYPE = 1;
var DEHYDRATED_VIEWS = 6;
var NATIVE = 7;
var VIEW_REFS = 8;
var MOVED_VIEWS = 9;
var CONTAINER_HEADER_OFFSET = 10;
function isLView(value) {
  return Array.isArray(value) && typeof value[TYPE] === "object";
}
function isLContainer(value) {
  return Array.isArray(value) && value[TYPE] === true;
}
function isContentQueryHost(tNode) {
  return (tNode.flags & 4) !== 0;
}
function isComponentHost(tNode) {
  return tNode.componentOffset > -1;
}
function isDirectiveHost(tNode) {
  return (tNode.flags & 1) === 1;
}
function isComponentDef(def) {
  return !!def.template;
}
function isRootView(target) {
  return (target[FLAGS] & 512) !== 0;
}
function isProjectionTNode(tNode) {
  return (tNode.type & 16) === 16;
}
function hasI18n(lView) {
  return (lView[FLAGS] & 32) === 32;
}
function isDestroyed(lView) {
  return (lView[FLAGS] & 256) === 256;
}
function assertTNodeForLView(tNode, lView) {
  assertTNodeForTView(tNode, lView[TVIEW]);
}
function assertTNodeCreationIndex(lView, index) {
  const adjustedIndex = index + HEADER_OFFSET;
  assertIndexInRange(lView, adjustedIndex);
  assertLessThan(adjustedIndex, lView[TVIEW].bindingStartIndex, "TNodes should be created before any bindings");
}
function assertTNodeForTView(tNode, tView) {
  assertTNode(tNode);
  const tData = tView.data;
  for (let i = HEADER_OFFSET; i < tData.length; i++) {
    if (tData[i] === tNode) {
      return;
    }
  }
  throwError("This TNode does not belong to this TView.");
}
function assertTNode(tNode) {
  assertDefined(tNode, "TNode must be defined");
  if (!(tNode && typeof tNode === "object" && tNode.hasOwnProperty("directiveStylingLast"))) {
    throwError("Not of type TNode, got: " + tNode);
  }
}
function assertTIcu(tIcu) {
  assertDefined(tIcu, "Expected TIcu to be defined");
  if (!(typeof tIcu.currentCaseLViewIndex === "number")) {
    throwError("Object is not of TIcu type.");
  }
}
function assertComponentType(actual, msg = "Type passed in is not ComponentType, it does not have 'ɵcmp' property.") {
  if (!getComponentDef(actual)) {
    throwError(msg);
  }
}
function assertNgModuleType(actual, msg = "Type passed in is not NgModuleType, it does not have 'ɵmod' property.") {
  if (!getNgModuleDef(actual)) {
    throwError(msg);
  }
}
function assertHasParent(tNode) {
  assertDefined(tNode, "currentTNode should exist!");
  assertDefined(tNode.parent, "currentTNode should have a parent");
}
function assertLContainer(value) {
  assertDefined(value, "LContainer must be defined");
  assertEqual(isLContainer(value), true, "Expecting LContainer");
}
function assertLViewOrUndefined(value) {
  value && assertEqual(isLView(value), true, "Expecting LView or undefined or null");
}
function assertLView(value) {
  assertDefined(value, "LView must be defined");
  assertEqual(isLView(value), true, "Expecting LView");
}
function assertFirstCreatePass(tView, errMessage) {
  assertEqual(tView.firstCreatePass, true, errMessage || "Should only be called in first create pass.");
}
function assertFirstUpdatePass(tView, errMessage) {
  assertEqual(tView.firstUpdatePass, true, "Should only be called in first update pass.");
}
function assertDirectiveDef(obj) {
  if (obj.type === void 0 || obj.selectors == void 0 || obj.inputs === void 0) {
    throwError(`Expected a DirectiveDef/ComponentDef and this object does not seem to have the expected shape.`);
  }
}
function assertIndexInDeclRange(tView, index) {
  assertBetween(HEADER_OFFSET, tView.bindingStartIndex, index);
}
function assertIndexInExpandoRange(lView, index) {
  const tView = lView[1];
  assertBetween(tView.expandoStartIndex, lView.length, index);
}
function assertBetween(lower, upper, index) {
  if (!(lower <= index && index < upper)) {
    throwError(`Index out of range (expecting ${lower} <= ${index} < ${upper})`);
  }
}
function assertProjectionSlots(lView, errMessage) {
  assertDefined(lView[DECLARATION_COMPONENT_VIEW], "Component views should exist.");
  assertDefined(lView[DECLARATION_COMPONENT_VIEW][T_HOST].projection, "Components with projection nodes (<ng-content>) must have projection slots defined.");
}
function assertParentView(lView, errMessage) {
  assertDefined(lView, "Component views should always have a parent view (component's host view)");
}
function assertNodeInjector(lView, injectorIndex) {
  assertIndexInExpandoRange(lView, injectorIndex);
  assertIndexInExpandoRange(
    lView,
    injectorIndex + 8
    /* NodeInjectorOffset.PARENT */
  );
  assertNumber(lView[injectorIndex + 0], "injectorIndex should point to a bloom filter");
  assertNumber(lView[injectorIndex + 1], "injectorIndex should point to a bloom filter");
  assertNumber(lView[injectorIndex + 2], "injectorIndex should point to a bloom filter");
  assertNumber(lView[injectorIndex + 3], "injectorIndex should point to a bloom filter");
  assertNumber(lView[injectorIndex + 4], "injectorIndex should point to a bloom filter");
  assertNumber(lView[injectorIndex + 5], "injectorIndex should point to a bloom filter");
  assertNumber(lView[injectorIndex + 6], "injectorIndex should point to a bloom filter");
  assertNumber(lView[injectorIndex + 7], "injectorIndex should point to a bloom filter");
  assertNumber(lView[
    injectorIndex + 8
    /* NodeInjectorOffset.PARENT */
  ], "injectorIndex should point to parent injector");
}
var SVG_NAMESPACE = "svg";
var MATH_ML_NAMESPACE = "math";
function unwrapRNode(value) {
  while (Array.isArray(value)) {
    value = value[HOST];
  }
  return value;
}
function unwrapLView(value) {
  while (Array.isArray(value)) {
    if (typeof value[TYPE] === "object")
      return value;
    value = value[HOST];
  }
  return null;
}
function getNativeByIndex(index, lView) {
  ngDevMode && assertIndexInRange(lView, index);
  ngDevMode && assertGreaterThanOrEqual(index, HEADER_OFFSET, "Expected to be past HEADER_OFFSET");
  return unwrapRNode(lView[index]);
}
function getNativeByTNode(tNode, lView) {
  ngDevMode && assertTNodeForLView(tNode, lView);
  ngDevMode && assertIndexInRange(lView, tNode.index);
  const node = unwrapRNode(lView[tNode.index]);
  return node;
}
function getNativeByTNodeOrNull(tNode, lView) {
  const index = tNode === null ? -1 : tNode.index;
  if (index !== -1) {
    ngDevMode && assertTNodeForLView(tNode, lView);
    const node = unwrapRNode(lView[index]);
    return node;
  }
  return null;
}
function getTNode(tView, index) {
  ngDevMode && assertGreaterThan(index, -1, "wrong index for TNode");
  ngDevMode && assertLessThan(index, tView.data.length, "wrong index for TNode");
  const tNode = tView.data[index];
  ngDevMode && tNode !== null && assertTNode(tNode);
  return tNode;
}
function load(view, index) {
  ngDevMode && assertIndexInRange(view, index);
  return view[index];
}
function store(tView, lView, index, value) {
  if (index >= tView.data.length) {
    tView.data[index] = null;
    tView.blueprint[index] = null;
  }
  lView[index] = value;
}
function getComponentLViewByIndex(nodeIndex, hostView) {
  ngDevMode && assertIndexInRange(hostView, nodeIndex);
  const slotValue = hostView[nodeIndex];
  const lView = isLView(slotValue) ? slotValue : slotValue[HOST];
  return lView;
}
function isCreationMode(view) {
  return (view[FLAGS] & 4) === 4;
}
function viewAttachedToChangeDetector(view) {
  return (view[FLAGS] & 128) === 128;
}
function viewAttachedToContainer(view) {
  return isLContainer(view[PARENT]);
}
function getConstant(consts, index) {
  if (index === null || index === void 0)
    return null;
  ngDevMode && assertIndexInRange(consts, index);
  return consts[index];
}
function resetPreOrderHookFlags(lView) {
  lView[PREORDER_HOOK_FLAGS] = 0;
}
function markViewForRefresh(lView) {
  if (lView[FLAGS] & 1024) {
    return;
  }
  lView[FLAGS] |= 1024;
  if (viewAttachedToChangeDetector(lView)) {
    markAncestorsForTraversal(lView);
  }
}
function walkUpViews(nestingLevel, currentView) {
  while (nestingLevel > 0) {
    ngDevMode && assertDefined(currentView[DECLARATION_VIEW], "Declaration view should be defined if nesting level is greater than 0.");
    currentView = currentView[DECLARATION_VIEW];
    nestingLevel--;
  }
  return currentView;
}
function requiresRefreshOrTraversal(lView) {
  return !!(lView[FLAGS] & (1024 | 8192) || lView[REACTIVE_TEMPLATE_CONSUMER]?.dirty);
}
function updateAncestorTraversalFlagsOnAttach(lView) {
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(
    8
    /* NotificationSource.ViewAttached */
  );
  if (lView[FLAGS] & 64) {
    lView[FLAGS] |= 1024;
  }
  if (requiresRefreshOrTraversal(lView)) {
    markAncestorsForTraversal(lView);
  }
}
function markAncestorsForTraversal(lView) {
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(
    0
    /* NotificationSource.MarkAncestorsForTraversal */
  );
  let parent = getLViewParent(lView);
  while (parent !== null) {
    if (parent[FLAGS] & 8192) {
      break;
    }
    parent[FLAGS] |= 8192;
    if (!viewAttachedToChangeDetector(parent)) {
      break;
    }
    parent = getLViewParent(parent);
  }
}
function storeLViewOnDestroy(lView, onDestroyCallback) {
  if (isDestroyed(lView)) {
    throw new RuntimeError(911, ngDevMode && "View has already been destroyed.");
  }
  if (lView[ON_DESTROY_HOOKS] === null) {
    lView[ON_DESTROY_HOOKS] = [];
  }
  lView[ON_DESTROY_HOOKS].push(onDestroyCallback);
}
function removeLViewOnDestroy(lView, onDestroyCallback) {
  if (lView[ON_DESTROY_HOOKS] === null)
    return;
  const destroyCBIdx = lView[ON_DESTROY_HOOKS].indexOf(onDestroyCallback);
  if (destroyCBIdx !== -1) {
    lView[ON_DESTROY_HOOKS].splice(destroyCBIdx, 1);
  }
}
function getLViewParent(lView) {
  ngDevMode && assertLView(lView);
  const parent = lView[PARENT];
  return isLContainer(parent) ? parent[PARENT] : parent;
}
function getOrCreateLViewCleanup(view) {
  return view[CLEANUP] ??= [];
}
function getOrCreateTViewCleanup(tView) {
  return tView.cleanup ??= [];
}
function storeCleanupWithContext(tView, lView, context, cleanupFn) {
  const lCleanup = getOrCreateLViewCleanup(lView);
  ngDevMode && assertDefined(context, "Cleanup context is mandatory when registering framework-level destroy hooks");
  lCleanup.push(context);
  if (tView.firstCreatePass) {
    getOrCreateTViewCleanup(tView).push(cleanupFn, lCleanup.length - 1);
  } else {
    if (ngDevMode) {
      Object.freeze(getOrCreateTViewCleanup(tView));
    }
  }
}
var instructionState = {
  lFrame: createLFrame(null),
  bindingsEnabled: true,
  skipHydrationRootTNode: null
};
var CheckNoChangesMode;
(function(CheckNoChangesMode2) {
  CheckNoChangesMode2[CheckNoChangesMode2["Off"] = 0] = "Off";
  CheckNoChangesMode2[CheckNoChangesMode2["Exhaustive"] = 1] = "Exhaustive";
  CheckNoChangesMode2[CheckNoChangesMode2["OnlyDirtyViews"] = 2] = "OnlyDirtyViews";
})(CheckNoChangesMode || (CheckNoChangesMode = {}));
var _checkNoChangesMode = 0;
var _isRefreshingViews = false;
function getElementDepthCount() {
  return instructionState.lFrame.elementDepthCount;
}
function increaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount++;
}
function decreaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount--;
}
function getBindingsEnabled() {
  return instructionState.bindingsEnabled;
}
function isInSkipHydrationBlock() {
  return instructionState.skipHydrationRootTNode !== null;
}
function isSkipHydrationRootTNode(tNode) {
  return instructionState.skipHydrationRootTNode === tNode;
}
function ɵɵenableBindings() {
  instructionState.bindingsEnabled = true;
}
function enterSkipHydrationBlock(tNode) {
  instructionState.skipHydrationRootTNode = tNode;
}
function ɵɵdisableBindings() {
  instructionState.bindingsEnabled = false;
}
function leaveSkipHydrationBlock() {
  instructionState.skipHydrationRootTNode = null;
}
function getLView() {
  return instructionState.lFrame.lView;
}
function getTView() {
  return instructionState.lFrame.tView;
}
function ɵɵrestoreView(viewToRestore) {
  instructionState.lFrame.contextLView = viewToRestore;
  return viewToRestore[CONTEXT];
}
function ɵɵresetView(value) {
  instructionState.lFrame.contextLView = null;
  return value;
}
function getCurrentTNode() {
  let currentTNode = getCurrentTNodePlaceholderOk();
  while (currentTNode !== null && currentTNode.type === 64) {
    currentTNode = currentTNode.parent;
  }
  return currentTNode;
}
function getCurrentTNodePlaceholderOk() {
  return instructionState.lFrame.currentTNode;
}
function getCurrentParentTNode() {
  const lFrame = instructionState.lFrame;
  const currentTNode = lFrame.currentTNode;
  return lFrame.isParent ? currentTNode : currentTNode.parent;
}
function setCurrentTNode(tNode, isParent) {
  ngDevMode && tNode && assertTNodeForTView(tNode, instructionState.lFrame.tView);
  const lFrame = instructionState.lFrame;
  lFrame.currentTNode = tNode;
  lFrame.isParent = isParent;
}
function isCurrentTNodeParent() {
  return instructionState.lFrame.isParent;
}
function setCurrentTNodeAsNotParent() {
  instructionState.lFrame.isParent = false;
}
function getContextLView() {
  const contextLView = instructionState.lFrame.contextLView;
  ngDevMode && assertDefined(contextLView, "contextLView must be defined.");
  return contextLView;
}
function isInCheckNoChangesMode() {
  !ngDevMode && throwError("Must never be called in production mode");
  return _checkNoChangesMode !== CheckNoChangesMode.Off;
}
function isExhaustiveCheckNoChanges() {
  !ngDevMode && throwError("Must never be called in production mode");
  return _checkNoChangesMode === CheckNoChangesMode.Exhaustive;
}
function setIsInCheckNoChangesMode(mode) {
  !ngDevMode && throwError("Must never be called in production mode");
  _checkNoChangesMode = mode;
}
function isRefreshingViews() {
  return _isRefreshingViews;
}
function setIsRefreshingViews(mode) {
  const prev = _isRefreshingViews;
  _isRefreshingViews = mode;
  return prev;
}
function getBindingRoot() {
  const lFrame = instructionState.lFrame;
  let index = lFrame.bindingRootIndex;
  if (index === -1) {
    index = lFrame.bindingRootIndex = lFrame.tView.bindingStartIndex;
  }
  return index;
}
function getBindingIndex() {
  return instructionState.lFrame.bindingIndex;
}
function setBindingIndex(value) {
  return instructionState.lFrame.bindingIndex = value;
}
function nextBindingIndex() {
  return instructionState.lFrame.bindingIndex++;
}
function incrementBindingIndex(count) {
  const lFrame = instructionState.lFrame;
  const index = lFrame.bindingIndex;
  lFrame.bindingIndex = lFrame.bindingIndex + count;
  return index;
}
function isInI18nBlock() {
  return instructionState.lFrame.inI18n;
}
function setInI18nBlock(isInI18nBlock2) {
  instructionState.lFrame.inI18n = isInI18nBlock2;
}
function setBindingRootForHostBindings(bindingRootIndex, currentDirectiveIndex) {
  const lFrame = instructionState.lFrame;
  lFrame.bindingIndex = lFrame.bindingRootIndex = bindingRootIndex;
  setCurrentDirectiveIndex(currentDirectiveIndex);
}
function getCurrentDirectiveIndex() {
  return instructionState.lFrame.currentDirectiveIndex;
}
function setCurrentDirectiveIndex(currentDirectiveIndex) {
  instructionState.lFrame.currentDirectiveIndex = currentDirectiveIndex;
}
function getCurrentDirectiveDef(tData) {
  const currentDirectiveIndex = instructionState.lFrame.currentDirectiveIndex;
  return currentDirectiveIndex === -1 ? null : tData[currentDirectiveIndex];
}
function getCurrentQueryIndex() {
  return instructionState.lFrame.currentQueryIndex;
}
function setCurrentQueryIndex(value) {
  instructionState.lFrame.currentQueryIndex = value;
}
function getDeclarationTNode(lView) {
  const tView = lView[TVIEW];
  if (tView.type === 2) {
    ngDevMode && assertDefined(tView.declTNode, "Embedded TNodes should have declaration parents.");
    return tView.declTNode;
  }
  if (tView.type === 1) {
    return lView[T_HOST];
  }
  return null;
}
function enterDI(lView, tNode, flags) {
  ngDevMode && assertLViewOrUndefined(lView);
  if (flags & 4) {
    ngDevMode && assertTNodeForTView(tNode, lView[TVIEW]);
    let parentTNode = tNode;
    let parentLView = lView;
    while (true) {
      ngDevMode && assertDefined(parentTNode, "Parent TNode should be defined");
      parentTNode = parentTNode.parent;
      if (parentTNode === null && !(flags & 1)) {
        parentTNode = getDeclarationTNode(parentLView);
        if (parentTNode === null)
          break;
        ngDevMode && assertDefined(parentLView, "Parent LView should be defined");
        parentLView = parentLView[DECLARATION_VIEW];
        if (parentTNode.type & (2 | 8)) {
          break;
        }
      } else {
        break;
      }
    }
    if (parentTNode === null) {
      return false;
    } else {
      tNode = parentTNode;
      lView = parentLView;
    }
  }
  ngDevMode && assertTNodeForLView(tNode, lView);
  const lFrame = instructionState.lFrame = allocLFrame();
  lFrame.currentTNode = tNode;
  lFrame.lView = lView;
  return true;
}
function enterView(newView) {
  ngDevMode && assertNotEqual(newView[0], newView[1], "????");
  ngDevMode && assertLViewOrUndefined(newView);
  const newLFrame = allocLFrame();
  if (ngDevMode) {
    assertEqual(newLFrame.isParent, true, "Expected clean LFrame");
    assertEqual(newLFrame.lView, null, "Expected clean LFrame");
    assertEqual(newLFrame.tView, null, "Expected clean LFrame");
    assertEqual(newLFrame.selectedIndex, -1, "Expected clean LFrame");
    assertEqual(newLFrame.elementDepthCount, 0, "Expected clean LFrame");
    assertEqual(newLFrame.currentDirectiveIndex, -1, "Expected clean LFrame");
    assertEqual(newLFrame.currentNamespace, null, "Expected clean LFrame");
    assertEqual(newLFrame.bindingRootIndex, -1, "Expected clean LFrame");
    assertEqual(newLFrame.currentQueryIndex, 0, "Expected clean LFrame");
  }
  const tView = newView[TVIEW];
  instructionState.lFrame = newLFrame;
  ngDevMode && tView.firstChild && assertTNodeForTView(tView.firstChild, tView);
  newLFrame.currentTNode = tView.firstChild;
  newLFrame.lView = newView;
  newLFrame.tView = tView;
  newLFrame.contextLView = newView;
  newLFrame.bindingIndex = tView.bindingStartIndex;
  newLFrame.inI18n = false;
}
function allocLFrame() {
  const currentLFrame = instructionState.lFrame;
  const childLFrame = currentLFrame === null ? null : currentLFrame.child;
  const newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
  return newLFrame;
}
function createLFrame(parent) {
  const lFrame = {
    currentTNode: null,
    isParent: true,
    lView: null,
    tView: null,
    selectedIndex: -1,
    contextLView: null,
    elementDepthCount: 0,
    currentNamespace: null,
    currentDirectiveIndex: -1,
    bindingRootIndex: -1,
    bindingIndex: -1,
    currentQueryIndex: 0,
    parent,
    child: null,
    inI18n: false
  };
  parent !== null && (parent.child = lFrame);
  return lFrame;
}
function leaveViewLight() {
  const oldLFrame = instructionState.lFrame;
  instructionState.lFrame = oldLFrame.parent;
  oldLFrame.currentTNode = null;
  oldLFrame.lView = null;
  return oldLFrame;
}
var leaveDI = leaveViewLight;
function leaveView() {
  const oldLFrame = leaveViewLight();
  oldLFrame.isParent = true;
  oldLFrame.tView = null;
  oldLFrame.selectedIndex = -1;
  oldLFrame.contextLView = null;
  oldLFrame.elementDepthCount = 0;
  oldLFrame.currentDirectiveIndex = -1;
  oldLFrame.currentNamespace = null;
  oldLFrame.bindingRootIndex = -1;
  oldLFrame.bindingIndex = -1;
  oldLFrame.currentQueryIndex = 0;
}
function nextContextImpl(level) {
  const contextLView = instructionState.lFrame.contextLView = walkUpViews(level, instructionState.lFrame.contextLView);
  return contextLView[CONTEXT];
}
function getSelectedIndex() {
  return instructionState.lFrame.selectedIndex;
}
function setSelectedIndex(index) {
  ngDevMode && index !== -1 && assertGreaterThanOrEqual(index, HEADER_OFFSET, "Index must be past HEADER_OFFSET (or -1).");
  ngDevMode && assertLessThan(index, instructionState.lFrame.lView.length, "Can't set index passed end of LView");
  instructionState.lFrame.selectedIndex = index;
}
function getSelectedTNode() {
  const lFrame = instructionState.lFrame;
  return getTNode(lFrame.tView, lFrame.selectedIndex);
}
function ɵɵnamespaceSVG() {
  instructionState.lFrame.currentNamespace = SVG_NAMESPACE;
}
function ɵɵnamespaceMathML() {
  instructionState.lFrame.currentNamespace = MATH_ML_NAMESPACE;
}
function ɵɵnamespaceHTML() {
  namespaceHTMLInternal();
}
function namespaceHTMLInternal() {
  instructionState.lFrame.currentNamespace = null;
}
function getNamespace() {
  return instructionState.lFrame.currentNamespace;
}
var _wasLastNodeCreated = true;
function wasLastNodeCreated() {
  return _wasLastNodeCreated;
}
function lastNodeWasCreated(flag) {
  _wasLastNodeCreated = flag;
}
function createInjector(defType, parent = null, additionalProviders = null, name) {
  const injector = createInjectorWithoutInjectorInstances(defType, parent, additionalProviders, name);
  injector.resolveInjectorInitializers();
  return injector;
}
function createInjectorWithoutInjectorInstances(defType, parent = null, additionalProviders = null, name, scopes = /* @__PURE__ */ new Set()) {
  const providers = [additionalProviders || EMPTY_ARRAY, importProvidersFrom(defType)];
  name = name || (typeof defType === "object" ? void 0 : stringify(defType));
  return new R3Injector(providers, parent || getNullInjector(), name || null, scopes);
}
var Injector = class _Injector {
  static THROW_IF_NOT_FOUND = THROW_IF_NOT_FOUND;
  static NULL = new NullInjector();
  static create(options, parent) {
    if (Array.isArray(options)) {
      return createInjector({ name: "" }, parent, options, "");
    } else {
      const name = options.name ?? "";
      return createInjector({ name }, options.parent, options.providers, name);
    }
  }
  /** @nocollapse */
  static ɵprov = (
    /** @pureOrBreakMyCode */
    ɵɵdefineInjectable({
      token: _Injector,
      providedIn: "any",
      factory: () => ɵɵinject(INJECTOR$1)
    })
  );
  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__ = -1;
};
var DOCUMENT = new InjectionToken(ngDevMode ? "DocumentToken" : "");
var DestroyRef = class {
  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__ = injectDestroyRef;
  /**
   * @internal
   * @nocollapse
   */
  static __NG_ENV_ID__ = (injector) => injector;
};
var NodeInjectorDestroyRef = class extends DestroyRef {
  _lView;
  constructor(_lView) {
    super();
    this._lView = _lView;
  }
  get destroyed() {
    return isDestroyed(this._lView);
  }
  onDestroy(callback) {
    const lView = this._lView;
    storeLViewOnDestroy(lView, callback);
    return () => removeLViewOnDestroy(lView, callback);
  }
};
function injectDestroyRef() {
  return new NodeInjectorDestroyRef(getLView());
}
var ErrorHandler = class {
  /**
   * @internal
   */
  _console = console;
  handleError(error) {
    this._console.error("ERROR", error);
  }
};
var INTERNAL_APPLICATION_ERROR_HANDLER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "internal error handler" : "", {
  providedIn: "root",
  factory: () => {
    const injector = inject2(EnvironmentInjector);
    let userErrorHandler;
    return (e) => {
      if (injector.destroyed && !userErrorHandler) {
        setTimeout(() => {
          throw e;
        });
      } else {
        userErrorHandler ??= injector.get(ErrorHandler);
        userErrorHandler.handleError(e);
      }
    };
  }
});
var errorHandlerEnvironmentInitializer = {
  provide: ENVIRONMENT_INITIALIZER,
  useValue: () => void inject2(ErrorHandler),
  multi: true
};
var globalErrorListeners = new InjectionToken(ngDevMode ? "GlobalErrorListeners" : "", {
  providedIn: "root",
  factory: () => {
    if (true) {
      return;
    }
    const window = inject2(DOCUMENT).defaultView;
    if (!window) {
      return;
    }
    const errorHandler = inject2(INTERNAL_APPLICATION_ERROR_HANDLER);
    const rejectionListener = (e) => {
      errorHandler(e.reason);
      e.preventDefault();
    };
    const errorListener = (e) => {
      if (e.error) {
        errorHandler(e.error);
      } else {
        errorHandler(new Error(ngDevMode ? `An ErrorEvent with no error occurred. See Error.cause for details: ${e.message}` : e.message, { cause: e }));
      }
      e.preventDefault();
    };
    const setupEventListeners = () => {
      window.addEventListener("unhandledrejection", rejectionListener);
      window.addEventListener("error", errorListener);
    };
    if (typeof Zone !== "undefined") {
      Zone.root.run(setupEventListeners);
    } else {
      setupEventListeners();
    }
    inject2(DestroyRef).onDestroy(() => {
      window.removeEventListener("error", errorListener);
      window.removeEventListener("unhandledrejection", rejectionListener);
    });
  }
});
function provideBrowserGlobalErrorListeners() {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => void inject2(globalErrorListeners))
  ]);
}
function isSignal2(value) {
  return typeof value === "function" && value[SIGNAL] !== void 0;
}
function ɵunwrapWritableSignal(value) {
  return null;
}
function signal(initialValue, options) {
  const [get, set, update] = createSignal(initialValue, options?.equal);
  const signalFn = get;
  const node = signalFn[SIGNAL];
  signalFn.set = set;
  signalFn.update = update;
  signalFn.asReadonly = signalAsReadonlyFn.bind(signalFn);
  if (ngDevMode) {
    signalFn.toString = () => `[Signal: ${signalFn()}]`;
    node.debugName = options?.debugName;
  }
  return signalFn;
}
function signalAsReadonlyFn() {
  const node = this[SIGNAL];
  if (node.readonlyFn === void 0) {
    const readonlyFn = () => this();
    readonlyFn[SIGNAL] = node;
    node.readonlyFn = readonlyFn;
  }
  return node.readonlyFn;
}
function isWritableSignal(value) {
  return isSignal2(value) && typeof value.set === "function";
}
function assertNotInReactiveContext(debugFn, extraContext) {
  if (getActiveConsumer() !== null) {
    throw new RuntimeError(-602, ngDevMode && `${debugFn.name}() cannot be called from within a reactive context.${extraContext ? ` ${extraContext}` : ""}`);
  }
}
var ViewContext = class {
  view;
  node;
  constructor(view, node) {
    this.view = view;
    this.node = node;
  }
  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__ = injectViewContext;
};
function injectViewContext() {
  return new ViewContext(getLView(), getCurrentTNode());
}
var ChangeDetectionScheduler = class {
};
var ZONELESS_ENABLED = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "Zoneless enabled" : "", { providedIn: "root", factory: () => false });
var PROVIDED_ZONELESS = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "Zoneless provided" : "", { providedIn: "root", factory: () => false });
var ZONELESS_SCHEDULER_DISABLED = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "scheduler disabled" : "");
var SCHEDULE_IN_ROOT_ZONE = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "run changes outside zone in root" : "");
var PendingTasksInternal = class _PendingTasksInternal {
  taskId = 0;
  pendingTasks = /* @__PURE__ */ new Set();
  destroyed = false;
  pendingTask = new import_rxjs.BehaviorSubject(false);
  get hasPendingTasks() {
    return this.destroyed ? false : this.pendingTask.value;
  }
  /**
   * In case the service is about to be destroyed, return a self-completing observable.
   * Otherwise, return the observable that emits the current state of pending tasks.
   */
  get hasPendingTasksObservable() {
    if (this.destroyed) {
      return new import_rxjs.Observable((subscriber) => {
        subscriber.next(false);
        subscriber.complete();
      });
    }
    return this.pendingTask;
  }
  add() {
    if (!this.hasPendingTasks && !this.destroyed) {
      this.pendingTask.next(true);
    }
    const taskId = this.taskId++;
    this.pendingTasks.add(taskId);
    return taskId;
  }
  has(taskId) {
    return this.pendingTasks.has(taskId);
  }
  remove(taskId) {
    this.pendingTasks.delete(taskId);
    if (this.pendingTasks.size === 0 && this.hasPendingTasks) {
      this.pendingTask.next(false);
    }
  }
  ngOnDestroy() {
    this.pendingTasks.clear();
    if (this.hasPendingTasks) {
      this.pendingTask.next(false);
    }
    this.destroyed = true;
    this.pendingTask.unsubscribe();
  }
  /** @nocollapse */
  static ɵprov = (
    /** @pureOrBreakMyCode */
    ɵɵdefineInjectable({
      token: _PendingTasksInternal,
      providedIn: "root",
      factory: () => new _PendingTasksInternal()
    })
  );
};
var PendingTasks = class _PendingTasks {
  internalPendingTasks = inject2(PendingTasksInternal);
  scheduler = inject2(ChangeDetectionScheduler);
  errorHandler = inject2(INTERNAL_APPLICATION_ERROR_HANDLER);
  /**
   * Adds a new task that should block application's stability.
   * @returns A cleanup function that removes a task when called.
   */
  add() {
    const taskId = this.internalPendingTasks.add();
    return () => {
      if (!this.internalPendingTasks.has(taskId)) {
        return;
      }
      this.scheduler.notify(
        11
        /* NotificationSource.PendingTaskRemoved */
      );
      this.internalPendingTasks.remove(taskId);
    };
  }
  /**
   * Runs an asynchronous function and blocks the application's stability until the function completes.
   *
   * ```ts
   * pendingTasks.run(async () => {
   *   const userData = await fetch('/api/user');
   *   this.userData.set(userData);
   * });
   * ```
   *
   * @param fn The asynchronous function to execute
   * @developerPreview 19.0
   */
  run(fn) {
    const removeTask = this.add();
    fn().catch(this.errorHandler).finally(removeTask);
  }
  /** @nocollapse */
  static ɵprov = (
    /** @pureOrBreakMyCode */
    ɵɵdefineInjectable({
      token: _PendingTasks,
      providedIn: "root",
      factory: () => new _PendingTasks()
    })
  );
};
function noop(...args) {
}
var EffectScheduler = class _EffectScheduler {
  /** @nocollapse */
  static ɵprov = (
    /** @pureOrBreakMyCode */
    ɵɵdefineInjectable({
      token: _EffectScheduler,
      providedIn: "root",
      factory: () => new ZoneAwareEffectScheduler()
    })
  );
};
var ZoneAwareEffectScheduler = class {
  dirtyEffectCount = 0;
  queues = /* @__PURE__ */ new Map();
  add(handle) {
    this.enqueue(handle);
    this.schedule(handle);
  }
  schedule(handle) {
    if (!handle.dirty) {
      return;
    }
    this.dirtyEffectCount++;
  }
  remove(handle) {
    const zone = handle.zone;
    const queue = this.queues.get(zone);
    if (!queue.has(handle)) {
      return;
    }
    queue.delete(handle);
    if (handle.dirty) {
      this.dirtyEffectCount--;
    }
  }
  enqueue(handle) {
    const zone = handle.zone;
    if (!this.queues.has(zone)) {
      this.queues.set(zone, /* @__PURE__ */ new Set());
    }
    const queue = this.queues.get(zone);
    if (queue.has(handle)) {
      return;
    }
    queue.add(handle);
  }
  /**
   * Run all scheduled effects.
   *
   * Execution order of effects within the same zone is guaranteed to be FIFO, but there is no
   * ordering guarantee between effects scheduled in different zones.
   */
  flush() {
    while (this.dirtyEffectCount > 0) {
      let ranOneEffect = false;
      for (const [zone, queue] of this.queues) {
        if (zone === null) {
          ranOneEffect ||= this.flushQueue(queue);
        } else {
          ranOneEffect ||= zone.run(() => this.flushQueue(queue));
        }
      }
      if (!ranOneEffect) {
        this.dirtyEffectCount = 0;
      }
    }
  }
  flushQueue(queue) {
    let ranOneEffect = false;
    for (const handle of queue) {
      if (!handle.dirty) {
        continue;
      }
      this.dirtyEffectCount--;
      ranOneEffect = true;
      handle.run();
    }
    return ranOneEffect;
  }
};

// node_modules/@angular/core/fesm2022/resource.mjs
var OutputEmitterRef = class {
  destroyed = false;
  listeners = null;
  errorHandler = inject2(ErrorHandler, { optional: true });
  /** @internal */
  destroyRef = inject2(DestroyRef);
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.listeners = null;
    });
  }
  subscribe(callback) {
    if (this.destroyed) {
      throw new RuntimeError(953, ngDevMode && "Unexpected subscription to destroyed `OutputRef`. The owning directive/component is destroyed.");
    }
    (this.listeners ??= []).push(callback);
    return {
      unsubscribe: () => {
        const idx = this.listeners?.indexOf(callback);
        if (idx !== void 0 && idx !== -1) {
          this.listeners?.splice(idx, 1);
        }
      }
    };
  }
  /** Emits a new value to the output. */
  emit(value) {
    if (this.destroyed) {
      console.warn(formatRuntimeError(953, ngDevMode && "Unexpected emit for destroyed `OutputRef`. The owning directive/component is destroyed."));
      return;
    }
    if (this.listeners === null) {
      return;
    }
    const previousConsumer = setActiveConsumer(null);
    try {
      for (const listenerFn of this.listeners) {
        try {
          listenerFn(value);
        } catch (err) {
          this.errorHandler?.handleError(err);
        }
      }
    } finally {
      setActiveConsumer(previousConsumer);
    }
  }
};
function getOutputDestroyRef(ref) {
  return ref.destroyRef;
}
function untracked2(nonReactiveReadsFn) {
  return untracked(nonReactiveReadsFn);
}
function computed(computation, options) {
  const getter = createComputed(computation, options?.equal);
  if (ngDevMode) {
    getter.toString = () => `[Computed: ${getter()}]`;
    getter[SIGNAL].debugName = options?.debugName;
  }
  return getter;
}
var EffectRefImpl = class {
  [SIGNAL];
  constructor(node) {
    this[SIGNAL] = node;
  }
  destroy() {
    this[SIGNAL].destroy();
  }
};
function effect(effectFn, options) {
  ngDevMode && assertNotInReactiveContext(effect, "Call `effect` outside of a reactive context. For example, schedule the effect inside the component constructor.");
  if (ngDevMode && !options?.injector) {
    assertInInjectionContext(effect);
  }
  if (ngDevMode && options?.allowSignalWrites !== void 0) {
    console.warn(`The 'allowSignalWrites' flag is deprecated and no longer impacts effect() (writes are always allowed)`);
  }
  const injector = options?.injector ?? inject2(Injector);
  let destroyRef = options?.manualCleanup !== true ? injector.get(DestroyRef) : null;
  let node;
  const viewContext = injector.get(ViewContext, null, { optional: true });
  const notifier = injector.get(ChangeDetectionScheduler);
  if (viewContext !== null) {
    node = createViewEffect(viewContext.view, notifier, effectFn);
    if (destroyRef instanceof NodeInjectorDestroyRef && destroyRef._lView === viewContext.view) {
      destroyRef = null;
    }
  } else {
    node = createRootEffect(effectFn, injector.get(EffectScheduler), notifier);
  }
  node.injector = injector;
  if (destroyRef !== null) {
    node.onDestroyFn = destroyRef.onDestroy(() => node.destroy());
  }
  const effectRef = new EffectRefImpl(node);
  if (ngDevMode) {
    node.debugName = options?.debugName ?? "";
    const prevInjectorProfilerContext = setInjectorProfilerContext({ injector, token: null });
    try {
      emitEffectCreatedEvent(effectRef);
    } finally {
      setInjectorProfilerContext(prevInjectorProfilerContext);
    }
  }
  return effectRef;
}
var EFFECT_NODE = (() => __spreadProps(__spreadValues({}, BASE_EFFECT_NODE), {
  cleanupFns: void 0,
  zone: null,
  onDestroyFn: noop,
  run() {
    if (ngDevMode && isInNotificationPhase()) {
      throw new Error(`Schedulers cannot synchronously execute watches while scheduling.`);
    }
    const prevRefreshingViews = setIsRefreshingViews(false);
    try {
      runEffect(this);
    } finally {
      setIsRefreshingViews(prevRefreshingViews);
    }
  },
  cleanup() {
    if (!this.cleanupFns?.length) {
      return;
    }
    const prevConsumer = setActiveConsumer(null);
    try {
      while (this.cleanupFns.length) {
        this.cleanupFns.pop()();
      }
    } finally {
      this.cleanupFns = [];
      setActiveConsumer(prevConsumer);
    }
  }
}))();
var ROOT_EFFECT_NODE = (() => __spreadProps(__spreadValues({}, EFFECT_NODE), {
  consumerMarkedDirty() {
    this.scheduler.schedule(this);
    this.notifier.notify(
      12
      /* NotificationSource.RootEffect */
    );
  },
  destroy() {
    consumerDestroy(this);
    this.onDestroyFn();
    this.cleanup();
    this.scheduler.remove(this);
  }
}))();
var VIEW_EFFECT_NODE = (() => __spreadProps(__spreadValues({}, EFFECT_NODE), {
  consumerMarkedDirty() {
    this.view[FLAGS] |= 8192;
    markAncestorsForTraversal(this.view);
    this.notifier.notify(
      13
      /* NotificationSource.ViewEffect */
    );
  },
  destroy() {
    consumerDestroy(this);
    this.onDestroyFn();
    this.cleanup();
    this.view[EFFECTS]?.delete(this);
  }
}))();
function createViewEffect(view, notifier, fn) {
  const node = Object.create(VIEW_EFFECT_NODE);
  node.view = view;
  node.zone = typeof Zone !== "undefined" ? Zone.current : null;
  node.notifier = notifier;
  node.fn = createEffectFn(node, fn);
  view[EFFECTS] ??= /* @__PURE__ */ new Set();
  view[EFFECTS].add(node);
  node.consumerMarkedDirty(node);
  return node;
}
function createRootEffect(fn, scheduler, notifier) {
  const node = Object.create(ROOT_EFFECT_NODE);
  node.fn = createEffectFn(node, fn);
  node.scheduler = scheduler;
  node.notifier = notifier;
  node.zone = typeof Zone !== "undefined" ? Zone.current : null;
  node.scheduler.add(node);
  node.notifier.notify(
    12
    /* NotificationSource.RootEffect */
  );
  return node;
}
function createEffectFn(node, fn) {
  return () => {
    fn((cleanupFn) => (node.cleanupFns ??= []).push(cleanupFn));
  };
}
var identityFn = (v) => v;
function linkedSignal(optionsOrComputation, options) {
  if (typeof optionsOrComputation === "function") {
    const getter = createLinkedSignal(optionsOrComputation, identityFn, options?.equal);
    return upgradeLinkedSignalGetter(getter, options?.debugName);
  } else {
    const getter = createLinkedSignal(optionsOrComputation.source, optionsOrComputation.computation, optionsOrComputation.equal);
    return upgradeLinkedSignalGetter(getter, optionsOrComputation.debugName);
  }
}
function upgradeLinkedSignalGetter(getter, debugName) {
  if (ngDevMode) {
    getter.toString = () => `[LinkedSignal: ${getter()}]`;
    getter[SIGNAL].debugName = debugName;
  }
  const node = getter[SIGNAL];
  const upgradedGetter = getter;
  upgradedGetter.set = (newValue) => linkedSignalSetFn(node, newValue);
  upgradedGetter.update = (updateFn) => linkedSignalUpdateFn(node, updateFn);
  upgradedGetter.asReadonly = signalAsReadonlyFn.bind(getter);
  return upgradedGetter;
}
function resource(options) {
  if (ngDevMode && !options?.injector) {
    assertInInjectionContext(resource);
  }
  const oldNameForParams = options.request;
  const params = options.params ?? oldNameForParams ?? (() => null);
  return new ResourceImpl(params, getLoader(options), options.defaultValue, options.equal ? wrapEqualityFn(options.equal) : void 0, options.injector ?? inject2(Injector));
}
var BaseWritableResource = class {
  value;
  constructor(value) {
    this.value = value;
    this.value.set = this.set.bind(this);
    this.value.update = this.update.bind(this);
    this.value.asReadonly = signalAsReadonlyFn;
  }
  isError = computed(() => this.status() === "error");
  update(updateFn) {
    this.set(updateFn(untracked2(this.value)));
  }
  isLoading = computed(() => this.status() === "loading" || this.status() === "reloading");
  // Use a computed here to avoid triggering reactive consumers if the value changes while staying
  // either defined or undefined.
  isValueDefined = computed(() => {
    if (this.isError()) {
      return false;
    }
    return this.value() !== void 0;
  });
  hasValue() {
    return this.isValueDefined();
  }
  asReadonly() {
    return this;
  }
};
var ResourceImpl = class extends BaseWritableResource {
  loaderFn;
  equal;
  pendingTasks;
  /**
   * The current state of the resource. Status, value, and error are derived from this.
   */
  state;
  /**
   * Combines the current request with a reload counter which allows the resource to be reloaded on
   * imperative command.
   */
  extRequest;
  effectRef;
  pendingController;
  resolvePendingTask = void 0;
  destroyed = false;
  unregisterOnDestroy;
  constructor(request, loaderFn, defaultValue, equal, injector) {
    super(
      // Feed a computed signal for the value to `BaseWritableResource`, which will upgrade it to a
      // `WritableSignal` that delegates to `ResourceImpl.set`.
      computed(() => {
        const streamValue = this.state().stream?.();
        if (!streamValue) {
          return defaultValue;
        }
        if (this.state().status === "loading" && this.error()) {
          return defaultValue;
        }
        if (!isResolved(streamValue)) {
          throw new ResourceValueError(this.error());
        }
        return streamValue.value;
      }, { equal })
    );
    this.loaderFn = loaderFn;
    this.equal = equal;
    this.extRequest = linkedSignal({
      source: request,
      computation: (request2) => ({ request: request2, reload: 0 })
    });
    this.state = linkedSignal({
      // Whenever the request changes,
      source: this.extRequest,
      // Compute the state of the resource given a change in status.
      computation: (extRequest, previous) => {
        const status = extRequest.request === void 0 ? "idle" : "loading";
        if (!previous) {
          return {
            extRequest,
            status,
            previousStatus: "idle",
            stream: void 0
          };
        } else {
          return {
            extRequest,
            status,
            previousStatus: projectStatusOfState(previous.value),
            // If the request hasn't changed, keep the previous stream.
            stream: previous.value.extRequest.request === extRequest.request ? previous.value.stream : void 0
          };
        }
      }
    });
    this.effectRef = effect(this.loadEffect.bind(this), {
      injector,
      manualCleanup: true
    });
    this.pendingTasks = injector.get(PendingTasks);
    this.unregisterOnDestroy = injector.get(DestroyRef).onDestroy(() => this.destroy());
  }
  status = computed(() => projectStatusOfState(this.state()));
  error = computed(() => {
    const stream = this.state().stream?.();
    return stream && !isResolved(stream) ? stream.error : void 0;
  });
  /**
   * Called either directly via `WritableResource.set` or via `.value.set()`.
   */
  set(value) {
    if (this.destroyed) {
      return;
    }
    const error = untracked2(this.error);
    const state = untracked2(this.state);
    if (!error) {
      const current = untracked2(this.value);
      if (state.status === "local" && (this.equal ? this.equal(current, value) : current === value)) {
        return;
      }
    }
    this.state.set({
      extRequest: state.extRequest,
      status: "local",
      previousStatus: "local",
      stream: signal({ value })
    });
    this.abortInProgressLoad();
  }
  reload() {
    const { status } = untracked2(this.state);
    if (status === "idle" || status === "loading") {
      return false;
    }
    this.extRequest.update(({ request, reload }) => ({ request, reload: reload + 1 }));
    return true;
  }
  destroy() {
    this.destroyed = true;
    this.unregisterOnDestroy();
    this.effectRef.destroy();
    this.abortInProgressLoad();
    this.state.set({
      extRequest: { request: void 0, reload: 0 },
      status: "idle",
      previousStatus: "idle",
      stream: void 0
    });
  }
  loadEffect() {
    return __async(this, null, function* () {
      const extRequest = this.extRequest();
      const { status: currentStatus, previousStatus } = untracked2(this.state);
      if (extRequest.request === void 0) {
        return;
      } else if (currentStatus !== "loading") {
        return;
      }
      this.abortInProgressLoad();
      let resolvePendingTask = this.resolvePendingTask = this.pendingTasks.add();
      const { signal: abortSignal } = this.pendingController = new AbortController();
      try {
        const stream = yield untracked2(() => {
          return this.loaderFn({
            params: extRequest.request,
            // TODO(alxhub): cleanup after g3 removal of `request` alias.
            request: extRequest.request,
            abortSignal,
            previous: {
              status: previousStatus
            }
          });
        });
        if (abortSignal.aborted || untracked2(this.extRequest) !== extRequest) {
          return;
        }
        this.state.set({
          extRequest,
          status: "resolved",
          previousStatus: "resolved",
          stream
        });
      } catch (err) {
        if (abortSignal.aborted || untracked2(this.extRequest) !== extRequest) {
          return;
        }
        this.state.set({
          extRequest,
          status: "resolved",
          previousStatus: "error",
          stream: signal({ error: encapsulateResourceError(err) })
        });
      } finally {
        resolvePendingTask?.();
        resolvePendingTask = void 0;
      }
    });
  }
  abortInProgressLoad() {
    untracked2(() => this.pendingController?.abort());
    this.pendingController = void 0;
    this.resolvePendingTask?.();
    this.resolvePendingTask = void 0;
  }
};
function wrapEqualityFn(equal) {
  return (a, b) => a === void 0 || b === void 0 ? a === b : equal(a, b);
}
function getLoader(options) {
  if (isStreamingResourceOptions(options)) {
    return options.stream;
  }
  return (params) => __async(null, null, function* () {
    try {
      return signal({ value: yield options.loader(params) });
    } catch (err) {
      return signal({ error: encapsulateResourceError(err) });
    }
  });
}
function isStreamingResourceOptions(options) {
  return !!options.stream;
}
function projectStatusOfState(state) {
  switch (state.status) {
    case "loading":
      return state.extRequest.reload === 0 ? "loading" : "reloading";
    case "resolved":
      return isResolved(state.stream()) ? "resolved" : "error";
    default:
      return state.status;
  }
}
function isResolved(state) {
  return state.error === void 0;
}
function encapsulateResourceError(error) {
  if (error instanceof Error) {
    return error;
  }
  return new ResourceWrappedError(error);
}
var ResourceValueError = class extends Error {
  constructor(error) {
    super(ngDevMode ? `Resource is currently in an error state (see Error.cause for details): ${error.message}` : error.message, { cause: error });
  }
};
var ResourceWrappedError = class extends Error {
  constructor(error) {
    super(ngDevMode ? `Resource returned an error that's not an Error instance: ${String(error)}. Check this error's .cause for the actual error.` : String(error), { cause: error });
  }
};

export {
  require_cjs,
  require_operators,
  setCurrentInjector,
  SIGNAL,
  setActiveConsumer,
  getActiveConsumer,
  REACTIVE_NODE,
  producerAccessed,
  consumerBeforeComputation,
  consumerAfterComputation,
  consumerPollProducersForChange,
  consumerDestroy,
  createComputed,
  setThrowInvalidWriteToSignalError,
  signalSetFn,
  SIGNAL_NODE,
  setAlternateWeakRefImpl,
  Version,
  VERSION,
  XSS_SECURITY_URL,
  RuntimeError,
  formatRuntimeError,
  _global,
  initNgDevMode,
  getClosureSafeProperty,
  fillProperties,
  stringify,
  concatStringsWithSpace,
  truncateMiddle,
  forwardRef,
  resolveForwardRef,
  isForwardRef,
  assertNumber,
  assertNumberInRange,
  assertString,
  assertFunction,
  assertEqual,
  assertNotEqual,
  assertSame,
  assertNotSame,
  assertLessThan,
  assertGreaterThan,
  assertGreaterThanOrEqual,
  assertNotDefined,
  assertDefined,
  throwError,
  assertDomNode,
  assertElement,
  assertIndexInRange,
  assertOneOf,
  assertNotReactive,
  ɵɵdefineInjectable,
  defineInjectable,
  ɵɵdefineInjector,
  getInjectableDef,
  isInjectable,
  getInjectorDef,
  NG_PROV_DEF,
  NG_INJ_DEF,
  InjectionToken,
  setInjectorProfilerContext,
  setInjectorProfiler,
  emitProviderConfiguredEvent,
  emitInjectorToCreateInstanceEvent,
  emitInstanceCreatedByInjectorEvent,
  emitInjectEvent,
  emitEffectCreatedEvent,
  runInInjectorProfilerContext,
  isEnvironmentProviders,
  NG_COMP_DEF,
  NG_DIR_DEF,
  NG_PIPE_DEF,
  NG_MOD_DEF,
  NG_FACTORY_DEF,
  NG_ELEMENT_ID,
  renderStringify,
  stringifyForError,
  cyclicDependencyError,
  cyclicDependencyErrorWithDetails,
  throwProviderNotFoundError,
  setInjectImplementation,
  injectRootLimpMode,
  assertInjectImplementationNotEqual,
  ɵɵinject,
  ɵɵinvalidFactoryDep,
  inject2 as inject,
  convertToBitFlags,
  attachInjectFlag,
  getFactoryDef,
  arrayEquals,
  flatten,
  deepForEach,
  addToArray,
  removeFromArray,
  newArray,
  arraySplice,
  arrayInsert2,
  keyValueArraySet,
  keyValueArrayGet,
  keyValueArrayIndexOf,
  EMPTY_OBJ,
  EMPTY_ARRAY,
  ENVIRONMENT_INITIALIZER,
  INJECTOR$1,
  INJECTOR_DEF_TYPES,
  NullInjector,
  getNgModuleDef,
  getNgModuleDefOrThrow,
  getComponentDef,
  getDirectiveDefOrThrow,
  getDirectiveDef,
  getPipeDef,
  isStandalone,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  importProvidersFrom,
  internalImportProvidersFrom,
  walkProviderTree,
  isTypeProvider,
  isClassProvider,
  INJECTOR_SCOPE,
  getNullInjector,
  EnvironmentInjector,
  R3Injector,
  providerToFactory,
  runInInjectionContext,
  isInInjectionContext,
  assertInInjectionContext,
  HOST,
  TVIEW,
  FLAGS,
  PARENT,
  NEXT,
  T_HOST,
  HYDRATION,
  CLEANUP,
  CONTEXT,
  INJECTOR,
  ENVIRONMENT,
  RENDERER,
  CHILD_HEAD,
  CHILD_TAIL,
  DECLARATION_VIEW,
  DECLARATION_COMPONENT_VIEW,
  DECLARATION_LCONTAINER,
  PREORDER_HOOK_FLAGS,
  QUERIES,
  ID,
  EMBEDDED_VIEW_INJECTOR,
  ON_DESTROY_HOOKS,
  EFFECTS_TO_SCHEDULE,
  EFFECTS,
  REACTIVE_TEMPLATE_CONSUMER,
  AFTER_RENDER_SEQUENCES_TO_ADD,
  ANIMATIONS,
  HEADER_OFFSET,
  DEHYDRATED_VIEWS,
  NATIVE,
  VIEW_REFS,
  MOVED_VIEWS,
  CONTAINER_HEADER_OFFSET,
  isLView,
  isLContainer,
  isContentQueryHost,
  isComponentHost,
  isDirectiveHost,
  isComponentDef,
  isRootView,
  isProjectionTNode,
  hasI18n,
  isDestroyed,
  assertTNodeForLView,
  assertTNodeCreationIndex,
  assertTNodeForTView,
  assertTNode,
  assertTIcu,
  assertComponentType,
  assertNgModuleType,
  assertHasParent,
  assertLContainer,
  assertLView,
  assertFirstCreatePass,
  assertFirstUpdatePass,
  assertDirectiveDef,
  assertIndexInDeclRange,
  assertIndexInExpandoRange,
  assertProjectionSlots,
  assertParentView,
  assertNodeInjector,
  SVG_NAMESPACE,
  MATH_ML_NAMESPACE,
  unwrapRNode,
  unwrapLView,
  getNativeByIndex,
  getNativeByTNode,
  getNativeByTNodeOrNull,
  getTNode,
  load,
  store,
  getComponentLViewByIndex,
  isCreationMode,
  viewAttachedToChangeDetector,
  viewAttachedToContainer,
  getConstant,
  resetPreOrderHookFlags,
  markViewForRefresh,
  walkUpViews,
  requiresRefreshOrTraversal,
  updateAncestorTraversalFlagsOnAttach,
  markAncestorsForTraversal,
  storeLViewOnDestroy,
  removeLViewOnDestroy,
  getLViewParent,
  getOrCreateLViewCleanup,
  getOrCreateTViewCleanup,
  storeCleanupWithContext,
  CheckNoChangesMode,
  getElementDepthCount,
  increaseElementDepthCount,
  decreaseElementDepthCount,
  getBindingsEnabled,
  isInSkipHydrationBlock,
  isSkipHydrationRootTNode,
  ɵɵenableBindings,
  enterSkipHydrationBlock,
  ɵɵdisableBindings,
  leaveSkipHydrationBlock,
  getLView,
  getTView,
  ɵɵrestoreView,
  ɵɵresetView,
  getCurrentTNode,
  getCurrentTNodePlaceholderOk,
  getCurrentParentTNode,
  setCurrentTNode,
  isCurrentTNodeParent,
  setCurrentTNodeAsNotParent,
  getContextLView,
  isInCheckNoChangesMode,
  isExhaustiveCheckNoChanges,
  setIsInCheckNoChangesMode,
  isRefreshingViews,
  setIsRefreshingViews,
  getBindingRoot,
  getBindingIndex,
  setBindingIndex,
  nextBindingIndex,
  incrementBindingIndex,
  isInI18nBlock,
  setInI18nBlock,
  setBindingRootForHostBindings,
  getCurrentDirectiveIndex,
  setCurrentDirectiveIndex,
  getCurrentDirectiveDef,
  getCurrentQueryIndex,
  setCurrentQueryIndex,
  enterDI,
  enterView,
  leaveDI,
  leaveView,
  nextContextImpl,
  getSelectedIndex,
  setSelectedIndex,
  getSelectedTNode,
  ɵɵnamespaceSVG,
  ɵɵnamespaceMathML,
  ɵɵnamespaceHTML,
  getNamespace,
  wasLastNodeCreated,
  lastNodeWasCreated,
  createInjector,
  createInjectorWithoutInjectorInstances,
  Injector,
  DOCUMENT,
  DestroyRef,
  ErrorHandler,
  INTERNAL_APPLICATION_ERROR_HANDLER,
  errorHandlerEnvironmentInitializer,
  provideBrowserGlobalErrorListeners,
  isSignal2 as isSignal,
  ɵunwrapWritableSignal,
  signal,
  signalAsReadonlyFn,
  isWritableSignal,
  assertNotInReactiveContext,
  ViewContext,
  ChangeDetectionScheduler,
  ZONELESS_ENABLED,
  PROVIDED_ZONELESS,
  ZONELESS_SCHEDULER_DISABLED,
  SCHEDULE_IN_ROOT_ZONE,
  PendingTasksInternal,
  PendingTasks,
  noop,
  EffectScheduler,
  OutputEmitterRef,
  getOutputDestroyRef,
  untracked2 as untracked,
  computed,
  effect,
  linkedSignal,
  resource,
  ResourceImpl,
  encapsulateResourceError
};
/*! Bundled license information:

@angular/core/fesm2022/not_found.mjs:
@angular/core/fesm2022/signal.mjs:
@angular/core/fesm2022/effect.mjs:
@angular/core/fesm2022/weak_ref.mjs:
@angular/core/fesm2022/primitives/signals.mjs:
@angular/core/fesm2022/primitives/di.mjs:
@angular/core/fesm2022/root_effect_scheduler.mjs:
@angular/core/fesm2022/resource.mjs:
  (**
   * @license Angular v20.3.18
   * (c) 2010-2025 Google LLC. https://angular.dev/
   * License: MIT
   *)
*/
//# sourceMappingURL=chunk-P4AT7P6F.js.map
