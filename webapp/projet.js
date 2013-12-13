var map = new OpenLayers.Map('carte');
var wms = new OpenLayers.Layer.OSM("OpenLayers WMS");
map.addLayer(wms);
map.zoomToMaxExtent();

var calqueMarkers;

var overview = new OpenLayers.Control.OverviewMap();
map.addControl(overview);

var listeTweet = [];

function afficheMarqueur(position, info) {
	var projCarte = map.getProjectionObject();
	var projSpherique = new OpenLayers.Projection("EPSG:4326");

	var coord = new OpenLayers.LonLat(position.lon, position.lat);
	coord.transform(projSpherique,projCarte);

	if (!calqueMarkers) {
		calqueMarkers = new OpenLayers.Layer.Markers("Tweet");
		map.addLayer(calqueMarkers);
	}
	

	var mark=new OpenLayers.Marker(coord);


	mark.events.register("mouseover", mark, marksOver);
	mark.events.register("mouseout", mark, markOut);
	var popup;

	function marksOver(e) {
		popup = new OpenLayers.Popup("popup",coord,new OpenLayers.Size(200,200),info,true);
    	map.addPopup(popup);
	}
	function markOut(e){
		map.removePopup(popup);
	}

	calqueMarkers.addMarker(mark);


}

function supprtoutMarqueur() {
	map.getLayersByName("Tweet").forEach(function (val) {
		map.removeLayer(val);
	});
	calqueMarkers = undefined;
}

function lieMarqueur(position1, position2) {
	var projSpherique = new OpenLayers.Projection("EPSG:4326");
	var point1 = new OpenLayers.Geometry.Point(position1.lon, position1.lat);
	point1 = point1.transform(projSpherique, map.getProjectionObject());

	var point2 = new OpenLayers.Geometry.Point(position2.lon, position2.lat);
	point2 = point2.transform(projSpherique, map.getProjectionObject());



	var ligne = new OpenLayers.Geometry.LineString([point1, point2]);
	var lineFeature = new OpenLayers.Feature.Vector(ligne, null, {strokeColor:"blue",strokeWidth:"2"}); 
	
	var calqueDessins = new OpenLayers.Layer.Vector("Dessins");
	map.addLayer(calqueDessins);
	calqueDessins.addFeatures([lineFeature]);
}

function zoom(position, nivZoom) {
	var projSpherique = new OpenLayers.Projection("EPSG:4326");
	var coord = new OpenLayers.LonLat(position.lon, position.lat);
	coord.transform(projSpherique,map.getProjectionObject());
	map.setCenter(coord, nivZoom);
}

function get(url) {
	var http;
	http = new XMLHttpRequest();
	http.open("GET", url, true);

	http.onreadystatechange = function (aEvt) {
  		if (http.readyState == 4) {
     		if(http.status == 200) {
     			reccupTweet(http.responseText);
     		}
     		else {
     		}
     	}
     	else {
     	}
     }
	http.send(null);
	//return http.responseText;
}

//function reccupTweet(url,hashtag, resp) {
function reccupTweet(resp) {
	//var resp = get("../server/geotweet.php?twitter_query="+encodeURIComponent(url+encodeURIComponent(hashtag)+"&count=100"));
	if (!resp || resp == null) {
		document.getElementById("chargement").innerHTML = "";
		document.getElementById('body').className = document.getElementById('body').className.replace('wait','');
		document.getElementById('carte').className = document.getElementById('carte').className.replace('wait','');
		return undefined;
	}
	try {
		var data = JSON.parse(resp);
	}
	catch (ex) {
		document.getElementById("chargement").innerHTML = "";
		document.getElementById('body').className = document.getElementById('body').className.replace('wait','');
		document.getElementById('carte').className = document.getElementById('carte').className.replace('wait','');
		return undefined;
	}
	

	if (data) {
		if (data.errors) {
			listeTweet = [];
			data.errors.forEach(function(val) {
				listeTweet.push({user:{name:"Erreur"},text: "erreur"+val.code+": " + val.message});
			});
			affichelisteTweet(listeTweet);
			return;
		}

		data.statuses.forEach(function (val) {
			if (val.coordinates && val.coordinates != null && val.coordinates.coordinates!=null) {
				listeTweet.push(val);
			}
		});
		get("../server/geotweet.php?twitter_query="+encodeURIComponent("https://api.twitter.com/1.1/search/tweets.json"+data.search_metadata.next_results+""));
		affichelisteTweet();
	}
	
}

function getTweet(hashtag) {
	supprtoutMarqueur();
	document.getElementById("chargement").innerHTML = "<img SRC=\"chargement.gif\"  TITLE=\"Chargement des twwets\" width=\"25\" height=\"25\"></img>";
	document.getElementById('body').className += 'wait';
	document.getElementById('carte').className += 'wait';
	listeTweet = [];
	get("../server/geotweet.php?twitter_query="+encodeURIComponent("https://api.twitter.com/1.1/search/tweets.json?q="+encodeURIComponent(hashtag)+"&count=100"));	
}

function affichelisteTweet() {
	var htmlListeTweet = "<h2 class=\"titreListeTweets\">Tweets retrouvés</h2>";
	var texte="";
	listeTweet.forEach(function (val, idx) {
		texte = "<h3>"+val.user.name+"</h3>";
		if (val.place != null) {
			texte += "<p>"+val.created_at+"  "+val.place.country+", "+val.place.name+"</p>";
		}
		texte += "<p>"+val.text+"</p>";

		console.log(val);
		if (idx % 2 ==0) {
			htmlListeTweet += ("<div class=\"tweetFonce\" onClick= \"zoom({lon: "+val.coordinates.coordinates[0]+", lat: "+val.coordinates.coordinates[1]+"}, 10)\">"+texte+"</div>");
		} else {
			htmlListeTweet += ("<div class=\"tweetClair\" onClick= \"zoom({lon: "+val.coordinates.coordinates[0]+", lat: "+val.coordinates.coordinates[1]+"}, 10)\">"+texte+"</div>");
		}
		
		if (val.coordinates && val.coordinates.coordinates) {
			afficheMarqueur({lon: val.coordinates.coordinates[0], lat: val.coordinates.coordinates[1]}, "<h3>"+val.user.name+"</h3>"+"<p>"+val.text+"</p>");
		}
		console.log(val);
	});
	document.getElementById("listeTweets").innerHTML = htmlListeTweet;
	document.getElementById("nombreTweet").innerHTML = "<p> Nombre de Tweets trouvés: "+listeTweet.length+"</p>"
}


function handle() {
	getTweet(document.getElementById("hashtag").value);
}

//getTweet("#yolo");