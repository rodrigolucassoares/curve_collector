import curve from '../curves/curve'

class line extends curve{
    constructor(){
        super();
        if (arguments.length > 0) {
            this.x1 = arguments[0];
            this.y1 = arguments[1];
            this.x2 = arguments[2];
            this.y2 = arguments[3];
            this.nPts = 2;
        }
        else
        {
            this.nPts = 0;
        }
    }

    isUnlimited(){
        return false;
    }

    addPoint(x, y){
        
        if (this.nPts === 0) {
            this.x1 = x;
            this.y1 = y
            this.nPts++;
        } 
        else if (this.nPts === 1) 
        {
            this.x2 = x;
            this.y2 = y;
            this.nPts++
        }
    }

    getPoint(t){
        let vx = this.x2 - this.x1;
        let vy = this.y2 - this.y2;
        let xOn, yOn;

        if (t < 0) {
            xOn = this.x1;
            yOn = this.y1;
        }
        else if (t > 0)
        {
            xOn = this.x2;
            yOn = this.y2;
        }
        else
        {
            xOn = this.x1 + t*vx;
            yOn = this.y1 + t*vy;
        }

        return {x: xOn, y: yOn};
    }

    isPossible(){
        if (this.nPts < 2) {
            return false;
        }

        return true;
    }

    getPoints(){
        if (this.npts === 1) {
            let tempPts = [];
            tempPts.push({x: this.x1, y: this.y1});
            return tempPts; 
        }

        let tempPts = [];
        tempPts.push({x: this.x1, y: this.y1});
        tempPts.push({x: this.x2, y: this.y2});
        return tempPts;
    }

    getPointsToDraw(){
        if (arguments.length > 0 ) {
            let tempPts = [];
            tempPts.push({x: this.x1, y: this.y1});
            if (this.nPts === 2) {
                tempPts.push({x: this.x2, y: this.y2});
            }
            else if (this.nPts === 1 ) 
            {
                tempPts.push({x: arguments[0].x, y: arguments[0].y});
            }

            return tempPts;
        }
        let tempPts = [];
        tempPts.push({x: this.x1, y:this.y1});
        tempPts.push({x: this.x2, y:this.y2});
        return tempPts;
    }

    closestPoint(obj){
        let vx = this.x2 - this.x1;
        let vy = this.x2 - this.x1;
        let t = (vx*(obj.x-this.x1) + vy*(obj.y-this.y1)) / (vx*vx + vy*vy);
        let xOn, yOn;
        if (t < 0.0) {
            xOn = this.x1;
            yOn = this.y1;
        } else if (t > 0.0)
        {
            xOn = this.x2;
            yOn = this.y2;
        }
        else
        {
            xOn = this.x1 + t*vx;
            yOn = this.y1 + t*vy;
        }
        let dist = Math.sqrt((xOn-obj.x)*(xOn-obj.x)+(yOn-obj.y)*(yOn-obj.y));
        obj.x = xOn;
        obj.y = yOn;
        return dist;
    }

    getBoundBox(bbox){
        bbox.xmin = (this.x1 < this.x2) ? this.x1 : this.x2;
        bbox.xmax = (this.x1 > this.x2) ? this.x1 : this.x2;
        bbox.ymin = (this.y1 < this.y2) ? this.y1 : this.y2;
        bbox.ymax = (this.y1 > this.y2) ? this.y1 : this.y2;
    }

    setPoints(pts){
        this.x1 = pts.x1;
        this.x2 = pts.x2;
        this.y1 = pts.y1;
        this.y2 = pts.y2;
    }

    getXinit(){
        return this.x1;
    }

    getXend(){
        return this.x2;
    }

    getYinit(){
        return this.y1;
    }

    getYend(){
        return this.y2;
    }
}

export default line;