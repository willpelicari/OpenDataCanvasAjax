//Created by Wilton Pelicari - July 1st, 2014




//OBJECTS
function Route(xml){
	/*	Route Object.
	 *	Receives the xml from getRoute function and create a Route object.
	 *	Each route has a title, stops, a tag, xml file, directions and longitute/latitude ranges.
	 */
	this.title = xml.getAttribute('title');
	this.stops = [];
	this.tag = xml.getAttribute('tag');
	this.xml = xml;
	this.directions = [];
	this.lon = [];
	this.lat = [];
}

function Direction(xml){
	/*	Direction Object.
	 *	Receives the xml from getConfig function and create a Direction object. 
	 *	Each Direction has its title, its raw xml, and its specific stops.
	 */	
	this.tag = xml.getAttribute('tag');
	this.title = xml.getAttribute('title');
	this.xml = xml;
	this.getStops = function(){
		var list = [];
		var stops = xml.getElementsByTagName('stop');
		for(var i=0;i<stops.length;i++){
			list.push(stops[i].getAttribute('tag'));
		}
		return list;
	};
	this.stops = this.getStops();
}

function Stop(xml){
	/*	Stop Object.
	 *	Receives the xml from getConfig function and create a Stop object. 
	 *	Each Stop receives a tag, title, latitude/longitude locations and ID.
	 */		
	this.tag = xml.getAttribute('tag');
	this.title = xml.getAttribute('title');
	this.lat = parseInt(parseFloat(xml.getAttribute('lat')) * 10000000);
	this.lon = parseInt(parseFloat(xml.getAttribute('lon')) * 10000000);
	this.id = xml.getAttribute('stopId');
}





//ARRAYS
var routes = []; //This array stores all XML information from all XML functions. You could use it inside your server and get the value using GET or POST method.





//FUNCTIONS
function ajax(){
	/*	Simple XMLHttp object creation.
	 *	Regardless browser, makes it work.
	 */		
	var xmlhttp;
	if(window.XMLHttpRequest){
		xmlhttp = new XMLHttpRequest();
	} else {
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	return xmlhttp;	
}

function getRoutes(){
	/*	getRoutes Function.
	 *	Open a asynchronous connection with Nextbus Open data and get the list of routes for TTC System.
	 */		
	xmlhttp = ajax();
	var options = "<option>Select a line</option>" + "\n";

	xmlhttp.onreadystatechange = function(){
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200){ 
			var XMLroutes = xmlhttp.responseXML.documentElement.getElementsByTagName("route");
			for(var i = 0; i < XMLroutes.length; i++){
				routes.push(new Route(XMLroutes[i]));
				options = options + "<option value='" + i + "'>" + routes[i].title + "</option>" + "\n";
			}
			document.getElementById('routes').innerHTML = options;
		}
	};

	xmlhttp.open("GET", "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=ttc", true);
	xmlhttp.send();
}

function getConfig(value){
	/*	getConfig Function.
	 *	Open a asynchronous connection with Nextbus Open data and get details about the selected route.
	 */	
	route = routes[value];
	xmlhttp = ajax();
	var options = "<option>Select a direction</option>" + "\n";

	xmlhttp.onreadystatechange = function(){
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
			var XMLroute = xmlhttp.responseXML.documentElement.getElementsByTagName("route");	
			var XMLdirections = xmlhttp.responseXML.documentElement.getElementsByTagName("direction");
			var XMLstops = xmlhttp.responseXML.documentElement.getElementsByTagName("stop");

			for(var i=0; i<XMLdirections.length; i++){
				route.directions.push(new Direction(XMLdirections[i]));
				options = options + "<option value='" + i + "'>" + route.directions[i].title + "</option>" + "\n"
			}
			document.getElementById('directions').innerHTML = options;

			for(var i = 0; i < XMLstops.length; i++){
				if(XMLstops[i].getAttribute('title')){
				route.stops.push(new Stop(XMLstops[i]));
				}
			}		

			//Adding the ranges of MAX/MIN LATITUDE and MAX/MIN LONGITUDE inside the selected object to prepare the canvas to be drawn.
			routes[document.getElementById('routes').value].lon.push(parseInt(parseFloat(XMLroute[0].getAttribute('lonMax')) * 10000000));
			routes[document.getElementById('routes').value].lon.push(parseInt(parseFloat(XMLroute[0].getAttribute('lonMin')) * 10000000));
			routes[document.getElementById('routes').value].lat.push(parseInt(parseFloat(XMLroute[0].getAttribute('latMax')) * 10000000));
			routes[document.getElementById('routes').value].lat.push(parseInt(parseFloat(XMLroute[0].getAttribute('latMin')) * 10000000));
		}
	}

	xmlhttp.open("GET", "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + route.tag + "&terse", true);
	xmlhttp.send();
}

function getStops(value){
	/*	getStops Function.
	 *	Uses the XML previously retrieved to get STOPS information regarding the specific direction selected.
	 */	
	var options = "<option>Select a stop</option>" + "\n",
		route = routes[document.getElementById('routes').value],
		stops = route.directions[value].stops,
		nStops = [];
	for(var i=0; i < route.stops.length; i++){
		if(stops.indexOf(route.stops[i].tag) > -1){
			nStops.push(route.stops[i]);
			options = options + "<option value='" + i + "'>" + route.stops[i].title + "</option>" + "\n";
		}
	}
	routes[document.getElementById('routes').value].directions[document.getElementById('directions').value].stops = nStops;
	document.getElementById('stops').innerHTML = options;
}

/*
 * DRAWING
 */

function toPc(maxCoord, minCoord, actualCoord){
	/*	toPc Function.
	 *	Convert Longitude and Latitude values into percentages to be drawn on Canvas regardless its size.
	 */	
	return (actualCoord - minCoord) / (maxCoord - minCoord);
}

function drawCanvas(){
	/*	drawCanvas Function.
	 *	Draw the path of each route regarding each stop position and drawing a line to connect them.
	 */	
	var route = routes[document.getElementById('routes').value],
		stops = routes[document.getElementById('routes').value].directions[document.getElementById('directions').value].stops,
		height = 400,
		width = 400;

	var ctx = document.getElementById('path').getContext("2d");

	document.getElementById('path').height = height + 20;
	document.getElementById('path').width = width + 20;

	ctx.beginPath();
	for(var i=0; i < stops.length; i++){
		var X = toPc(route.lon[0], route.lon[1], stops[i].lon) * width + 5,
			Y = toPc(route.lat[0], route.lat[1], stops[i].lat) * height + 5;
		console.log(X, Y);
		
		if(i == 0){
			ctx.moveTo(X, Y);
			ctx.fillStyle = '#00FF00'; //Green dot for the route beggining.
			ctx.fillRect(X - 2.5, Y - 2.5, 5, 5);
		} else {
			ctx.lineTo(X, Y);
			i === (stops.length - 1) ? ctx.fillStyle = '#FF0000' : ctx.fillStyle = '#101010'; //Black dot for regular stops, Red dot for the last stop.
			ctx.fillRect(X - 2.5, Y - 2.5, 5, 5);
		}
	}
	ctx.lineWidth = 2;
	ctx.strokeStyle = '#808080';
	ctx.stroke();	
}