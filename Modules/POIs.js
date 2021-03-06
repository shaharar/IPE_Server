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

router.get("/get3RandomPOIs", function(req,res){
    var query1 = "select ID from POIs where Rank >= 70";
    DButilsAzure.execQuery(query1).then(function (result) {
    var randIndexArr = [];
    var promiseArr = [];
    for (var i = 0; i < result.length && i < 3; i++){
        promiseArr[i] = new Promise(function(resolve,reject){
            let randIndex = Math.floor(Math.random() * result.length);
            while(randIndexArr.includes(randIndex)){
                randIndex = Math.floor(Math.random() * result.length);
            }
            randIndexArr[i] = randIndex;
            resolve(getPOIByID(result[randIndex].ID));
        })
    }
    Promise.all(promiseArr).then(function(results){
        res.status(200).send(results);

    })
    })
})


router.post("/private/saveFavoritePOIs", function(req,res){
    var username = req.decoded.username;
    var userFavorites = req.body.favorites;
    var priorities = req.body.priorities;
    var query1 = "Delete from FavoritesPOIs where Username='" + username + "'";
    DButilsAzure.execQuery(query1).then(function (result) {
        for (var i = 0; i < userFavorites.length; i++) {
            var query2 = "insert into FavoritesPOIs (Username, POI_ID, Priority) VALUES"  + "('" + username + "','" + userFavorites[i] + "','" + priorities[i] +  "')";
            DButilsAzure.execQuery(query2).then(function(result){
                console.log("Favorite added")
            })
        }
        res.status(200).send({success: true, message: "Favorites list was updated"});
    }).catch(function (err) {
        res.send(err);
    })
})



router.get("/private/get2POIsByCategories", function(req,res){
    var userCategories = req.decoded.usersCategories;
    var randIndexArr = [];
    var promiseArr = [];

    for (var i = 0; i < 2; i++){
        promiseArr[i] = new Promise(function(resolve,reject){
            let randIndex = Math.floor(Math.random() * userCategories.length);
            while(randIndexArr.includes(randIndex)){
                randIndex = Math.floor(Math.random() * userCategories.length);
            }
            randIndexArr[i] = randIndex;
            var query = "select ID from POIs where CategoryID ='" + userCategories[randIndex].CategoryID+"' order by Rank desc";
            DButilsAzure.execQuery(query).then(function(result){
                console.log(result);
                resolve(getPOIByID(result[0].ID));
            })
    
        })
    }
    Promise.all(promiseArr).then(function(results){
        res.status(200).send(results);
    
    })

})

function getPOIByID (poiID) {
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
                let review1 = reviewResults[0];
                let review2 = reviewResults[1];

                
                if(reviewResults.length == 0) {
                    review1 = "";
                    review2 = "";
                }

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
        if(result == "POI ID is invalid")
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
})


router.get('/getAllPOIs', function(req,res) {

    var query1 = "SELECT ID FROM POIs";
    DButilsAzure.execQuery(query1)
        .then(function(result){
            if(result.length != 0) {
                var promises = [];
                for (let i = 0; i < result.length ; i++) {
                    promises[i] = getPOIByID(result[i].ID);
                }
                Promise.all(promises)
                .then(function(results){
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
                promises[i] = getPOIByID(result[i].ID);   
            }
            Promise.all(promises).then(function(results){
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

router.post('/private/addRank', function (req, res) {
    var username = req.decoded.username;
    var poiID = req.body.ID;
    var rank = req.body.Rank;
    var review = req.body.Review;
    var currDate = new Date().toISOString();

    var totalRanks = 0;
    var query1 = "insert into POIsReviews (POI_ID, Username, Rank, Review, Date) VALUES" + "('" + poiID + "','" + username + "','" + rank + "','" + review + "','" + currDate + "')";
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

router.get('/private/getFavoritesPOIsOfUser/:POINum', function(req,res) {
    var promises = [];
    var username = req.decoded.username;
    var poiNum = req.params.POINum;
    // if (!req.params){
    //     poiNum = 0;
    // }
    // else{
    //     poiNum = req.params.POINum;
    // }
    var query1 = "SELECT POI_ID from FavoritesPOIs where Username = '" + username + "'";
    DButilsAzure.execQuery(query1)
    .then(function (result) {
        if(result.length == 0) {
            res.status(400).send({success: false, message: "There are no favorites POIs for this user"})
            return
        }
        // else if(result.length < 2) {
        //         res.status(400).send({success: false, message: "There is only one favorite POI - should be at least two"})
        //         return
        // }
        else if(poiNum != 2) {
            for (let i = 0; i < result.length; i++) {
                promises[i] = getPOIByID(result[i].POI_ID);
            }
            Promise.all(promises)
            .then(function(results){
                res.status(200).send(results);
            })
        }
        else if(poiNum == 2) {
            for (let i = 0; i < result.length && i < 2; i++) {
                promises[i] = getPOIByID(result[i].POI_ID);
            }
            Promise.all(promises)
            .then(function(results){
                res.status(200).send(results);
            })
        }
    })
})


router.get('/private/getFavoritesPriorities', function(req,res) {
    var username = req.decoded.username;
    var query1 = "SELECT POI_ID, Priority from FavoritesPOIs where Username = '" + username + "'";
    DButilsAzure.execQuery(query1)
    .then(function (result) {
        if(result.length == 0) {
            res.status(400).send({success: false, message: "There are no favorites POIs for this user"})
            return
        }
        else {
            res.status(200).send(result);
        }
    })
})
router.get('/getPOIsCategories', function(req,res){
    var query = "SELECT * FROM Categories";
    DButilsAzure.execQuery(query).then(function(result){
        res.status(200).send(result);
    })
    .catch(function(err){
        res.send(err)
    })
})

