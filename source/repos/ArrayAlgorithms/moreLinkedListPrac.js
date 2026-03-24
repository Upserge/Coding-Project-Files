
class SLNode {
    value: number;
    next: SLNode | null;

    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class SLL {
    constructor() {
      this.head = null;
     }

     head: SLNode | null = null;

        addToFront(value) {
            const newNode = new SLNode(value);
            newNode.next = this.head;
            this.head = newNode;
        }

        addToBack(value) {
            const newNode = new SLNode(value);
          
            if(!this.head) {
              newNode = this.head;
              return;
            }

            let current = this.head;
            while (current.next) {
                current = current.next;
            }
          current.next = newNode;
        }
      //TODO: this is a recursive function that is ALMOST working but I'm too dumb to figure out why.
      rfind(value) {
        if (!this.head) {
          return false;
        }
        
        const current = this.head;
        if(current.value === value) {
          return true;
        }
        
        if (!this.next) {
          return false;
        }
        
         return rfind(value); 

      }
      
}

const mySLL = new SLL();
mySLL.addToFront(10);
mySLL.addToBack(5);
mySLL.addToBack(10);
mySLL.addToFront(1);
mySLL.addToFront(2);
console.log(mySLL);

mySLL.rfind(1)
