var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var DButilsAzure = require('../DButils');
var jwt = require('jsonwebtoken');

var secret = "SAYH";


router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

module.exports = router;



router.use("/private", (req, res,next) => {
    const token = req.header("x-auth-token");
	// token not provided
	if (!token) res.status(401).send({success : false, message : "Access denied. No token provided"});
	// verify token
	try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
		next(); 
	} catch (exception) {
		res.status(400).send({success : false, message : "Invalid token", tokenRec: token});
    }
});

router.post("/get3RandomPOIs", function(req,res){
    console.log("test");
})

router.post("/private/saveFavoritePOIs", function(req,res){
    var username = req.decoded.username;
    DButilsAzure.execQuery("Delete from FavoritesPOIs where Username='" + username + "'").then(function (result) {
        var userFavorites = req.body.favorites;
        for (var i = 0; i < userFavorites.length; i++) {
            DButilsAzure.execQuery("insert into FavoritesPOIs (Username, POI_ID) VALUES"  + "('" + username + "','" + userFavorites[i] +  "')").then(function(result){
                console.log("Favorite added")
            })
        }
        res.status(200).send({success: true, message: "Favorites list was updated"});
    }).catch(function (err) {
        res.send(err);
    })

})

router.post("/private/get2POIsByCategories", function(req,res){
    console.log("test");
})


router.get('/getPOIByID/:id', function(req,res) {
    var poiID = req.params.id;
    var query1 = "SELECT * FROM POIs where ID = '" + poiID + "'";
    DButilsAzure.execQuery(query1)
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
                var query2 = "update POIs set UsersWatching=" + (result[0].UsersWatching + 1) + " where Name='" + poiName + "'";
                DButilsAzure.execQuery(query2)
                    .then(function(result){
                        var query3 = "SELECT * FROM POIs where Name = '" + poiName + "'";
                        DButilsAzure.execQuery(query3)
                            .then(function(result){
                                res.status(200).send(result)
                            })
                    })
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
    var poiID = req.body.ID;
    var rank = req.body.Rank;
    var review = req.body.Review;
    var currDate = new Date().toISOString();
    var totalRanks = 0;
    DButilsAzure.execQuery("insert into POIsReviews (POI_ID,Username,Rank,Review,Date) VALUES (" + poiID + "," + "'" + req.decoded.payload.username + ",'" + + rank + ",'" + review + "','" + currDate + "')")
    .then(function (result) {
        DButilsAzure.execQuery("select Rank from POIsReviews where POI_ID = " + poiID)
        .then(function (result) {
        for (let i = 0; i < result.length; i++) {
            totalRanks += result[i].Rank;
        }
        var avgRank = (totalRanks / (result.length));
        var newRank = (avgRank / 5) * 100;

        DButilsAzure.execQuery("update POIs set Rank = " + newRank + " where ID = " + poiID)
        .then(function (result) {
            res.status(200).send({success: true, message: "Review added successfuly"})            
        })
    }).catch(function (err) {
        res.send(err);
    })
    }).catch(function(err)
    {
        res.status(400).send({success: false, message: "The same review from this user exists"})
    })   
})
