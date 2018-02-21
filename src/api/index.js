"use strict";

const Hapi = require("hapi");

const { notImplementedMethods } = require("./errors/not-implemented-methods");

const server = new Hapi.Server();
server.connection({
  port: 3000,
  host: "localhost",
  router: {
    stripTrailingSlash: true
  }
});

server.route([
  {
    method: "GET",
    path: "/",
    handler: function(request, reply) {
      reply("Hello, world!");
    }
  },
  notImplementedMethods("/")
]);

server.route([
  {
    method: "GET",
    path: "/{name}",
    handler: function(request, reply) {
      reply("Hello, " + encodeURIComponent(request.params.name) + "!");
    }
  },
  notImplementedMethods("/{name}")
]);

server.start(err => {
  if (err) {
    throw err;
  }
  console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
});
