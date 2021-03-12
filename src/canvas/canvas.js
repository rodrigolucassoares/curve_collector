import * as THREE from 'three'
import * as dat from 'dat.gui'
import collector from '../curves/curveCollector'
import curve from '../curves/curve'
import Line from '../curves/line'
import model from '../model/model'
import {GLCanvas} from './GLCanvas'
import {CurveTypes} from '../curves/CurveTypes'
import { DoubleSide, SrcAlphaSaturateFactor } from 'three'
import Grid from './grid'
import {io} from 'socket.io-client'
import line from '../curves/line'


class canvas {
    constructor(){
        //create canvas
        this.canvas = document.getElementById( 'canvas' );
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        //create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xffffff );
        //create camera
        this.top = (this.height/2)/20;
        this.bottom = - (this.height/2)/20;
        this.left = -(this.width/2)/20;
        this.right = (this.width/2)/20;
        this.camera = new THREE.OrthographicCamera(this.left, this.right,
            this.top, this.bottom,1,1000);
        this.camera.position.set( 0, 0, 1 );
        this.camera.lookAt(0,0,0);
        //gui
        const theme = {
            color: 0xffffff
        };
        
        //create renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(theme.color);
        this.canvas.append(this.renderer.domElement);
       
        //collector 
        this.collector = new collector();

        this.curMouseAction = null;

        this.gridOn = true;
        this.gridObj = new Grid();
        this.gridDisplay = null;
        this.planeObject = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.pt0 = null;
        this.pt1 = null;

        this.mouseButton = null;
        this.mouseMoveTol = 0.1;
        this.pickTolFac = 0.01;

        this.curves = [];

        this.fence = null;

        this.model = new model();
        
        this.displayCurves = new THREE.Mesh();

        //socket object
        this.socket = io("http://localhost:8080");
    }

    socketListeners(){
        //socket listeners

        this.socket.on("connect", () => {
            alert("Connected");
        });

        this.socket.on("insert-curve", (curve) => {
            var line = new Line(curve.x1, curve.y1, curve.x2, curve.y2);
            line.selected = curve.selected;
            this.model.curves.push(line);
            this.render();
        });
        
        this.socket.on('room-created', (token)=>{
            alert(`Share this room token with others: ${token}`);
        });

        this.socket.on('room-joined', (token)=>{
            alert(`Joined to room: ${token}`);
        });

        this.socket.on('user-joined', (token)=>{
            alert(`The user ${token} joined to your room`);
        });
        
        this.socket.on("user-disconnected", (id) => {
            alert(`The user: ${id} disconnected from your room`);
        });

        this.socket.on('room-disconnected', ()=>{
            alert('The room has been disconnect');
        })

        this.socket.on("disconnect", (reason) => {
            alert(`disconnected, reason: ${reason}`);
        });

        this.socket.on('error', (e)=>{
            alert(`ERROR: ${e}`);
        })
    }

    setCoordsToUniverse(x, y){
        this.mouse.set(( x / window.innerWidth ) * 2 - 1, - ( y / window.innerHeight ) * 2 + 1);

        this.raycaster.setFromCamera( this.mouse, this.camera );
        const intersects = this.raycaster.intersectObject( this.planeObject );
        if ( intersects.length > 0 ) {
            const intersect = intersects[ 0 ];
            return {x: intersect.point.x, y: intersect.point.y};
        }
    }

    onButtonDown(event){
        event.preventDefault();
        this.buttonPressed = true;
        this.mouseButton = event.button;
        this.pt0 = this.setCoordsToUniverse(event.clientX, event.clientY);

        switch (this.curMouseAction) {
            case GLCanvas.SELECTION:
                
                break;
            case GLCanvas.COLLECTION:
                if (!this.collector.isActive()) {
                    this.collector.startCurveCollection();
                }
                break;
            case GLCanvas.PAN:
            
            break;
            default:
                break;
        }
    }

