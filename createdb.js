
var db = require('sqlite-sync');
db.connect('./env.db');

db.run("CREATE TABLE readers (var TEXT, module TEXT)");
db.run("CREATE INDEX readers_var_index ON readers (var)");
db.run("CREATE INDEX readers_module_index ON readers (module)");
db.run("CREATE TABLE writers (var TEXT, module TEXT, value REAL)");
db.run("CREATE INDEX writers_var_index ON writers (var)");
db.run("CREATE INDEX writers_module_index ON writers (module)");

// Add some data for testing
db.run("INSERT INTO readers VALUES ('foo', 'module1.js')")
db.run("INSERT INTO readers VALUES ('bar', 'module1.js')")
db.run("INSERT INTO writers VALUES ('foo', 'module1.js', 10)")
db.run("INSERT INTO writers VALUES ('foo', 'module2.js', 100)")
db.run("INSERT INTO writers VALUES ('foo', 'module3.js', 1000)")
db.run("INSERT INTO writers VALUES ('bar', 'module2.js', 56)")

db.close()
