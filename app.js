const express = require('express');
const app = express();
const axios = require('axios');
const protobuf = require('protobufjs');
let temp = new Uint8Array;
let isResolved;
app.get('/', (req, res, next) => {
    res.status(200).json({
        health:'healthy',
        endpoints : ['townhalltouni', 'rydetotownhall', 'townhalltoryde']
    });
    temp = axios.get('https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses',
    {
        headers:{
            "Authorization" : "apikey Qc9idalrWCIhYSKgNA0AVDFYXFOuaStWG66W"
        },
        responseType:"arraybuffer"
    })
    isResolved = false;
    temp.then(function() {
        isResolved = true;
    });
});
app.get('/vehicleid/:tripid', (req, res) => {
    // req.params.id
    axios.get('https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/buses',
        {
        headers:{
        "Authorization" : "apikey Qc9idalrWCIhYSKgNA0AVDFYXFOuaStWG66W"
                },
            responseType:"arraybuffer"
        }
            )
    .then(resp => 
        protobuf.load("gtfs-realtime.proto", function(err, root) {
            if (err)
            throw err;
            var FeedMessage = root.lookupType("transit_realtime.FeedMessage");
            var message = FeedMessage.decode(resp.data);
            // FeedMessage.toObject(message)
            var bigobj = FeedMessage.toObject(message);
            console.log(bigobj)
            console.log("start")            
            var individualobj = bigobj.entity.filter((x) =>{ 
                console.log(x.id)
                return x.id == req.params.tripid});
            console.log("end")            

            console.log(individualobj);
            res.json({response: individualobj.map(function(d) {
                return {
                    id: d.id,
                    positionLat: d.vehicle.position.latitude,
                    positionLong: d.vehicle.position.longitude,
                    occupancyStatus: d.vehicle.occupancyStatus
                        };
                    })
            });
        }));
});


// 1 is townhall
// 2 is ryde
// 3 is uni

//7 is ryde -> townhall
//8 is townhall -> uni

app.get('/townhalltouni', (req, res) => {

    axios.get('https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses',
    {
        headers:{
            "Authorization" : "apikey Qc9idalrWCIhYSKgNA0AVDFYXFOuaStWG66W"
        },
        responseType:"arraybuffer"
    }).then(resp => protobuf.load("gtfs-realtime.proto", function(err, root) {
            if (err)
            throw err;
            var FeedMessage = root.lookupType("transit_realtime.FeedMessage");
            var message = FeedMessage.decode(resp.data);
            FeedMessage.toObject(message)
            res.json({response: FilterData(FeedMessage.toObject(message), 8,3)});
    }));
});


app.get('/rydetotownhall', (req, res) => {

    axios.get('https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses',
    {
        headers:{
            "Authorization" : "apikey Qc9idalrWCIhYSKgNA0AVDFYXFOuaStWG66W"
        },
        responseType:"arraybuffer"
    }).then(resp => protobuf.load("gtfs-realtime.proto", function(err, root) {
            if (err)
            throw err;
            var FeedMessage = root.lookupType("transit_realtime.FeedMessage");
            var message = FeedMessage.decode(resp.data);
            FeedMessage.toObject(message)
            res.json({response: FilterData(FeedMessage.toObject(message), 7,1)});
    }));
});

app.get('/townhalltoryde', (req, res) => {

    axios.get('https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses',
    {
        headers:{
            "Authorization" : "apikey Qc9idalrWCIhYSKgNA0AVDFYXFOuaStWG66W"
        },
        responseType:"arraybuffer"
    }).then(resp => protobuf.load("gtfs-realtime.proto", function(err, root) {
            if (err)
            throw err;
            var FeedMessage = root.lookupType("transit_realtime.FeedMessage");
            var message = FeedMessage.decode(resp.data);
            FeedMessage.toObject(message)
            res.json({response: FilterData(FeedMessage.toObject(message), 7, 2)});
    }));
});

module.exports = app;

function FilterData (FeedMessageObject, tripVariation, tripDestination){
            var filteredRoutes =  (FeedMessageObject.entity.filter((x) => {
                let arr = x.id.split("_")
                switch (tripVariation){
                    case 7:
                        return arr[3] == "518" || arr[3] == "M52" || arr[3] == "515" || arr[3] == "520"
                    case 8:
                        return arr[3] == "392" || arr[3] == "394" || arr[3] == "396" || arr[3] == "397" || arr[3] == "399" 
                }
                }))
  
            var filteredDirectionalRoutes =  (filteredRoutes.filter((x) => {
                if(x.tripUpdate.stopTimeUpdate){
                    let length = x.tripUpdate.stopTimeUpdate.length;
                    let arr = x.tripUpdate.stopTimeUpdate[length-1];
                    switch(tripDestination){
                            // 1 is townhall
                            // 2 is ryde
                            // 3 is uni
                        case 1:
                            return arr.stopId == "200059" || arr.stopId == "2000249";
                        case 2:
                            return arr.stopId == "2150119" || arr.stopId == "211316" || arr.stopId == "212214" || arr.stopId == "211230";
                        case 3:
                            return arr.stopId == "203560" || arr.stopId == "2036119" || arr.stopId == "2035115" || arr.stopId == "203622"; 
                    }
                }
                }))
                var startStop = 0;
                switch(tripDestination){
                    case 1: 
                        startStop = 211220;
                        break;
                    case 2: 
                        startStop = 2000252;
                        break;
                    case 3: 
                        startStop = 200073;
                        break;
                }
                console.log(startStop);
            return smallData = filteredDirectionalRoutes.map(function(d) {
                return {
                    id: d.id,
                    ArrivalTime: d.tripUpdate.stopTimeUpdate.filter((x) => {
                        if (x.stopId == startStop) {
                            return x.arrival.time.low;
                        }
                    })
                };
            }).filter((x) => x.ArrivalTime.length > 0);
}