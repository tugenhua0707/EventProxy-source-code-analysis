## EventProxy 代码分析
<p>EventProxy 是一个很轻量的工具，但是能够带来一种事件式编程的思维变化。</p>
<p>有如下优点:</p>
<ul>
  <li>1.利用事件机制解耦复杂业务逻辑。</li>
  <li>2.解决多个异步回调嵌套的问题</li>
  <li>3.无平台依赖，适合前后端，能用于浏览器和Node.js</li>
  <li>4.兼容CMD，AMD以及CommonJS模块环境</li>
</ul>
<p>详见中文文档：<a href="https://github.com/JacksonTian/eventproxy#%E9%87%8D%E5%A4%8D%E5%BC%82%E6%AD%A5%E5%8D%8F%E4%BD%9C">https://github.com/JacksonTian/eventproxy#%E9%87%8D%E5%A4%8D%E5%BC%82%E6%AD%A5%E5%8D%8F%E4%BD%9C</a></p>
<p>比如我们之前多个ajax异步请求回调，b请求需要依赖于a请求完成后，再进行，那么就会出现ajax嵌套的问题</p>
<p>比如代码如下：</p>
<pre>
  $.getJSON("@@@PREFIX@@@/json/json1.json",function(data1){
    $.getJSON("@@@PREFIX@@@/json/json2.json",function(data2){
      render(data1,data2);
    });
  });
  function render(data1,data2) {
    console.log(data1);
    console.log(data2);
  }
</pre>
<p>但是现在我们使用EventProxy的话，我们可以直接在页面上引入EventProxy.js即可，代码总共就几百行代码，不依赖与任何框架，或者我们使用Node在本地项目中安装一下，然后require进来即可，或者使用seajs或者requireJS都可以的；使用EventProxy代码变为如下解决多个异步嵌套的问题：</p>
<pre>
  var ep = EventProxy.create("json1", "json2", function (json1, json2) {
    console.log(json1);
    console.log(json2);
  });

  $.get("@@@PREFIX@@@/json/json1.json", function (data) {
    // something
    ep.emit("json1", data);
  });
  $.get("@@@PREFIX@@@/json/json2.json", function (data) {
    // something
    ep.emit("json2", data);
  });
</pre>
<p>代码分析如下：</p>
<p>页面外层组装代码是由一个立即函数封装，传入2个参数，一个是函数名EventProxy,另一个是函数；代码如下：</p>
<pre>
  !(function(name, definition){
    
  })('EventProxy',function(debug){
    
  })
</pre>
<p>支持AMD,CMD及commonJS模块代码如下定义：</p>
<pre>
  // Check define
  var hasDefine = typeof define === 'function',
      // Check exports
      hasExports = typeof module !== 'undefined' && module.exports;

  if (hasDefine) {
    // AMD Module or CMD Module
    define('eventproxy_debug', function () {return function () {};});
    define(['eventproxy_debug'], definition);
  } else if (hasExports) {
    // Node.js Module
    module.exports = definition(require('debug')('eventproxy'));
  } else {
    // Assign to common namespaces or simply the global object (window)
    this[name] = definition();
  }
</pre>
<p>如上代码；如果既不是define封装的代码，也不是有module.exports导出的代码；那么就直接把函数definition赋值给this[name];这里的this指向window，也就是window的全局的一个方法EventProxy,name参数就是刚刚是传进去的EventProxy，definition是一个函数，下面一整块的；</p>
<pre>
  debug = debug || function () {};
  var SLICE = Array.prototype.slice;
  var CONCAT = Array.prototype.concat;
  var ALL_EVENT = '__all__';
</pre>
<p>
  debug定义成一个函数，SLICE 和 CONCAT 一些数组才常见操作定义；下面看如下构造函数定义：
</p>
<pre>
  var EventProxy = function () {
    if (!(this instanceof EventProxy)) {
      return new EventProxy();
    }
    this._callbacks = {};
    this._fired = {};
  };
</pre>
<p>定义个EventProxy构造函数，如果当前调用EventProxy方法不是它的实列的话，也就是说没有通过new实例化的话，那么就直接返回一个新实列 EventProxy; 然后定义一个存放所有的回调函数_callbacks对象，及存放事件名对象_fired</p>
<pre>
  EventProxy.prototype.addListener = function (ev, callback) {
    debug('Add listener for %s', ev);
    this._callbacks[ev] = this._callbacks[ev] || [];
    this._callbacks[ev].push(callback);
    return this;
  };
