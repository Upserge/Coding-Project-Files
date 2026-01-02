// Global vaiables
var input = document.getElementById("userInput");
const submitButton = document.getElementById("submitButton");
var searchResults;

// Create our Pokemon class to store fetched Pokemon data
class Pokemon {
    abilities;
    base_experience;
    cries;
    forms;
    game_indices;
    height;
    held_items;
    id;
    is_default;
    location_area_encounters;
    moves;
    name;
    order;
    past_abilities;
    past_types;
    species;
    sprites;
    stats;
    types;
    weight;

}

// Async function to fetch Pokemon data based on name or ID
async function getPokemon(nameOrId) {
    if (typeof nameOrId === 'string' && isNaN(nameOrId)) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}`);
        const data = await response.json();
        return data;
    }
    else if (isNaN(nameOrId) === false) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId}`);
        const data = await response.json();
        return data;
    }
}

// Search function to get user input and call getPokemon
function pokeSearch() {
    document.getElementById('pokeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        var userPokemon = new Pokemon();
        const uInput = input.value;

        userPokemon = await getPokemon(uInput);

        let nameResult = (`You searched for: ${uInput}! Here's the result: ${userPokemon.name}`);
        document.getElementById("pokeNameResult").innerHTML = nameResult;
        let typeResult = (`Type: ${userPokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}`);
        document.getElementById("pokeTypeResult").innerHTML = typeResult;
        const spriteImg = document.getElementById("pokeSpriteResult");
        spriteImg.src = userPokemon.sprites.front_default;
        spriteImg.alt = userPokemon.name;

    });
}

// Initialize the search function
pokeSearch();