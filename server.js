const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const randomId = require('./utils/randomId');
const serializeClientId = require('./utils/serializeClientId');

const PORT = process.env.SERVER_PORT || 4228;

// Authorized clients
// TODO: move to redis for multi instance mode
const clientsMap = {};
const clientsRemoteInfoMap = {};

server.on('error', (err) => {
  console.error(err);
  server.close();
});

server.on('listening', () => console.log(`Server is listening on ${PORT}`));

server.on('message', (msg, remoteInfo) => {
  try {
    console.log(JSON.parse(msg.toString('utf8')))
    const { receiver, message } = JSON.parse(msg.toString('utf8'));
    const clientHash = serializeClientId(remoteInfo);
    console.log(message)
    if (message === 'ping') {
      const clientId = randomId();
      clientsMap[clientId] = remoteInfo;
      clientsRemoteInfoMap[clientHash] = clientId;
      server.send(JSON.stringify({ type: 'pong', data: { clientId } }), remoteInfo.port, remoteInfo.address);
      return
    }

    // send to all clients
    const sentAt = Date.now();
    const senderId = clientsRemoteInfoMap[clientHash];
    const serializedMessage = JSON.stringify({ type: 'message', from: senderId, data: message, sentAt });
    if (receiver) {
      if (!clientsMap[receiver]) return;
      const { address, port } = clientsMap[receiver];
      server.send(serializedMessage, port, address);
    } else {
      Object.keys(clientsMap).forEach((clientId) => {
        if (senderId === clientId) return;
        const { address, port } = clientsMap[clientId];
        server.send(serializedMessage, port, address);
      });
    }
  } catch (e) {
    console.error(e)
  }

});

server.bind(PORT);
