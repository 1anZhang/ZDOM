/**
 * 轻量级类jQuery库，实现部分dom选择功能。
 * 
 * 
 * Todo
 * dom('li', 'ul').html()
 * dom(<ul><li>Hello World!</li></ul>).html()
 *
 * 
**/

(function(win){
  const global = win;
  const doc = this.document;

  const dom = function(params, context) {
    return new GetOrMakeDom(params, context);
  }

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
  }

  global.dom = dom;
  dom.fn = GetOrMakeDom.prototype;
})(window);