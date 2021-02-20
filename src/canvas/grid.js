export default class Grid {
    constructor(){
        this.is_snapOn = false;
        this.gridX = 10.0;
        this.gridY = 10.0;
    }

    reset(){
        this.is_snapOn = false;
        this.gridX = 1.0;
        this.gridY = 1.0;
    }

    setSnapData(dx, dy, is_snapOn ){
        this.gridX = dx;
        this.gridY = dy;
        this.is_SnapOn = is_snapOn;
    }

    getSnapInfo(){
        return this.is_SnapOn;
    }

    getGridSpace(obj){
        obj.x = this.gridX;
        obj.y = this.gridY;
    }

    snapTo(pos){
        var ip, fp;
        var x = pos.x;
        var y = pos.y;

        fp = x/this.gridX;
        ip = Math.trunc(fp);
        fp = fp-ip;
        if (fp > 0.5) {
            x = (ip+1.0)*this.gridX;
        } 
        else if(fp < -0.5)
        {
            x=(ip - 1.0)*this.gridX;
        }
        else{
            x = ip*this.gridX;
        }

        fp = y/this.gridY;
        ip = Math.trunc(fp);
        fp = fp-ip;
        if (fp > 0.5) {
            y = (ip+1.0)*this.gridY;
        } 
        else if(fp < -0.5)
        {
            y=(ip - 1.0)*this.gridY;
        }
        else{
            y = ip*this.gridY;
        }

        pos.x = x;
        pos.y = y;
    }
}