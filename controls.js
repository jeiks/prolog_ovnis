class Controls{
    constructor(type, timeForUpdateProlog=100){
        this.forward=false;
        this.left=false;
        this.right=false;
        this.reverse=false;
        this.boom=false;
        this.timeForUpdateProlog=timeForUpdateProlog
        this.lastUpdate=Date.now();

        switch(type){
            case "KEYS":
                this.#addKeyboardListeners();
                break;
            case "DUMMY":
                this.forward=Math.random() > 0.5;
                this.reverse=!this.forward;
                this.left=Math.random() > 0.5;
                this.right=!this.left;
                break;
            case "PROLOG":
                // this.updateProlog();
                break;
        }
    }

    updateJSONKeys(controls) {
        //console.log(controls);
        this.forward = (controls.forward)?true:false;
        this.reverse = (controls.reverse)?true:false;
        this.left = (controls.left)?true:false;
        this.right = (controls.right)?true:false;
        this.boom = (controls.boom)?true:false;
        let msg = controls.msg;
        // console.log(msg);
        //console.log('forward: '+this.forward+' ('+controls.forward+') -- reverse: '+this.reverse+' ('+controls.reverse+') -- '+
        //            'left: '+this.left+' ('+controls.left+') -- right: '+this.right+' ('+controls.right+')'+this.boom+' ('+controls.boom+')')
    }

    updateProlog(sensors, sensorsType, x, y, angle, prologID, score, speed, shieldStrength, x_oficina, y_oficina) {
        // delay para evitar travamento:
        if (Date.now() - this.lastUpdate < this.timeForUpdateProlog) return;
        this.lastUpdate = Date.now();

        if (x==undefined || y==undefined || angle==undefined || speed==undefined ||
            shieldStrength==undefined || x_oficina==undefined || y_oficina==undefined) return;
        for (let i=1;i<sensors.length;i++) if (sensors[i]==undefined) return;
        for (let i=1;i<sensorsType.length;i++) if (sensorsType[i]==undefined) return;
        
        var ss='';
        for (let i=1;i<sensors.length;i++) ss+="&s"+i+"="+sensors[i];
        var sst='';
        for (let i=1;i<sensorsType.length;i++) sst+="&st"+i+"="+sensorsType[i];

        var URL = ("./action?"+
                   "id="+prologID+ss+sst+
                   "&x="+x+"&y="+y+"&angle="+angle+
                   "&score="+score+"&speed="+speed+
                   "&shield="+shieldStrength);
        //console.log(URL);
        $.getJSON(
            URL,
            this.updateJSONKeys.bind(this)
        );
    }

    updateDUMMYKeys(sensors, sensorsType) {
        if ((Date.now() - this.lastUpdate) < 1000)
            return;
        else{
            this.lastUpdate = Date.now();
            const r = Math.random();
            if (r < .4) {
                this.forward = true;
                this.reverse = false;
                this.left = false;
                this.right = false;
            } else if (r < .5) {
                this.reverse = true;
                this.forward = false;
                this.left = false;
                this.right = false;
            } else if (r < .8) {
                this.left = true;
                this.right = false;
            }else{
                this.right = true;
                this.left = false;
            }
            // console.log('R:'+this.right+', L:'+this.left+', F:'+this.forward+', R:'+this.reverse);
        }
        if (sensors[5] != undefined){
            if (sensors[5] > .4 && sensorsType[5] == 2 ||
                sensors[4] > .4 && sensorsType[4] == 2 ||
                sensors[3] > .4 && sensorsType[3] == 2
            )
                this.boom = true;
            if (sensors[5] > .8) {
                this.forward = false;
                this.reverse = true;
            }
            if (sensors[3]+sensors[4]+sensors[5] > 0.6) {
                this.right = true;
                this.left = false;
            }else if (sensors[5]+sensors[6]+sensors[7] > 0.6) {
                this.right = false;
                this.left = true;
            }
        }
    }

    getBOOM() {
        let ret = this.boom;
        this.boom = false;
        return ret;
    }

    #addKeyboardListeners(){
        document.addEventListener("keydown",(event) => {
            switch(event.key){
                case "ArrowLeft":
                    this.left=true;
                    break;
                case "ArrowRight":
                    this.right=true;
                    break;
                case "ArrowUp":
                    this.forward=true;
                    break;
                case "ArrowDown":
                    this.reverse=true;
                    break;
                case "Enter":
                case " ":
                    this.boom=true;
                    break;
            }
        });
        document.addEventListener("keyup",(event) => {
            switch(event.key){
                case "ArrowLeft":
                    this.left=false;
                    break;
                case "ArrowRight":
                    this.right=false;
                    break;
                case "ArrowUp":
                    this.forward=false;
                    break;
                case "ArrowDown":
                    this.reverse=false;
                    break;
            }
        });
    }
}
