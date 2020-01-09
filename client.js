const { Observable, of, Subject, throwError, combineLatest } = require('rxjs');
const { filter, switchMap, switchMapTo, take, tap, retry, timeout, map } = require('rxjs/operators');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const createStdInObservable = require('./utils/stdInObservale');
const printMessage = require('./utils/printMessage');

const serverConnection$ = new Observable((observer) => {
  server.bind(() => {
    observer.next();
    observer.complete();
  })
});


const messagesSubject = new Subject();
const pong$ = messagesSubject.pipe(filter(({ type }) => type === 'pong'));
const messages$ = messagesSubject.pipe(filter(({ type }) => type === 'message'));

server.on('message', (msg) => {
  const messageContent = msg.toString('utf8')
  try {
    messagesSubject.next(JSON.parse(messageContent))
  } catch (e) {
    // Just skip
  }
});

const connectionEpic$ = of(null).pipe(
  switchMap(() => {
    console.log('Enter server port (empty for 4228):');
    return createStdInObservable().pipe(
      switchMap((input) => {
        // Try to connect to server, send ping
        server.send(JSON.stringify({ message: 'ping' }), input || 4228, 'localhost', console.log);
        // Then wait for pong
        return pong$.pipe(
          map(({ data }) => data),
          timeout(1000) // If there is no pong response after 1000ms then throw an error
        )
      }))
  }),
  retry(),
);

const sendMessageEpic$ = of(null).pipe(
  switchMap(() => {
    console.log('Input receiver id (empty for everyone):');
    return createStdInObservable().pipe(
      take(1),
      map((receiver) => ({ receiver }))
    )
  }),
  retry(),
  switchMap(({ receiver }) => {
    console.log(`Enter message for ${!!receiver ? receiver : 'everyone'}:`);
    return createStdInObservable().pipe(
      switchMap((message) => {
        server.send(JSON.stringify({ receiver, message }), 4228, 'localhost');
        return throwError(null)
      })
    )
  }),
  retry()
);

const sendMessageWithPrintEpic$ = combineLatest(
  messages$.pipe(tap(printMessage)),
  sendMessageEpic$
);

serverConnection$.pipe(
  switchMapTo(connectionEpic$),
  take(1),
  tap(({ clientId }) => console.log(`Hooray, connection has been established, current client id is ${clientId}`)),
  switchMapTo(sendMessageWithPrintEpic$),
).subscribe();
