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
        const customLocation = getCustom();
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