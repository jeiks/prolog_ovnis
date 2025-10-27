///// >>>>>>>>>> NÃO mexa nessas linhas: <<<<<<<<<<
let windowHeight=$(window).height(),
    windowWidth=$(window).width(),
    lastUpdateScore=Date.now(),
    prologAgentsIDs=0, timeForUpdatingProlog=200;
const canvas=document.getElementById("myCanvas");
canvas.width=800; // Arena's Width;
canvas.height=600; // Arena's Height;
const ctx=canvas.getContext("2d"),
      background=new Image();
background.src='sky.jpg'; //from Gemini
const dummyAgentNames = /*from chatGPT*/[ "Boladão", "Rabugento", "Trovão", "Bagunceiro", "Marrento", "Trambiqueiro", "Espertinho", "Sorriso", "Soneca", "Maluco", "Zé Bala", "Trapalhão", "Fofinho", "Dengoso", "Terremoto", "Estabanado", "Cuspidor de Fogo", "Doidivanas", "Trovador", "Curioso", "Esquentadinho", "Pestinha", "Trapaceiro", "Esperto", "Relâmpago", "Roncador", "Surpresa", "Malandrinho", "Borbulhante", "Folgado", "Trovão Azul", "Espião", "Explosivo", "Cabeça de Vento", "Malabarista", "Tristonho", "Saltitante", "Dorminhoco", "Felpudo", "Arrasador", "Espirra-Água", "Trapaceiro", "Esquentado", "Reluzente", "Fofoqueiro", "Torpedo", "Dente de Leão", "Terrível", "Sapeca", "Bate-Papo", "Barulhento", "Faísca", "Linguarudo", "Abobalhado", "Bagunceiro", "Furacão", "Tagarela", "Artilheiro", "Engraçadinho", "Furioso", "Bicudo", "Mágico", "Espanta-Mosquito", "Ziguezague", "Estiloso", "Brincalhão", "Trancado", "Bagunçado", "Sorridente", "Tornado", "Desastrado", "Malabarista", "Mala Sem Alça", "Borbulhante", "Dorminhoco", "Trovão Azul", "Risadinha", "Bagunceiro", "Barulhento", "Fofinho", "Sorriso Largo", "Reluzente", "Esperto", "Arrepiante", "Mexeriqueiro", "Estelar", "Roncador", "Zigzag", "Fanfarrão", "Bate-Papo", "Trapaceiro", "Estourado", "Espirra-Água", "Bagunceiro", "Bagunça", "Trovador", "Saltitante", "Cabeça de Vento", "Veloz" ];
// velocidade máxima, borda da arena, tamanho do agente, vida do agente
const maxSpeed=2, arenaPadding=10, agentW=50, agentH=40, score=100;
// tamanho e velocidade da bomba (se for baixa, o agente vai acertar ele mesmo ao disparar):
const bombSize=3, bombMaxSpeed=maxSpeed+1;
let dummyAgents=10, humanAgent=true, prologAgents=[], showSensors=false, showSensorsOfDummyAgents=false;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//// --==========================================================--
//// --======-- Essa área pode ser configurada por você: --======--
dummyAgents = 10; // quantidade de agentes aleatórios (Java Script)
humanAgent = true; // modifique (true OU false) para ter um agente controlado pelo teclado ou não

// nome dos agentes controlados por Prolog (obs.: tem que adaptar o 'servidor.pl' ao mexer aqui), pois
// a quantidade é referente a quantidade de nomes. Obs.: na falta de criatividade, o nome pode repetir... rs
// exemplo de dois agente:
//prologAgents=["Ligerin", "ApagaFogo"];
// exemplo de um agente:
//prologAgents=["Ligerin"];
// Nenhum agente:
//prologAgents=[]; //se não quiser nenhum agente Prolog, faça assim ou só comente essa variável

// Deixar os Sensores visíveis:
showSensors = false; //modifique (true OU false) para mostrar ou não os sensores dos agentes PROLOG e KEYS
showSensorsOfDummyAgents = false; //modifique (true OU false) para mostrar ou não os sensores dos agentes DUMMY
//// --============================================================--
//// --============================================================--


//// ---------------------------------------------------------
//// >>>>>>>>>>>>    NÃO mexa daqui para baixo:    <<<<<<<<<<<
//// ---------------------------------------------------------
// Definição da Oficina (Coordenadas definidas igualmente em 'servidor.pl') ---
const repairZone = {x: 390, y: 260, radius: 50, color: 'rgba(46, 13, 122, 0.3)' };
// Definição da arena:
const arena = new Arena(canvas.height, canvas.width, arenaPadding), _colors = new Colors(0);
// Definição dos agentes:
var agents = [];
if (humanAgent) agents.push(newAgent("KEYS"));
for (let i=0;i<prologAgents.length;i++) agents.push(newAgent("PROLOG"));
for (let i=0;i<dummyAgents;i++) agents.push(newAgent("DUMMY"));
// Definição dos tiros (bombas):
var allBOOMS = new Array(), lastBullet = new Array(agents.length);
for (let i=0;i<lastBullet.length;i++) lastBullet[i] = 0;

