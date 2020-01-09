// interface remoteInfo = {
//   address: string;
//   family: 'IPv4' | 'IPv6';
//   port: number;
//   size: number;
// }

/**
 * @param remoteInfo
 * @returns {string}
 */
module.exports = function serializeClientId(remoteInfo) {
  return JSON.stringify([ remoteInfo.address, remoteInfo.port ])
};
