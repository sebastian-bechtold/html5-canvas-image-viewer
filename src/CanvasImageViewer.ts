import {Vec2d} from "../../Vec2d/Vec2d"

export class CanvasImageViewer {

    // Config:
    cfg_minZoom: number = 0.1;

    //###### BEGIN Resource members ######
    canvas: any = null;
    ctx: any = null;
    img: any = new Image();
    //###### END Resource members ######    

    //######## BEGIN State members ########
    mouseDown: boolean = false;
    imageLoaded: boolean = false;

    mouseDownOffset: Vec2d = new Vec2d(0, 0);
    viewOffset: Vec2d = new Vec2d(0, 0);

    targetZoom: number = 1;
    zoom: number = 1;
    //######## END State members ########


    init(canvasId, imageUrl) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.updateScale();

        //################# BEGIN Set Up Canvas Event Handlers ###################

        let me = this;

        this.canvas.addEventListener("dblclick", function (evt) {

            if (!me.imageLoaded) return;

            me.setTargetZoom(1);
            me.viewOffset = new Vec2d(-me.img.naturalWidth / 2, -me.img.naturalHeight / 2);

            // Prevent selecting/highlighting of the canvas:
            return false;
        });


        this.canvas.addEventListener("mousedown", function (evt) {

            if (!me.imageLoaded) return;

            me.mouseDown = true;

            me.canvas.style.pointer = "hand";

            let mouseDownPos = new Vec2d(evt.clientX, evt.clientY).mult(1.0 / me.zoom);

            me.mouseDownOffset = mouseDownPos.subtract(me.viewOffset);

            // Prevent selecting/highlighting of the canvas:
            return false;
        });


        this.canvas.addEventListener("mousemove", function (evt) {

            if (!me.imageLoaded) return;

            if (me.mouseDown) {

                let mousePos = new Vec2d(evt.clientX, evt.clientY).mult(1.0 / me.zoom);

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
            
            if (!me.imageLoaded) return;

            let delta = 0;
            
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
    }

    onImageLoaded = () => {

        this.imageLoaded = true;

        this.viewOffset = new Vec2d(-this.img.naturalWidth / 2, -this.img.naturalHeight / 2);

        window.requestAnimationFrame(this.draw);
    }

    setTargetZoom(zoom) {

        if (zoom < this.cfg_minZoom) {
            zoom = this.cfg_minZoom;
        }

        this.targetZoom = zoom;

        window.requestAnimationFrame(this.draw);
    }


    draw = () => {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let x = this.viewOffset.x * this.zoom + (this.canvas.width / 2);
        let y = this.viewOffset.y * this.zoom + (this.canvas.height / 2);

        let sizex = this.img.naturalWidth * this.zoom;
        let sizey = this.img.naturalHeight * this.zoom;

        this.ctx.drawImage(this.img, x, y, sizex, sizey);

        //############## BEGIN Update zoom level and request draw ################

        let diff = this.targetZoom - this.zoom;

        if (Math.abs(diff) > 0.001) {


            this.zoom += diff * 0.05;

            window.requestAnimationFrame(this.draw);
        }
        else {
            this.zoom = this.targetZoom;
        }
        //############## END Update zoom level and request draw ################
    }


    drawLoadingScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let fontSize = 30;

        this.ctx.font = fontSize + "px Arial";

        let text = "Bild wird geladen...";

        let width = this.ctx.measureText(text).width;

        this.ctx.fillText(text, this.canvas.width / 2 - width / 2, this.canvas.height / 2 - fontSize / 2);
    }

    loadImage(url) {

        this.imageLoaded = false;
        this.img.src = url;
        this.drawLoadingScreen();
    }

    updateScale() {

        if (this.canvas == null) return;

        let rect = this.canvas.getBoundingClientRect();

        this.ctx.canvas.width = rect.width;
        this.ctx.canvas.height = rect.height;

        console.log("Resize!");

        //this.setTargetZoom(1);
        this.viewOffset = new Vec2d(-this.img.naturalWidth / 2, -this.img.naturalHeight / 2);

        this.draw();
    }
}

