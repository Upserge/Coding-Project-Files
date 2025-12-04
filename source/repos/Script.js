// Declare some global variables
var userGuess = document.getElementById("guessedNumber");
const submitButton = document.getElementById('submitButton');

// Function to handle the guessing game logic
function guessingGame() { 
    submitButton.addEventListener('click', () => {
        var magicNumber = Math.floor(Math.random() * 10) + 1;
        const guess = userGuess.value;

        if (parseInt(guess) === parseInt(magicNumber)) {
            let result = "Congratulations! You guessed the magic number! You're cracked out of your mind.";
            document.getElementById("resultText").innerHTML = result;
        }
        else {
            let result = "Another wrong guess unfortunately. The magic number was " + magicNumber + ". Better luck next time!";
            document.getElementById("resultText").innerHTML = result;
    }

        console.log("1 loop completed"); 
    });
}

// If players want to play again, clear the guessing box and call the function again
const playAgainButton = document.getElementById('playAgain');
playAgainButton.addEventListener('click', () => {
    document.getElementById("guessedNumber").value = "";
    guessingGame();
});

// Initialize the game
guessingGame();
