var bluebird  = require('bluebird');

bluebird.Promise.longStackTraces();

var assert    = require('assert')
var _         = require('lodash')
var path      = require('path')
var uuid      = require('uuid')
var compute   = require(path.join(__dirname, '/../lib/compute_service'))
var engine    = require(path.join(__dirname, '/../lib/engine'))
var Contract  = require(path.join(__dirname, '/../models/contract')).model
var Token     = require(path.join(__dirname, '/../models/token')).model
var chai      = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('Compute Service', function() {
  var contract, token, contractHash;

  before(function(done) {
    var fileManager = engine.fileManager;
    var compiler = engine.compiler;
    var currentDir = path.join(__dirname, '/test_contract');

    compiler.on('file', function (event) {
      if (event.name.indexOf(currentDir) !== 0) {
        throw new Error('File path does not have current directory prefix: ' + event.name);
      }
      fileManager.storeFileWithHash(event.hash, event.data);
    });

    contractHash = compiler.compileModule(currentDir);
    new Contract({hash: contractHash}).fetch().then(function (_contract) {
      if (_contract) {
        return _contract;
      } else {
        return Contract.forge({
          hash: contractHash
        }).save();
      }
    }).then(function (_contract) {
      contract = _contract;
      new Token({ token: uuid.v4(), contract_id: contract.get('id')}).save().then(function(token_) {
        token = token_;
        done();
      });
    })
  });

  after(function(done) {
    // TODO: Remove contract from filesystem
    contract.destroy().then(function(){
      token.destroy().then(function() {
        done();
      });
    });
  });

  it('should start a new running instance', function(done) {

    expect(compute.startInstance(token.get('token')).then(function(instance) {
      assert.strictEqual(instance.token, token.get('token'));
      assert.strictEqual(instance.container_hash, contractHash);
      assert.strictEqual(instance.state, 'running');
    })).to.notify(done);
  });

  it('should list all running instances', function(done) {
    
    expect(compute.getInstances().then(function(instances) {
      var idx = _.findIndex(instances, function(instance) { return instance.token === token.get('token'); });
      assert.notStrictEqual(idx, -1)
      assert.strictEqual(instances[idx].container_hash, contractHash);
      assert.strictEqual(instances[idx].state, 'running');
    })).to.notify(done);
  })

  it('should get info on single running instance', function(done) {

    expect(compute.getInstance(token.get('token')).then(function(instance) {
      assert.strictEqual(instance.token, token.get('token'));
      assert.strictEqual(instance.container_hash, contractHash);
      assert.strictEqual(instance.state, 'running');
    })).to.notify(done);
  });

  it('should stop a running instance', function(done) {

    expect(compute.stopInstance(token.get('token')).then(function(state) {
      assert.strictEqual(state, 'stopping');
    })).to.notify(done);
  });

  it.skip('should get a quote to run an instance', function(done) {

    expect(compute.getQuote().then(function(quote) {
      assert(quote);
    })).to.notify(done);
  });
});

