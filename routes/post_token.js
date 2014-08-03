var crypto = require('crypto');
var base64url = require('base64url');

var Token = require('../models/token').model;
var Contract = require('../models/contract').model;

/**
 * Request a token.
 *
 * A token is a multi-use endpoint for interacting with a contract via HTTP.
 */
module.exports = function (req, res) {
  var config = req.app.get('config');

  function getUniqueToken() {
    var token = base64url(crypto.pseudoRandomBytes(config.get('token_size')));

    return new Token({token: token}).fetch().then(function (model) {
      if (model !== null) {
        return getUniqueToken();
      } else return token;
    });
  }

  // First we check if the contract actually exists
  new Contract({hash: req.query.contract}).fetch().then(function (contract) {
    if (!contract) {
      // Contract doesn't exist
      res.json(400, {
        message: "Unknown contract hash"
      });
    } else {
      return getUniqueToken().then(function (token) {
        return Token.forge({token: token, contract: contract.get('id')}).save();
      }).then(function (token) {
        // All done!
        res.json(200, {
          token: token.get('token')
        });
      });
    }
  });
};
