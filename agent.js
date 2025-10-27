class Agent{
    constructor(x,y,width,height,
                arenaheight,arenawidth,padding,
                controlType,maxSpeed=3,color="lightBlue",
                score=100,prologID=-1,name="Humano",
                timeForUpdateProlog=100){
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        this.name=name;
        this.color=color;

        this.prologID=prologID;
        this.arenaleft = padding;
        this.arenatop = padding;
        this.arenawidth = arenawidth - padding;
        this.arenaheight = arenaheight - padding;

        this.speed=0.0;
        this.acceleration=0.05;
        this.maxSpeed=maxSpeed;
        this.friction=0.05;
        this.angle=0;
        this.controlType=controlType;
        this.steps=0;
        this.smallSteps=0;
        this.damage=false;
        this.sensor=new Sensor(this);
        this.score=score;
        this.lastDamage = Date.now();

        this.shieldStrength = 100;
        this.isAtRepairZone = false;
        this.isRepairing = false;

        this.alreadyDrawed = false;

        this.controls=new Controls(controlType,timeForUpdateProlog);
        this.polygon=this.#createPolygon();

        [this.img, this.mask] = this.#getAgentImg(color);
        [this.img2, this.mask2] = this.#getAgentImg("black");
    }

    // Calcula a distância entre o agente e um ponto (usado para Oficina)
    #distanceTo(x, y) {
        return Math.hypot(this.x - x, this.y - y);
    }

    #getAgentImg(color) {
        var img=new Image();
        //  imagem gerada com o Google Gemini
        img.src = (this.controlType == "DUMMY")?"ovni_dummy.png":"ovni.png";

        var mask=document.createElement("canvas");
        mask.width=this.width;
        mask.height=this.height;
        
        const maskCtx=mask.getContext("2d");
        img.onload=()=>{
            maskCtx.fillStyle=color;
            maskCtx.rect(0,0,this.width,this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation="destination-atop";
            maskCtx.drawImage(img,0,0,this.width,this.height);
        }
        return [img, mask];
    }

    update(arenaBorders, agents, booms, repairZone){
        if (this.score > 0){
            // --- Lógica de Reparo ---
            this.isAtRepairZone = this.#distanceTo(repairZone.x, repairZone.y) < repairZone.radius;
            this.isRepairing = false;
            
            if (this.isAtRepairZone) {
                    // Repara se o agente estiver "parado"
                        if (this.shieldStrength < 100) {
                            this.shieldStrength = Math.min(100, this.shieldStrength + 0.02);
                        }else{
                            this.score = Math.min(100, this.score+0.005);
                        }
                        this.isRepairing = true;
            }
            // --- Fim Lógica de Reparo ---

            switch(this.controlType) {
                case "PROLOG":
                    //this.controls.updateProlog(this.getSensors(), this.x, this.y, this.angle, this.prologID, this.score, this.speed);
                    // Passa o novo sensor SHIELD_STRENGTH e as coordenadas da Oficina
                    this.controls.updateProlog(this.getSensors(),
                                               this.getSensorsType(),
                                               this.x, this.y, this.angle, 
                                               this.prologID, this.score, this.speed, 
                                               this.shieldStrength, repairZone.x, repairZone.y);
                    break;
                case "DUMMY":
                    this.controls.updateDUMMYKeys(this.getSensors(), this.getSensorsType());
                    break;
                case "KEYS":
                    // Para debugar:
                    //console.log(this.getSensors());
                    //console.log(this.getSensorsType());
                    break;
            }
            this.#move();
        } else {
            this.img = this.img2;
            this.mask = this.mask2;
        }
        this.polygon=this.#createPolygon();
        if (this.#assessDamage(arenaBorders,agents)) {
            this.damage = true;
            this.#collision();
        }else{
            this.damage = false;
        }
        this.#keepInBounds();
        this.polygon=this.#createPolygon();

        this.#boomDamage(booms);
        //if (this.#boomDamage(booms)) {
        //    this.score=(this.score-10>0)?this.score-10:0;
        //}
        if(this.sensor){
            this.sensor.update(arenaBorders,agents,booms);
        }

        let boom = this.controls.getBOOM() && (this.score > 0);
        return [boom, this.x, this.y, this.angle];
    }

    getSensors() {
        if(this.sensor){
            const offsets=this.sensor.readings.map(
                s=>s==null?0:1-s.offset
            );
            return offsets;
        }else{
            return new Array(this.sensor.rayCount).fill(0);
        }
    }

    getSensorsType() {
        if(this.sensor){
            const offsets=this.sensor.readings.map(
                s=>s==null?0:s.type
            );
            return offsets;
        }else{
            return new Array(this.sensor.rayCount).fill(0);
        }
    }

    #boomDamage(booms){
        let hit = false;
        for (let i=0;i<booms.length;i++) {
            if (polysIntersect(this.polygon, booms[i].getCircle())) {
                booms[i].deactivate();
                hit = true;
                
                // --- NOVA LÓGICA DE DANO E ESCUDO ---
                const damageAmount = 10;
                
                // O ângulo do projétil (booms[i].angle) é a direção do ataque.
                // this.angle é a direção para onde o drone está virado (sua "frente").
                
                // Calcula a diferença angular entre a direção do projétil e a frente do drone
                const impactAngle = Math.abs(booms[i].angle - this.angle); 
                // Normaliza o ângulo (0 a PI)
                const normalizedAngle = Math.abs(Math.atan2(Math.sin(impactAngle), Math.cos(impactAngle)));
                
                // Flanqueamento (Ataque por trás): Ângulo próximo a 180 graus (PI)
                const isFlanked = normalizedAngle > Math.PI * 0.75; // 135 graus em diante
                
                // 1. CHECANDO O REPARO: Escudo desativado se estiver reparando
                if (this.isRepairing) {
                     this.score = (this.score - damageAmount > 0) ? this.score - damageAmount : 0;
                // 2. CHECANDO O FLANQUEAMENTO: Dano direto
                } else if (isFlanked) {
                    this.score = (this.score - damageAmount > 0) ? this.score - damageAmount : 0;
                // 3. CHECANDO O ESCUDO: Ataque pela frente
                } else if (this.shieldStrength > 0) {
                    this.shieldStrength = Math.max(0, this.shieldStrength - damageAmount);
                // 4. ESCUDO QUEBRADO: Dano direto
                } else {
                    this.score = (this.score - damageAmount > 0) ? this.score - damageAmount : 0;
                }
                
                // --- FIM NOVA LÓGICA DE DANO E ESCUDO ---
            }
        }
        return hit;
    }

    #assessDamage(arenaBorders,agents){
        for(let i=0;i<arenaBorders.length;i++){
            if(polysIntersect(this.polygon,arenaBorders[i])){
                return true;
            }
        }
        if (this.x < 0 || this.y < 0 ||
            this.x > this.arenawidth || this.y > this.arenaheight) {
            this.score = 0;
        }
        return false;
    }

    #createPolygon(){
        const points=[];
        const rad=Math.hypot(this.width,this.height)/2;
        const alpha=Math.atan2(this.width,this.height);
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });
        return points;
    }

    #move(){
        if(this.controls.forward){
            this.speed = Math.min(this.speed+this.acceleration, this.maxSpeed);
        }
        if(this.controls.reverse && !this.damage){
            this.speed = Math.max(this.speed-this.acceleration, -this.maxSpeed);
        }

        if(this.speed>this.maxSpeed){
            this.speed=this.maxSpeed;
        }else if(this.speed<-this.maxSpeed){
            this.speed=-this.maxSpeed;
        }

        //if(this.speed!=0){
            const flip=this.speed>0?1:-1;
            if(this.controls.left){
                this.#updateAngle(this.angle+0.03*flip);
            }
            if(this.controls.right){
                this.#updateAngle(this.angle-0.03*flip);
            }
        //}
        
        this.x-=Math.sin(this.angle)*this.speed;
        this.y-=Math.cos(this.angle)*this.speed;
    }

    #updateAngle(newAngle) {
        newAngle = newAngle % (Math.PI*2);
        if (newAngle < 0) newAngle = Math.PI*2 + newAngle;
        this.angle = newAngle;
    }

    #collision() {
        if (this.score <= 0) return;
        var oldSpeed = this.speed, sensors, inc=1.5;
        const flip=this.speed>0?1:-1;
        if(this.controls.left){
            this.#updateAngle(this.angle+0.03*flip);
        }
        if(this.controls.right){
            this.#updateAngle(this.angle-0.03*flip);
        }
        sensors = this.getSensors();
        for (var i=0;i<sensors.length-1;i++)
            if (sensors[i] > 0.8) this.speed = -0.2;
        this.x-=Math.sin(this.angle)*this.speed*inc;
        this.y-=Math.cos(this.angle)*this.speed*inc;
        inc = 0.01;
        this.speed = (oldSpeed>0)?oldSpeed*inc:oldSpeed*inc;
        if ((Date.now()-this.lastDamage) > 1000) {
            this.score=(this.score-2>0)?this.score-2:0;
            this.lastDamage = Date.now();
        }
    }

    #keepInBounds(){
        const points = this.polygon; // Os 4 vértices do polígono do agente
        
        // Limites da Arena (ajustados para a sua convenção de arena)
        const minX = this.arenaleft;
        const maxX = this.arenawidth;
        const minY = this.arenatop;
        const maxY = this.arenaheight;

        let correctedX = this.x;
        let correctedY = this.y;

        for(let i = 0; i < points.length; i++){
            const p = points[i];
            
            // 1. Correção Horizontal (X)
            if(p.x < minX){
                // O ponto está muito à esquerda. Calcular o quanto precisa mover o centro (this.x)
                // para que o ponto p.x fique exatamente em minX.
                correctedX = Math.max(correctedX, this.x + (minX - p.x));
            } else if (p.x > maxX){
                // O ponto está muito à direita.
                correctedX = Math.min(correctedX, this.x - (p.x - maxX));
            }

            // 2. Correção Vertical (Y)
            if(p.y < minY){
                // O ponto está muito acima.
                correctedY = Math.max(correctedY, this.y + (minY - p.y));
            } else if (p.y > maxY){
                // O ponto está muito abaixo.
                correctedY = Math.min(correctedY, this.y - (p.y - maxY));
            }
        }

        // não houve correção
        if (this.x == correctedX && this.y ==correctedY) return false;
        // Aplicar a correção à posição do agente
        this.x = correctedX;
        this.y = correctedY;
        return true;
    }

    draw(ctx, drawSensor = false) {
        this.alreadyDrawed = true;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        const baseTilt = 0.05; // Fator base de inclinação
        const speedFactor = this.speed; // Limita a intensidade máxima
        const tiltFactor = Math.max(-baseTilt, Math.min(baseTilt, (this.controls.right - this.controls.left) * baseTilt * speedFactor));
        const verticalScale = 0.8; // Escala vertical constante
        const shear = tiltFactor; // Cisalhamento baseado no tilt

        // Aplicar transformação personalizada
        ctx.transform(1, shear, 0, verticalScale, 0, 0);

        // Desenho da máscara e da imagem
        ctx.drawImage(this.mask, -this.width/2, -this.height/2, this.width, this.height);
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(this.img, -this.width/2, -this.height/2, this.width, this.height);

        ctx.restore();
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        
        
        ctx.restore();

        // --- DESENHO DO SCORE E ESCUDO ---
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        
        ctx.textAlign = "center";
        // Desenho da Vida (Score)
        ctx.fillStyle = (this.score > 20)?"white":"red";
        ctx.font = "bold 10px Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeText('' + Math.round(this.score), 0, this.height/4);
        ctx.fillText('' + Math.round(this.score), 0, this.height/4);
        
        // Desenho da Força do Escudo (Shield Strength)
        ctx.fillStyle = (this.shieldStrength > 20)?"#00FFFF":"yellow";
        if (this.isRepairing) ctx.fillStyle = "lime";
        ctx.font = "bold 10px Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeText(Math.round(this.shieldStrength), 0, this.height/4 + 12);
        ctx.fillText(Math.round(this.shieldStrength), 0, this.height/4 + 12);

        ctx.restore();
        // --- FIM DESENHO ---

        // Desenho dos sensores, se necessário
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }



}
