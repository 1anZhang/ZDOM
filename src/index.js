/**
 * 轻量级类jQuery库，实现部分dom选择功能。
 *
 * elements可以接收参数的类型
 * CSS选择器字符串 zdom('body')
 * HTML字符串 zdom('<p>Hello<span>World!</span></p>')
 * Element节点 zdom(document.body)
 * 元素节点数组 zdom([document.body])
 * NodeList zdom(document.body.children)
 * HTMLCollection zdom(document.all)
 * zdom()对象自身 zdom(zdom())
 *
 **/

(function(win) {
  const global = win;
  const doc = this.document;

  const zdom = function(elements, context) {
    return new Zdom(elements, context);
  };

  // 判断参数是否是一个HTML字符串
  const regXContainsTag = /^\s*<(\w+|!)[^>]*>/;

  const Zdom = function(elements, context) {
    let d = doc;
    if (context && context.nodeType) {
      // 这是一个Element
      if (context.nodeType === 1) {
        d = context.ownerDocument;
      } else {
        d = context.body.ownerDocument;
      }
    }

    // 如果没有传入elements， 返回html元素
    if (!elements) {
      this.length = 1;
      this[0] = d.documentElement;
      return this;
    }

    // 如果是HTML字符串，构造文档片段，填好对象，然后返回
    if (
      typeof elements === 'string' &&
      elements.charAt(0) === '<' &&
      elements.charAt(elements.length - 1) === '>' &&
      elements.length >= 3
    ) {
      const divElm = d.createElement('div');
      divElm.className = 'hippo-doc-frag-wrapper';
      const docFrag = d.createDocumentFragment();
      docFrag.appendChild(divElm);
      const queryDiv = docFrag.querySelector('div');
      queryDiv.innerHTML = elements;
      const numberOfChildren = queryDiv.children.length;
      // 遍历节点并填充对象，因为HTML字符串可能包含多个兄弟节点
      for (let i = 0; i < numberOfChildren; i++) {
        this[i] = queryDiv.children[i];
      }
      this.length = numberOfChildren;
      return this;
    }

    //如果传入的单个节点引用，填好对象，返回
    if (typeof elements === 'object' && elements.nodeName) {
      this.length = 1;
      this[0] = elements;
      return this;
    }

    // 如果是个字符串，那么应该是选择器字符串了,如果不是，那应该就是NodeList或者HTMLCollection或zdom对象。
    let nodes;

    if (typeof elements !== 'string') {
      nodes = elements;
    } else {
      if (typeof context === 'string' && d.querySelectorAll(context)[0] === undefined) {
        // 定义了context但是找不到，那肯定就没东西咯
        nodes = [];
      } else {
        // 如果定义的context存在，那么在该context下查找，否则在document下查找
        nodes = (typeof context === 'string' ? d.querySelectorAll(context)[0] : d).querySelectorAll(
          elements.trim(),
        );
      }
    }
    const nodeLength = nodes.length;
    for (let i = 0; i < nodeLength; i++) {
      this[i] = nodes[i];
    }
    this.length = nodeLength;
    return this;
  };

  // 给全局作用域添加zdom对象，如果$没有被占用，那么绑定到$上
  global.zdom = zdom;
  if (!('$' in global)) {
    global.$ = zdom;
  }

  // 设置prototype的简写，并定义constructor
  zdom.fn = Zdom.prototype = {
    constructor: zdom,
  };

  /**
   * 定义在原型上的各种实用函数
   */
  zdom.fn.html = function(htmlStringOrTextString) {
    if (htmlStringOrTextString) {
      return this.each(function() {
        this.innerHTML = htmlStringOrTextString;
      });
    } else {
      return this[0].innerHTML;
    }
  };

  zdom.fn.text = function(textString) {
    if (textString) {
      return this.each(function() {
        this.textContent = textString;
      });
    } else {
      return this[0].textContent.trim();
    }
  };

  // todo zdom.fn.append()
  zdom.fn.append = function(stringOrObject) {
    return this.each(function() {
      if (typeof stringOrObject === 'string') {
        this.insertAdjacentHTML('beforeend', stringOrObject);
      } else {
        zdom(stringOrObject).each(function(index, value) {
          this.insertAdjacentHTML('beforeend', value.outerHTML);
        });
      }
    });
  };

  /**
   * -----------------------------------------------------------
   * utilities for zdom
   * 提供一些实用的工具和属性, 添加在zdom上, 是静态属性和方法
   * -----------------------------------------------------------
   */

  /**
   * 返回当前zdom库的版本
   * @property version
   * @static
   * @type String
   * @return {string}
   */
  zdom.version = '0.1';

  /**
   * 遍历函数
   * @method each
   * @static
   * @param objectOrArray {Object|Array}
   * @param callback {Function}
   * @return {Object|Array} returns the Object or Array passed in
   */
  zdom.each = function(objectOrArray, callback) {
    const len = objectOrArray.length;
    // 没有length属性，就遍历对象的每个属性
    if (len === undefined) {
      for (let name in objectOrArray) {
        if (callback.call(objectOrArray[name], name, objectOrArray[name]) === false) {
          break;
        }
      }
    } else {
      for (let i = 0; i < len; i++) {
        // 执行回调函数，并设置它的this为当前元素，传递相应参数
        if (callback.call(this[i], i, this[i]) === false) {
          break;
        }
      }
    }
    // 返回Zdom对象供链式调用
    return objectOrArray;
  };

  /**
   * 返回当前参数的类型 'string'|'number'|'null'|'undefined'|'object'|'array'|'symbol'|'boolean'
   * @method type
   * @static
   * @param value {any}
   * @return {'string'|'number'|'null'|'undefined'|'object'|'array'|'symbol'|'boolean'}
   */
  zdom.type = function(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    let ret = Object.prototype.toString.call(value).match(/^\[object\s+(\w+)\]$/)[1];
    ret = ret ? ret.toLowerCase() : '';
    if (ret === 'number' && isNaN(value)) {
      ret = 'NaN';
    }
    return ret;
  };

  /**
   * 判断是不是Array
   * @method isArray
   * @static
   * @param value {object}
   * @return {Boolean}
   */
  zdom.isArray =
    Array.isArray ||
    function(value) {
      return zdom.type(value) === 'array';
    };

  /**
   * 判断是不是Function
   * @method isFunction
   * @static
   * @param value {object}
   * @return {Boolean}
   */
  zdom.isFunction = function(value) {
    return zdom.type(value) === 'function';
  };

  /**
   * 判断给定字符串能否选中该node
   * @method matchesSelector
   * @static
   * @param node {Node}
   * @param selector {String}
   * @return {Boolean}
   */
  zdom.matchesSelector = function(node, selector) {
    const d = doc.body;
    return (
      doc.matchesSelector ||
      d.mozMatchesSelector ||
      d.webkitMatchesSelector ||
      d.oMatchesSelector ||
      d.msMatchesSelector
    ).call(node, selector);
  };

  /**
   * -命名转驼峰命名
   * @method camelCaseDashs
   * @static
   * @param value {String}
   * @return {String}
   */
  zdom.camelCaseDashs = function(value) {
    return value.replace(/-([\da-z])/gi, function(match, letter) {
      return (letter + '').toUpperCase(); 
    });
  };

  /**
   * -----------------------------------------------------------
   * core methods
   * 定义在原型上，操作zdom对象的核心方法
   * -----------------------------------------------------------
   */

  /**
   * 判断zdom对象是否是对应节点或者满足匹配
   * @method is
   * @param selectorOrNode {String|Ojbect} 
   * @returns {Boolean}
   */

   zdom.fn.is = function(selectorOrNode) {
    let check = true;
    this.each(function(index, value) {
      if(selectorOrNode.nodeValue) {
        if(value === selectorOrNode) {
          check = false;
          return
        }
      } else {
        if(!zdom.matchesSelector(value, selectorOrNode)) {
          check = false;
          return
        }
      }
    });
    return check;
   }

  /**
   * 判断zdom对象是否为空
   * @method isEmpty
   * @param {String|Ojbect} 选择器或者元素节点
   * @returns {Boolean}
   */
  zdom.fn.isEmpty = function(){
    let check = true;
    this.each(function(index, value) {
      if(this.innerHTML.trim() !== '') {
        check = false;
        return
      }
    });
    return check;
  };

  /**
   * 返回查找元素的index, 查找到的第一个
   * @method index
   * @param {String|Ojbect} 选择器或者元素节点
   * @returns {Number}
   */
  zdom.fn.index = function(selectorOrNode) {
    let index = -1;
    this.each(function(i, value) {
      if (typeof selectorOrNode === 'string') {
        if(zdom.matchesSelector(value, selectorOrNode)) {
          index = i;
          return false;
        }
      } else {
        if(this === selectorOrNode) {
          index = i;
          return false;
        }
      }
    });
    return index;
  }

  /**
   * 返回查找元素的index, 查找到的最后一个
   * @method lastIndex
   * @param {String|Ojbect} 选择器或者元素节点
   * @returns {Number}
   */
  zdom.fn.lastIndex = function(selectorOrNode) {
    let fromStart = this.reverse().index(selectorOrNode);
    if (fromStart === -1) {
      return -1;
    } else {
      return (this.length - 1) - fromStart;
    }
  }

  /**
   * 查找当前节点之前兄弟节点数量
   * @method previousSiblingNum
   * @returns {Number}
   */
  zdom.fn.previousSiblingNum = function() {
    if(this[0] === undefined) return -1;
    let index = 0;
    let element = this[0];
    while(element && (element = element.perviousElementSibling)) {
      index++;
    }
    return index;
  }

  /**
   * 查找是否拥有该节点
   * @method has
   * @param {String|Node}
   * @returns {Boolean}
   */
  zdom.fn.has = function(selectorOrNode) {
    let check = false;
    this.each(function(index, value) {
      if(typeof selectorOrNode === 'string' ? this.parentNode.querySelectorAll(selectorOrNode).length === 1 : this.parentNode.contains(selectorOrNode)) {
        check = true;
        return false;
      }
    });
    return check;
  }

  /**
   * 返回数组长度
   * @method total
   * @returns {Number}
   */
  zdom.fn.total = function() {
    return this.length;
  }

  /**
   * 将zdom转换成数组
   * @method toArray
   * @returns {Array}
   */
  zdom.fn.toArrAy = function() {
    return [].slice.call(this);
  }

  /**
   * 根据索引返回元素
   * @method get
   * @param {Number}
   * @return {Node}
   */
  zdom.fn.get = function(index) {
    return index === undefined ? this[0] : this[index];
  }

  // 下面这些方法会返回zdom对象，所以可以链式调用

  /**
   * 翻转zdom
   * @method reverse
   * @returns {Object}
   */
  zdom.fn.reverse = function() {
    return zdom(this.toArrAy().reverse());
  }

  /**
   * @method each
   * @return {Ojbect}
   */
  zdom.fn.each = function(callback) {
    return zdom.each(this, callback);
  }
  

})(window);
