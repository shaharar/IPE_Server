var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var joi = require('joi');
var DButilsAzure = require('../DButils');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

module.exports = router;

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

//register
router.post('/register', function(req,res) {

    var username = req.body.Username;
    var password = req.body.Password;
    var firstName = req.body.FirstName;
    var lastName = req.body.LastName;
    var city = req.body.City;
    var country = req.body.Country;
    var email = req.body.Email;
    var questions = req.body.SecurityQ;
    var answers = req.body.SecurityA;
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
    var query1 = "SELECT * FROM Countries where Name = '" + country + "'";
    DButilsAzure.execQuery(query1)
    .then(function(result){
        if(result.length == 0){
            res.status(400).send({success: false, message: "Country is invalid"});
            return;
        }   
        var query2 = "SELECT * FROM Users where Username = '" + username + "'";
        DButilsAzure.execQuery(query2)
            .then(function(result){
                if(result.length == 0) { //there is no user with this username -> username is valid.
                    var query3 = "insert into Users (Username, Password, FirstName, LastName, City, Country, Email) VALUES" + "('" + username + "','" + password + "','" + firstName + "','" + lastName + "','" 
                                + city + "','" + country + "','" + email + "')";
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
                    //add questions and answers of user
                    for (let i = 0; i < questions.length; i++) {
                        var query44 = "insert into UserQuestions (Username, QID, Answer) VALUES" + "('" + username + "','" + questions[i] + "','" + answers[i] + "')";
                        DButilsAzure.execQuery(query44)
                            .then(function(result){
                                console.log("question and answer added")
                            })  
                    }
                    res.status(200).send({success: true, message: "Registration succeeded"}); //success
                }
                else {
                    res.status(400).send({success: false, message: "Username already exists, please choose another one"}) //failure
                }
            })
    })       
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})


