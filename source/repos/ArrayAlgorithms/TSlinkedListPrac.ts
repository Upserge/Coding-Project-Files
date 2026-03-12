class node {
    value: number;
    next: node | null;

    constructor(value: number) {
        this.value = value;
        this.next = null;
    }
}

class LinkedList {
    head: node | null;

    constructor() {
        this.head = null;
    }

    append(value: number): void {
        const newNode = new node(value);
        if (!this.head) {
            this.head = newNode;
            return;
        }

        let current = this.head;

        while (current) {
            current = current.next;
        }
    }

    addAfterValue(targetValue: number, newValue: number): void {
        const newNode = new node(newValue)
        if (!this.head) {
            this.head = newNode;
            return;
        }

        let current = this.head;

        while (current) {
            if (current.value === targetValue) {
                current.next = newNode;
                return;
            }

            if (current.next === null) {
                this.head = newNode;
                return;
            }
        }

    }
}

const newLL: LinkedList = new LinkedList;
newLL.append(1);
newLL.append(2);
newLL.append(3);

newLL.addAfterValue(2, 99);
newLL.addAfterValue(7, 50);
console.log(newLL);