</pre>
<p>上面这段代码是给EventProxy添加事件的函数，传递2个参数，一个是事件名称，另一个是回调，如果之前_callbacks没有该事件名的话，就存进对象去，且变成数组形式；最后把回调push进去，最后返回EventProxy;也就是说每一个callback回调都对应自己的事件名称；我们可以把上面的代码理解成下面这样的；</p>
<pre>
  var obj = {};
  function a(){
    console.log(1)
  };
  obj['click'] = obj['click'] || [];
  obj['click'].push(a);
  console.log(obj);
  // {"click":function a(){console.log(1)} } 变成这样的。
</pre>
<p>下面就是给EventProxy添加别名了，为了兼容其他的框架，也就是一个好习惯；代码如下；</p>
<pre>
  EventProxy.prototype.bind = EventProxy.prototype.addListener;
  EventProxy.prototype.on = EventProxy.prototype.addListener;
  EventProxy.prototype.subscribe = EventProxy.prototype.addListener;
</pre>
<p>YUI3使用者，subscribe和fire分别对应的是on/addListener和emit。</p>
<p>jQuery使用者，trigger对应的方法是emit，bind对应的就是on/addListener</p>
<p>removeListener和removeAllListeners其实都可以通过别名unbind完成。</p>
<pre>
  EventProxy.prototype.headbind = function (ev, callback) {
    debug('Add listener for %s', ev);
    this._callbacks[ev] = this._callbacks[ev] || [];
    this._callbacks[ev].unshift(callback);
    return this;
  };
</pre>
<p>
  headbind函数的作用是：添加一个事件函数，并且把它存到数组中第一个位置上去；然后返回EventProxy对象实例；
</p>
<pre>
  EventProxy.prototype.removeListener = function (eventname, callback) {
    var calls = this._callbacks;
    if (!eventname) {
      debug('Remove all listeners');
      this._callbacks = {};
    } else {
      if (!callback) {
        debug('Remove all listeners of %s', eventname);
        calls[eventname] = [];
      } else {
        var list = calls[eventname];
        if (list) {
          var l = list.length;
          for (var i = 0; i < l; i++) {
            if (callback === list[i]) {
              debug('Remove a listener of %s', eventname);
              list[i] = null;
            }
          }
        }
      }
    }
    return this;
  };
</pre>
<p>
  上面removeListener 作用是删除事件的函数，传入2个参数，第一个是事件名称，第二个是一个函数，首先使用
  一个局部变量 calls把this._callbacks存起来，让calls指针指向与this._callbacks对象，因此它有
  this._callbacks所有的属性；然后判断该事件名称是否有，如果该事件名称本来就没有的话，那就不需要删除该事件了，因此直接是 this._callbacks = {};  再进入else判断，如果该事件名存在的话，但是没有对应的函数的
  话，那么直接给该事件名 置为 []; 如果即有事件名称和对应函数的话，然后获取该事件名；然后进行遍历；判断
  当前的项与传进来的callback是否相同，是的话，直接置为null;
</p>
<p>给removeListener 设置别名如下：</p>
<pre>
  EventProxy.prototype.unbind = EventProxy.prototype.removeListener;
</pre>
<p>removeAllListeners是删除所有的事件，如下：</p>
<pre>
  EventProxy.prototype.removeAllListeners = function (event) {
    return this.unbind(event);
  };
</pre>
<p>
  该事件调用unbind方法；也就是调用了removeListener方法；因为unbind是它的别名；因为只传递了一个事件
  名称event,没有传递函数，因此会执行到else里面的这句代码：calls[eventname] = [];
</p>
<p>下面是绑定所有的事件方法bindForAll</p>
<pre>
  EventProxy.prototype.bindForAll = function (callback) {
    this.bind(ALL_EVENT, callback);
  };
</pre>
<p>
  bindForAll方法传递了callback参数，然后调用了bind方法；那也就是调用了addListener方法；因为bind
  是它的别名；bind方法的第一个参数 是ALL_EVENT 也就是全局变量定义的 var ALL_EVENT = '__all__';
