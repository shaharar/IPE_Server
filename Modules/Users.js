var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var joi = require('joi');
var DButilsAzure = require('../DButils');
var jwt = require('jsonwebtoken');

var secret = "SAYH";

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
    var Q1 = req.body.SecurityQ1;
    var Q2 = req.body.SecurityQ2;
    var A1 = req.body.SecurityA1;
    var A2 = req.body.SecurityA2;
    var categories = req.body.Categories;

    //validation of fields
    let objects = {
        username: req.body.Username,
        password: req.body.Password,
        firstName: req.body.FirstName,
        lastName: req.body.LastName,
        city: req.body.City,
        email: req.body.Email,
        categories: req.body.Categories
     };    

     const {error} = regValidation (objects);
     if (error) {
        res.status(400).send({success: false, message: error.details[0].message});
        return;
     }
     
     //validation of country
    var query = "SELECT * FROM Countries where Name = '" + country + "'";
    DButilsAzure.execQuery(query)
    .then(function(result){
        if(result.length == 0){
            res.status(400).send({success: false, message: "Country is invalid"});
            return;
        }
         //validation of questions
        var query1 = "SELECT * FROM Questions where Question = '" + Q1 + "'";
        DButilsAzure.execQuery(query1)
        .then(function(result){
            if(result.length == 0){
                res.status(400).send({success: false, message: "Question is invalid"});
                return;
            }
            var query11 = "SELECT * FROM SecurityQuestions where Question = '" + Q2 + "'";
            DButilsAzure.execQuery(query11)
            .then(function(result){
                if(result.length == 0){
                    res.status(400).send({success: false, message: "Question is invalid"});
                    return;
                }     
                var query2 = "SELECT * FROM Users where Username = '" + username + "'";
                DButilsAzure.execQuery(query2)
                    .then(function(result){
                        if(result.length == 0) { //there is no user with this username -> username is valid.
                            var query3 = "insert into Users (Username, Password, FirstName, LastName, City, Country, Email, Q1, Q2, A1, A2) VALUES" + "('" + username + "','" + password + "','" + firstName + "','" + lastName + "','" 
                                        + city + "','" + country + "','" + email + "','" + Q1 + "','" + Q2 + "','" + A1 + "','" + A2 + "')";
                            DButilsAzure.execQuery(query3)
                                .then(function(result){
                                })
                            //add categories of user
                            for (let i = 0; i < categories.length; i++) {
                                var query4 = "insert into UserCategories (Username, CategoryID) VALUES" + "('" + username + "','" + categories[i] + "')";
                                DButilsAzure.execQuery(query4)
                                    .then(function(result){
                                        console.log("Category added")
                                    })  
                            }                    
                            res.status(200).send({success: true, message: "Registration succeeded"}); //success
                        }
                        else {
                            res.status(400).send({success: false, message: "Username already exists, please choose another one"}) //failure
                        }
                    })
                })
            })
    })       
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

function regValidation (reqObjects) {
    const schema = joi.object().keys({
        username: joi.string().alphanum().min(3).max(8).required(),
        password: joi.string().regex(/^[a-zA-Z0-9]{5,10}$/).required(),
        firstName: joi.string().regex(/^[a-zA-Z]{1,40}$/).required(),
        lastName: joi.string().regex(/^[a-zA-Z]{1,40}$/).required(),
        city: joi.string().regex(/^[a-zA-Z]{2,40}$/).required(),
        email: joi.string().email({ minDomainAtoms: 2 }),
        categories: joi.array().min(2).required()
    }).with('username', 'password');

    const validRes = joi.validate(reqObjects, schema);
    return validRes;
}


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
    var categories = [];
    var query1 = "SELECT CategoryID FROM UserCategories where Username = '" + user[0].Username + "'";
    DButilsAzure.execQuery(query1).then(function(result){
        for (var i = 0; i < result.length; i++){
            categories.push(result[i]);
        }
        var payload = {username : user[0].Username, name : user[0].FirstName + " " + user[0].LastName ,usersCategories : categories};
        var options = {expiresIn: "1d"};
        const token = jwt.sign(payload,secret,options);
        // const decoded = jwt.verify(token, secret);
        // console.log(decoded);
        res.status(200).send({success : true, message : "successfull login attempt", userToken : token});
    }) 
   .catch(function(err){
        console.log(err)
        res.send(err)
    })

} 

router.post('/retrievePassword', function(req,res){
    var username = req.body.Username;
    var question = req.body.SecurityQ;
    var answer = req.body.SecurityA;

    var query1 = "SELECT * FROM Users where Username = '" + username + "'";
    DButilsAzure.execQuery(query1).then(function(result){
        if(result.length != 0){
            var userQ1 = result[0].Q1;
            var userA1 = result[0].A1;
            var userQ2 = result[0].Q2;
            var userA2 = result[0].A2;
            if ((userQ1 == question && userA1 == answer) || (userQ2 == question && userA2 == answer) ){
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
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

router.get('/getUserQuestions', function(req,res){
    var username = req.body.Username;
    if (!username){
        res.status(400).send({success : false, message: "one or more fields required"});
        return;
    }
    var query = "SELECT Q1, Q2 FROM Users where Username = '" + username + "'";
    DButilsAzure.execQuery(query).then(function(result){
        res.status(200).send(result);
    })
    .catch(function(err){
        res.send(err)
    })
})


router.get('/getSecurityQuestions', function(req,res){
    var query = "SELECT Question FROM SecurityQuestions";
    DButilsAzure.execQuery(query).then(function(result){
        res.status(200).send(result);
    })
    .catch(function(err){
        res.send(err)
    })
}
)













