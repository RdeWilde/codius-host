var nconf = require('nconf');

// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

// Then load configuration from a designated file.
nconf.file({ file: 'config.json' });

// Provide default values for settings not provided above.
nconf.defaults({
  'log_format': 'dev',
  'engine': {

  },

  // The port that contracts can listen to to receive external connections.
  //
  // You should never change this.
  'virtual_port': 8000
});

if (nconf.get('NODE_ENV') === 'fig') {
  // nconf doesn't support multiple layers of defaults
  // https://github.com/flatiron/nconf/issues/81
  nconf.add('db_defaults', {'type': 'literal',
    // Port for incoming TLS (e.g. HTTPS) connections
    "port":         process.env.PORT || 2633,
    "db": {
      "client": 'pg',
      "connection": {
        "host":     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_ADDR,
        "port":     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_PORT,
        "database": 'docker',
        "user":     'docker',
        "password": 'docker'
      },
      "pool": {
        "min": 2,
        "max": 10
      }
    }
  });
} else if (nconf.get('NODE_ENV') === 'beanstalk') {
  // nconf doesn't support multiple layers of defaults
  // https://github.com/flatiron/nconf/issues/81
  nconf.add('db_defaults', {'type': 'literal',
    "port":         process.env.PORT || 3000,
    "db": {
      "client": "pg",
      "connection": {
        "host":     process.env.RDS_HOSTNAME,
        "port":     process.env.RDS_PORT,
        "database": process.env.RDS_DB_NAME,
        "user":     process.env.RDS_USERNAME,
        "password": process.env.RDS_PASSWORD
      },
      "pool": {
        "min": 2,
        "max": 10
      }
    },
  });
} else {
  nconf.add('db_defaults', {'type': 'literal',
    // Port for incoming TLS (e.g. HTTPS) connections
    'port': 2633,
    'db': {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3'
      }
    }
  });
}

module.exports = nconf;
