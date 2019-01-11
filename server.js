var express = require("express"),
    app = express();
var ErgastClient = require('ergast-client'),
    ergast = new ErgastClient();
var Request = require("request");
var async = require("async");
const fs = require('fs');
// const csv = require('fast-csv');

var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));

// app.get("/sayHello", function (request, response) {
//   var user_name = request.query.user_name;
//   response.end("Hello " + user_name + "!");
// });

app.listen(port);
console.log("Listening on port ", port);



function timestampToMillis(timeStamp){
  var split1 = timeStamp.split(":")
  var split2 = split1[1].split(".")
  return split1[0]* 60000 + split2[0] * 1000 + Number(split2[1]);
}


// HEATMAP FASTEST LAPTIMES:
var raceNames = [];
var yearArray = [];
var fastestLaps = [];

var q = async.queue(function(task, callback) {
  Request.get(task.url, (error, response, body) => {
      if(error) {
          return console.log(error);
      }
      var jsonObj = JSON.parse(body);
      var races = jsonObj.MRData.RaceTable.Races;

      for (var i = 0, len = races.length; i < len; i++) {
        var locality = races[i].Circuit.Location.locality;
        var country = races[i].Circuit.Location.country;
        var raceName = locality+", "+country;
        // var indexOfRace =
        if(raceNames.indexOf(raceName) == -1){
          raceNames.push(raceName);
          fastestLaps[raceNames.indexOf(raceName)] = [];
        }

        var fastestLap;
        try{
          fastestLap = timestampToMillis(races[i].Results[0].FastestLap.Time.time);
        } catch(e){
          fastestLap = "";
        }

        fastestLaps[raceNames.indexOf(raceName)][task.counter] = fastestLap;
      }
      // console.log(raceNames);
      // console.log(fastestLaps);
  });
  callback();
}, 5);


for (var i = 0; i < 15; i++) {
  var year = 2004+i;
  yearArray.push("|"+year+"|");
  var requestURL = "http://ergast.com/api/f1/"+year+"/results/1.json"
  q.push({ url: requestURL, counter:i }, function(err) {
    // console.log('finished processing #'+i);
  });
}

app.get('/fastestLapsHeatmap', function(req, res){
  res.send({raceNames:raceNames, fastestLaps:fastestLaps, year:yearArray});
});
//END HEATMAP FASTEST LAPTIMES




// FISHER YATES SHUFFLE (RaceResult & QualResult):
var raceResults = {};
var qFisherYates = async.queue(function(task, callback) {
  Request.get(task.url, (error, response, body) => {
      if(error) {
          return console.log(error);
      }
      var jsonObj = JSON.parse(body);
      var races = jsonObj.MRData.RaceTable.Races;
      raceResults[task.year] = races;
      // {
      //   year:task.year
      //   task.year:races
      // };

  });
  callback();
}, 5);


for (var i = 0; i < 15; i++) {
  var year = 2004+i;
  // yearArray.push("|"+year+"|");
  var requestURL = "http://ergast.com/api/f1/"+year+"/results.json?limit=1000";
  qFisherYates.push({ url: requestURL, year:year }, function(err) {
    // console.log('finished processing #'+i);
  });
}

app.get('/getDetailsViewData', function(req, res){
  var yatesShuffleStart = [];
  var yatesShuffleEnd = [];

  var requestedYear = yearArray[req.query.yearIndex].substring(1, 5);
  var tmp = raceNames[req.query.raceIndex].split(/[ ,]+/);
  var requestedRaceCountry = tmp[1];
  var requestedRaceLocality = tmp[0];
  var results = raceResults[requestedYear]
  var laptimes;
  var places;

  // FISHER YATES
  for(var i=0; i < results.length; i++){
    var circuitInfos = results[i].Circuit.Location;
    var resultInfos = results[i].Results;
    var raceRound;

    if(circuitInfos.locality == requestedRaceLocality && circuitInfos.country == requestedRaceCountry){
      for(var k=0; k < resultInfos.length; k++){
        yatesShuffleStart.push(resultInfos[k].position);
        yatesShuffleEnd.push(resultInfos[k].grid);

        raceRound = results[i].round; // Prüfen, welche "round" des Jahres angeklickt wurde
        laptimes = getLaptimesOfRace(requestedYear, raceRound);
        places = getPlacesOfRace(requestedYear, raceRound);
      }
    }
  }

  res.send({start:yatesShuffleStart, end:yatesShuffleEnd, laptimes:laptimes, places:places});
  // res.send({raceNames:raceNames, fastestLaps:fastestLaps, year:yearArray});
});
//END FISHER YATES SHUFFLE (RaceResult & QualResult)



