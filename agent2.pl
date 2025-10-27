% Ovni 2
:- module(agent2, [obter_controles/2]).

%%% Explicação:
% -=- Sensores: -=-
% X: posição horizontal do agente
% Y: posiçao vertical do agente
% ANGLE: angulo de inclinacao do agente: 0 para virado para frente até PI*2 (~6.28)
% Sensores: olhe em "doc/info.png"
%   S1,S2,S3,S4,S5,S6,S7,S8,S9,S10: valores de 0 à 1, indicando a distância até o item identificado
%   ST1,ST2,ST3,ST4,ST5,ST6,ST7,ST8,ST9,ST10: tipo de objeto do sensor, 1: bomba, 2: agente e 4: parede
% SCORE: inteiro com a "vida" do agente. Em zero, ele perdeu
% SPEED: velocidade do agente
% SHIELD: força do escudo
% X_OFF, Y_OFF: Posições X e Y da Oficina
% -=- Controles: -=-
% [FORWARD, REVERSE, LEFT, RIGHT, BOOM, MSG]
% FORWARD: 1 para acelerar e 0 para continuar a velocidade atual
% REVERSE: 1 para desacelerar e 0 para continuar a velocidade atual
% LEFT: 1 para ir pra esquerda e 0 para não ir
% RIGHT: 1 para ir pra direita e 0 para não ir
% BOOM: 1 para tentar disparar (BOOM). Obs.: ele só pode disparar uma bala a cada segundo
% MSG: mensagem que voltará para o servidor. Pode usar para debugar: controls.js, linha 35

%%% Faça seu codigo a partir daqui. Você deve ter sempre o predicado:
%%%% obter_controles(
%%%%       [X,Y,ANGLE,
%%%%        S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,
%%%%        ST1,ST2,ST3,ST4,ST5,ST6,ST7,ST8,ST9,ST10,
%%%%        SCORE,SPEED,SHIELD,X_OFF, Y_OFF],
%%%%       [FORWARD, REVERSE, LEFT, RIGHT, BOOM, MSG]
%%%% ) :- ...

troca(0, 1).
troca(1, 0).

% Predicado auxiliar de distância
distancia(X1, Y1, X2, Y2, D) :-
    D is sqrt((X1 - X2)^2 + (Y1 - Y2)^2).
% Exemplo de uso da distância com raio de 50:
% oficina(X, Y, X_OFF, Y_OFF) :- distancia(X, Y, X_OFF, Y_OFF, D), D < 50, format('Estou na oficina').

% [FORWARD, REVERSE, LEFT, RIGHT, BOOM, MSG]
obter_controles(
    [X, Y, ANGLE,
     S1, S2, S3, S4, S5, S6, S7, S8, S9, S10,
     ST1,ST2,ST3,ST4,ST5,ST6,ST7,ST8,ST9,ST10,
     SCORE, SPEED, SHIELD, X_OFF, Y_OFF],
    [FORWARD, REVERSE, LEFT, RIGHT, BOOM, MSG]
) :-
    random_between(0,1,AA),
    troca(AA, BB),
    random_between(0,1,CC),
    FORWARD is AA,
    REVERSE is 0,
    LEFT is AA,
    RIGHT is BB,
    BOOM is CC,
    ST = [ST1,ST2,ST3,ST4,ST5,ST6,ST7,ST8,ST9,ST10],
    obter_mensagem(ST, [], MSG).

% Para evitar erros:
obter_controles(_, [0,0,0,0,0,"nenhuma regra aplicada"]).

% base:
obter_mensagem([], MSG_AUX, MSG) :-
    reverse(MSG_AUX, MSG_INV),
    atomics_to_string(MSG_INV, "][", CORPO),
    string_concat("[", CORPO, TEMP),
    string_concat(TEMP, "]", MSG).
% passos:
obter_mensagem(ST, MSG_AUX, MSG) :-
    [H|T] = ST,
    analisa(H, AUX),
    obter_mensagem(T, [AUX|MSG_AUX], MSG).

% predicados:
analisa(1, "bomba") :- !.
analisa(2, "ovni") :- !.
analisa(4, "parede") :- !.
analisa(_, "") :- !.
