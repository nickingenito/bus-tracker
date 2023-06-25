function initMap() {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();

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
    calculateAndDisplayRoute(directionsService, directionsRenderer, { lat: 33.21128520875526, lng: -97.14619021951677 });
}

function calculateAndDisplayRoute(directionsService, directionsRenderer, origin){
    directionsService
        .route({
            // origin: { lat: 33.21128520875526, lng: -97.14619021951677 },
            origin: origin,
            destination: { lat: 33.21128520875526, lng: -97.14619021951677 },
            waypoints: [
                {location: {lat: 33.20832641408987, lng: -97.1474643653456 }},
                {location: {lat: 33.20834151095838, lng: -97.15004461155056}},
                {location: {lat: 33.20688190457579, lng: -97.15219019386063}},
                {location: {lat: 33.20942767684717, lng: -97.15527900308146}},
                {location: {lat: 33.21147413101999, lng: -97.15360059511525}},
                {location: {lat: 33.213645551382065, lng: -97.15149490833078}},
                {location: {lat: 33.21398014880134, lng: -97.14835708070595}},
            ],
            travelMode: google.maps.TravelMode.DRIVING,
        })
        .then((response) => {
            directionsRenderer.setDirections(response);

            const route = response.routes[0];
        })
}

window.initMap = initMap;