
/**
 * Created by Tran on 2/23/2017.
 */

'use strict';
/*
 'use strict' is not required but helpful for turning syntactical errors into true errors in the program flow
 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
 */

/*
 Modules make it possible to import JavaScript files into your application.  Modules are imported
 using 'require' statements that give you a reference to the module.

 It is a good idea to getListMOvie the modules that your application depends on in the package.json in the project root
 */
var util = require('util');


/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
 - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
 - Or the operationId associated with the operation in your Swagger document

 In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
 we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */

/*
 Functions in a127 controllers used for operations should take two parameters:

 Param 1: a handle to the request object
 Param 2: a handle to the response object
 */
var _ = require('lodash');
var usergrid = require('usergrid');
var apigee  = require('apigee-access');

var UsergridClient = require('../../node_modules/usergrid/lib/client');
var Usergrid = new UsergridClient({
    "appId": "sandbox",
    "orgId": "vinh",
    "authMode": "NONE",
    "baseUrl": "https://apibaas-trial.apigee.net",
    "URI": "https://apibaas-trial.apigee.net",
    "clientId": "b3U6jfOKbRZCEeeiwhIuBzeXfQ",
    "clientSecret": "YXA6esia0cMraok4eb9yTA9hVKzltuE"
});


module.exports = {
    getAll : getAllMovie,
    list: getMovieInfo,
    add: createNewMovie,
    update: editMovie,
    earase: deleteMovie,
    createreview: addReview,
    deletereview: deleteReview
};

function getAllMovie (req,res){

    //var reviews = req.swagger.params.review.value;
    Usergrid.GET('movies', function(err, response, movie) {
        //Getting all movies from apige BaaS
        if(err)
        {
            res.json({error: err});
        }
        else
        {
            console.log(response.entities);
            res.json(
                {
                    movies: response.entities,
                    //reviews: response.entities
                }).end();
        }



    })
}
function getMovieInfo(req, res) {
    // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    //Title, year released, and an array of three actors that were in the film.
    var uuid = req.swagger.params.id.value;
    var reviews = req.swagger.params.review.value;
    Usergrid.GET("movies", uuid, function(error, usergridResponse, movie) {
        if (error){
            res.json({error: error});
        }
        else
        if (!reviews) {
            res.json({
                movie: usergridResponse
            }).end();
        }
        else{
            var options = {
                path:"reviews",
                //searches reviews by movie name
                ql: "movie = '"+movie.name+"'"
            };
            Usergrid.GET(options, function(error, usergridResponse2) {
                res.json({
                    movie: usergridResponse,
                    reviews: usergridResponse2.entities
                }).end();
            })
        }
    })
}


function createNewMovie(req,res){
    var movies = req.swagger.params.movie.value.movie;
    _.assign(movies,{type: 'movie'});
    if(_.isUndefined(movies.actors))
        res.json({Error: "Error! Actor undefined"});
    else if(_.isUndefined(movies.name))
        res.json({Error: "Error! Title undefined"});
    else if(_.isUndefined(movies.year))
        res.json({Error: "Error! Year undefined"});
    else if(_.isUndefined(movies.ID))
        res.json({Error: "Error! ID undefined"});
    else
        Usergrid.POST(movies, function (err, response, movie)
        {
            if (err) {res.json({message: err});}
            else
            {
                movie.save(Usergrid, function (err)
                {
                    if (err) {res.status(500).json(err).end();}
                    else res.json({message: 'Create successful!', movie: response}).end();
                });
            }
        })
}

function editMovie(req,res){
    var uuid = req.swagger.params.id.value;
    Usergrid.GET('movies', uuid, function(error, usergridResponse, movie)
    {
        _.assign(movie, req.swagger.params.movie.value.movie);
        _.assign(movie, {type: 'movie'});
        Usergrid.PUT(movie, {uuid : uuid}, function (err, usergridResponse)
        {
            if(err){res.json({error: err});}
            else {res.json({message: 'Updated successful!', movie: usergridResponse})}
        });
    })

}

function deleteMovie(req,res)
{
    var uuid = req.swagger.params.id.value;
    Usergrid.DELETE('movies',uuid, function(error, usergridResponse)
    {
        // if successful, entity will now be deleted
        if (error)
        {
            res.json({error: error});
        }
        else res.json(
            {
                message: 'movie deleted',
                movie: usergridResponse
            }).end();
    })


}

function addReview(req,res)
{
    var review = req.swagger.params.review.value;
    _.assign(review, {type: 'review'});
    Usergrid.GET("movies", req.swagger.params.id.value, function(error, usergridResponse, movie) {
        if (!error){
            var movietitle = movie.name;
            //give movie name to review, only if movie exists already
            _.assign(review, {movie: movietitle});
            if(_.isUndefined(review.reviewer))
                res.json({ Error: "movie reviewer undefined."});
            else if(_.isUndefined(review.score))
                res.json({ Error: "score undefined." });
            else if(_.isUndefined(review.quote))
                res.json({ Error: "quote undefined." });
            else if(_.isUndefined(review.movie))
                res.json({ Error: "can not get movie",
                                movie: movie });


            else Usergrid.POST(review, function (err, response, review) {
                    if (err) {
                        res.json({message: err});
                    }
                    else {
                        review.save(Usergrid, function (err) {

                            if (err) {
                                res.status(500).json(err).end();
                            }
                            else res.json({
                                message: 'Review add successful',
                                review: review
                            }).end();
                        });
                    }
                })
        }
        else
            res.json({message: "Could not add review to a movie that does not exist!",
                error: error});
    });
}

function deleteReview(req,res){

    var uuid = req.swagger.params.id.value;
    Usergrid.DELETE('reviews',uuid, function(error, usergridResponse) {
        if (error) {
            res.json({error: error});
        }
        else res.json({
            message: 'Review removed successful!',
            movie: usergridResponse
        }).end();
    })
}




