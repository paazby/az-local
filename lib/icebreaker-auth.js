var url = require('url');
var User = require('../app/models/user');
var Users = require('../app/collections/users');
var API_KEY = require('./internal-files').API_KEY;
var JWT_SECRET = require('./internal-files').JWT_SECRET;
var serverUtil = require('../lib/server-utils');
var jwt = require('jwt-simple');

// check whether the api_key on the url matches the 
// icebreaker API_KEY
// check whether the token is a valid token. if it is then
// the attach the user id to the request.


exports.iceAuthenticated = function(request, response, next){
  var url_parts = url.parse(request.url, true);
  var query = url_parts.query;

  // if the request doesn't have an api key or a token immediately 404
  if(!query.apiKey || !query.token) {
    serverUtil.send404(request, response);
    return;
  }

  var decodedJwtApiKey = jwt.decode(query.apiKey, JWT_SECRET);

  // if the request isn't encoded with the API key immediately 404
  if(decodedJwtApiKey.apiKey !== API_KEY){
    serverUtil.send404(request, response);
    return;
  } 

  var decodedJwtToken = jwt.decode(query.token, JWT_SECRET);
  // decode the token and then query the database to find
  // the user. if the user is not found, 404 the request
  // if the user is found, attach the users fb_id to the
  // request and call next
 
  new User()
    .query({where: {fb_id: decodedJwtToken.fb_id}})
      .fetch()
      .then(function(user){
        if(!user){
	  // if the user is not found (i.e. invalid token) immediatedly 404
          serverUtil.send404(request, response);
        } else {
          request.mydata = {};
          request.mydata.user = user;
          return next();
        }
      })
      .catch(function(err){
        serverUtil.send404(request, response);
	console.log(err);
      });
 };
