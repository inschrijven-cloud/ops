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

if(!fs.existsSync('backups')) {
  fs.mkdirSync('backups')
}


cloudant.db.list((err, allDbs) => {
  console.log('All databases: %s', allDbs.join(', '));
  
  const iterable = allDbs.map(db => {
    return () => {
      console.log('Backing up ' + db)
      const filename = `./backups/db-backup-${db}-${new Date().toJSON()}.json`;

      const backupAsync = promisify(couchbackup.backup);
      return backupAsync(
        url + db,
        fs.createWriteStream(filename),
        { parallelism: 1 }
      ).catch(err => console.error(`[${db}] FAILED: ${err}`));
    }
  });

  iterable.reduce((p, fn) => p.then(fn), Promise.resolve() )
});

