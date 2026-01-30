"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/canonicalize";
exports.ids = ["vendor-chunks/canonicalize"];
exports.modules = {

/***/ "(rsc)/./node_modules/canonicalize/lib/canonicalize.js":
/*!*******************************************************!*\
  !*** ./node_modules/canonicalize/lib/canonicalize.js ***!
  \*******************************************************/
/***/ ((module) => {

eval("/* jshint esversion: 6 */\n/* jslint node: true */\n\n\nmodule.exports = function serialize (object) {\n  if (object === null || typeof object !== 'object' || object.toJSON != null) {\n    return JSON.stringify(object);\n  }\n\n  if (Array.isArray(object)) {\n    return '[' + object.reduce((t, cv, ci) => {\n      const comma = ci === 0 ? '' : ',';\n      const value = cv === undefined || typeof cv === 'symbol' ? null : cv;\n      return t + comma + serialize(value);\n    }, '') + ']';\n  }\n\n  return '{' + Object.keys(object).sort().reduce((t, cv, ci) => {\n    if (object[cv] === undefined ||\n        typeof object[cv] === 'symbol') {\n      return t;\n    }\n    const comma = t.length === 0 ? '' : ',';\n    return t + comma + serialize(cv) + ':' + serialize(object[cv]);\n  }, '') + '}';\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvY2Fub25pY2FsaXplL2xpYi9jYW5vbmljYWxpemUuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNhOztBQUViO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUcsVUFBVTtBQUNiIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY3NyLWZyb250ZW5kLy4vbm9kZV9tb2R1bGVzL2Nhbm9uaWNhbGl6ZS9saWIvY2Fub25pY2FsaXplLmpzPzU5MzYiXSwic291cmNlc0NvbnRlbnQiOlsiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuLyoganNsaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzZXJpYWxpemUgKG9iamVjdCkge1xuICBpZiAob2JqZWN0ID09PSBudWxsIHx8IHR5cGVvZiBvYmplY3QgIT09ICdvYmplY3QnIHx8IG9iamVjdC50b0pTT04gIT0gbnVsbCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmplY3QpO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0KSkge1xuICAgIHJldHVybiAnWycgKyBvYmplY3QucmVkdWNlKCh0LCBjdiwgY2kpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hID0gY2kgPT09IDAgPyAnJyA6ICcsJztcbiAgICAgIGNvbnN0IHZhbHVlID0gY3YgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgY3YgPT09ICdzeW1ib2wnID8gbnVsbCA6IGN2O1xuICAgICAgcmV0dXJuIHQgKyBjb21tYSArIHNlcmlhbGl6ZSh2YWx1ZSk7XG4gICAgfSwgJycpICsgJ10nO1xuICB9XG5cbiAgcmV0dXJuICd7JyArIE9iamVjdC5rZXlzKG9iamVjdCkuc29ydCgpLnJlZHVjZSgodCwgY3YsIGNpKSA9PiB7XG4gICAgaWYgKG9iamVjdFtjdl0gPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICB0eXBlb2Ygb2JqZWN0W2N2XSA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgIHJldHVybiB0O1xuICAgIH1cbiAgICBjb25zdCBjb21tYSA9IHQubGVuZ3RoID09PSAwID8gJycgOiAnLCc7XG4gICAgcmV0dXJuIHQgKyBjb21tYSArIHNlcmlhbGl6ZShjdikgKyAnOicgKyBzZXJpYWxpemUob2JqZWN0W2N2XSk7XG4gIH0sICcnKSArICd9Jztcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/canonicalize/lib/canonicalize.js\n");

/***/ })

};
;