    onMouseMove(event){
        event.preventDefault();
        this.pt1 = this.setCoordsToUniverse(event.clientX, event.clientY);

        switch (this.curMouseAction) {
            case GLCanvas.SELECTION:
                if (this.mouseButton === 0 && this.buttonPressed) {
                    this.render();
                }
                break;
            case GLCanvas.COLLECTION:
                if (this.mouseButton === 0 && !this.buttonPressed) {
                    if ((Math.abs(this.pt0.x - this.pt1.x) > this.mouseMoveTol) && 
                    (Math.abs(this.pt0.y - this.pt1.y) > this.mouseMoveTol)) {
                        if (this.collector.isCollecting()) {
                            if (this.gridObj.getSnapInfo()) {
                                var pos = {x: this.pt1.x, y: this.pt1.y};
                                this.gridObj.snapTo(pos);
                                this.pt1.x = pos.x;
                                this.pt1.y = pos.y;
                            }

                            if (this.model && !this.model.isEmpty()) {
                                var max_size = ((this.right-this.left) >= (this.top - this.bottom) ? (this.right-this.left) :
                                (this.top - this.bottom));
                                var pick_tol = max_size*this.pickTolFac;
                                var pos = {x: this.pt1.x, y: this.pt1.y};
                                this.model.snapToCurve(pos, pick_tol);
                                this.pt1.x = pos.x;
                                this.pt1.y = pos.y;
                            }
                            this.collector.addTempPoint(this.pt1.x, this.pt1.y)
                            this.render();
                        }
                    }
                }
                break;
            case GLCanvas.PAN:
                if (this.mouseButton === 0 && this.buttonPressed) {
                    if ((Math.abs(this.pt0.x - this.pt1.x) > this.mouseMoveTol) && 
                    (Math.abs(this.pt0.y - this.pt1.y) > this.mouseMoveTol)) {
                        var dPos = new THREE.Vector3(this.pt0.x - this.pt1.x, this.pt0.y - this.pt1.y,0);
                        this.panWorldWindow(dPos.x, dPos.y);
                        this.render();
                    }
                }
            default:
                break;
        }
    }

    onButtonUp(event){
        this.buttonPressed = false;
        this.pt1 = this.setCoordsToUniverse(event.clientX, event.clientY);

        switch (this.curMouseAction) {
            case GLCanvas.SELECTION:
                if (this.mouseButton === 0) {
                    if (this.model != null && !(this.model.isEmpty())) {
                        if ((Math.abs(this.pt0.x - this.pt1.x) <= this.mouseMoveTol) && 
                        (Math.abs(this.pt0.y - this.pt1.y) <= this.mouseMoveTol)) {
                            var pick_tol = this.width*this.pickTolFac;

                        }
                        else
                        {
                            var xmin = (this.pt0.x < this.pt1.x) ? this.pt0.x : this.pt1.x;
                            var xmax = (this.pt0.x > this.pt1.x) ? this.pt0.x : this.pt1.x;
                            var ymin = (this.pt0.y < this.pt1.y) ? this.pt0.y : this.pt1.y;
                            var ymax = (this.pt0.y > this.pt1.y) ? this.pt0.y : this.pt1.y;
                            this.model.selectFence(xmin, xmax, ymin, ymax);
                        }
                    }
                    this.render();
                }
                break;
            case GLCanvas.COLLECTION:
                if (this.mouseButton === 0) {
                    if ((Math.abs(this.pt0.x - this.pt1.x) < this.mouseMoveTol) && 
                    (Math.abs(this.pt0.y - this.pt1.y) < this.mouseMoveTol)) {
                        var max_size = ((this.right-this.left) >= (this.top - this.bottom) ? (this.right-this.left) :
                        (this.top - this.bottom));
                        var tol = max_size*this.pickTolFac;

                        if (this.gridObj.getSnapInfo()) {
                            var pos = {x: this.pt1.x, y: this.pt1.y};
                            this.gridObj.snapTo(pos);
                            this.pt1.x = pos.x;
                            this.pt1.y = pos.y;
                        }

                        if (this.model && !this.model.isEmpty()) {
                            var pos = {x: this.pt1.x, y: this.pt1.y};
                            this.model.snapToCurve(pos, tol);
                            this.pt1.x = pos.x;
                            this.pt1.y = pos.y;
                        }
                        this.collector.insertPoint(this.pt1.x, this.pt1.y, tol);
                    }
                }

                var endCollection = false;
                if (this.mouseButton === 0) {
                    if (!this.collector.isUnlimited()) {
                        if (this.collector.hasFinished()) {
                            endCollection = true;
                        }
                    }
                }
                else if (this.mouseButton === 2) 
                {
                    if (this.collector.isUnlimited()) {
                        if (this.collector.hasFinished()) {
                            endCollection=true;
                        }
                        else
                        {
                            this.collector.reset();
                            this.render();
                        }
                    }
                    else
                    {
                        this.collector.reset();
                        this.render();
                    }
                }

                if (endCollection) {
                    var curve = this.collector.getCollectedCurve();
                    this.curves.push(curve);
                    this.model.insertCurve(curve);
                    this.collector.endCurveCollection();
                    this.render();
                    this.socket.emit('insert-curve', curve);
                }
                break;
        
            default:
                break;
        }
    }

