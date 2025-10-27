class Sensor{
    constructor(agent){
        this.agent=agent;
        this.rayCount=11;
        this.rayLength=250;
        this.raySpread=Math.PI*2;

        this.rays=[];
        this.readings=[];
    }

    update(arenaBorders,agents,booms){
        this.#castRays();
        this.readings=[];
        for(let i=0;i<this.rays.length;i++){
            this.readings.push(
                this.#getReading(this.rays[i], arenaBorders,agents,booms)
            );
        }
    }

    #getReading(ray,arenaBorders,agents,booms){
        let touches=[];

        // Detecção de bordas e paredes (Tipo 4)
        for(let i=0;i<arenaBorders.length;i++){
            const value=getIntersection(
                ray[0],
                ray[1],
                arenaBorders[i][0],
                arenaBorders[i][1]
            );
            if(value){
                value.type += 4; //+4 do tipo
                touches.push(value);
            }
        }

        // Detecção de outras naves (Tipo 2)
        for(let i=0;i<agents.length;i++){
            const poly=agents[i].polygon;
            for(let j=0;j<poly.length;j++){
                const value=getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j+1)%poly.length]
                );
                if(value){
                    //value.score = agents[i].score;
                    value.type += 2; //+2 do tipo
                    touches.push(value);
                }
            }
        }

        // Detecção de bombas (Tipo 1)
        for (let i=0;i<booms.length;i++) {
            const poly=booms[i].getCircle();
            for(let j=0;j<poly.length;j++){
                const value=getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j+1)%poly.length]
                );
                if(value){
                    value.type += 1; //+1 do tipo
                    touches.push(value);
                }
            }
        }

        if(touches.length==0){
            return null;
        }else{
            const offsets=touches.map(e=>e.offset);
            const minOffset=Math.min(...offsets);
            return touches.find(e=>e.offset==minOffset);
        }
        
    }

    #castRays(){
        this.rays=[];
        const start={x:this.agent.x, y:this.agent.y};
        var rayAngle, end;
        for(let i=0;i<this.rayCount;i++){
            rayAngle=lerp(
                this.raySpread/2,
                -this.raySpread/2,
                this.rayCount==1?0.5:i/(this.rayCount-1)
            )+this.agent.angle;
    
            end={
                x:this.agent.x-Math.sin(rayAngle)*this.rayLength,
                y:this.agent.y-Math.cos(rayAngle)*this.rayLength
            };
            this.rays.push([start,end]);
        }
    }

    draw(ctx){
        for(let i=0;i<this.rays.length;i++){
            let end=this.rays[i][1];
            if(this.readings[i]){
                end=this.readings[i];
            }

            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.strokeStyle="yellow";
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.strokeStyle="black";
            ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
            ctx.lineTo(end.x,end.y);
            ctx.stroke();
        }
    }        
}
