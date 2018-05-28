const fs = require('fs');
const Crafter = require('./Crafter.js');

if (process.argv.length !== 3) {
  console.log('Usage: crafter file.apib');
  process.exit(1);
}

const data = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
const result = Crafter.parse(data);
console.log(JSON.stringify(result.toRefract(), null, 2));