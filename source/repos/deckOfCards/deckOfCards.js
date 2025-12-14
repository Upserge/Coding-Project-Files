// ---- HOMEWORK ----
//1) add a shuffle method to this deck. You should be able to call a shuffle methods that randomizes the order. Use the Fisher-Yates method.
//2) Change each from being just strings (“Like 2 of Hearts”)  to an Object! Use a class.  Class Card...

// Card Class - Powerful vessels lie here, choose carefully 
class Card {
    suit = "";
    number = "";
    name = "";
    health = 10;
    mana = 100;

    constructor(suit, number) {
        this.suit = suit;
        this.number = number;
        this.name = `${number} of ${suit}`;
    }
}

// Deck of Cards by Jason Salas and only Jason Salas no help at all simply me straight from the dome
class Deck {

    cards = [];
    suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    number = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'Jack', 'Queen', 'King', 'Ace'];

    constructor() {
        this.initCards();
        this.shuffle();
    }

    // Create our deck of cards and give them the correct health and mana depending on suit and number
    initCards() {
        var card;
        var fullHealth;

        for (var suit of this.suits) {
            for (var number of this.number) {
                card = new Card(suit, number)
                switch (card.number) {
                    case 'Jack': fullHealth = 110;
                        break;
                    case 'Queen': fullHealth = 120;
                        break;
                    case 'King': fullHealth = 130;
                        break;
                    case 'Ace': fullHealth = 150;
                        break;
                    default: fullHealth = card.number * card.health;
                }
                card.fullHealth = fullHealth;
                this.cards.push(card)
            }
        }
    }

    // Function to draw a card from the bottom of the deck (bc of Pop)
    draw() {
        var cardToReturn = "";
        cardToReturn = this.cards.pop()
        return cardToReturn
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let k = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = k;
        }
        return this.cards;
    }

}


// Player Class - This is your Champion and their Skillset
class Player {
    name = "";
    hand = [];
    manaPotions = 2;
    healthPotions = 2;
    constructor(name) {
        this.name = name;
    }

    addToHand(deck) {
        if (!deck || !deck.draw || !deck.cards.length) return;

        var card = deck.draw();
        this.hand.push(card);
    }

    drawFive(deck) {
        if (!deck || !deck.draw || !deck.cards.length) return;

        for (i = 0; i < 5; i += 1) {
            var card = deck.draw();
            this.hand.push(card);
        }
    }

    refillMana(card) {
        this.card = card;
        if (this.manaPotions > 0 && card.mana !== 100) {
            card.mana = 100;
            console.log(`${this.name} refilled ${card.name}s mana!`);
            this.manaPotions -= 1;
        }
        else if (card.mana === 100) {
            console.log(`${card.name} Mana is already full.`);
        }
        else {
            console.log(`Oh no! No mana potions left.`);
        }
    }

    refillHealth(card) {
        this.card = card;
        if (this.healthPotions > 0 && card.health !== this.card.fullHealth) {
            card.health = card.fullHealth;
            console.log(`${this.name} refilled ${card.name} health!`);
            this.healthPotions -= 1;
        }
        else if (card.health === fullHealth) {
            console.log(`${card.name} health is already full.`);
        }
        else {
            console.log(`Oh no! No health potions left.`);
        }
    }
}



// Create our new Deck and Player and maybe do some stuff about it
var myDeck = new Deck();
var Jason = new Player('Jason');
Jason.drawFive(myDeck);
Jason.refillMana(Jason.hand[0]);
Jason.refillHealth(Jason.hand[1]);

//console.log(Jason)
//console.log(myDeck)