</p>
<p>移除所有的事件 unbindForAll</p>
<pre>
  EventProxy.prototype.unbindForAll = function (callback) {
    this.unbind(ALL_EVENT, callback);
  };
</pre>
<p>调用了unbind方法，也就是调用了removeListener方法；</p>
<p>下面是事件触发函数 trigger</p>
<pre>
  EventProxy.prototype.trigger = function (eventname, data) {
    var list, ev, callback, i, l;
    var both = 2;
    var calls = this._callbacks;
    debug('Emit event %s with data %j', eventname, data);
    while (both--) {
      ev = both ? eventname : ALL_EVENT;
      list = calls[ev];
      if (list) {
        for (i = 0, l = list.length; i < l; i++) {
          if (!(callback = list[i])) {
            list.splice(i, 1);
            i--;
            l--;
          } else {
            var args = [];
            var start = both ? 1 : 0;
            for (var j = start; j < arguments.length; j++) {
              args.push(arguments[j]);
            }
            callback.apply(this, args);
          }
        }
      }
    }
    return this;
  };
</pre>
<p>
  事件的触发，该函数带有2个参数，第一个是事件名称，第二个是需要的传递的数据，触发事件，先获取要触发的事件
  名称，也就是返回对应的callback函数，然后遍历该callback函数是否在 this._callbacks内，如果没有的
  话，继续截取数组中一个，继续往下遍历，否则的话，从1遍历(因为第一个是eventName参数)，获取对应函数需
  要传递的数据，保存数组args里面去，然后使用apply方法调用该函数，最后返回eventProxy的实列；
</p>
<p>emit和fire都是trigger的别名，如下代码</p>
<pre>
  EventProxy.prototype.emit = EventProxy.prototype.trigger;
  EventProxy.prototype.fire = EventProxy.prototype.trigger;
</pre>
<p>绑定一次事件once</p>
<pre>
  EventProxy.prototype.once = function (ev, callback) {
    var self = this;
    var wrapper = function () {
      callback.apply(self, arguments);
      self.unbind(ev, wrapper);
    };
    this.bind(ev, wrapper);
    return this;
  };
</pre>
<p>
  同样传递二个参数，第一个是事件名称，第二个是需要触发的函数，如上代码；通过bind绑定一次；调用完成后，通过unbind进行解绑；
</p>
<p>异步事件触发: emitLater</p>
<pre>
  var later = (typeof setImmediate !== 'undefined' && setImmediate) ||
    (typeof process !== 'undefined' && process.nextTick) || function (fn) {
    setTimeout(fn, 0);
  };

  /**
   * emitLater
   * make emit async
   */
  EventProxy.prototype.emitLater = function () {
    var self = this;
    var args = arguments;
    later(function () {
      self.trigger.apply(self, args);
    });
  };
</pre>
<p>
  使用方法如下：
  var ep = EventProxy.create();
  ep.once('check', function (a) {

  });
  ep.emitLater('check', "a");
</p>
<p>immediate方法的含义是马上绑定一个事件，然后触发它</p>
<pre>
  /**
   * Bind an event, and trigger it immediately.
   * @param {String} ev Event name.
   * @param {Function} callback Callback.
   * @param {Mix} data The data that will be passed to calback as arguments.
   */
  EventProxy.prototype.immediate = function (ev, callback, data) {
    this.bind(ev, callback);
    this.trigger(ev, data);
    return this;
  };
</pre>
<p>
  可以传递三个参数，第一个为事件名称，第二个是需要触发的函数，第三个是需要传递的数据；
  使用方法可以如下：
  <pre>
  var eproxy = new EventProxy();
  eproxy.immediate('funcName',function(){
    console.log(1);
  },'aa')
  </pre>
</p>
<p>
  asap是immediate的别名<br/>
  EventProxy.prototype.asap = EventProxy.prototype.immediate;
</p>
<p>all方法--all方法将handler注册到事件组合上。当注册的多个事件都触发后，将会调用handler执行，每个事件传递的数据，将会依照事件名顺序，传入handler作为参数。</p>
<p>代码的调用可以如下：</p>
<pre>
  var ep = new EventProxy();
  ep.all('tpl', 'data', function (tpl, data) { 
    // or ep.all(['tpl', 'data'], function (tpl, data) {})
    // 在所有指定的事件触发后，将会被调用执行
    // 参数对应各自的事件名
  });
