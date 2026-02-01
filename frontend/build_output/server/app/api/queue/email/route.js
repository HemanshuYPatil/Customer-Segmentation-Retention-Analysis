"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/queue/email/route";
exports.ids = ["app/api/queue/email/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tty");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "node:async_hooks":
/*!***********************************!*\
  !*** external "node:async_hooks" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:async_hooks");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fqueue%2Femail%2Froute&page=%2Fapi%2Fqueue%2Femail%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Femail%2Froute.ts&appDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fqueue%2Femail%2Froute&page=%2Fapi%2Fqueue%2Femail%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Femail%2Froute.ts&appDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Data_Science_Project_Customer_Segmentation_Retention_Analysis_frontend_app_api_queue_email_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/queue/email/route.ts */ \"(rsc)/./app/api/queue/email/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/queue/email/route\",\n        pathname: \"/api/queue/email\",\n        filename: \"route\",\n        bundlePath: \"app/api/queue/email/route\"\n    },\n    resolvedPagePath: \"C:\\\\Data-Science-Project\\\\Customer-Segmentation-Retention-Analysis\\\\frontend\\\\app\\\\api\\\\queue\\\\email\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Data_Science_Project_Customer_Segmentation_Retention_Analysis_frontend_app_api_queue_email_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/queue/email/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZxdWV1ZSUyRmVtYWlsJTJGcm91dGUmcGFnZT0lMkZhcGklMkZxdWV1ZSUyRmVtYWlsJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGcXVldWUlMkZlbWFpbCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDRGF0YS1TY2llbmNlLVByb2plY3QlNUNDdXN0b21lci1TZWdtZW50YXRpb24tUmV0ZW50aW9uLUFuYWx5c2lzJTVDZnJvbnRlbmQlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNEYXRhLVNjaWVuY2UtUHJvamVjdCU1Q0N1c3RvbWVyLVNlZ21lbnRhdGlvbi1SZXRlbnRpb24tQW5hbHlzaXMlNUNmcm9udGVuZCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDOEQ7QUFDM0k7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jc3ItZnJvbnRlbmQvPzk5ZjQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcRGF0YS1TY2llbmNlLVByb2plY3RcXFxcQ3VzdG9tZXItU2VnbWVudGF0aW9uLVJldGVudGlvbi1BbmFseXNpc1xcXFxmcm9udGVuZFxcXFxhcHBcXFxcYXBpXFxcXHF1ZXVlXFxcXGVtYWlsXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9xdWV1ZS9lbWFpbC9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3F1ZXVlL2VtYWlsXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9xdWV1ZS9lbWFpbC9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXERhdGEtU2NpZW5jZS1Qcm9qZWN0XFxcXEN1c3RvbWVyLVNlZ21lbnRhdGlvbi1SZXRlbnRpb24tQW5hbHlzaXNcXFxcZnJvbnRlbmRcXFxcYXBwXFxcXGFwaVxcXFxxdWV1ZVxcXFxlbWFpbFxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvcXVldWUvZW1haWwvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fqueue%2Femail%2Froute&page=%2Fapi%2Fqueue%2Femail%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Femail%2Froute.ts&appDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/queue/email/route.ts":
