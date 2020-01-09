module.exports = function printMessage({ data, from, sentAt }) {
  const dateFormatted = new Date(sentAt).toISOString();
  console.log(`
New message
Client ${from} sent "${data}" at ${dateFormatted}
  `)
};
