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

  
})(window);
