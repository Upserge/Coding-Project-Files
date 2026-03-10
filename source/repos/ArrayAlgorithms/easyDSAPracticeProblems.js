// ######## MAX CHARACTERS IN A STRING ########
// on each char iterate through the array and count occurrances of that character. Store that max char count variable. At the end, push that max char variable to the outputArray. 
//If tied for max occurrances, push each variable that is tied to the outputArray

// Edge cases: Empty array, single var array, ties, spaces 

function maxChar(input) {
    if (input.length <= 1) {
        return [input]
    }

    const charCountMap = new Map;
    let maxCount = 0;
    outputArray = [];

    // put our chars into a map in Char,Count format
    for (const char of input) {
        charCountMap.set(char, input.split(char).length - 1);
    }

    // iterate through map to find out what our highest count char is
    for (const count of charCountMap.values()) {
        maxCount = Math.max(maxCount, count);
    }

    // iterate through our map and return keys where their values are the same as maxCount
    for ([key, value] of charCountMap.entries()) {
        if (value === maxCount) {
            outputArray.push(key)
        }
    }
    return outputArray;

}

maxChar('   bbb')
maxChar('a')
maxChar('abca')
maxChar('aabbcc')
maxChar('AAa')

// ######## REPLACE THIRTY ########
// iterate through array, check if it's a number (if not, skip), if it is a number, compare to thirty, if higher, replace with "too big", if lower, skip. Mutate existing array.

// edge cases: elements not of number type, empty array

function replaceThirty(array) {
    if (array.length < 1) {
        return "Empty array, please enter a valid array.";
    }

    for (i = 0; i < array.length - 1; i++) {
        if ((typeof array[i] === 'number') && (array[i] > 30)) {
            array[i] = 'too big'
        }
    }

    return array;
}

replaceThirty([])
replaceThirty([10, 31, 22, 45])
replaceThirty([5, 'hello', 99, true, 30, 31])
replaceThirty([100, 12, '50', 40])

// ######## COUNT EVENS ########
// iterate through array, if number is 0 add to count, otherwise count how many numbers return 0 when modulused by 2. 

// edge cases: negative numbers, 0, potentially not number types?

function countEvens(array) {
    let count = 0;

    for (i = 0; i < array.length; i++) {
        if (array[i] === 0 || array[i] % 2 === 0) {
            count++;
        }
    }
    return count;
}

countEvens([1, 2, 3, 4, 5, 6])
countEvens([7, 9, 11])
countEvens([0, -2, 5, 8])