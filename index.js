let markers = [];
let stopList = [];
let goodDestRoutes = [];
let goodOrigRoutes = [];
let goodRecRoutes = [];
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
    let distance;
    goodDestRoutes = [];
    goodOrigRoutes = [];
    goodRecRoutes = [];
    const recList = document.getElementById("rec-list");
    recList.style.display="flex";
    while (recList.firstChild){
        recList.removeChild(recList.firstChild);
    }
    for (const route of stopList){
        let minDestDistance = 0.5;
        let minOrigDistance = 0.5;
        let minDestStop;
        let minOrigStop;
        let routeActive = false;
        const routeSelector = '[route-id="' + route.routeID.toLowerCase() + '"]';
        const routeCard = document.querySelector(routeSelector);
        if (!routeCard.classList.contains("inactive")){
            routeActive = true;
        }
        for (const timepoint of route.timepoints){
            distance = calculateDistance(timepoint.coordinates, destination)
            if (distance < minDestDistance ){
                minDestDistance = distance
                minDestStop = timepoint.name;
            }
            distance = calculateDistance(timepoint.coordinates, origin)
            if (distance < minOrigDistance ){
                minOrigDistance = distance
                minOrigStop = timepoint.name;
            }
        }
        for (const stop of route.stops){
            distance = calculateDistance(stop.coordinates, destination)
            if (distance < minDestDistance ){
                minDestDistance = distance
                minDestStop = stop.name;
            }
            distance = calculateDistance(stop.coordinates, origin)
            if (distance < minOrigDistance ){
                minOrigDistance = distance
                minOrigStop = stop.name;
            }
        }
        if (minDestDistance < 0.5 && minOrigDistance < 0.5){ //Route is a valid recomendation
            const validRoute = {
                "name" : route.name,
                "id" : route.routeID,
                "origStop" : minOrigStop,
                "origDistance" : minOrigDistance,
                "destStop" : minDestStop,
                "destDistance" : minDestDistance,
                "active" : routeActive
            }
            goodRecRoutes.push(validRoute);
        } else if (minOrigDistance < 0.5){
            const origRoute = {
                "name" : route.name,
                "id" : route.routeID,
                "stop" : minOrigStop,
                "distance" : minOrigDistance,
                "active" : routeActive
            }
            goodOrigRoutes.push(origRoute);
        } else if (minDestDistance < 0.5){
            const destRoute = {
                "name" : route.name,
                "id" : route.routeID,
                "stop" : minDestStop,
                "distance" : minDestDistance,
                "active" : routeActive
            }
            goodDestRoutes.push(destRoute);
        }
    }
    if (goodRecRoutes.length != 0){ //There is a non-transfer route
        populateRecs(goodRecRoutes, false);
        return;
    } else if (goodDestRoutes.length == 0){ // There are no routes near destination
        const searchError = document.createElement('p');
        searchError.textContent = "There are no routes near your destination."
        recList.appendChild(searchError);
        return;
    } else if (goodOrigRoutes.length == 0){ // There are no routes near origin
        const searchError = document.createElement('p');
        searchError.textContent = "There are no routes near your origin."
        recList.appendChild(searchError);
        return;
    } else { // There is a transfer route
        console.log("transfer route");
        for (const origRoute of goodOrigRoutes){
            for (const destRoute of goodDestRoutes){
                const transferRoute = {
                    "origName" : origRoute.name,
                    "destName" : destRoute.name,
                    "origID" : origRoute.id,
                    "destID" : destRoute.id,
                    "origStop" : origRoute.stop,
                    "destStop" : destRoute.stop,
                    "origDistance" : origRoute.distance,
                    "destDistance" : destRoute.distance,
                    "origActive" : origRoute.active,
                    "destActive" : destRoute.active
                }
                goodRecRoutes.push(transferRoute);
            }
        }
        populateRecs(goodRecRoutes, true);
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

function populateRecs(goodRoutes, transfer){
    const recList = document.getElementById("rec-list");
    recList.style.display="flex";
    let sortedRoutes = goodRoutes.sort(
        (p1, p2) => ((p1.origDistance + p1.destDistance) > (p2.origDistance + p2.destDistance)) ? 1 : ((p1.origDistance + p1.destDistance) < (p2.origDistance + p2.destDistance)) ? -1 : 0
    );
    for (const route of sortedRoutes){
        const recCard = document.createElement('div');
        recCard.classList.add("route-rec-card");
        const origWalk = document.createElement('div');
        const origWalkText = document.createElement('p')
        const destWalk = document.createElement('div');
        const destWalkText = document.createElement('p')
        const walkingIcon1 = document.createElement('span');
        const walkingIcon2 = document.createElement('span');
        const via = document.createElement('p');
        const originText = document.createElement('p');
        const busIcon1 = document.createElement('span');
        const busIcon2 = document.createElement('span');
        const destinationText = document.createElement('p');
        const origin = document.createElement('div');
        const destination = document.createElement('div');
        const recContent = document.createElement('div');
        recContent.classList.add("rec-content");

        walkingIcon1.classList.add("material-symbols-outlined")
        walkingIcon1.textContent = "directions_walk"
        walkingIcon2.classList.add("material-symbols-outlined")
        walkingIcon2.textContent = "directions_walk"
        origWalk.classList.add("rec-icon");
        origWalkText.textContent = Math.ceil(route.origDistance * 15) + " minute walk";
        origWalk.appendChild(walkingIcon1);
        origWalk.appendChild(origWalkText);
        destWalk.classList.add("rec-icon");
        destWalkText.textContent = Math.ceil(route.destDistance * 15) + " minute walk";
        destWalk.appendChild(walkingIcon2);
        destWalk.appendChild(destWalkText);

        const divider = document.createElement('span');
        divider.classList.add('material-symbols-outlined')
        divider.textContent = "more_vert"

        via.textContent = "via ";
        origin.classList.add("rec-icon")
        destination.classList.add("rec-icon")
        originText.textContent = route.origStop;
        destinationText.textContent = route.destStop;
        busIcon1.classList.add("material-symbols-outlined")
        busIcon1.textContent = "directions_bus"
        busIcon2.classList.add("material-symbols-outlined")
        busIcon2.textContent = "directions_bus"
        origin.appendChild(busIcon1);
        origin.appendChild(originText);
        destination.appendChild(busIcon2);
        destination.appendChild(destinationText);
        
        const recHeader = document.createElement('div');
        const name = document.createElement('h3');
        const id = document.createElement('p');
        recHeader.classList.add("rec-header");
        id.classList.add("rec-id");

        if (transfer){
            const recContent2 = document.createElement('div');
            recContent2.classList.add("rec-content");
            const recHeader2 = document.createElement('div');
            const name2 = document.createElement('h3');
            const id2 = document.createElement('p');
            const via2 = document.createElement('p')
            const busIcon3 = document.createElement('span');
            const busIcon4 = document.createElement('span');
            const union1 = document.createElement('div');
            const union2 = document.createElement('div');
            const unionText1 = document.createElement('p');
            const unionText2 = document.createElement('p');
            busIcon3.classList.add("material-symbols-outlined");
            busIcon3.textContent = "directions_bus";
            busIcon4.classList.add("material-symbols-outlined");
            busIcon4.textContent = "directions_bus";
            unionText1.textContent = "Union Transfer";
            unionText2.textContent = "Union Transfer";
            union1.classList.add("rec-icon");
            union2.classList.add("rec-icon");
            union1.appendChild(busIcon3);
            union1.appendChild(unionText1);
            union2.appendChild(busIcon4);
            union2.appendChild(unionText2);
            recHeader2.classList.add("rec-header");
            id2.classList.add("rec-id");
            if (route.origActive){
                id.style.backgroundColor = "#509E2F";
            } else {
                id.style.backgroundColor = "#FFAA00";
            }
            if (route.destActive){
                id2.style.backgroundColor = "#509E2F";
            } else {
                id2.style.backgroundColor = "#FFAA00";
            }
            name.textContent = route.origName;
            id.textContent = route.origID;
            name2.textContent = route.destName;
            id2.textContent = route.destID;
            via2.textContent = "then";
            recHeader.appendChild(via);
            recHeader.appendChild(name);
            recCard.appendChild(recHeader);
            recContent.appendChild(origWalk);
            recContent.appendChild(origin);
            recContent.appendChild(union1);
            recContent.appendChild(id);
            recCard.appendChild(recContent);

            recHeader2.appendChild(via2);
            recHeader2.appendChild(name2);
            recCard.appendChild(recHeader2);
            recContent2.appendChild(union2);
            recContent2.appendChild(destination);
            recContent2.appendChild(destWalk);
            recContent2.appendChild(id2);
            recCard.appendChild(recContent2);
        } else {
            name.textContent = route.name;
            id.textContent = route.id;
            if (route.active){
                id.style.backgroundColor = "#509E2F";
            } else {
                id.style.backgroundColor = "#FFAA00";
            }

            recHeader.appendChild(via);
            recHeader.appendChild(name);
            recCard.appendChild(recHeader);
            recContent.appendChild(origWalk);
            recContent.appendChild(origin);
            recContent.appendChild(destination);
            recContent.appendChild(destWalk);
            recContent.appendChild(id);
            recCard.appendChild(recContent);
        }
       recList.appendChild(recCard);
    }
    const routeCards = document.querySelectorAll(".route-card");
    for (const card of routeCards){
        card.style.display = "none";
    }
    for (const card of routeCards){
        for (const route of goodRoutes){
            const id = card.getAttribute("route-id")
            if (id == route.id?.toLowerCase() || id == route.destID?.toLowerCase() || id == route.origID?.toLowerCase() ){
                card.style.display = "flex";
            }
        }
    }
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
            if (startTime < time){
                minutes.textContent = "tomorrow";
            } else {
                minutes.textContent = "later today";
            }
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
