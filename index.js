const fs = require('fs');
const Crafter = require('./Crafter.js');
const data = fs.readFileSync('../drafter/test.apib', {encoding: 'utf-8'});
const result = Crafter.parse(data);

console.log(require('util').inspect(result, {depth: null}));