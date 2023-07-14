let markers = [];
let stopList = [];
let goodRoutes = [];
let currentLocation;

// Use Fetch API to load JSON file as objects for routes
async function populate(map, directionsService, directionsRenderer) {
    const requestURL = "./routes.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    const routes = await response.json();

    // Dynamically create route cards from JSON
    createRoutes(map, routes, directionsService, directionsRenderer);
}

//Access DOM and create route cards from JSON file
function createRoutes(map, routes, directionsService, directionsRenderer){
    const container = document.getElementById('route-list');

    for (const route of routes){
        const content = document.createElement('div');
        const textContainer = document.createElement('div');
        const timeContainer = document.createElement('div');
        const newRoute = document.createElement('button');
        const newHeader = document.createElement('h2');
        const newID = document.createElement('p');
        const nextStopText = document.createElement('div');
        const stopText = document.createElement('p');
        const indexText = document.createElement('p');
        const timeText = document.createElement('h2');
        const minutes = document.createElement('p');

        newHeader.textContent = route.name;
        newID.textContent = route.routeID;

        textContainer.classList.add("text-container");
        timeContainer.classList.add("time-container");
        content.classList.add("content");
        nextStopText.classList.add("next-stop");
        newRoute.classList.add("route-card");
        newRoute.classList.add("condensed");
        newID.classList.add("route-id");
        newHeader.classList.add("route-name")
        stopText.classList.add("next-stop-name");
        minutes.classList.add("time-label");
        timeText.classList.add("time-left");
        indexText.classList.add("route-index");

        newRoute.setAttribute("route-id", route.routeID.toLowerCase());
        newRoute.setAttribute("route-name", route.name.toLowerCase());

        // Get current day and compare against route activity (getDay returns int)
        const d = new Date();
        const day = d.getDay();
        const time = d.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'});
        const startTime = route.timepoints[0].times[0];
        const endTime = route.timepoints[route.timepoints.length - 1].times.slice(-1).toString();
        let nextStop;
        let nextStopIndex;
        if(!route.active.enabled){ // Route is not enabled
            newRoute.classList.add("inactive");
            newID.style.backgroundColor = "#CC0000";
            stopText.textContent = "Route is inactive for Summer 2023";
        } else if (!route.active.days.includes(day)){ // Route is inactive for today
            newRoute.classList.add("inactive");
            stopText.textContent = route.timepoints[0].name;
            newID.style.backgroundColor = "#FFAA00";
        } else if (time <= startTime || time >= endTime){ // Route is inactive at this time
            newRoute.classList.add("inactive");
            stopText.textContent = route.timepoints[0].name;
            timeText.textContent = startTime;
            if (startTime < time){
                minutes.textContent = "tomorrow";
            } else {
                minutes.textContent = "later today";
            }
            newID.style.backgroundColor = "#FFAA00";
        } else { // Route is active
            newID.style.backgroundColor = "#509E2F";
            minutes.textContent = "minutes";
            
            let nextTime = endTime;
            for (let i = 0; i < route.timepoints.length; i++){
                for (let j = 0; j < route.timepoints[i].times.length; j++){
                    if (route.timepoints[i].times[j] >= time){
                        if (route.timepoints[i].times[j] <= nextTime){
                            nextTime = route.timepoints[i].times[j];
                            nextStop = route.timepoints[i].name;
                            nextStopIndex = i + 1;
                        }
                    }
                }
            }
            stopText.textContent = nextStop;
            timeText.textContent = (Number((nextTime.slice(0,2) * 60)) + Number(nextTime.slice(3,5))) - (Number((time.slice(0,2) * 60)) + Number(time.slice(3,5)));
            indexText.textContent = nextStopIndex;
        }

        // Add event handler to route-cards to display routes
        const eventHandler = function (){
            calculateAndDisplayRoute(directionsService, directionsRenderer, route.origin, route.waypoints);
            addMarkers(map, route.timepoints, route.stops);
            expandCard(route.routeID.toLowerCase());
        }
        newRoute.addEventListener("click", eventHandler);

        timeContainer.appendChild(timeText);
        timeContainer.appendChild(minutes);
        newRoute.appendChild(newHeader);
        textContainer.appendChild(newID);
        nextStopText.appendChild(indexText);
        nextStopText.appendChild(stopText);
        textContainer.appendChild(nextStopText);
        content.appendChild(textContainer);
        content.appendChild(timeContainer);
        newRoute.appendChild(content);

        if(route.active.enabled){ // Create route timepoint list on focus
            stopList.push(route);
            const timepointList = document.createElement('div');
            timepointList.classList.add("timepoint-list");
            for (let i = nextStopIndex; i < route.timepoints.length; i++){
                const timepointContainer = document.createElement('div');
                timepointContainer.classList.add("timepoint-container");

                const routeTimepoint = document.createElement('p');
                routeTimepoint.textContent = route.timepoints[i].name;

                const number = document.createElement('p');
                number.classList.add('timepoint-num');
                number.textContent = i + 1;

                timepointContainer.appendChild(number);
                timepointContainer.appendChild(routeTimepoint);

                const divider = document.createElement('span');
                divider.classList.add('material-symbols-outlined')
                divider.textContent = "more_vert"
                timepointList.appendChild(divider);

                timepointList.appendChild(timepointContainer)
            }
            newRoute.appendChild(timepointList);
        }

        container.appendChild(newRoute);
    }
}

