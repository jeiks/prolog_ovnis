% Controle dos Agentes
:- module(agent_controls, [vez/3]).

% deve existir um arquivo com o nome "agent1.pl" ou "agent1.pro" com o predicado obter_controles/2
:- use_module(agent1, [obter_controles/2 as obter_controles1]).

% deve existir um arquivo com o nome "agent2.pl" ou "agent2.pro" com o predicado obter_controles/2
:- use_module(agent2, [obter_controles/2 as obter_controles2]).

% Exemplo de mais um agente (adicione também o "vez" dele lá embaixo):
%:- use_module(agent3, [obter_controles/2 as obter_controles3]).

% sempre deve-se iniciar pelo zero (1)
vez(1, SENSORES, CONTROLES) :- obter_controles1(SENSORES,CONTROLES).
vez(2, SENSORES, CONTROLES) :- obter_controles2(SENSORES,CONTROLES).

% Exemplo de mais um agente:
%vez(3, SENSORES, CONTROLES) :- obter_controles3(ENSORES,CONTROLES).

