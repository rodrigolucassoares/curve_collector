import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as dat from 'dat.gui'
import App from './App';
import canvas from './canvas/canvas'
import control from './control/control'
import { GLCanvas } from './canvas/GLCanvas';
import { CurveTypes } from './curves/CurveTypes';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

const ctrl = new control();
const cnv = new canvas(ctrl);
cnv.grid();
cnv.render();


document.getElementById('canvas').style.cursor = "crosshair";

//configuring gui options bar
const guiOptions = {
  pan: ()=>{
    document.getElementById('canvas').style.cursor = "move";
    cnv.setMouseAction(GLCanvas.PAN);
  },
  selection: ()=>{
    document.getElementById('canvas').style.cursor = "auto";
    cnv.setMouseAction(GLCanvas.SELECTION);
  },
  line: ()=>{
    document.getElementById('canvas').style.cursor = "crosshair";
    cnv.setMouseAction(GLCanvas.COLLECTION);
    cnv.setCurveType(CurveTypes.LINE);
  },
  Grid: ()=>{
    cnv.gridHelperOnOff();
  },
}

const gui = new dat.GUI({name: 'My GUI'});
gui.add(guiOptions, 'pan');
gui.add(guiOptions, 'selection');
const curvesFolder = gui.addFolder('Curves');
curvesFolder.add(guiOptions, 'line');
/*curvesFolder.add(guiOptions, 'polyline');
curvesFolder.add(guiOptions, 'circle');
curvesFolder.add(guiOptions, 'arc');
curvesFolder.add(guiOptions, 'cubicbezier');
curvesFolder.add(guiOptions, 'quadbezier'); */

curvesFolder.close();
gui.add(guiOptions, 'Grid')

//curvesFolder.add(this.curveTypes, 'line');
//curvesFolder.add(this.curveTypes, 'polyline');
//curvesFolder.add(this.curveTypes, 'circle');
window.addEventListener('resize', ()=>cnv.onWindowResize());

document.getElementById('canvas').addEventListener( 'mousedown', (e)=>cnv.onButtonDown(e) );
document.getElementById('canvas').addEventListener( 'mousemove', (e)=>cnv.onMouseMove(e) );
document.getElementById('canvas').addEventListener( 'mouseup', (e)=>cnv.onButtonUp(e) );