let markers = [];
let stopList = [];
let destination;

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
            minutes.textContent = "later today"
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
            timeText.textContent = nextTime.slice(3,5) - time.slice(3,5);
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

// Initiate map and load Google Maps services
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
    const input = document.getElementById("destination");

    const searchOptions = {
        componentRestrictions: { country: "us" },
    };

    const searchBox = new google.maps.places.SearchBox(input, searchOptions);
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length == 0){
            return;
        }

        places.forEach((place) => {
            destination = { "lat": place.geometry.location.lat(), "lng": place.geometry.location.lng() }
        })
    })

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
            timeText.textContent = nextTime.slice(3,5) - time.slice(3,5);
            indexText.textContent = nextStopIndex;
        }
    }
}, 60 * 1000)

window.initMap = initMap;