// Initialize map and load Google Maps services
function initMap() {
    const directionsService = new google.maps.DirectionsService({
        avoidHighways: true
    });
    const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#008000",
            strokeOpacity: .6,
            strokeWeight: 6
        }
    });
    const destInput = document.getElementById("destination");
    const origInput = document.getElementById("origin");
    const searchOptions = {
        componentRestrictions: { country: "us" },
    };

    const destSearch = new google.maps.places.SearchBox(destInput, searchOptions);
    const origSearch = new google.maps.places.SearchBox(origInput, searchOptions);
    const searchButton = document.getElementById("search-button");
    searchButton.addEventListener("click", () => {
        let destination;
        let origin;
        if (origInput.value == "Current Location"){
            getCurrentLocation();
            origin = currentLocation;
        } else {
            const origins = origSearch.getPlaces();
            if (origins.length == 0){
                return;
            }
            origins.forEach((place) => {
                origin = { "lat": place.geometry.location.lat(), "lng": place.geometry.location.lng() }
            });
        }
        const destinations = destSearch.getPlaces();
        if (destinations.length == 0){
            return;
        }
        destinations.forEach((place) => {
            destination = { "lat": place.geometry.location.lat(), "lng": place.geometry.location.lng() }
        });
        findClosest(origin, destination);
    });

    const myStyles = [{
        featureType: "poi",
        elementType: "labels",
        stylers: [{visibility: "off"} ]
    }];

    const mapOptions = {
        zoom: 15,
        center: { lat: 33.21128520875526, lng: -97.14619021951677 },
        styles: myStyles,
    };

    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    directionsRenderer.setMap(map);

    // Read JSON file
    populate(map, directionsService, directionsRenderer);
}

// Calculate and load roats based on route waypoints
function calculateAndDisplayRoute(directionsService, directionsRenderer, origin, waypoints){
    // Format waypoints from JSON array
    const waypts = [];
    for (let i = 0; i < waypoints.length; i++) {
        waypts.push({
            location: waypoints[i],
            stopover: true,
        });
    }

    directionsService
        .route({
            origin: origin,
            destination: origin,
            waypoints: waypts,
            travelMode: google.maps.TravelMode.DRIVING,
        })
        .then((response) => {
            directionsRenderer.setDirections(response);

            const route = response.routes[0];
        })
        .catch((e) => window.alert("Directions request failed"));
}

function setMapOnAll(map){
    for (let i = 0; i < markers.length; i++){
        markers[i].setMap(map);
    }
}

