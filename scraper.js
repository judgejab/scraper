//TASK: Create a command line application that goes to an ecommerce site to get the latest prices.
    //Save the scraped data in a spreadsheet (CSV format).

'use strict';

//Modules being used:
var cheerio = require('cheerio');
var json2csv = require('json2csv');
var request = require('request');
var moment = require('moment');
var fs = require('fs');

//harcoded url
var url = 'http://shirts4mike.com/';

//url for tshirt pages
var urlSet = new Set();

var tshirtArray = [];


const requestPromise = function(url) {
    return new Promise(function(resolve, reject) {
        request(url, function(error, response, html) {
            
            if(error)return reject(error);
            
            if(!error && response.statusCode == 200){
                return resolve(html);   
            }       
        });
    });
}


// Go into webpage via url, load html and grab links shirt in url
function scrape (url) {
    console.log("Currently scraping " + url)
    return requestPromise(url)
        .then(function(html) {
            var $ = cheerio.load(html);

            var links = [];

            //get all the links
            $('a[href*=shirt]').each(function(){
                var a = $(this).attr('href');
                //add into link array
                links.push(url + a);
            });
            // return array of links
            return links;
        });
}


function nextStep (arrayOfLinks) { 
    var promiseArray = [];
    console.log(arrayOfLinks);
    for(var i = 0; i < arrayOfLinks.length; i++){
        promiseArray.push(requestPromise(arrayOfLinks[i]));
    }
    //return both the html of pages and their urls
    return Promise.all(promiseArray)
        .then(function(arrayOfHtml){
        return {arrayOfHtml: arrayOfHtml , arrayOfUrls: arrayOfLinks};
    });                 
}


//go through the html of each url and add to urlSet if there is a checkout button
//add to remainder otherwise to rescrape
function lastStep (obj){ 
    for(var i = 0;  i < obj.arrayOfHtml.length; i++){
        var $ = cheerio.load(obj.arrayOfHtml[i]);

        //if page has a submit it must be a product page
        if($('[type=submit]').length !== 0){
                            
            //add page to set
            urlSet.add(obj.arrayOfUrls[i]);
            console.log(obj.arrayOfUrls[i]);
                            
        } else if(remainder == undefined) {
            //if not a product page, add it to remainder so it another scrape can be performed.
            var remainder = obj.arrayOfUrls[i];
            console.log("The remainder is " + remainder)                                     
        }
    }
    //return remainder for second run-through of scrape 
    return remainder;
}


//iterate through urlSet (product pages and grab html)
function lastScraperPt1(){
    //call lastScraper so we can grab data from the set (product pages)
        //scrape set, product pages
        var promiseArray = [];

        for(var item of urlSet){
            var url = item;

            promiseArray.push(requestPromise(url));
        }
        return Promise.all(promiseArray)
            .then(function(arrayOfHtml){
                return arrayOfHtml;
            });    
}


//iterate over the html of the product pages and store data as objects
function lastScraperPt2(html){
    for(var i = 0; i < html.length; i++){
        var $ = cheerio.load(html[i]);

        //grab data and store as variables
        var price = $('.price').text();
        var imgURL = $('.shirt-picture').find('img').attr('src');
        var title = $('body').find('.shirt-details > h1').text().slice(4);

        var tshirtObject = {};
        //add values into tshirt object
        tshirtObject.Title = title;
        tshirtObject.Price = price;
        tshirtObject.ImageURL = imgURL;
        tshirtObject.URL = url;
        tshirtObject.Date = moment().format('MMMM Do YYYY, h:mm:ss a');

        //add the object into the array of tshirts
        tshirtArray.push(tshirtObject);
    }
    return tshirtArray;
}


//conver tshirt objects and save as CSV file
function convertJson2Csv(tshirtArray){
        //The scraper should generate a folder called `data` if it doesn’t exist.
        var dir ='./data';
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        var fields = ['Title', 'Price', 'ImageURL', 'URL', 'Date'];

        //convert tshirt data into CSV and pass in fields
        var csv = json2csv({ data: tshirtArray, fields: fields });

        //Name of file will be the date
        var fileDate = moment().format('MM-DD-YY');
        var fileName = dir + '/' + fileDate + '.csv';

        //Write file
        fs.writeFile(fileName, csv, {overwrite: true}, function(err) {
            console.log('file saved');
            if (err) throw err;
        });
}


scrape(url) //scrape from original entry point
    .then(nextStep) 
    .then(lastStep)
    .then(scrape)
    .then(nextStep)
    .then(lastStep)
    .then(lastScraperPt1)
    .then(lastScraperPt2)
    .then(convertJson2Csv)
    .catch(function(err) {
        // handle any error from any request here
        console.log(err);
     });


//If the site is down, an error message describing the issue should appear in the console. 
    //This is to be tested by disabling wifi on your device.
    //When an error occurs log it to a file scraper-error.log . It should append to the bottom of the file with a time stamp and error





	
		




























