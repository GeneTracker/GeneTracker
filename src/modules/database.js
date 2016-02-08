// Database initialisation --
// Based on orientjs : https://www.npmjs.com/package/orientjs

var config  = require('config');
var OrientDB = require('orientjs');

var helper = {};

// -- Methods --

var getParam = function(id, defaultValue) {
  if(config.has('database') && config.get('database').has(id))
    return config.get('database').get(id);

  console.log('[config] no database.'+ id +' field, fallback to default');
  return defaultValue;
};

// -- Fields --

var server = OrientDB({
  host:     getParam('host',      'localhost'),
  port:     getParam('port',      2424),
  username: getParam('username',  'root'),
  password: getParam('password',  'yourpassword'),
  enableRIDBags: false
});

var dbname = getParam('dbname',  'animaltracker');
var db = server.use(dbname);

// -- Notify methods --

helper.notifyRecordsCreation = function(records, configClassName) {

  var number = Array.isArray(records) ? records.length : 1;
  console.log('[orientjs] ' + number + ' ' + (configClassName ? configClassName + ' record(s) created' : 'records created.'));

  // Simplify rids --
  var fn = function(record) { record.rid = db.helper.simplifyRid(record['@rid']); };

  if(Array.isArray(records))
    records.forEach(fn);
  else
    fn(records);

  return records;
};

helper.error = function(err) {
  console.log('[orientjs] ' + err);
};

// -- Records methods --


helper.recordifyRid = function(rid) {
  return OrientDB.RID(rid);
};

helper.simplifyRid = function(rid) {
  return rid ? rid.toString().substring(1).split(':').join('-') : null;
};

helper.unsimplifyRid = function(rid) {
  return rid ? '#' + rid.split('-').join(':') : null;
};

helper.unsimplifyAndRecordifyRid = function(rid) {
  return rid ? OrientDB.RID(helper.unsimplifyRid(rid)) : null;
};

helper.createRecords = function(className, arg) {
  return db.class.get(className).then(function(Class) {
    return Class.create(arg).then((records) => {
      return helper.notifyRecordsCreation(records, className);
    });
  });
};

// -- Check that no one of our variable will override db's ones --

var variables = ["ready", "init", "close", "srv", "helper"];
for(var variable of variables) {
  if(db.hasOwnProperty(variable)) {
    console.error('[app] db.' + variable + ' override in database.js');
  }
}

// -- Test query --

db.ready = server.list()
  .then(function() {
    console.info('[orientjs] Access to server: OK.');
  })
  .then(db.select().from('OUser').all()).then(function () {
    console.info('[orientjs] Access to database: ' + dbname);
  });

// -- Module requirements --

db.init = function() {
};

db.close = function() {
  server.close();
  console.info('[orientjs] Connection closed.');
};

db.srv = server;
db.helper = helper;

module.exports = db;