// Add markers to stops for timepoints and stops
function addMarkers(map, timepoints, stops){
    setMapOnAll(null);
    markers = [];
    let counter = 1;
    const image = {
        url: "./assets/marker.png",
        scaledSize: new google.maps.Size(24,32),
        labelOrigin: new google.maps.Point(12, 12),
    }
    const imageSmall = {
        url: "./assets/marker.png",
        scaledSize: new google.maps.Size(19.2,25.6),
        labelOrigin: new google.maps.Point(10,10),
    }
    for (const timepoint of timepoints){
        const infoWindow = new google.maps.InfoWindow({
            content: timepoint.name,
        });
        const marker = new google.maps.Marker({
            position: timepoint.coordinates,
            map,
            label: {
                text: counter.toString(),
                fontFamily: "",
                color: "#ffffff",
                fontSize: "18px",
            },
            icon: image,
            title: timepoint.name,
        });
        marker.addListener("click", () => {
            infoWindow.open({
                anchor: marker,
                map,
            });
        });
        markers.push(marker);
        counter++;
    }
    for (const stop of stops){
        const infoWindow = new google.maps.InfoWindow({
            content: stop.name,
        });
        const marker = new google.maps.Marker({
            position: stop.coordinates,
            map,
            label: {
                text: "\ue530",
                fontFamily: "Material Icons",
                color: "#ffffff",
                fontSize: "15px",
            },
            icon: imageSmall,
            title: stop.name,
        });
        marker.addListener("click", () => {
            infoWindow.open({
                anchor: marker,
                map,
            });
        });
        markers.push(marker);
    }
    setMapOnAll(map)
}

function expandCard(routeID){
    const cards = document.querySelectorAll(".route-card");
    for (let i = 0; i < cards.length; i++){
        if (cards[i].classList.contains("selected")){
            cards[i].classList.remove("selected");
        }
    }
    const search = '[route-id="' + routeID + '"]';
    document.querySelector(search).classList.add("selected");
}

function findClosest(origin, destination){
    console.log(origin);
    console.log(destination);
    let distance;
    goodRoutes = [];
    const recList = document.getElementById("rec-list");
    while (recList.firstChild){
        recList.removeChild(recList.firstChild);
    }
    for (const route of stopList){
        let minDistance = 0.5;
        let minStop;
        let routeActive = false;
        const routeSelector = '[route-id="' + route.routeID.toLowerCase() + '"]';
        const routeCard = document.querySelector(routeSelector);
        if (!routeCard.classList.contains("inactive")){
            routeActive = true;
        }
        for (const timepoint of route.timepoints){
            distance = calculateDistance(timepoint.coordinates, destination)
            if (distance < minDistance ){
                minDistance = distance
                minStop = timepoint.name;
            }
        }
        for (const stop of route.stops){
            distance = calculateDistance(stop.coordinates, destination)
            if (distance < minDistance ){
                minDistance = distance
                minStop = stop.name;
            }
        }
        if (minDistance < 0.5){
            const bestStop = {
                "name" : route.name,
                "id" : route.routeID,
                "originStop" : '',
                "origDistance" : '',
                "destinationStop" : minStop,
                "destDistance" : minDistance,
                "active" : routeActive
            }
            goodRoutes.push(bestStop);
        }
    }
    for (let i = 0; i < goodRoutes.length; i++){
        for (const route of stopList){
            if(route.routeID == goodRoutes[i]?.id){
                let minDistance = 0.5;
                let minStop;
                for (const timepoint of route.timepoints){
                    distance = calculateDistance(timepoint.coordinates, origin)
                    if (distance < minDistance ){
                        minDistance = distance
                        minStop = timepoint.name;
                    }
                }
                for (const stop of route.stops){
                    distance = calculateDistance(stop.coordinates, origin)
                    if (distance < minDistance ){
                        minDistance = distance
                        minStop = stop.name;
                    }
                }
                if (minDistance == 0.5){
                    goodRoutes.splice(i,1);
                } else {
                    goodRoutes[i].originStop = minStop;
                    goodRoutes[i].origDistance = minDistance;
                }
            }
        }
    }
    recList.style.display="flex";
    if (goodRoutes.length == 0){
        const searchError = document.createElement('p');
        searchError.textContent = "Unable to find a route with those search parameters."
        recList.appendChild(searchError);
    } else {
        let sortedRoutes = goodRoutes.sort(
            (p1, p2) => ((p1.origDistance + p1.destDistance) > (p2.origDistance + p2.destDistance)) ? 1 : ((p1.origDistance + p1.destDistance) < (p2.origDistance + p2.destDistance)) ? -1 : 0
        );
        for (const route of sortedRoutes){
            const recCard = document.createElement('div');
            const recHeader = document.createElement('div');
            const via = document.createElement('p');
            const name = document.createElement('h3');
            const id = document.createElement('p');
            const origin = document.createElement('p');
            const destination = document.createElement('p');
    
            via.textContent = "via";
            name.textContent = route.name;
            id.textContent = route.id;
            origin.textContent = route.originStop + " " + Math.ceil(route.origDistance * 15) + " min";
            destination.textContent = route.destinationStop + " " + Math.ceil(route.destDistance * 15) + " min";
            recCard.classList.add("route-rec-card");
            recHeader.classList.add("rec-header");
            id.classList.add("rec-id");
            if (route.active){
                id.style.backgroundColor = "#509E2F";
            } else {
                id.style.backgroundColor = "#FFAA00";
            }

            const divider = document.createElement('span');
            divider.classList.add('material-symbols-outlined')
            divider.textContent = "more_vert"
    
            recHeader.appendChild(via);
            recHeader.appendChild(name);
            recCard.appendChild(recHeader);
            recCard.appendChild(origin);
            recCard.appendChild(divider);
            recCard.appendChild(destination);
            recCard.appendChild(id);
            recList.appendChild(recCard);
        }
        const routeCards = document.querySelectorAll(".route-card");
        for (const card of routeCards){
            card.style.display = "none";
        }
        for (const card of routeCards){
            for (const route of goodRoutes){
                if (card.getAttribute("route-id") == route.id.toLowerCase()){
                    card.style.display = "flex";
                }
            }
        }
    }
}

