#!/usr/bin/env node

require('dotenv').load();

const Cloudant = require('@cloudant/cloudant');
const couchbackup = require('@cloudant/couchbackup');
const fs = require('fs');

const username = process.env.CLOUDANT_USERNAME;
const password = process.env.CLOUDANT_PASSWORD;

const cloudant = Cloudant({ account: username, password: password});

const url = `https://${username}:${password}@${username}.cloudant.com/`;

if(!fs.existsSync('backups')) {
  fs.mkdirSync('backups')
}


cloudant.db.list((err, allDbs) => {
  console.log('All databases: %s', allDbs.join(', '));
  
  allDbs.forEach(db => {
    console.log(url + db)
    const filename = `./backups/db-backup-${db}-${new Date().toJSON()}.json`;

    couchbackup.backup(
      url + db,
      fs.createWriteStream(filename),
      { parallelism: 1 },
      (err, data) => {
        if(err) {
          console.error(`[${db}] FAILED: ${err}`);
        }
      }
    );
  });
});

