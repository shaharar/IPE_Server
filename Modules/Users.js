var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var DButilsAzure = require('../DButils');
var jwt = require('jsonwebtoken');

var secret = "s&y";

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

module.exports = router;

//register
router.post('/register', function(req,res) {
    var username = req.body.Username;
    var password = req.body.Password;
    var firstName = req.body.FirstName;
    var lastName = req.body.LastName;
    var city = req.body.City;
    var country = req.body.Country;
    var email = req.body.Email;
    var q1 = req.body.SecurityQ1;
    var q2 = req.body.SecurityQ2;
    var a1 = req.body.SecurityA1;
    var a2 = req.body.SecurityA2;
    var categories = req.body.Categories;

    if (typeof password == 'undefined' || typeof firstName == 'undefined' || typeof lastName == 'undefined'|| typeof city == 'undefined'|| typeof country == 'undefined'|| typeof email == 'undefined'|| typeof q1 == 'undefined'|| typeof q2 == 'undefined'|| typeof a1 == 'undefined'|| typeof a2 == 'undefined'|| typeof categories == 'undefined'  ){
        res.send("Please notice that you entered all the fields");
    }
    else if (username.length < 3 || username.length > 8 || !("/^[a-zA-Z)+$/".test(username))) {
        res.send("Username is invalid");
    }
    else if (password.length < 5 || password.length > 10 || !password.matches("^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/")) {
        res.send("Password is invalid");
    }
    else if (!("/^[a-zA-Z)+$/".test(firstName)) || !("/^[a-zA-Z)+$/".test(lastName))) {
        res.send("Name is invalid");
    }
    else if (categories.length < 2) {
        res.send("Less than 2 categories");
    }

    //------------------country, email - check valid TODO


    var query1 = "SELECT * FROM Users where Username = '" + username + "'";
    DButilsAzure.execQuery(query1)
        .then(function(result){

            if(result.length == 0) { //there is no user with this username -> username is valid.
                var query2 = "insert into Users (Username, Password, FirstName, LastName, City, Country, Email, SecurityQ1, SecurityQ2, SecurityA1, SecurityA2) VALUES" + "('" + username + "','" + password + "','" + firstName + "','" + lastName + "','" 
                            + city + "','" + country + "','" + email + "','" + q1 + "','" + q2 + "','" + a1 + "','" + a2 + "')";
                DButilsAzure.execQuery(query2)
                    .then(function(result){
                        console.log("Registration succeeded")
                    })

                //add categories of user
                for (let i = 0; i < categories.length; i++) {
                    var query3 = "insert into UserCategories (Username, CategoryID) VALUES" + "('" + username + "','" + categories[i] + "')";
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



//-----------------------------------------------login - TODO
router.post('/login', function(req,res){
    // check if undefined-TODO

    var username = req.body.Username;
    var password = req.body.Password;

    if (!username || !password){
        res.status(400).send({success : false, message: "one or more fields required"});
        return;
    }

    var query1 = "SELECT * FROM Users where Username = '" + username + "'";
    DButilsAzure.execQuery(query1).then(function(result){
        if (result.length != 0){
            if (result[0].Password && result[0].Password == password){
                                //send token - TODO
                signToken(result,res);
                res.status(200).send({success : true, message : "successfull login attempt"});
                return;
            } 
        }
        res.status(400).send({success : false, message : "invalid login attempt"});
   
      

    })  
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})



function signToken(user,res){
    var payload = {username : user[0].Username, name : user[0].FirstName + " " + user[0].LastName};
    var options = {expiresIn : "1d"};
    const token = jwt.sign(payload,secret,options);
    res.send(token);
} 



router.post('/retrievePassword', function(req,res){
    var username = req.body.Username;
    var quetions = req.body.SecurityQ;
    var answers = req.body.SecurityA;

    var query1 = "SELECT * FROM Users where Username = '" + username + "'";
    DButilsAzure.execQuery(query1).then(function(result){
        if(result.length != 0){
            var userQ = result[0].SecurityQ;
            var userA = result[0].SecurityA;
            var valid = true;
            for (var i = 0; i < userQ.length; i++){
                if (userQ[i] != quetions[i] || userA[i] != answers[i]){
                    valid = false;
                }
            }
            if (valid){
                res.status(200).send({success : true, message : response[0].Password});
            }
            else{
                res.status(400).send({success : false, message : "invalid attemp to retrieve password"});
            }
        }
        else{
            res.status(400).send({success : false, message : "invalid attemp to retrieve password"}); 
        }

    })

})












