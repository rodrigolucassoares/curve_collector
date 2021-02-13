class curve {
    constructor(){
        this.nPts = 0;
        this.nSdv = 1;
        this.selected = false;
    }

    getSubdivPoints(){
        let sdvPts = [];
        for (let i = 0; i < this.nSdv; i++) {
            let t = i / this.nSdv;
            sdvPts[i] = this.getPoint(t)            
        }
    }

    getNumberOfPoints(){
        return this.nPts;
    }

    setSelected(selected){
        this.selected = selected;
    }

    isSelected(){
        return this.selected;
    }
}

export default curve;