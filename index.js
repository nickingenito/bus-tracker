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
        const newRoute = document.createElement('button');
        const newHeader = document.createElement('h3');
        const newID = document.createElement('p');

        newHeader.textContent = route.name;
        newRoute.classList.add("route-card");
        if(!route.active){
            newRoute.classList.add("inactive");
        }
        newID.textContent = route.routeID;

        const eventHandler = function (){
            calculateAndDisplayRoute(directionsService, directionsRenderer, route.origin, route.waypoints);
            addMarkers(map, route.timepoints);
        }
        newRoute.addEventListener("click", eventHandler);

        newRoute.appendChild(newHeader);
        newRoute.appendChild(newID);
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

function addMarkers(map, timepoints){
    setMapOnAll(null);
    markers = [];
    let counter = 1;
    for (const timepoint of timepoints){
        const infoWindow = new google.maps.InfoWindow({
            content: timepoint.name,
        })
        const marker = new google.maps.Marker({
            position: timepoint.coordinates,
            map,
            label: {
                text: counter.toString(),
                fontFamily: "sans-serif",
                color: "#ffffff",
                fontSize: "18px",
            },
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
    setMapOnAll(map)
}

window.initMap = initMap;