</pre>
<p>代码分析如下：</p>
<pre>
  EventProxy.prototype.all = function (eventname1, eventname2, callback) {
    var args = CONCAT.apply([], arguments);
    args.push(true);
    _assign.apply(this, args);
    return this;
  };
</pre>
<p>调用了_assign函数，代码如下：</p>
<pre>
  var _assign = function (eventname1, eventname2, cb, once) {
    var proxy = this;
    var argsLength = arguments.length;
    var times = 0;
    var flag = {};

    // Check the arguments length.
    if (argsLength < 3) {
      return this;
    }

    var events = SLICE.call(arguments, 0, -2);
    var callback = arguments[argsLength - 2];
    var isOnce = arguments[argsLength - 1];

    // Check the callback type.
    if (typeof callback !== "function") {
      return this;
    }
    debug('Assign listener for events %j, once is %s', events, !!isOnce);
    var bind = function (key) {
      var method = isOnce ? "once" : "bind";
      proxy[method](key, function (data) {
        proxy._fired[key] = proxy._fired[key] || {};
        proxy._fired[key].data = data;
        if (!flag[key]) {
          flag[key] = true;
          times++;
        }
      });
    };

    var length = events.length;
    for (var index = 0; index < length; index++) {
      bind(events[index]);
    }

    var _all = function (event) {
      if (times < length) {
        return;
      }
      if (!flag[event]) {
        return;
      }
      var data = [];
      for (var index = 0; index < length; index++) {
        data.push(proxy._fired[events[index]].data);
      }
      if (isOnce) {
        proxy.unbindForAll(_all);
      }
      debug('Events %j all emited with data %j', events, data);
      callback.apply(null, data);
    };
    proxy.bindForAll(_all);
  };
</pre>
<p>
  all方法传递3个参数，因为all方法是处理多个事件，然后对多个事件依次返回对应的事件名称结果来，第一个和
  第二个是事件名称，第三个是一个回调函数，首先把所有的参数转换成数组，保存到args变量中，如下代码：
  var args = CONCAT.apply([], arguments); 然后添加第四个参数 args.push(true);
  最后通过 apply 调用 _assign.apply(this, args); _assign这个方法；下面来看看该方法做了什么事情；
  同时_assign函数接收四个参数，第一个和第二个是事件名称，第三个是callback回调，第四个是否是是once，如果是once的是的话，绑定一次函数，调用once绑定事件，否则的话，调用bind绑定；一刚开始定义一些变量；
  并且判断传递的参数有没有三个，如果小于3个的话，直接返回不做任何事情；如下代码：
</p>
<pre>
  var proxy = this;
    var argsLength = arguments.length;
    var times = 0;
    var flag = {};

    // Check the arguments length.
    if (argsLength < 3) {
      return this;
    }
</pre>
<p>
  接着是获取事件，var events = SLICE.call(arguments, 0, -2); 使用slice方法截取，从第一个开始到
  倒数第二个结束(不包括倒数第二个); 也就是说可以绑定多个事件名称；获取callback函数；代码如下：
  var callback = arguments[argsLength - 2]; 倒数第二个为callback函数；倒数第一个判断为isonce
  函数;如下代码：var isOnce = arguments[argsLength - 1];
  判断callback是否为函数，不是函数的话，也直接返回；如下代码：
</p>
<pre>
  if (typeof callback !== "function") {
    return this;
  }
</pre>
<pre>
  var bind = function (key) {
      var method = isOnce ? "once" : "bind";
      proxy[method](key, function (data) {
        proxy._fired[key] = proxy._fired[key] || {};
        proxy._fired[key].data = data;
        if (!flag[key]) {
          flag[key] = true;
          times++;
        }
      });
    };
    var length = events.length;
    for (var index = 0; index < length; index++) {
      bind(events[index]);
    }
