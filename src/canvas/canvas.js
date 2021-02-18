import * as THREE from 'three'
import * as dat from 'dat.gui'
import collector from '../curves/curveCollector'
import curve from '../curves/curve'
import model from '../model/model'
import {GLCanvas} from './GLCanvas'
import {CurveTypes} from '../curves/CurveTypes'
import { DoubleSide } from 'three'


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
        this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2,
            this.height/2, - this.height/2,1,1000);
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

        this.planeObject = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.pt0 = null;
        this.pt1 = null;

        this.mouseButton = null;
        this.mouseMoveTol = 2;
        this.pickTolFac = 0.01;

        this.curves = [];

        this.fence = null;

        this.model = new model()
    }

    setCoordsToUniverse(x, y){
        this.mouse.set(( x / window.innerWidth ) * 2 - 1, - ( y / window.innerHeight ) * 2 + 1);

        this.raycaster.setFromCamera( this.mouse, this.camera );
        const intersects = this.raycaster.intersectObject( this.planeObject );
        if ( intersects.length > 0 ) {
            const intersect = intersects[ 0 ];
            //rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
            //rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
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
                            if (this.model && !this.model.isEmpty()) {
                                var pick_tol = this.width*this.pickTolFac;
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
                        var camPos = this.camera.position;
                        var dPos = new THREE.Vector3(this.pt0.x - this.pt1.x, this.pt0.y - this.pt1.y,0);
                        camPos.add(dPos);
                        this.camera.position.set(camPos.x,camPos.y,1);
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
                    this.scene.remove(this.fence);
                    this.render();
                }
                
                //this.renderer.render(this.scene, this.camera);
                break;
            case GLCanvas.COLLECTION:
                if (this.mouseButton === 0) {
                    if ((Math.abs(this.pt0.x - this.pt1.x) < this.mouseMoveTol) && 
                    (Math.abs(this.pt0.y - this.pt1.y) < this.mouseMoveTol)) {
                        var tol = this.width*this.pickTolFac;

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
                }
                break;
        
            default:
                break;
        }
    }

    makeDisplayModel(){
        if (this.model === null && this.model.isEmpty()) {
            return;
        }

        while (this.scene.children.length !== 2) //excludes the gridHelper and the plan 
        {
            this.scene.remove(this.scene.children[2]);
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
        this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize( this.width, this.height );
    }

    grid(){
        this.gridHelper = new THREE.GridHelper((this.width > this.height) ? this.width : this.height, 100);
        this.gridHelper.position.z = -0.001;
        this.gridHelper.geometry.rotateX( Math.PI / 2 );
        var vector = new THREE.Vector3( 0, 0, 1 );
        this.gridHelper.lookAt( vector );
        this.scene.add(this.gridHelper);

        this.planeGeometry = new THREE.PlaneBufferGeometry(2*this.width, 2*this.height, 100, 100 );
        //this.planeGeometry.rotateX( -Math.PI / 2 );
        this.planeGeometry.lookAt(vector)
        this.plane = new THREE.Mesh( this.planeGeometry, new THREE.MeshBasicMaterial( {color:0x000000, visible: false, side: DoubleSide } ) );
        //this.plane.geometry.rotateX(Math.PI/2);
        //this.plane.lookAt(vector)
        this.scene.add( this.plane );

        this.planeObject = this.plane ;
        
        this.render();
    }

    gridHelperOnOff(){
        if (this.gridOn === true) {
            this.gridOn = false;
            this.gridHelper.visible = false;
        } else {
            this.gridOn = true;
            this.gridHelper.visible = true;
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