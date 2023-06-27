const API_KEY = config.API_KEY;

class BusRider {
    constructor(startLocation, endLocation) {
        this.startLocation = startLocation;
        this.endLocation = endLocation;
    }
    useCurrent(){
        const currentLocation = getCurrent();
        startLocation = currentLocation;
    }
    useCustom(){
        let customLocation = document.getElementById("origin").value;
        startLocation = customLocation;
    }
}

class BusRoute {
    constructor(fare, driver, activity, time, numBuses, routeID){
        this.fare = fare;
        this.driver = driver;
        this.activity = activity;
        this.time = time;
        this.numBuses = numBuses;
        this.routeID = routeID;
    }
}

class BusStop {
    constructor(address, active){
        this.address = address;
        this.active = active;
    }
}

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

const MG114 = "https://www.google.com/maps/embed/v1/directions?key=" + API_KEY + "&origin=33.211025,-97.146251&waypoints=33.208244,-97.147459|33.208278,-97.150049|33.206803,-97.152148|33.209621,-97.155453|33.211532,-97.153609|33.213704,-97.151497|33.213977,-97.148428&destination=33.211025,-97.146251"
const NT124 = "https://www.google.com/maps/embed/v1/directions?key=" + API_KEY + "&origin=33.213315,-97.173426&waypoints=33.215423,-97.166131|33.218690,-97.147173|33.211543,-97.144716&destination=33.213315,-97.173426"



function showRoute(routeSRC){
    document.getElementById('map').src = routeSRC;
}
