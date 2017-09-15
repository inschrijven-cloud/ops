const fs = require('fs')
const cbr = require('couchdb-backup-restore')

const config = {credentials: 'http://localhost:5984'}

function done(err) {
  if (err) {
    return console.error(err)
  }
  console.log('all done!')
}

if(!fs.existsSync('backups')) {
  fs.mkdirSync('backups')
}

// backup 
cbr.backup(config, done).pipe(fs.createWriteStream(`./backups/db-backup-${new Date().toJSON()}.tar.gz`))

