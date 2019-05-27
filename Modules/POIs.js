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

function getPOIByID (poiID) {
    console.log("ENTER")
    return new Promise(function (resolve, reject) {
        var query1 = "SELECT * FROM POIs where ID = '" + poiID + "'";
        DButilsAzure.execQuery(query1)
            .then(function(result){
                if(result.length == 0) {
                    resolve("POI ID is invalid")
                    return;
                }
            let poi = result[0];
            var query2 = "SELECT Rank, Review, Date from POIsReviews where POI_ID=" + poiID + " order by Date desc";
            return DButilsAzure.execQuery(query2)
            .then(function (reviewResults) {
                if(reviewResults.length == 0) {
                    resolve("No reviews for this POI")
                    return;
                }
                let review1 = reviewResults[0];
                let review2 = reviewResults[1];

                let PoifullInfo = {
                    "ID": poiID,
                    "Name": poi.Name,
                    "Picture": poi.Picture,
                    "UsersWatching": poi.UsersWatching,
                    "Description": poi.Description,
                    "Rank": poi.Rank,
                    "Review1": review1,
                    "Review2": review2,
                    "CategoryID": poi.CategoryID
                }
                resolve(PoifullInfo);
            }).catch(function (err) {
                console.log (err) })
        }).catch(function (err) {
             console.log (err)})
    });
}

router.get('/getPOIByID/:id', function(req,res) {
    var poiID = req.params.id;
    getPOIByID(poiID)
    .then(function (result) {
        if(result == "POI ID is invalid" || result == "No reviews for this POI")
        {
            res.status(400).send({success: false, message: result})
        }
        else {
            var query = "update POIs set UsersWatching=" + (result.UsersWatching + 1) + " where ID ='" + poiID + "'";
            DButilsAzure.execQuery(query)
            .then(function(result){
            })
            .catch(function (err) {
                console.log (err) })
            res.send(result);
        }
    })
    .catch(function (err) {
        console.log (err) })


    // var poiID = req.params.id;
    // var query1 = "SELECT * FROM POIs where ID = '" + poiID + "'";
    // DButilsAzure.execQuery(query1)
    //     .then(function(result){
    //         if(result.length != 0) {
    //             var query2 = "update POIs set UsersWatching=" + (result[0].UsersWatching + 1) + " where ID ='" + poiID + "'";
    //             DButilsAzure.execQuery(query2)
    //                 .then(function(result){
    //                     var query3 = "SELECT * FROM POIs where ID = '" + poiID + "'";
    //                     DButilsAzure.execQuery(query3)
    //                         .then(function(result){
    //                             res.status(200).send(result)
    //                         })
    //                 })
    //         }
    //         else {
    //             res.status(400).send({success: false, message: "POI ID is invalid"})
    //         }
    //     })
    //     .catch(function(err){
    //         console.log(err)
    //         res.send(err)
    //     })
})


router.get('/getAllPOIs', function(req,res) {

    var query1 = "SELECT ID FROM POIs";
    DButilsAzure.execQuery(query1)
        .then(function(result){
            if(result.length != 0) {
                var promises = [];
                // for (let i = 0; i < result.length ; i++) {
                //     let newPromise = new Promise(function(resolve,reject){
                //     resolve(getPOIbyID(result[i].ID))
                //     promises[i] = newPromise;
                // })}
                for (let i = 0; i < result.length ; i++) {
                    promises[i] = new Promise(function(resolve,reject){
                    resolve(getPOIbyID(result[i].ID))
                //    reject(new Error("OOPS"))                    
                })}
                console.log("AAAAAAAAAAAAA")
                Promise.all(promises)
                .then(function(results){
                    console.log("BBBBBBBBBBBBB")
                    res.status(200).send(results);
                })            
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
    var query1 = "SELECT ID FROM POIs where Name = '" + poiName + "'";
    DButilsAzure.execQuery(query1)
    .then(function(result){
        if(result.length != 0) { 
            var promises = [];           
            for (let i = 0; i < result.length; i++) {
                promises[i] = new Promise(function(resolve,reject){
                resolve(getPOIbyID(result[i].ID));
               // reject(new Error("OOPS"));     
            })
            }
            Promise.all(promises)
            .then(function(results){
                res.status(200).send(results);
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

router.post('/private/addRank/', function (req, res) {
    var username = req.decoded.username;
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

router.get('/private/getFavoritesPOIsOfUser/', function(req,res) {

    var promises = [];
    var username = req.decoded.username;

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
                let newPromise = new Promise(function(resolve,reject){
                resolve(getPOIbyID(result[i].ID))
                promises[i] = newPromise;
            })
            }
            Promise.all(promises)
            .then(function(results){
                res.status(200).send(results);
            })
        }
    })
})