/*!**************************************!*\
  !*** ./app/api/queue/email/route.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _inngest_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/inngest/client */ \"(rsc)/./inngest/client.ts\");\n\n\nasync function POST(request) {\n    const payload = await request.json();\n    await _inngest_client__WEBPACK_IMPORTED_MODULE_1__.inngest.send({\n        name: \"email.send\",\n        data: {\n            to_email: payload.to_email,\n            subject: payload.subject,\n            html: payload.html,\n            text: payload.text,\n            metadata: payload.metadata ?? {}\n        },\n        id: payload.event_id\n    });\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        status: \"queued\"\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3F1ZXVlL2VtYWlsL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUF3RDtBQUNiO0FBRXBDLGVBQWVFLEtBQUtDLE9BQW9CO0lBQzdDLE1BQU1DLFVBQVUsTUFBTUQsUUFBUUUsSUFBSTtJQUNsQyxNQUFNSixvREFBT0EsQ0FBQ0ssSUFBSSxDQUFDO1FBQ2pCQyxNQUFNO1FBQ05DLE1BQU07WUFDSkMsVUFBVUwsUUFBUUssUUFBUTtZQUMxQkMsU0FBU04sUUFBUU0sT0FBTztZQUN4QkMsTUFBTVAsUUFBUU8sSUFBSTtZQUNsQkMsTUFBTVIsUUFBUVEsSUFBSTtZQUNsQkMsVUFBVVQsUUFBUVMsUUFBUSxJQUFJLENBQUM7UUFDakM7UUFDQUMsSUFBSVYsUUFBUVcsUUFBUTtJQUN0QjtJQUNBLE9BQU9mLHFEQUFZQSxDQUFDSyxJQUFJLENBQUM7UUFBRVcsUUFBUTtJQUFTO0FBQzlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY3NyLWZyb250ZW5kLy4vYXBwL2FwaS9xdWV1ZS9lbWFpbC9yb3V0ZS50cz83MWU1Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCB7IGlubmdlc3QgfSBmcm9tIFwiQC9pbm5nZXN0L2NsaWVudFwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBOZXh0UmVxdWVzdCkge1xuICBjb25zdCBwYXlsb2FkID0gYXdhaXQgcmVxdWVzdC5qc29uKCk7XG4gIGF3YWl0IGlubmdlc3Quc2VuZCh7XG4gICAgbmFtZTogXCJlbWFpbC5zZW5kXCIsXG4gICAgZGF0YToge1xuICAgICAgdG9fZW1haWw6IHBheWxvYWQudG9fZW1haWwsXG4gICAgICBzdWJqZWN0OiBwYXlsb2FkLnN1YmplY3QsXG4gICAgICBodG1sOiBwYXlsb2FkLmh0bWwsXG4gICAgICB0ZXh0OiBwYXlsb2FkLnRleHQsXG4gICAgICBtZXRhZGF0YTogcGF5bG9hZC5tZXRhZGF0YSA/PyB7fVxuICAgIH0sXG4gICAgaWQ6IHBheWxvYWQuZXZlbnRfaWRcbiAgfSk7XG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHN0YXR1czogXCJxdWV1ZWRcIiB9KTtcbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJpbm5nZXN0IiwiUE9TVCIsInJlcXVlc3QiLCJwYXlsb2FkIiwianNvbiIsInNlbmQiLCJuYW1lIiwiZGF0YSIsInRvX2VtYWlsIiwic3ViamVjdCIsImh0bWwiLCJ0ZXh0IiwibWV0YWRhdGEiLCJpZCIsImV2ZW50X2lkIiwic3RhdHVzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/queue/email/route.ts\n");

/***/ }),

/***/ "(rsc)/./inngest/client.ts":
/*!***************************!*\
  !*** ./inngest/client.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   inngest: () => (/* binding */ inngest)\n/* harmony export */ });\n/* harmony import */ var inngest__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! inngest */ \"(rsc)/./node_modules/inngest/components/Inngest.js\");\n\nconst inngest = new inngest__WEBPACK_IMPORTED_MODULE_0__.Inngest({\n    id: \"csr-frontend\"\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9pbm5nZXN0L2NsaWVudC50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUFrQztBQUUzQixNQUFNQyxVQUFVLElBQUlELDRDQUFPQSxDQUFDO0lBQUVFLElBQUk7QUFBZSxHQUFHIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY3NyLWZyb250ZW5kLy4vaW5uZ2VzdC9jbGllbnQudHM/NmUwOSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbm5nZXN0IH0gZnJvbSBcImlubmdlc3RcIjtcblxuZXhwb3J0IGNvbnN0IGlubmdlc3QgPSBuZXcgSW5uZ2VzdCh7IGlkOiBcImNzci1mcm9udGVuZFwiIH0pO1xuIl0sIm5hbWVzIjpbIklubmdlc3QiLCJpbm5nZXN0IiwiaWQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./inngest/client.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry","vendor-chunks/inngest","vendor-chunks/zod","vendor-chunks/hash.js","vendor-chunks/color-convert","vendor-chunks/debug","vendor-chunks/@inngest","vendor-chunks/chalk","vendor-chunks/color-name","vendor-chunks/ansi-styles","vendor-chunks/serialize-error-cjs","vendor-chunks/ms","vendor-chunks/supports-color","vendor-chunks/inherits","vendor-chunks/json-stringify-safe","vendor-chunks/canonicalize","vendor-chunks/has-flag","vendor-chunks/minimalistic-assert"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fqueue%2Femail%2Froute&page=%2Fapi%2Fqueue%2Femail%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Femail%2Froute.ts&appDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CData-Science-Project%5CCustomer-Segmentation-Retention-Analysis%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();