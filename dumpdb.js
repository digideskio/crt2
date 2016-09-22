
var db = require('sqlite-sync');
db.connect('./env.db'); 

console.log("Readers:");
console.log(db.run("SELECT * FROM readers"));
console.log("Writers:");
console.log(db.run("SELECT * FROM writers"));
 
db.close();
