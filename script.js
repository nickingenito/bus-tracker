class Node {
    constructor(val) {
        this.value = val;
        this.next = null;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
    }
    push(val) {
        const newNode = new Node(val);
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.tail.next = newNode;
            this.tail = newNode;
        }
        return this;
    }
    cycle() {
        const temp = this.head;
        this.head = this.head.next;
        temp.next = null;
        this.tail = temp;
    }
}


function toggleInactive(){
    const inactives = document.querySelectorAll(".inactive")
    inactives.forEach((obj) => {
        obj.style.display = obj.style.display === 'grid' ? '' : 'grid';
    });
}

function searchRoutes(){
    let input = document.getElementById("route-search").value;
    input = input.toLowerCase();
    let cards = document.getElementsByClassName("route-card");

    console.log(input);
    for (i = 0; i < cards.length; i++){
        const routeName = cards[i].getAttribute("route-name")
        const routeID = cards[i].getAttribute("route-id")
        if (!routeName.includes(input)){
            cards[i].style.display="none";
        } else {
            cards[i].style.display="grid";
        }
    }
}

function expandSidebar(){
    document.querySelector(".sidebar").classList.toggle("short");
}

function expandSearch(){
    document.querySelector(".address-search").classList.toggle("single");
}

function getCurrentLocation(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
            }
        );
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const r = 6371;
    const p = Math.PI / 180;
    const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
    
    return 2 * r * Math.asin(Math.sqrt(a));
}
    
