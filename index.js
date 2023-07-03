let markers = [];

async function populate(map, directionsService, directionsRenderer) {
    const requestURL = "./routes.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    const routes = await response.json();

    // Dynamically create route cards from JSON
    createRoutes(map, routes, directionsService, directionsRenderer);
}

function createRoutes(map, routes, directionsService, directionsRenderer){
    const container = document.getElementById('route-list');

    for (const route of routes){
        const content = document.createElement('div');
        const textContainer = document.createElement('div');
        const timeContainer = document.createElement('div');
        const newRoute = document.createElement('button');
        const newHeader = document.createElement('h2');
        const newID = document.createElement('p');
        const nextStop = document.createElement('div');
        const stopText = document.createElement('p');
        const timeText = document.createElement('h2');
        const minutes = document.createElement('p');

        newHeader.textContent = route.name;
        newID.textContent = route.routeID;

        textContainer.classList.add("text-container");
        timeContainer.classList.add("time-container");
        content.classList.add("content");
        nextStop.classList.add("next-stop");
        newRoute.classList.add("route-card");
        newID.classList.add("route-id");
        newHeader.classList.add("route-name")

        newRoute.setAttribute("route-id", route.routeID.toLowerCase());
        newRoute.setAttribute("route-name", route.name.toLowerCase());

        // Get current day and compare against route activity (getDay returns int)
        const d = new Date();
        const day = d.getDay();
        const time = d.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'}).slice(0,-3);
        const startTime = route.timepoints[0].times[0];
        const endTime = route.timepoints[route.timepoints.length - 1].times.slice(-1).toString();
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
            stopText.textContent = route.timepoints[0].name;
            timeText.textContent = "0";
            minutes.textContent = "minutes";
        }

        // Add event handler to route-cards to display routes
        const eventHandler = function (){
            calculateAndDisplayRoute(directionsService, directionsRenderer, route.origin, route.waypoints);
            addMarkers(map, route.timepoints, route.stops);
        }
        newRoute.addEventListener("click", eventHandler);

        timeContainer.appendChild(timeText);
        timeContainer.appendChild(minutes);
        newRoute.appendChild(newHeader);
        textContainer.appendChild(newID);
        nextStop.appendChild(stopText);
        textContainer.appendChild(nextStop);
        content.appendChild(textContainer);
        content.appendChild(timeContainer);
        newRoute.appendChild(content);
        container.appendChild(newRoute);
    }
}

function initMap() {
    const directionsService = new google.maps.DirectionsService({
        avoidHighways: true
    });
    const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true
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

window.initMap = initMap;
