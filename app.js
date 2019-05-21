var express = require('express');
var bodyParser = require('body-parser');
var users = require('./Modules/Users');
var poi = require('./Modules/POIs');
var DButilsAzure = require('./DButils');
var app = express();
var jwt = require('jsonwebtoken');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/Users', users);
app.use('/POIs', poi);

var port = 3000;
app.listen(port,  function () {
    console.log('Example app listening on port ' + port);
});
