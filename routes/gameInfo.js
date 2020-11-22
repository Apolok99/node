// Moduls que necesitarem
const express = require('express');
const router = express.Router(); // creem una miniaplicació de aquesta ruta

const { isAuthenticated } = require("../helpers/auth");

// Variables locals del joc
global.playersCookies = []; // array de jugadors. Jugador={cookie, distancia xarxa}

global.playersReady = 0; // nombre de jugadors que estan preparats per a una ronda
global.inGame = false; // boolena que ens indica si la partida a començat
global.changeStatus = false; // variable de contenció

var playerPetitionsClick = []; // peticions dels jugadors per a una ronda. Jugador={cookie, data de recepció}
var position; // posició en que ha quedat un jugador en una ronda

// Variables dels timrers
var timeInter;
var timeAfterRound;
var timeRound;
var timeResults;
global.isInterTime = false;
global.isAfterRoundTime = false;
global.isRoundTime = false;
global.isResultsTime = false;

// Funció per comparar dos dates de recepció d'una petició
function custom_compare (a,b) {
  return a.value - b.value;
}

// HTTP GET (Loop del joc)
router.get('/gameinfo:', isAuthenticated, (req,res) => {
  // Només rebre la petició mirem en quin moment intern del servidor ha arribat
  let timeNow = Date.now();

  // Comrpovem si el jugador acaba d'entrar o no a la partida. Si es el primer cop, l'afegim a la llista de jugadors
  let cookie = req.cookies["connect.sid"];
  let isNewPlayer = playersCookies.find(element => element.vCookie == cookie);
  if (isNewPlayer == undefined){
    playersCookies.push({vCookie: cookie, time: 0});
  }

  // Actualització del estat del joc
  let messageSend = "Dona-li al botó de <Not Ready> per començar a jugar";
  let diffTime = 1;
  let timeSend;
  if (inGame){
    // Timer entre rondes
    if(isInterTime){
      messageSend = "Esta a punt de començar la ronda";
      diffTime = timeInter - timeNow;
      timeSend = diffTime;
    }
    else if(!isAfterRoundTime && !isRoundTime && !isResultsTime && !isInterTime) {
      timeInter = timeNow + 8000;
      isInterTime = true;
    }

    if(diffTime <= 0 && isInterTime){
      isInterTime = false;
    }

    // Timer abans de la ronda
    diffTime = 1;
    if(isAfterRoundTime){
      messageSend = "Ha començat la ronda! Estigues atent...";
      diffTime = timeAfterRound - timeNow;
      timeSend = diffTime;
    }
    else if(!isInterTime && !isRoundTime && !isResultsTime && !isAfterRoundTime) 
    {
      timeAfterRound = timeNow + Math.floor(Math.random() * 4000) + 4000;
      isAfterRoundTime = true;
    }

    if(diffTime <= 0 && isAfterRoundTime){
      isAfterRoundTime = false;
    }

    // Timer ronda
    diffTime = 1;
    if(isRoundTime){
      messageSend = "Corre clicka!!!!!!!!!!!!";
      diffTime = timeRound - timeNow;
      timeSend = diffTime;
    }
    else if(!isInterTime && !isAfterRoundTime && !isResultsTime && !isRoundTime) 
    {
      timeRound = timeNow + 4000;
      isRoundTime = true;
    }

    if(diffTime <= 0 && isRoundTime){
      isRoundTime = false;
    }

    // Timer ensenyant resultats
    diffTime = 1;
    if(isResultsTime){
      messageSend = "Mira els resultats";
      diffTime = timeResults - timeNow;
      timeSend = diffTime;
      playerPetitionsClick.sort(custom_compare);
      calculateRes = true;
      position = playerPetitionsClick.findIndex(element => element.name === cookie); 
    }
    else if(!isInterTime && !isAfterRoundTime && !isRoundTime && !isResultsTime) 
    {
      timeResults = timeNow + 4000;
      isResultsTime = true;
    }

    if(diffTime <= 0 && isResultsTime){ // reset de totes les variables d'una ronda
      isResultsTime = false;
      playersReady = 0;
      inGame = false;
      changeStatus = false;
      position = undefined;
      playerPetitionsClick = [];
    }
  }

  // Informació que enviem al jugador
  var info = {
    numPlayers: playersCookies.length,
    startGame: inGame,
    status: changeStatus,
    timer: timeSend,
    message: messageSend,
    results: position
  };

  res.contentType('application/json');
  var infoJSON = JSON.stringify(info);
  res.send(infoJSON);
});

// HTTP POST (Petició explicita jugador)
router.post('/gameinfo:', isAuthenticated, (req,res) => {
  // Guardem la informació que rebem del jugador
  let timeNow = Date.now();
  let readyBody = req.body.ready;
  let clickBody = req.body.click;
  let inGameBody = req.body.inGameHTML;
  let cookie = req.cookies["connect.sid"];
  let timeClientServer = req.body.timeClientServer;
  let indexPlayer = playersCookies.findIndex(element => element.vCookie === cookie);
  
  // El jugador passa de estar not ready a esperar a la resta de jugadors
  if(readyBody == false){
    playersReady++;
    changeStatus = true;
    playersCookies[indexPlayer].time = timeClientServer; // guardem la distancia en xarxa del client al servidor
  }

  // Comprovem que tots els jugadors estiguin llestos. Si ho estan, comencem la partida
  if(playersReady == playersCookies.length && playersCookies.length > 1 ){
    inGame = true;
  }

  // Si estem durant el joc, durant la ronda, i és el primer click que fem
  if(inGame && isRoundTime && !clickBody && inGameBody){
    playerPetitionsClick.push({name: cookie, value: timeNow-playersCookies[indexPlayer].time});
  }
  var info = [];
  res.contentType('application/json');
  var infoJSON = JSON.stringify(info);
  res.send(infoJSON);
});

module.exports = router;