</pre>
<p>
  如上代码：是绑定事件的操作；首先获取事件的长度；var length = events.length;然后遍历该事件；获取到
  单个的事件名称，传入bind()方法内；bind方法接收一个事件名称；判断isOnce是否为true，有的话，就绑定一次
  once；否则的话为bind；把对应事件名称存入proxy._fired[key].data内；然后通过flag[key]是否为true，
  过滤一些已经执行的事件名称，最后执行times++;获取总的次数，因为下面会通过该总的次数和事件名称的长度
  进行对比，看对应的事件是否执行完，执行完后会依次存入数组内，这样就保证了all方法中的事件名称对应了回调
  的参数；接着再看如下代码：
</p>
<pre>
  var _all = function (event) {
      if (times < length) {
        return;
      }
      if (!flag[event]) {
        return;
      }
      var data = [];
      for (var index = 0; index < length; index++) {
        data.push(proxy._fired[events[index]].data);
      }
      if (isOnce) {
        proxy.unbindForAll(_all);
      }
      debug('Events %j all emited with data %j', events, data);
      callback.apply(null, data);
    };
    proxy.bindForAll(_all);
</pre>
<p>
  首先判断次数是否小于它的总长度；然后flag对象内是否有未执行完的事件名；接着遍历长度，依次存入数组data内
  ，最后调用apply执行callback回调，参数为data；
</p>
<p>assign是all的别名，如下代码：</p>
<pre>
  EventProxy.prototype.assign = EventProxy.prototype.all;
</pre>
<p>fail方法-- 该方法侦听了error的事件；如下代码：</p>
<pre>
  /**
   * Assign the only one 'error' event handler.
   * @param {Function(err)} callback
   */
  EventProxy.prototype.fail = function (callback) {
    var that = this;

    that.once('error', function () {
      that.unbind();
      // put all arguments to the error handler
      // fail(function(err, args1, args2, ...){})
      callback.apply(null, arguments);
    });
    return this;
  };
</pre>
<p>
  接收一个参数callback；内部侦听error事件，内部that.unbind 卸载掉所有handler；然后调用该回调，比如
  如下代码：
</p>
<pre>
  var ep = new EventProxy();
  ep.fail(callback);
  // 由于参数位相同，它实际是
  ep.fail(function (err) {
    callback(err);
  });

  // 等价于
  ep.bind('error', function (err) {
    // 卸载掉所有handler
    ep.unbind();
    // 异常回调
    callback(err);
  });
</pre>
<p>throw的方法-抛出异常，throw 是 ep.emit('error', err) 的简写。</p>
<pre>
  /**
   * A shortcut of ep.emit('error', err)
   */
  EventProxy.prototype.throw = function () {
    var that = this;
    that.emit.apply(that, ['error'].concat(SLICE.call(arguments)));
  };
</pre>
<p>
  throw 是 ep.emit('error', err) 的简写。
</p>
<pre>
  var err = new Error();
  ep.throw(err);
  // 实际是
  ep.emit('error', err);
</pre>
<p>tail绑定事件</p>
<pre>
  /**
   * Assign some events, after all events were fired, the callback will be executed first time.
   * Then any event that predefined be fired again, the callback will executed with the newest data.
   * Examples:
   * ```js
   * proxy.tail(ev1, ev2, callback);
   * proxy.tail([ev1, ev2], callback);
   * proxy.tail(ev1, [ev2, ev3], callback);
   * ```
   * @param {String} eventname1 First event name.
   * @param {String} eventname2 Second event name.
   * @param {Function} callback Callback, that will be called after predefined events were fired.
   */
  EventProxy.prototype.tail = function () {
    var args = CONCAT.apply([], arguments);
    args.push(false);
    _assign.apply(this, args);
    return this;
  };
</pre>
<p>tail是绑定多个事件，和上面的all方法功能相同，唯一不同的是第四个参数，第四个参数如果为true的话，说明是
once绑定一次，否则的话为bind进行绑定事件；同样该方法也有别名；如下所示：
</p>
<pre>
  /**
   * `tail` alias, assignAll
   */
  EventProxy.prototype.assignAll = EventProxy.prototype.tail;
  /**
   * `tail` alias, assignAlways
   */
  EventProxy.prototype.assignAlways = EventProxy.prototype.tail;
</pre>
<p>下面还有几个方法自己看看哦~ 代码看不下去了，突然不想看了~ 呵呵~~</p>
