// ######## MAX CHARACTERS IN A STRING ########
// on each char iterate through the array and count occurrances of that character. Store that max char count variable. At the end, push that max char variable to the outputArray.
//If tied for max occurrances, push each variable that is tied to the outputArray

// Edge cases: Empty array, single var array, ties, spaces 
function maxChar(input: string): string[] {
    const charMap: Map<string, number> = new Map<string, number>;
    const outputArray: string[] = [];
    let maxCount: number = 0;

    for (const char of input) {
        charMap.set(char, input.split(char).length - 1);
    }

    for (let value of charMap.values()) {
        maxCount = Math.max(maxCount, value);
    }

    for (let [key, value] of charMap.entries()) {
        if (value === maxCount) {
            outputArray.push(key);
        }
    }

    return outputArray;
}

// ######## REPLACE THIRTY ########
// iterate through array, check if it's a number (if not, skip), if it is a number, compare to thirty, if higher, replace with "too big", if lower, skip. Mutate existing array.

// edge cases: elements not of number type, empty array
function replaceThirty(array: any[]): string[] {

    for (let i = 0; i < array.length; i++) {
        if (typeof array[i] === 'number' && array[i] > 30) {
            array[i] = 'too big';
        }
    }
    return array;
}

console.log(replaceThirty([5, "hello", 99, true, 30, 31]));

// ######## COUNT EVENS ########
// iterate through array, if number is 0 add to count, otherwise count how many numbers return 0 when modulused by 2.

// edge cases: negative numbers, 0, potentially not number types?
function countEvens(array: number[]): number {
    let count: number = 0;

    for (let i = 0; i < array.length; i++) {
        if (array[i] === 0 || array[i] % 2 === 0) {
            count++;
        }
    }

    return count;
}

console.log(countEvens([0, -2, 5, 8]))