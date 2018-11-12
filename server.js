var express = require("express"),
    app = express();
var ErgastClient = require('ergast-client'),
    ergast = new ErgastClient();

var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));

// app.get("/sayHello", function (request, response) {
//   var user_name = request.query.user_name;
//   response.end("Hello " + user_name + "!");
// });

app.listen(port);
console.log("Listening on port ", port);


// Get the information of the drivers of 2014
// ergast.getDrivers(2014, function(err, drivers) {
//     if (!err) console.log(drivers);
// });

// ergast.getLaps(2017, 1, function(err, laps) {
//   if (!err) console.log(laps);
// });

// ergast.getLap(2017, 1, 22, function(err, lap) {
//   if (!err) console.log(lap);
// });

ergast.getRaceResults(2004, 1, function(err, raceResults) {
  if (!err) console.log(raceResults.driverResults[0].fastestLap.time.time);
});

// ergast.getQualifyingResults(2010, 1, function(err, qualifyingResults) {
//   if (!err) console.log(qualifyingResults);
// });
// require("cf-deployment-tracker-client").track();
