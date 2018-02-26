#!/usr/bin/env node

require('dotenv').load();

const Cloudant = require('@cloudant/cloudant');
const couchbackup = require('@cloudant/couchbackup');
const fs = require('fs');
const {promisify} = require('util');

const username = process.env.CLOUDANT_USERNAME;
const password = process.env.CLOUDANT_PASSWORD;
const host     = process.env.CLOUDANT_HOST;

const cloudant = Cloudant({ account: username, password: password});

const url = `https://${username}:${password}@${host}/`;

const argv = require('yargs')
  .usage('Usage: $0 [options]')
  .example('$0 -f ./backups/cats.json --db cats', 'Restore database dump')
  .options({
    'file': { nargs: 1, demandOption: true, describe: 'Source backup JSON file' },
    'db':   { nargs: 1, demandOption: true, describe: 'Destination database name' },
    'createIfNotExists': { type: 'boolean', describe: 'Create target database if not exists', default: false },
  })
  .help('h').alias('h', 'help')
  .argv;

const file = argv.file;
const dbName = argv.db;

console.log(`Restoring ${file} to db name ${dbName} at ${host} with username ${username} ...`);

if(!fs.existsSync(file)) {
  console.log('File not found: ' + file);
  process.exit(1);
}

var promise;

if(argv.createIfNotExists) {
  const getDb = promisify(cloudant.db.get);

  promise = getDb(dbName).then((err, body) => {
    if(err && err.error == 'not_found') {
      console.log('Target db not found. Creating...');
    }
    console.log('err', err, 'body', body)
  }).catch(err => {
    if(err && err.error == 'not_found') {
      console.log('Target db not found. Creating...');
      const create = promisify(cloudant.db.create);
      return create(dbName);
    } else {
      console.error('Unexpected error: ' + err);
      throw err;
    }
  });
} else {
  promise = Promise.resolve();
}

promise.then(() => {
  couchbackup.restore(
    fs.createReadStream(file),
    url + dbName,
    {parallelism: 2},
    function(err, data) {
      if (err) {
        console.error("Failed! " + err);
      } else {
        console.error("Success! ");
      }
    });
});

