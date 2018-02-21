const Boom = require("boom");

const notImplementedMethods = path => ({
  method: "*",
  path,
  handler: function(request, reply) {
    reply(Boom.notImplemented("Requested method is not implemented"));
  }
});

module.exports = {
  notImplementedMethods
};
