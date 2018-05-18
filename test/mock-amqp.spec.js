exports.channelStub = {
  isConnected: true,
  assertQueue: () => {
    return {
      then(successCallback) {
        successCallback();
      },
    };
  },
  sendToQueue: (queue, message, options) => {
    //console.log(`[AMQP] receive new message ${JSON.stringify(JSON.parse(message))}`);
    return Promise.resolve();
  },
  prefetch: () => {
    return Promise.resolve();
  },
  consume: (queue, messageHandler) => {
    const mockAMQPMessage = {
      properties: {
        replyTo: 'test-queue',
        correlationId: 'mockAMQPMessage',
      },
      payload: {
        name: 'test-command'
      },
    };
    return messageHandler(mockAMQPMessage);
  },
};

exports.connect = {
  createChannel: () => Promise.resolve(exports.channelStub),
};
