var express = require("express"),
    app = express();
var ErgastClient = require('ergast-client'),
    ergast = new ErgastClient();
var Request = require("request");
var async = require("async");

var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));

// app.get("/sayHello", function (request, response) {
//   var user_name = request.query.user_name;
//   response.end("Hello " + user_name + "!");
// });

app.listen(port);
console.log("Listening on port ", port);


// Example sending data to html
app.get('/testData', function(req, res){
  var yValues = ['W', 'X', 'Y', 'Z'];
  res.send(yValues);
});



ergast.getRaceResults(2004, 1, function(err, raceResults) {
  if (!err) console.log(timestampToMillis(raceResults.driverResults[0].fastestLap.time.time))
});

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

//callback
// qFisherYates.drain = function() {
//     console.log('all items have been processed');
//     console.log(raceResults);
// };

for (var i = 0; i < 15; i++) {
  var year = 2004+i;
  yearArray.push("|"+year+"|");
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

  for(var i=0; i < results.length; i++){
    var circuitInfos = results[i].Circuit.Location;
    var resultInfos = results[i].Results;

    if(circuitInfos.locality == requestedRaceLocality && circuitInfos.country == requestedRaceCountry){
      for(var k=0; k < resultInfos.length; k++){
        yatesShuffleStart.push(resultInfos[k].position);
        yatesShuffleEnd.push(resultInfos[k].grid);
      }
    }
  }

  res.send({start:yatesShuffleStart, end:yatesShuffleEnd});
  // res.send({raceNames:raceNames, fastestLaps:fastestLaps, year:yearArray});
});
//END FISHER YATES SHUFFLE (RaceResult & QualResult)


// Example API-Request
// Request.get("http://ergast.com/api/f1/2011/5/laps.json?limit=0", (error, response, body) => {
//     if(error) {
//         return console.log(error);
//     }
//     var jsonObj = JSON.parse(body)
//     console.log(jsonObj.MRData)
// });


// require("cf-deployment-tracker-client").track();
