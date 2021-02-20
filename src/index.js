import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as dat from 'dat.gui'
import App from './App';
import canvas from './canvas/canvas'
import { GLCanvas } from './canvas/GLCanvas';
import { CurveTypes } from './curves/CurveTypes';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

const cnv = new canvas();

cnv.render();

document.getElementById('canvas').style.cursor = "crosshair";

//configuring gui options bar
const guiOptions = {
  Pan: ()=>{
    document.getElementById('canvas').style.cursor = "move";
    cnv.setMouseAction(GLCanvas.PAN);
  },
  Selection: ()=>{
    document.getElementById('canvas').style.cursor = "auto";
    cnv.setMouseAction(GLCanvas.SELECTION);
  },
  Line: ()=>{
    document.getElementById('canvas').style.cursor = "crosshair";
    cnv.setMouseAction(GLCanvas.COLLECTION);
    cnv.setCurveType(CurveTypes.LINE);
  },
  Grid: ()=>{
    cnv.gridHelperOnOff();
  },
  SnapToGrid: ()=>{
    cnv.gridObj.getSnapInfo() ? cnv.gridObj.setSnapData(10.0, 10.0, false) : cnv.gridObj.setSnapData(10.0, 10.0, true);
  },
  Intersect: ()=>{
    cnv.model.intersectTwoCurves();
    cnv.render();
  }
}

const gui = new dat.GUI({name: 'My GUI'});
gui.add(guiOptions, 'Pan');
gui.add(guiOptions, 'Selection');
const curvesFolder = gui.addFolder('Curves');
curvesFolder.add(guiOptions, 'Line');
/*curvesFolder.add(guiOptions, 'polyline');
curvesFolder.add(guiOptions, 'circle');
curvesFolder.add(guiOptions, 'arc');
curvesFolder.add(guiOptions, 'cubicbezier');
curvesFolder.add(guiOptions, 'quadbezier'); */

curvesFolder.close();
gui.add(guiOptions, 'Grid');
gui.add(guiOptions, 'SnapToGrid');
gui.add(guiOptions, 'Intersect');

//curvesFolder.add(this.curveTypes, 'line');
//curvesFolder.add(this.curveTypes, 'polyline');
//curvesFolder.add(this.curveTypes, 'circle');

window.addEventListener('resize', ()=>cnv.onWindowResize());

document.getElementById('canvas').addEventListener( 'mousedown', (e)=>cnv.onButtonDown(e) );
document.getElementById('canvas').addEventListener( 'mousemove', (e)=>cnv.onMouseMove(e) );
document.getElementById('canvas').addEventListener( 'mouseup', (e)=>cnv.onButtonUp(e) );