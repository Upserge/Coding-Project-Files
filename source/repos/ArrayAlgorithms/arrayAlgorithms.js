// Array Algorithms Homework - avoid built-in methods unless discussed in class

// 1️⃣ Reverse an array in place
// Input: [1, 2, 3, 4] -- Output: [4, 3, 2, 1]
function reverseArray(inputArray) {
    reversedArray = [];
    for (i = inputArray.length - 1; i >= 0; i -= 1) {
        // console.log("i is " + i);
        // console.log(inputArray[i]);

        reversedArray.push(inputArray[i])
    }

    return reversedArray;
}
reverseArray([1, 2, 3, 4]);

//2️⃣ Replace a value at a given index
// Input: ([10, 20, 30], index = 1, value = 99) -- Output: [10, 99, 30]
function replaceValue(inputArray, index, value) {
    inputArray[index] = value; // is this a joke
    return inputArray;
}
replaceValue([10, 20, 30], 1, 99);

// 3️⃣ Change all values in an array to a given element
// Input: ([1, 2, 3], 0) -- Output: [0, 0, 0]
function replaceAll(inputArray, symbiote) {
    for (i = 0; i < inputArray.length; i += 1) {
        inputArray[i] = symbiote;
    }
    return inputArray;
}
replaceAll([1, 2, 3], 0);

// 4️⃣ Remove the first element from an array (without using .shift())
// Input: [5, 6, 7] -- Output: [6, 7]
function removeFirst(inputArray) {
    newArray = [];
    for (i = 1; i < inputArray.length; i += 1) {
        newArray.push(inputArray[i]);
    }

    return newArray;
}
removeFirst([5, 6, 7]);

// 5️⃣ Find the largest number in an array
// Input: [3, 9, 2, 5] -- Output: 9
function findLargest(inputArray) {
    var largestNum = inputArray[0];

    for (i = 0; i < inputArray.length; i += 1) {
        if (inputArray[i] > largestNum) {
            largestNum = inputArray[i];
        }
    }
    return largestNum;
}
findLargest([3, 9, 2, 5]);

// 6️⃣ Count how many times a value appears
// Input: ([1, 2, 2, 3, 2], 2) -- Output: 3
function valueCount(inputArray, value) {
    var count = 0;

    for (i = 0; i < inputArray.length; i += 1) {
        if (inputArray[i] === value) {
            count += 1;
        }
    }
    return count;
}
valueCount([1, 2, 2, 3, 2], 2);

// 7️⃣ Create a new array with only even numbers
// Input: [1, 2, 3, 4, 5, 6] -- Output: [2, 4, 6]
function onlyEvenArray(inputArray) {
    evenArray = [];
    for (i = 0; i < inputArray.length; i += 1) {
        if (inputArray[i] % 2 == 0) {
            evenArray.push(inputArray[i]);
        }
    }
    return evenArray;
}
onlyEvenArray([1, 2, 3, 4, 5, 6]);
