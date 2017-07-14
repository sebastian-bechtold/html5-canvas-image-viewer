var AppBundle = (function () {
  var main = null;
  var modules = {
      "require": {
          factory: undefined,
          dependencies: [],
          exports: function (args, callback) { return require(args, callback); },
          resolved: true
      }
  };
  function define(id, dependencies, factory) {
      return main = modules[id] = {
          dependencies: dependencies,
          factory: factory,
          exports: {},
          resolved: false
      };
  }
  function resolve(definition) {
      if (definition.resolved === true)
          return;
      definition.resolved = true;
      var dependencies = definition.dependencies.map(function (id) {
          return (id === "exports")
              ? definition.exports
              : (function () {
                  if(modules[id] !== undefined) {
                    resolve(modules[id]);
                    return modules[id].exports;
                  } else return require(id)
              })();
      });
      definition.factory.apply(null, dependencies);
  }
  function collect() {
      Object.keys(modules).map(function (key) { return modules[key]; }).forEach(resolve);
      return (main !== null) 
        ? main.exports
        : undefined
  }

  define("Vec2d/Vec2d", ["require", "exports"], function (require, exports) {
      "use strict";
      exports.__esModule = true;
      var Vec2d = (function () {
          function Vec2d(x, y) {
              this.x = 0;
              this.y = 0;
              this.x = x;
              this.y = y;
          }
          Vec2d.prototype.add = function (v) {
              return new Vec2d(this.x + v.x, this.y + v.y);
          };
          Vec2d.prototype.copy = function () {
              return new Vec2d(this.x, this.y);
          };
          Vec2d.prototype.mult = function (scalar) {
              return new Vec2d(this.x * scalar, this.y * scalar);
          };
          Vec2d.prototype.subtract = function (v) {
              return new Vec2d(this.x - v.x, this.y - v.y);
          };
          Vec2d.prototype.toString = function () {
              return "(" + this.x + ", " + this.y + ")";
          };
          return Vec2d;
      }());
      exports.Vec2d = Vec2d;
  });
  define("CanvasImageViewer/src/CanvasImageViewer", ["require", "exports", "Vec2d/Vec2d"], function (require, exports, Vec2d_1) {
      "use strict";
      exports.__esModule = true;
      var CanvasImageViewer = (function () {
          function CanvasImageViewer() {
              var _this = this;
              // Config:
              this.cfg_minZoom = 0.1;
              //###### BEGIN Resource members ######
              this.canvas = null;
              this.ctx = null;
              this.img = new Image();
              //###### END Resource members ######    
              //######## BEGIN State members ########
              this.mouseDown = false;
              this.imageLoaded = false;
              this.mouseDownOffset = new Vec2d_1.Vec2d(0, 0);
              this.viewOffset = new Vec2d_1.Vec2d(0, 0);
              this.targetZoom = 1;
              this.zoom = 1;
              this.onImageLoaded = function () {
                  _this.imageLoaded = true;
                  _this.viewOffset = new Vec2d_1.Vec2d(-_this.img.naturalWidth / 2, -_this.img.naturalHeight / 2);
                  window.requestAnimationFrame(_this.draw);
              };
              this.draw = function () {
                  _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
                  var x = _this.viewOffset.x * _this.zoom + (_this.canvas.width / 2);
                  var y = _this.viewOffset.y * _this.zoom + (_this.canvas.height / 2);
                  var sizex = _this.img.naturalWidth * _this.zoom;
                  var sizey = _this.img.naturalHeight * _this.zoom;
                  _this.ctx.drawImage(_this.img, x, y, sizex, sizey);
                  //############## BEGIN Update zoom level and request draw ################
                  var diff = _this.targetZoom - _this.zoom;
                  if (Math.abs(diff) > 0.001) {
                      _this.zoom += diff * 0.05;
                      window.requestAnimationFrame(_this.draw);
                  }
                  else {
                      _this.zoom = _this.targetZoom;
                  }
                  //############## END Update zoom level and request draw ################
              };
          }
          //######## END State members ########
          CanvasImageViewer.prototype.init = function (canvasId, imageUrl) {
              this.canvas = document.getElementById(canvasId);
              this.ctx = this.canvas.getContext("2d");
              this.updateScale();
              //################# BEGIN Set Up Canvas Event Handlers ###################
              var me = this;
              this.canvas.addEventListener("dblclick", function (evt) {
                  if (!me.imageLoaded)
                      return;
                  me.setTargetZoom(1);
                  me.viewOffset = new Vec2d_1.Vec2d(-me.img.naturalWidth / 2, -me.img.naturalHeight / 2);
                  // Prevent selecting/highlighting of the canvas:
                  return false;
              });
              this.canvas.addEventListener("mousedown", function (evt) {
                  if (!me.imageLoaded)
                      return;
                  me.mouseDown = true;
                  me.canvas.style.pointer = "hand";
                  var mouseDownPos = new Vec2d_1.Vec2d(evt.clientX, evt.clientY).mult(1.0 / me.zoom);
                  me.mouseDownOffset = mouseDownPos.subtract(me.viewOffset);
                  // Prevent selecting/highlighting of the canvas:
                  return false;
              });
              this.canvas.addEventListener("mousemove", function (evt) {
                  if (!me.imageLoaded)
                      return;
                  if (me.mouseDown) {
                      var mousePos = new Vec2d_1.Vec2d(evt.clientX, evt.clientY).mult(1.0 / me.zoom);
                      me.viewOffset = mousePos.subtract(me.mouseDownOffset);
                      window.requestAnimationFrame(me.draw);
                  }
              });
              this.canvas.addEventListener("mouseout", function (evt) {
                  me.mouseDown = false;
              });
              this.canvas.addEventListener("mouseup", function (evt) {
                  me.mouseDown = false;
              });
              // NOTE: "wheel" is standard, "mousewheel" is not!
              this.canvas.addEventListener("wheel", function (evt) {
                  if (!me.imageLoaded)
                      return;
                  var delta = 0;
                  if (typeof evt.deltaY === 'undefined') {
                      delta = -evt.wheelDelta;
                  }
                  else {
                      delta = evt.deltaY;
                  }
                  if (delta < 0) {
                      me.setTargetZoom(me.zoom * 2);
                  }
                  else {
                      me.setTargetZoom(me.zoom / 2);
                  }
                  // Prevent selecting/highlighting of the canvas:
                  return false;
              });
              //################# END Set Up Canvas Event Handlers ################### 
              this.img.addEventListener("load", this.onImageLoaded);
              this.loadImage(imageUrl);
          };
          CanvasImageViewer.prototype.setTargetZoom = function (zoom) {
              if (zoom < this.cfg_minZoom) {
                  zoom = this.cfg_minZoom;
              }
              this.targetZoom = zoom;
              window.requestAnimationFrame(this.draw);
          };
          CanvasImageViewer.prototype.drawLoadingScreen = function () {
              this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
              var fontSize = 30;
              this.ctx.font = fontSize + "px Arial";
              var text = "Bild wird geladen...";
              var width = this.ctx.measureText(text).width;
              this.ctx.fillText(text, this.canvas.width / 2 - width / 2, this.canvas.height / 2 - fontSize / 2);
          };
          CanvasImageViewer.prototype.loadImage = function (url) {
              this.imageLoaded = false;
              this.img.src = url;
              this.drawLoadingScreen();
          };
          CanvasImageViewer.prototype.updateScale = function () {
              if (this.canvas == null)
                  return;
              var rect = this.canvas.getBoundingClientRect();
              this.ctx.canvas.width = rect.width;
              this.ctx.canvas.height = rect.height;
              console.log("Resize!");
              //this.setTargetZoom(1);
              this.viewOffset = new Vec2d_1.Vec2d(-this.img.naturalWidth / 2, -this.img.naturalHeight / 2);
              this.draw();
          };
          return CanvasImageViewer;
      }());
      exports.CanvasImageViewer = CanvasImageViewer;
  });
  define("CanvasImageViewer/test/scripts/main", ["require", "exports", "CanvasImageViewer/src/CanvasImageViewer"], function (require, exports, CanvasImageViewer_1) {
      "use strict";
      exports.__esModule = true;
      var viewer = new CanvasImageViewer_1.CanvasImageViewer();
      viewer.init("canvas", "radio.jpg");
  });
  
  return collect(); 
})();