    panWorldWindow(panX, panY){
        var deslocX = -panX //-(this.right-this.left);
        var deslocY = -panY //-(this.top -this.bottom);
        
        this.right = this.right - deslocX;
        this.left = this.left - deslocX;

        this.top = this.top - deslocY;
        this.bottom = this.bottom - deslocY;

        this.camera.left = this.left;
        this.camera.right = this.right;
        this.camera.top = this.top;
        this.camera.bottom = this.bottom;
        this.camera.updateProjectionMatrix();
        this.render();
    }

    zoomIn(){
        this.scaleWorldWindow(1/1.1);
        this.render();
    }

    zoomOut(){
        this.scaleWorldWindow(1.1);
        this.render();
    }

    scaleWorldWindow(scaleFac){
        var vpr, cx, cy, sizex, sizey;

        vpr = this.height/this.width;

        cx = (this.left + this.right)/2;
        cy = (this.top + this.bottom)/2;

        sizex = (this.right - this.left)*scaleFac;
        sizey = (this.top - this.bottom)*scaleFac;

        if (sizey / sizex > vpr){
            sizex = sizey / vpr;
        }
        else if (sizey / sizex < vpr)
        {
            sizey = sizex*vpr;
        }

        this.right = cx + sizex/2;
        this.left = cx - sizex/2;
        this.top = cy + sizey/2;
        this.bottom = cy - sizey/2;

        this.camera.left = this.left;
        this.camera.right = this.right;
        this.camera.top = this.top;
        this.camera.bottom = this.bottom;
        this.camera.updateProjectionMatrix();
    }

    makeDisplayModel(){
        if (this.model === null && this.model.isEmpty()) {
            return;
        }

        const pCurves = this.model.getCurves();
        for (let i = 0; i < pCurves.length; i++) {
            const pts = pCurves[i].getPointsToDraw();
            var color;
            pCurves[i].isSelected() ? color = 'red' : color = 'blue';
            var vertices = [];
            pts.forEach(pt => {
                vertices.push(new THREE.Vector3(pt.x, pt.y, 0.0));
            });
            var geometry = new THREE.BufferGeometry(),
            material = new THREE.LineBasicMaterial({ color: color });
            geometry.setFromPoints(vertices);
            var curve = new THREE.Line(geometry, material);
            var ctrl_points = pCurves[i].getPoints();
            var pt_vertices = [];
            ctrl_points.forEach(pt => {
                pt_vertices.push(new THREE.Vector3(pt.x, pt.y, 0.0));
            });
            var pt_geometry = new THREE.BufferGeometry(),
            pt_material = new THREE.PointsMaterial({color: 'red', size: 5.0});
            pt_geometry.setFromPoints(pt_vertices);
            var points = new THREE.Points(pt_geometry, pt_material);
            curve.add(points);
            this.scene.add(curve);
        }
    }

    makeDisplayGrid(){

        var vector = new THREE.Vector3( 0, 0, 1 );
        this.planeGeometry = new THREE.PlaneBufferGeometry(10*this.width, 10*this.height );
        this.planeGeometry.lookAt(vector)
        this.planeObject = new THREE.Mesh( this.planeGeometry, new THREE.MeshBasicMaterial( {color:0x000000, visible: false, side: DoubleSide } ) );
        this.scene.add( this.planeObject );

        if (this.gridOn) {
            var oX = 0.0;
            var oY = 0.0;
            var x = this.left;
            var y = this.bottom;
            var gridSpace = {
                x: 0.0,
                y: 0.0
            };
            var vertices = [];
            var line_vertices = [];

            this.gridObj.getGridSpace(gridSpace);

            x = oX - ( Math.trunc((oX - this.left)/gridSpace.x)*gridSpace.x) - gridSpace.x;

            while (x <= this.right) {
                y = oY -(Math.trunc((oY - this.bottom)/gridSpace.y)*gridSpace.y) - gridSpace.y;
                while(y <= this.top){
                    vertices.push(new THREE.Vector3(x, y, 0.0));
                    y+=gridSpace.y;
                }
                x+=gridSpace.x;
            }

            line_vertices.push(new THREE.Vector3(oX - gridSpace.x, oY));
            line_vertices.push(new THREE.Vector3(oX + gridSpace.x, oY));
            line_vertices.push(new THREE.Vector3(oX, oY));
            line_vertices.push(new THREE.Vector3(oX, oY - gridSpace.y));
            line_vertices.push(new THREE.Vector3(oX, oY + gridSpace.y));

            var pt_geometry = new THREE.BufferGeometry(),
                pt_material = new THREE.PointsMaterial({color: 'gray', size: 1.0});
            pt_geometry.setFromPoints(vertices);

            var line_geometry = new THREE.BufferGeometry(),
                line_material = new THREE.LineBasicMaterial({color: 'gray'});        
            line_geometry.setFromPoints(line_vertices);
            var lines = new THREE.Line(line_geometry, line_material);
            this.gridDisplay = new THREE.Points(pt_geometry, pt_material);
            this.gridDisplay.add(lines);

            this.scene.add(this.gridDisplay);
        }
    }