animate();

// controls: ["DUMMY", "KEYS", "PROLOG"]
function newAgent(controls="DUMMY") {
    let pos = getPosition(), name, id=-1;
    switch(controls) {
        case "PROLOG":
            name=prologAgents[prologAgentsIDs];
            id=prologAgentsIDs++;
            break;
        case "DUMMY":
            name=dummyAgentNames[Math.round(Math.random()*dummyAgentNames.length)%dummyAgentNames.length];
            break;
        case "KEYS":
            name="Humano";
            break;
    }
    return new Agent(pos.x, pos.y, agentH, agentW,
                     canvas.height, canvas.width,
                     arenaPadding, controls,maxSpeed,
                     _colors.getColor(), score,
                     (controls=="PROLOG")?id:-1,
                     name, timeForUpdatingProlog);
}

function getPosition() {
    let agentPadding = arenaPadding+Math.max(agentH, agentW);
    let x = parseInt(Math.random()*(canvas.width-agentPadding*2)+agentPadding),
        y = parseInt(Math.random()*(canvas.height-agentPadding*2)+agentPadding);
    return {x:x, y:y};
}

function getScores() {
    let ret = {scores:new Array(agents.length), winner:undefined}, aux;
    aux = 0;
    for (let i=0;i<agents.length;i++) {
        ret.scores[i]=agents[i].score;
        if (agents[i].score > 0)
            if (aux++ == 0) ret.winner = i;
            else ret.winner = undefined;
    }
    return ret;
}

function updateScoresDiv(scores) {
    let e = $('#id_score');
    e.empty();
    if (scores.winner != undefined) {
        $('#id_winner').text("Vencedor: Agente "+scores.winner+
                             " ("+agents[scores.winner].name+","+agents[scores.winner].controlType+")");
        $('#id_km').hide();
    }else{
        lastUpdateScore = Date.now();
        for (let i=0;i<scores.scores.length;i++){
            e.append('<label style="color:'+agents[i].color+';">'+agents[i].name+': '+Math.round(scores.scores[i])+'</label>');
        }
    }
}

$('#kmdiv').toggle();
updateScoresDiv(getScores());
document.addEventListener("keydown",function(event) {
    switch(event.key){
        case "s":
            $('#kmdiv').toggle();
            break;
    }
});

function updateCanvas(){
    // Updating booms (removing deactivted ones)
    var newBooms = new Array();
    for (let i=0;i<allBOOMS.length;i++){    
        if (!allBOOMS[i].deactivated)
            newBooms.push(allBOOMS[i]);
    }
    allBOOMS = newBooms;

    // Updating agents
    for(let i=0;i<agents.length;i++){
        // Agents list :
        let newAgents = new Array();
        for(let j=0;j<agents.length;j++){
            if (i!=j) newAgents.push(agents[j]);
        }
        // Para cada agente, vamos checar a posição e se quer atirar:
        let [ag_boom, ag_x, ag_y, ag_angle] =
             agents[i].update(arena.borders, newAgents, allBOOMS, repairZone),
             ag_color = agents[i].color;
        // If it goes more than 1000 milliseconds after the last bomb, it can fire again
        if (ag_boom && Math.abs(lastBullet[i]-Date.now())>1000) {
            let bomb = new Boom(ag_x, ag_y, ag_angle, Math.max(agentH, agentW), ag_color,
                                bombSize, bombMaxSpeed);
            lastBullet[i]=Date.now();
            allBOOMS.push(bomb);
        }
    }
    // bombs update:
    for (let i=0;i<allBOOMS.length;i++){
        allBOOMS[i].update(arena.position);
    }
}

function animate(){
    var scores = getScores();
    var runFinished = scores.winner != undefined;
    if ((Date.now() - lastUpdateScore) > 1000)
        updateScoresDiv(scores);
    
    updateCanvas();

    ctx.save();
    arena.draw(ctx, background);
    
    // Desenha a Oficina
    ctx.beginPath();
    ctx.arc(repairZone.x, repairZone.y, repairZone.radius, 0, 2 * Math.PI);
    ctx.fillStyle = repairZone.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(13, 3, 36, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    //

    for(let i=0;i<agents.length;i++){
        if (agents[i].controlType == "DUMMY")
            agents[i].draw(ctx, showSensorsOfDummyAgents);
        else
            agents[i].draw(ctx, showSensors);
    }
    for (let i=0;i<allBOOMS.length;i++){
        if (allBOOMS[i] != undefined)
            allBOOMS[i].draw(ctx);
    }

    ctx.restore();

    var newAgents = new Array();
    for(let i=0;i<agents.length;i++){
        if (agents[i].score > 0) newAgents.push(agents[i]);
    }
    agents = newAgents;

    if (runFinished) {
        scores = getScores();
        updateScoresDiv(scores);
        updateScoresDiv = function(){};
        $('#kmdiv').show();
    }else{
        requestAnimationFrame(animate);
    }
}
