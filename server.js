var express = require("express"),
    app = express();
var ErgastClient = require('ergast-client'),
    ergast = new ErgastClient();
var Request = require("request");

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


// Example API-Request
// Request.get("http://ergast.com/api/f1/2011/5/laps.json?limit=0", (error, response, body) => {
//     if(error) {
//         return console.log(error);
//     }
//     var jsonObj = JSON.parse(body)
//     console.log(jsonObj.MRData)
// });


// require("cf-deployment-tracker-client").track();
