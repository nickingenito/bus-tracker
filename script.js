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
        obj.style.display = obj.style.display === 'block' ? '' : 'block';
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
            cards[i].style.display="block";
        }
    }
}
