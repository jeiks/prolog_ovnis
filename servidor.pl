%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Servidor em prolog

% Módulos:
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_files)).
:- use_module(library(http/json)).
:- use_module(library(http/http_json)).
:- use_module(library(http/json_convert)).
:- use_module(library(http/http_parameters)).
:- use_module(library(http/http_dirindex)).
:- use_module(library(http/http_path)).
:- use_module(library(http/http_server_files)).
%DEBUG:
%:- use_module(library(http/http_error)).
%:- debug.

:- use_module(agent_controls, [vez/3]).

% GET
:- http_handler(
    root(action), % Alias /action
    action,       % Predicado 'action'
    []).

:- http_handler(root(.), http_reply_from_files('.', []), [prefix]).

:- json_object
    controles(forward:integer, reverse: integer, left:integer, right:integer, boom:integer, msg: string).

% Coordenadas (X,Y) da Oficina (iguais do "main.js"):
local_oficina(390.0, 260.0).

start_server(Port) :-
    http_server(http_dispatch, [port(Port)]).

stop_server(Port) :-
    http_stop_server(Port, []).

action(Request) :-
    http_parameters(Request,
                    % sensores do agente:
                    [ id(VEZ, [integer]),
                      % posição:
                      x(X, [float]),
                      y(Y, [float]),
                      % ângulo de rotação:
                      angle(ANGLE, [float]),
                      % sensores de distância:
                      s1(S1, [float]),
                      s2(S2, [float]),
                      s3(S3, [float]),
                      s4(S4, [float]),
                      s5(S5, [float]),
                      s6(S6, [float]),
                      s7(S7, [float]),
                      s8(S8, [float]),
                      s9(S9, [float]),
                      s10(S10, [float]),
                      % identificação dos sensores:
                      st1(ST1, [integer]),
                      st2(ST2, [integer]),
                      st3(ST3, [integer]),
                      st4(ST4, [integer]),
                      st5(ST5, [integer]),
                      st6(ST6, [integer]),
                      st7(ST7, [integer]),
                      st8(ST8, [integer]),
                      st9(ST9, [integer]),
                      st10(ST10, [integer]),
                      % vida:
                      score(SCORE, [integer]),
                      % velocidade:
                      speed(SPEED, [float]),
                      % força do escudo:
                      shield(SHIELD_STRENGTH, [float])
                    ]),
    % Coordenadas da Oficina:
    local_oficina(X_OFICINA, Y_OFICINA),
    % juntando tudo em SENSORES:
    SENSORES = [X,Y,ANGLE,
                S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,
                ST1,ST2,ST3,ST4,ST5,ST6,ST7,ST8,ST9,ST10,
                SCORE,SPEED,SHIELD_STRENGTH,X_OFICINA,Y_OFICINA],
    % chamando o agente com o número VEZ
    VEZ_AUX is VEZ+1,
    vez(VEZ_AUX, SENSORES, CONTROLES),
    % separando os controles para formar a resposta json:
    CONTROLES = [FORWARD, REVERSE, LEFT, RIGHT, BOOM, MSG],
    % convertendo em json e respondendo ao GET do site:
    prolog_to_json( controles(FORWARD, REVERSE, LEFT, RIGHT, BOOM, MSG), JOut ),
    reply_json( JOut ).

start :- format('~n~n--========================================--~n~n'),
         start_server(8080),
         format('~n~n--========================================--~n~n').
:- initialization start.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
