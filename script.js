const API_KEY = config.API_KEY;

async function populate() {
    const requestURL = "./routes.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    const routes = await response.json();

    createRoutes(routes);
}

function showRoute(routeSRC){
    document.getElementById('map').src = routeSRC;
}

function alert(){
    alert("Hello");
}

function createRoutes(routes){
    const container = document.getElementById('route-list');
    const mapURL = "https://www.google.com/maps/embed/v1/directions?key=" + API_KEY + "&origin=";

    for (const route of routes){
        const newRoute = document.createElement('button');
        const newHeader = document.createElement('h3');

        newHeader.textContent = route.name
        newRoute.classList.add("route-card");
        if(!route.active){
            newRoute.classList.add("inactive");
        }

        newRoute.appendChild(newHeader);
        container.appendChild(newRoute);
    }
}

function toggleInactive(){
    const inactives = document.querySelectorAll(".inactive")
    inactives.forEach((obj) => {
        obj.style.display = obj.style.display === 'block' ? '' : 'block';
    });
}

populate();
