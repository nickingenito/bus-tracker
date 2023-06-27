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
