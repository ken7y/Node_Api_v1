const express = require('express');
const app = express();
const axios = require('axios');
const protobuf = require('protobufjs');

app.get('/', (req, res, next) => {
    res.status(200).json({
        message:'it works'
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
            FeedMessage.toObject(message)
            var bigobj = FeedMessage.toObject(message);
            var individualobj = bigobj.entity.filter((x) =>{ return x.id == req.params.tripid});


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


app.get('/rydetotownhall', (req, res) => {
    axios.get('https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses',
        {
            headers:{
        "Authorization" : "apikey Qc9idalrWCIhYSKgNA0AVDFYXFOuaStWG66W"
            },
            responseType:"arraybuffer"
        })
    .then(resp => 
        protobuf.load("gtfs-realtime.proto", function(err, root) {
            if (err)
            throw err;
            var FeedMessage = root.lookupType("transit_realtime.FeedMessage");
            var message = FeedMessage.decode(resp.data);
            FeedMessage.toObject(message)
            res.json({response: testerino(FeedMessage.toObject(message))});
    }));
});

module.exports = app;


function testerino (FeedMessageObject){
            var filteredRoutes =  (FeedMessageObject.entity.filter((x) => {
                let arr = x.id.split("_")
                return arr[3] == "518" || arr[3] == "M52" || arr[3] == "515" || arr[3] == "520"
                }))

            var filteredDirectionalRoutes =  (filteredRoutes.filter((x) => {
                if(x.tripUpdate.stopTimeUpdate){
                    let length = x.tripUpdate.stopTimeUpdate.length;
                    let arr = x.tripUpdate.stopTimeUpdate[length-1];
                    return arr.stopId == "200059" || arr.stopId == "2000249";
                }
                }))
            return smallData = filteredDirectionalRoutes.map(function(d) {
                return {
                    id: d.id,
                    ArrivaleTime: d.tripUpdate.stopTimeUpdate.filter((x) => {
                        if (x.stopId === "211220") {
                            return x.arrival.time.low;
                        }
                    })
                };
            }).filter((x) => x.ArrivaleTime.length > 0);
}