    drawSelectionFence(){
        if (!this.buttonPressed) {
            return;
        }

        if (this.pt0.x === this.pt1.x && this.pt0.y === this.pt1.y) {
            return;
        }

        if (this.model === null || this.model.isEmpty()) {
            return;
        }

        if (!(this.fence === null)) {
            this.scene.remove(this.fence);
        }

        var vertices = [];
        vertices.push(new THREE.Vector3(this.pt0.x, this.pt0.y, 0.0));
        vertices.push(new THREE.Vector3(this.pt1.x, this.pt0.y, 0.0));
        vertices.push(new THREE.Vector3(this.pt1.x, this.pt1.y, 0.0));
        vertices.push(new THREE.Vector3(this.pt0.x, this.pt1.y, 0.0));
        vertices.push(new THREE.Vector3(this.pt0.x, this.pt0.y, 0.0));
        var geometry = new THREE.BufferGeometry(),
        material = new THREE.LineBasicMaterial({ color:'green' });
        geometry.setFromPoints(vertices);
        this.fence = new THREE.Line(geometry, material);
        this.scene.add(this.fence);
    }

    drawCollectedCurve(){
        if (!this.collector.isActive() || !this.collector.isCollecting()) {
            /* if (this.tempCurve != null) {
                this.scene.remove(this.tempCurve);
                this.tempCurve = null;
            } */

            return;
        }

        if (this.tempCurve != null) {
            this.scene.remove(this.tempCurve);
            this.tempCurve = null;
        }
        var pts = this.collector.getDrawPoints();
        var vertices = []
        pts.forEach(pt => {
            vertices.push(new THREE.Vector3(pt.x, pt.y, 0.0));
        });
        var geometry = new THREE.BufferGeometry(),
        material = new THREE.LineBasicMaterial({ color: 'blue'});
        geometry.setFromPoints(vertices);
        var curve = new THREE.Line(geometry, material);
        if (this.collector.isCollecting()) {
            this.tempCurve = curve;
        }
        var ctrl_points = this.collector.getPoints();
        var pt_vertices = []
        ctrl_points.forEach(pt => {
            pt_vertices.push(new THREE.Vector3(pt.x, pt.y, 0.0));
        });
        var pt_geometry = new THREE.BufferGeometry(),
        pt_material = new THREE.PointsMaterial({color: 'red', size: 5.0});
        pt_geometry.setFromPoints(pt_vertices);
        var points = new THREE.Points(pt_geometry, pt_material);
        curve.add(points);
        this.scene.add(curve);
    }

    render(){
        this.scene.clear();
        if (this.gridDisplay !== null && this.planeObject !== null) {
            
            this.gridDisplay.geometry.dispose();
            this.planeObject.geometry.dispose();
        }

        this.makeDisplayGrid();
        this.makeDisplayModel();

        switch (this.curMouseAction) {
            case GLCanvas.SELECTION:
                this.drawSelectionFence();
                break;
            case GLCanvas.COLLECTION:
                this.drawCollectedCurve();
                break;
            default:
                break;
        }
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize(){

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.left = -(this.width/2)/20;
        this.right = (this.width/2)/20;
        this.top = (this.height/2)/20;
        this.bottom = - (this.height/2)/20;
        this.camera.left = this.left;
        this.camera.right = this.right;
        this.camera.top = this.top;
        this.camera.bottom = this.bottom;

        //this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
        
        this.renderer.setSize( this.width, this.height );
        this.render();
    }

    gridHelperOnOff(){
        if (this.gridOn === true) {
            this.gridOn = false;
        } else {
            this.gridOn = true;
        }
        this.render();
    }

    setMouseAction(action){
        if (this.curMouseAction === action) {
            return;
        }
        switch (action) {
            case GLCanvas.SELECTION:
                this.curMouseAction = GLCanvas.SELECTION;
                break;
            case GLCanvas.COLLECTION:
                this.curMouseAction = GLCanvas.COLLECTION;
                break;
            case GLCanvas.PAN:
            this.curMouseAction = GLCanvas.PAN;
            break;
            default:
                break;
        }
    }

    setCurveType(type){
        if (this.curMouseAction === GLCanvas.COLLECTION && this.collector.getCurveType() === type) {
            return;
        }
        this.collector.reset();
        this.collector.setCurveType(type);
    }
}

export default canvas;