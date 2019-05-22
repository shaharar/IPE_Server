var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var DButilsAzure = require('../DButils');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

module.exports = router;

router.get('/getPOIByID/:id', function(req,res) {
    var poiID = req.params.id;
    var query1 = "SELECT * FROM POIs where ID = '" + poiID + "'";
    DButilsAzure.execQuery(query1)
        .then(function(result){
            if(result.length != 0) {
                var query2 = "update POIs set UsersWatching=" + (result[0].UsersWatching + 1) + " where ID ='" + poiID + "'";
                DButilsAzure.execQuery(query2)
                    .then(function(result){
                        var query3 = "SELECT * FROM POIs where ID = '" + poiID + "'";
                        DButilsAzure.execQuery(query3)
                            .then(function(result){
                                res.status(200).send(result)
                            })
                    })
            }
            else {
                res.status(400).send({success: false, message: "POI ID is invalid"})
            }
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })
})

router.get('/getAllPOIs', function(req,res) {
    var query1 = "SELECT * FROM POIs";
    DButilsAzure.execQuery(query1)
        .then(function(result){
            if(result.length != 0) {
                res.status(200).send(result)
            }
            else {
                res.status(400).send({success: false, message: "There are no POIs"})
            }
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })
})

router.get('/getPOIByName/:name', function(req,res) {
    var poiName = req.params.name;
    var query1 = "SELECT * FROM POIs where Name = '" + poiName + "'";
    DButilsAzure.execQuery(query1)
    .then(function(result){
        if(result.length != 0) {
            res.status(200).send(result)
        }
        else {
            res.status(400).send({success: false, message: "POI Name is invalid"})
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

router.post('/addRank/', function (req, res) {
    var username = req.decoded.payload.username;
    var poiID = req.body.ID;
    var rank = req.body.Rank;
    var review = req.body.Review;
    var currDate = new Date().toISOString();
    var totalRanks = 0;
    var query1 = "insert into POIsReviews (POI_ID,Username,Rank,Review,Date) VALUES (" + poiID + "," + "'" + username + ",'" + + rank + ",'" + review + "','" + currDate + "')";
    DButilsAzure.execQuery(query1)
    .then(function (result) {
        var query2 = "SELECT Rank from POIsReviews where POI_ID = " + poiID;
        DButilsAzure.execQuery(query2)
        .then(function (result) {
        for (let i = 0; i < result.length; i++) {
            totalRanks += result[i].Rank;
        }
        var avgRank = (totalRanks / (result.length));
        var newRank = (avgRank / 5) * 100;

        var query3 = "update POIs set Rank = " + newRank + " where ID = " + poiID;
        DButilsAzure.execQuery(query3)
        .then(function (result) {
            res.status(200).send({success: true, message: "Review added successfuly"})            
        })
    }).catch(function (err) {
        res.send(err);
    })
    }).catch(function(err) {
        res.status(400).send({success: false, message: "This POI already has this review from this user"})
    })   
})

router.get('/getFavoritesPOIsOfUser/', function(req,res) {

    var username = req.decoded.payload.username;

    var query1 = "SELECT POI_ID from FavoritesPOIs where Username = '" + username + "'";
    DButilsAzure.execQuery(query1)
    .then(function (result) {
        if(result.length == 0) {
            res.status(400).send({success: false, message: "There are no favorites POIs for this user"})
            return
        }
        else if(result.length < 2) {
                res.status(400).send({success: false, message: "There is only one favorite POI - should be at least two"})
                return
        }
        else {
            for (let i = 0; i < result.length; i++) {
                var query2 = "SELECT * FROM POIs where ID = '" + poiID + "'";
                DButilsAzure.execQuery(query2)
                    .then(function(result){
                        if(result.length != 0) {
                            res.status(200).send(result)
                        }
                        else {
                            res.status(400).send({success: false, message: "POI ID is invalid"})
                        }
                    })
                    .catch(function(err){
                        console.log(err)
                        res.send(err)
                    })
            }
        }
    })
})