// Calculate distance between two LatLng coordinate objects
function calculateDistance(loc1, loc2) {
    const lat1 = loc1.lat;
    const lat2 = loc2.lat;
    const lon1 = loc1.lng;
    const lon2 = loc2.lng;

    const r = 6371;
    const p = Math.PI / 180;
    const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
    
    return 2 * r * Math.asin(Math.sqrt(a));
}

setInterval(function() {
    const d = new Date();
    const day = d.getDay();
    const time = d.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'});
    let nextStop;
    let nextStopIndex;

    console.log("Running interval update");
    for (const route of stopList){
        const startTime = route.timepoints[0].times[0];
        const endTime = route.timepoints[route.timepoints.length - 1].times.slice(-1).toString();
        const routeSelector = '[route-id="' + route.routeID.toLowerCase() + '"]';
        let nextTime = endTime;
        const routeCard = document.querySelector(routeSelector);
        const stopText = routeCard.querySelector(".next-stop-name");
        const ID = routeCard.querySelector(".route-id");
        const minutes = routeCard.querySelector(".time-label");
        const timeText = routeCard.querySelector(".time-left");
        const indexText = routeCard.querySelector(".route-index");

        if (!route.active.days.includes(day)){ // Route is inactive for today
            routeCard.classList.add("inactive");
            stopText.textContent = route.timepoints[0].name;
            ID.style.backgroundColor = "#FFAA00";
        } else if (time <= startTime || time >= endTime){ // Route is inactive at this time
            routeCard.classList.add("inactive");
            stopText.textContent = route.timepoints[0].name;
            timeText.textContent = startTime;
            minutes.textContent = "later today"
            ID.style.backgroundColor = "#FFAA00";
        } else { // Route is active
            if (routeCard.classList.contains("inactive")){
                routeCard.classList.remove("inactive");
            }
            ID.style.backgroundColor = "#509E2F";
            minutes.textContent = "minutes";
            for (let i = 0; i < route.timepoints.length; i++){
                for (let j = 0; j < route.timepoints[i].times.length; j++){
                    if (route.timepoints[i].times[j] >= time){
                        if (route.timepoints[i].times[j] <= nextTime){
                            nextTime = route.timepoints[i].times[j];
                            nextStop = route.timepoints[i].name;
                            nextStopIndex = i + 1;
                        }
                    }
                }
            }
            stopText.textContent = nextStop;
            timeText.textContent = (Number((nextTime.slice(0,2) * 60)) + Number(nextTime.slice(3,5))) - (Number((time.slice(0,2) * 60)) + Number(time.slice(3,5)));
            indexText.textContent = nextStopIndex;
        }
    }
}, 60 * 1000)

function getCurrentLocation(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
            }
        );
    }
}

getCurrentLocation();
window.initMap = initMap;
