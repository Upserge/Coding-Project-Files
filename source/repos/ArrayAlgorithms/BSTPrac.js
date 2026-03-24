class BSTNode {
    value: number;
    left: BSTNode | null;
    right: BSTNode | null;

    constructor(value: number) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}
class BST {
    constructor() {
        this.root = null;
    }

    root: BSTNode | null = null;

    add(value: number) {
        var newNode = new BSTNode(value);

        if (!this.root) {
            this.root = newNode;
        }

        this.addNode(this.root, newNode);
    }

    addNode(node: BSTNode, newNode: BSTNode) {
        if (newNode.value < node.value) {
            if (!node.left) {
                node.left = newNode;
            }
            this.addNode(node.left, newNode);
        }

        if (!node.right) {
            node.right = newNode;
        }
        this.addNode(node.right, newNode);

    }
}
const myBST = new BST;
myBST.addNode(9);
myBST.addNode(7);
myBST.addNode(6);
console.log(myBST);