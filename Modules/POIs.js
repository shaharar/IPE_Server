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
