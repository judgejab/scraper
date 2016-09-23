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

var remainder;
var tshirtArray = [];


// Load front page of shirts4mike
function firstScrape(){
	request(url, function(error, response, html) {
		if(!error && response.statusCode == 200){
			var $ = cheerio.load(html);
			
		//iterate over links with 'shirt'
			$('a[href*=shirt]').each(function(){
				var a = $(this).attr('href');

				//create new link
				var scrapeLink = url + a;

				//for each new link, go in and find out if there is a submit button. 
				//If there, add it to the set
				request(scrapeLink, function(error,response, html){
					if(!error && response.statusCode == 200) {
						var $ = cheerio.load(html);

						//if page has a submit it must be a product page
						if($('[type=submit]').length !== 0){
							
							//add page to set
							urlSet.add(scrapeLink);
						} else if(remainder == undefined) {
							//if not a product page, add it to remainder so it another scrape can be performed.
							remainder = scrapeLink;							
						}
					}
				});
			});		
		}
	});
}


function secondScrape() {
	request(remainder, function(error, response, html) {
		if(!error && response.statusCode == 200){
			var $ = cheerio.load(html);

			$('a[href*=shirt]').each(function(){
				var a = $(this).attr('href');

				//create new link
				var scrapeLink = url + a;

				request(scrapeLink, function(error,response, html){
					if(!error && response.statusCode == 200){

						var $ = cheerio.load(html);

						//collect remaining product pages and add to set
						if($('[type=submit]').length !== 0){
							urlSet.add(scrapeLink);
						}
					}
				});
			});		
		}
	});
}


//call lastScraper so we can grab data from the set (product pages)
function lastScraper(){
	//scrape set, product pages
	for(var item of urlSet){
		var url = item;

		request(url, function(error, response, html){
			if(!error && response.statusCode == 200){
				var $ = cheerio.load(html);

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
		});
	}
}


function convertJson2Csv(){
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



//If the site is down, an error message describing the issue should appear in the console. 
	//This is to be tested by disabling wifi on your device.
	//When an error occurs log it to a file scraper-error.log . It should append to the bottom of the file with a time stamp and error








	
		




























