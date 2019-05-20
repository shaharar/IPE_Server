var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var DButilsAzure = require('../DButils');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

module.exports = router;

//register
router.post('/register', function(req,res) {
    DButilsAzure.execQuery("SELECT * FROM Users where Username='" + req.body.Username + "'")
    .then(function(result){
        if(result.length == 0) {
            DButilsAzure.execQuery("insert into Users (Username, Password, FirstName, LastName, City, Country, Email, securityQ1, securityQ2, securityA1, securityA2) VALUES" 
            + "('"+req.body.Username + "','" + req.body.Password + "','" + req.body.FirstName + "','" + req.body.LastName + "','" + req.body.City + "','" + req.body.Country + "','" + req.body.Email + "','" + req.body.securityQ1 + "','" + req.body.securityQ2 + "','" + req.body.securityA1 + "','" + req.body.securityA2 + "')")
            .then(function(result){
                console.log("Registration succeeded")
            })
            let numOfCategories = req.body.Categories.length;
            for (let i = 0; i < numOfCategories; i++) {
                    DButilsAzure.execQuery("insert into UserCategories (Username, CategoryID) VALUES" 
            + "('"+req.body.Username + "','" + req.body.Categories[i] + "')")
            .then(function(result){
                console.log("Category added")
            })   
            }
            res.send(200); //success
        }
        else {
            res.send("Username already exists, please choose another one") //failure
        }
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})