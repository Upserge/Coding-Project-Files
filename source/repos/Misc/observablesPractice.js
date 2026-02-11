import { of } from 'rxjs';
import { map } from 'rxjs/operators';

let numArr = [10,5,1,2,9,3,7,5];
let numArr2 = [10,5,1,2,9,3,7,5];
let stringArr = ['banana', 'apple', 'grape', 'orange', 'kiwi'];

numArr.sort((a,b) => a-b);
let temp = 0;

for (let i = 0; i < numArr2.length; i++) {
  for (let j = numArr2.length-1; j > 0; j--) {
     if (numArr2[i] > numArr2[j]) {
       temp = numArr2[i]
       numArr2[i] = numArr2[j]
       numArr2[j] = temp;
     }
  }
}

function sortArray(arr) {
  return of(arr).pipe(
    map(values => [...values].sort((a,b) => {
        if (typeof a === 'number') return (a-b);
        return String(a).localeCompare(String(b));
    }))
  );
}

sortArray(numArr2).subscribe(sorted => {
  console.log('Sorted', sorted);
})

sortArray(stringArr);