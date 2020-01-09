const { Observable, Subject } = require('rxjs');
const readline = require('readline');

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const stdInStream$ = new Subject();

readlineInterface.on('line', (input) => stdInStream$.next(input.trim()));

module.exports = function createStdInObservable() {
  return stdInStream$.asObservable()
};
