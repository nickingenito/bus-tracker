async function populate(directionsService, directionsRenderer) {
    const requestURL = "./routes.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    const routes = await response.json();

    // Dynamically create route cards from JSON
    createRoutes(routes, directionsService, directionsRenderer);
}

function createRoutes(routes, directionsService, directionsRenderer){
    const container = document.getElementById('route-list');

    for (const route of routes){
        const newRoute = document.createElement('button');
        const newHeader = document.createElement('h3');

        newHeader.textContent = route.name
        newRoute.classList.add("route-card");
        if(!route.active){
            newRoute.classList.add("inactive");
        }

        const eventHandler = function (){
            calculateAndDisplayRoute(directionsService, directionsRenderer, route.origin, route.waypoints);
        }
        newRoute.addEventListener("click", eventHandler);

        newRoute.appendChild(newHeader);
        container.appendChild(newRoute);
    }
}

function initMap() {
    const directionsService = new google.maps.DirectionsService();
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
        styles: myStyles
    };

    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    directionsRenderer.setMap(map);

    // Read JSON file
    populate(directionsService, directionsRenderer);
}

function calculateAndDisplayRoute(directionsService, directionsRenderer, origin, waypoints){
    const waypts = [];
    for (let i = 0; i < waypoints.length; i++) {
        waypts.push({
            location: waypoints[i],
            stopover: true,
        });
    }
    console.log(waypts);
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

window.initMap = initMap;
