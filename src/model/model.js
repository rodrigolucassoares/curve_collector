import {computeSegmentSegmentIntersection, IntersectionType} from '../compgeom/compgeom'
import line from '../curves/line'

class model {
    constructor(){
        this.curves = [];
    }

    isEmpty(){
        return this.curves.length < 1;
    }

    getCurves(){
        return this.curves;
    }

    getBoundingBox(bbox){
        if (this.curves.length < 1) {
            bbox.xmin = 0.0;
            bbox.xmax = 10.0;
            bbox.ymin = 0.0;
            bbox.xmax = 10.0;
            return;
        }
        this.curves[0].getBoundingBox(bbox);
        for (let i = 0; i < this.curves.length; i++) {
            var bbox_c;
            this.curves[i].getBoundingBox(bbox_c)
            if (bbox_c.xmin < bbox.xmin) {
                bbox.xmin = bbox_c.xmin;
            }

            if (bbox_c.xmax > bbox.xmax) {
                bbox.xmax = bbox_c.xmax;
            }

            if (bbox_c.ymin < bbox.ymin) {
                bbox.ymin = bbox_c.ymin;
            }

            if (bbox_c.ymax > bbox.ymax) {
                bbox.ymax = bbox_c.ymax;
            }
        }
    }

    snapToCurve(pos, pick_tol){
        if (this.curves.length < 1) {
            return false;
        }

        var xC, yC;
        var xClst = pos.x;
        var yClst = pos.y;
        var id_target = -1;
        var dmin = pick_tol;
        var d;

        for (let i = 0; i < this.curves.length; i++) {
            xC = this.curves[i].getXinit();
            yC = this.curves[i].getYinit();

            if (Math.abs(pos.x - xC) < pick_tol && Math.abs(pos.y - yC) < pick_tol ) {
                d = Math.sqrt((pos.x - xC)*(pos.x - xC)+(pos.y - yC)*(pos.y - yC));

                if (d<dmin) {
                    xClst = xC;
                    yClst = yC;
                    dmin = d;
                    id_target = i;
                }
                continue;
            }

            xC = this.curves[i].getXend();
            yC = this.curves[i].getYend();

            if (Math.abs(pos.x - xC) < pick_tol && Math.abs(pos.y - yC) < pick_tol ) {
                d = Math.sqrt((pos.x - xC)*(pos.x - xC)+(pos.y - yC)*(pos.y - yC));
                if (d<dmin) {
                    xClst = xC;
                    yClst = yC;
                    dmin = d;
                    id_target = i;
                }
                continue;
            }
            xC = pos.x;
            yC = pos.y;
            d = this.curves[i].closestPoint({x: xC, y: yC});
            if (d<dmin) {
                xClst = xC;
                yClst = yC;
                dmin = d;
                id_target=i;
            }
        }
        
        if (id_target < 0) {
            return false;
        }
        pos.x = xClst;
        pos.y = yClst;
        return true;
    }

    insertCurve(curve){
        this.curves.push(curve);
    }

    selectFence(xmin, xmax, ymin, ymax){
        if (this.curves.length < 1) {
            return;
        }

        var inFence;
        var bbox = {};
        this.curves.forEach(curve => {
            curve.getBoundBox(bbox);
            (bbox.xmin < xmin || bbox.xmax > xmax || bbox.ymin < ymin || bbox.ymax > ymax) ? inFence = false : inFence = true;
            if (inFence) {
                curve.isSelected() ? curve.setSelected(false) : curve.setSelected(true);
            }//when implementation of shift key is done insert else{if(shiftkey){curve.setSelected(false)}}
        });
    }

    intersectTwoCurves(){
        if (this.curves.length < 1) {
            return
        }

        var id_target12 = -1;
        var id_target34 = -1;

        for (let i = 0; i < this.curves.length; i++) {
            if (this.curves[i].isSelected()) {
                if (id_target12 === -1) {
                    id_target12 = i;
                } else if (id_target34 === -1)
                {
                    id_target34 = i;
                } else 
                {
                    alert("More than two lines are selected \n" +
                    "Please be sure that only two curves are selected");
                    return;
                }
            }            
        }

        if (id_target12 === -1) {
            alert("There aren't any lines selected \n" +
            "Please be sure that two curves are selected");
            return;
        }

        if (id_target34 === -1) {
            alert("Exactly one line is selected \n" +
            "Please be sure that two curves are selected");
            return;
        }

        //Get lines' points
        var pts12 = this.curves[id_target12].getPoints();
        var pts34 = this.curves[id_target34].getPoints();
        var pt1 = pts12[0];
        var pt2 = pts12[1];
        var pt3 = pts34[0];
        var pt4 = pts34[1];

        //Compute intersection between two lines
        var pi;
        var ti_12 = 0.0;
        var ti_34 = 0.0;

        var ref_obj = {p1: pt1, p2: pt2, p3: pt3, p4: pt4, pi: pi, t12: ti_12, t34: ti_34};

        var status = computeSegmentSegmentIntersection(ref_obj);
        var deleteLine1 = false;
        var deleteLine2 = false;
        var createdLine = false;
        switch (status) {
            case IntersectionType.DO_NOT_INTERSECT:
                alert("Cannot peform instersection \n The two selected lines do not intersect")
                break;
            case IntersectionType.DO_INTERSECT:
                var ln_a = new line(ref_obj.p1.x, ref_obj.p1.y, ref_obj.pi.x, ref_obj.pi.y);
                var ln_b = new line(ref_obj.pi.x, ref_obj.pi.y, ref_obj.p2.x, ref_obj.p2.y);
                var ln_c = new line(ref_obj.p3.x, ref_obj.p3.y, ref_obj.pi.x, ref_obj.pi.y);
                var ln_d = new line(ref_obj.pi.x, ref_obj.pi.y, ref_obj.p4.x, ref_obj.p4.y);
                deleteLine1 = true;
                deleteLine2 = true;
                createdLine = true;
                break;
            default:
                break;
        }

        if (deleteLine1 && deleteLine2) {
            this.delCurve(id_target12);
            //this.delCurve(id_target34);
            id_target34 = -1;
            for(let i = 0; i < this.curves.length; i++)
            {
                if( this.curves[i].isSelected() )
                {
                    id_target34 = i;
                }
            }
            if( id_target34 !== -1 ){
                this.delCurve(id_target34);
            }
        }

        if (ln_a != null) {
            this.curves.push(ln_a);
        }
        if (ln_b != null) {
            this.curves.push(ln_b);
        }
        if (ln_c != null) {
            this.curves.push(ln_c);
        }
        if (ln_d != null) {
            this.curves.push(ln_d);
        }
    }

    delCurve(curve_id){
        delete this.curves[curve_id];
        this.curves.splice(curve_id, 1);
    }
}

export default model;