// LAPTIMES DETAILS
// var jsonFile = fs.createReadStream("f1db_csv/laptimes/2004_1.json");
function getLaptimesOfRace(year, round){
  var path = "f1db_csv/laptimes/"+year+"_"+round+".json"
  var jsonFile = fs.readFileSync(path);
  jsonFile = JSON.parse(jsonFile);

  var tracesArray = [];
  //sonderfall i=0; nicht mit vorgänger vergleichbar:
  var trace = {};
  trace.y = [];
  trace.y.push(jsonFile[0].milliseconds);
  var name = jsonFile[0].forename + " " + jsonFile[0].surname;
  trace.name = name;

  for(i=1; i<jsonFile.length; i++){
    var nameOld = jsonFile[i-1].forename + " " + jsonFile[i-1].surname;
    var nameAct = jsonFile[i].forename + " " + jsonFile[i].surname;
    if(nameOld == nameAct){
      trace.y.push(jsonFile[i].milliseconds);
    }else{
      tracesArray.push(trace);
      trace = {}; // leeren
      trace.y = []; // leeren
      trace.y.push(jsonFile[i].milliseconds);
      trace.name = nameAct;
    }
  }
  tracesArray.push(trace);
  return tracesArray;
}



// Platzierung DETAILS
function getPlacesOfRace(year, round){
  var path = "f1db_csv/platzierung/"+year+"_"+round+".json"
  var jsonFile = fs.readFileSync(path);
  jsonFile = JSON.parse(jsonFile);

  return jsonFile;
}

// console.log(getLaptimesOfRace(2004,1));





// var stream = fs.createReadStream("f1db_csv/races.csv");
//
// var csvStream = csv
//     .parse()
//     // .fromStream(stream, {headers : ["raceId","year","round","circuitId","name","date","time","url"]})
//     // .fromStream(stream, {headers : true})
//     // .validate(function(data){
//     //   return data[1] <= 2004; //all persons must be under the age of 50
//     // })
//     .on("data", function(data){
//          // console.log(data);
//          split = data[0].split(',')
//          console.log(split[1])
//     })
//     .on("end", function(){
//          console.log("done");
//     });
//
// stream.pipe(csvStream);



// LAPTIMES
// var raceResults = {};
// var lapTimes = [];
// var qLapTimes = async.queue(function(task, callback) {
//   Request.get(task.url, (error, response, body) => {
//       if(error) {
//           return console.log(error);
//       }
//       var jsonObj = JSON.parse(body);
//       console.log(jsonObj);
//       var laps = jsonObj.MRData.RaceTable.Races[0].Laps;
//
//       for(i=0; i<laps.length; i++){
//         lapTimes.push(laps.Timings[0].time);
//       }
//       console.log("Laptimes: "+lapTimes);
//       // raceResults[task.year] = races;
//       // {
//       //   year:task.year
//       //   task.year:races
//       // };
//
//   });
//   callback();
// }, 5);
//
//
// for (var i = 0; i < 15; i++) {
//   var year = 2004;
//   // yearArray.push("|"+year+"|");
//   var requestURL = "http://ergast.com/api/f1/"+year+"/5/laps/1.json";
//   qLapTimes.push({ url: requestURL, year:year }, function(err) {
//     // console.log('finished processing #'+i);
//   });
// }
