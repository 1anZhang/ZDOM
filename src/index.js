/**
 * 轻量级类jQuery库，实现部分dom选择功能。
 * 
 * params可以接收参数的类型
 * CSS选择器字符串 zdom('body')
 * HTML字符串 zdom('<p>Hello<span>World!</span></p>')
 * Element节点 zdom(document.body)
 * 元素节点数组 zdom([document.body])
 * NodeList zdom(document.body.children)
 * HTMLCollection zdom(document.all)
 * zdom()对象自身 zdom(zdom())
 * 
**/

(function(win){
  const global = win;
  const doc = this.document;

  const zdom = function(params, context) {
    return new GetOrMakeDom(params, context);
  }

  // 判断参数是否是一个HTML字符串
  const regXContainsTag = /^\s*<(\w+|!)[^>]*>/;

  const GetOrMakeDom = function(params, context) {
    const currentContext = doc;
    if(context) {
      // 他是个文档节点或元素节点
      if(context.nodeType){
        currentContext = context;
      } else {
        currentContext = document.querySelector(context);
      }
    }

    // 如果没有传入params， 返回空的zdom()对象
    if(!params || params === '' ||
        typeof params === 'string' && params.trim() === '') {
      this.length = 0;
      return this;
    }

    // 如果是HTML字符串，构造文档片段，填好对象，然后返回
    if(typeof params === 'string' && regXContainsTag.test(params)) {
      const divElm = currentContext.createElement('div');
      divElm.className = 'hippo-doc-frag-wrapper';
      const docFrag = currentContext.createDocumentFragment();
      docFrag.appendChild(divElm);
      const queryDiv = docFrag.querySelector('div');
      queryDiv.innerHTML = params;
      const numberOfChildren = queryDiv.children.length;
      // 遍历节点并填充对象，因为HTML字符串可能包含多个兄弟节点
      for (let i = 0; i < numberOfChildren; i++) {
        this[i] = queryDiv.children[i]
      }
      this.length = numberOfChildren;
      return this;
    }

    //如果传入的单个节点引用，填好对象，返回
    if(typeof params === 'object' && params.nodeName) {
      this.length = 1;
      this[0] = params;
      return this;
    }

    // 如果是个字符串，那么应该是选择器字符串了,如果不是，那应该就是NodeList或者HTMLCollection或zdom对象。
    let nodes;

    if(typeof params !== 'string') {
      nodes = params;
    } else {
      nodes = currentContext.querySelectorAll(params.trim())
    }
    const nodeLength = nodes.length;
    for (let i = 0; i < nodeLength; i++) {
      this[i] = nodes[i]
    }
    this.length = nodeLength;
    return this;
  }


  global.zdom = zdom;
  zdom.fn = GetOrMakeDom.prototype;

  zdom.fn.each = function (callback) {
    const len = this.length;
    for(let i = 0; i < len; i++) {
      // 执行回调函数，并设置它的this为当前元素，传递相应参数
      callback.call(this[i], i, this[i])
    }
    // 返回GetOrMakeObject对象供链式调用
    return this;
  }

  zdom.fn.html() = function(htmlStringOrTextString) {
    if(htmlStringOrTextString) {
      return this.each(function() {
        this.innerHTML = htmlStringOrTextString
      });
    } else {
      return this[0].innerHTML;
    }
  }


  zdom.fn.text() = function(textString) {
    if(textString) {
      return this.each(function() {
        this.textContent = textString;
      });
    } else {
      return this[0].textContent.trim();
    }
  }

  // todo zdom.fn.append()
  zdom.fn.append = function(stringOrObject) {
    return this.each(function() {
      if (typeof stringOrObject === 'string') {
        this.insertAdjacentHTML('beforeend', stringOrObject);
      } else {
        zdom(stringOrObject).each(function(index, value) {
          this.insertAdjacentHTML('beforeend', value.outerHTML);
        })
      }
    })
  }

})(window);
