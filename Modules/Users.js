var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var DButilsAzure = require('../DButils');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

module.exports = router;

//register
router.post('/register', function(req,res) {
    var username = req.body.Username;
    console.log(username);
    var query1 = "SELECT * FROM Users where Username = '" + username + "'";
    DButilsAzure.execQuery(query1)
        .then(function(result){

            if(result.length == 0) { //there is no user with this username -> username is valid.
                var query2 = "insert into Users (Username, Password, FirstName, LastName, City, Country, Email, SecurityQ1, SecurityQ2, SecurityA1, SecurityA2) VALUES" + "('"+req.body.Username + "','" + req.body.Password + "','" + req.body.FirstName + "','" + req.body.LastName + "','" 
                            + req.body.City + "','" + req.body.Country + "','" + req.body.Email + "','" + req.body.SecurityQ1 + "','" + req.body.SecurityQ2 + "','" + req.body.SecurityA1 + "','" + req.body.SecurityA2 + "')";
                DButilsAzure.execQuery(query2)
                    .then(function(result){
                        console.log("Registration succeeded")
                    })

                //add categories of user
                var categories = req.body.Categories;
                for (let i = 0; i < categories.length; i++) {
                    var query3 = "insert into UserCategories (Username, CategoryID) VALUES" + "('"+username + "','" + categories[i] + "')";
                    DButilsAzure.execQuery(query3)
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
