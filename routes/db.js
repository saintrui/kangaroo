mysql = require('mysql-libmysqlclient')
var conn;

exports.init = function() {
    conn = mysql.createConnectionSync();
    conn.connectSync('localhost', 'root', '', 'kangaroo');
    if (!conn.connectedSync()) {
        console.error("failed to connect db");
        process.exit(1);
    }
}

exports.testDB = function() {
    var sql = 'select 1';
    try {
        var dbres = conn.querySync(sql);
        if (false == dbres) {
            console.log("test db failed: false");
            return 1;
        }
    } catch (e) {
        console.log("test db failed: " + e);
        return 1;
    }
    return 0;
}

exports.login = function(email, password) {
    var sql = 'SELECT id FROM user WHERE username = "' + email + '" AND password = "' + password + '"';
    var dbres = conn.querySync(sql);
    var rows = dbres.fetchAllSync();
    if (rows.length != 0) {
        return rows[0].id;
    }
    return 0;
}

exports.getUserId = function(email) {
    var sql = 'SELECT id FROM user WHERE username = "' + email + '"';
    var dbres = conn.querySync(sql);
    var rows = dbres.fetchAllSync();
    if (rows.length != 0) {
        return rows[0].id;
    }
    return 0;
}

exports.addUser = function(email, password) {
    var sql = 'INSERT INTO user SET username = "' + email
        + '"' + ', password = md5("' + password + '"), created_at = now()';
    return conn.querySync(sql);
}

exports.getTabs = function(userId) {
    var q = 'SELECT snapshot_name, title, url FROM tab WHERE user_id = ' + userId;
    var r = conn.querySync(q);
    return r.fetchAllSync();
}

exports.saveSnapshot = function(userId, snapshot, items) {
    var q = 'INSERT INTO tab set user_id = ' + userId + ', snapshot_name = "' + snapshot + '"';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.url.length < 1 || item.url.indexOf("about") == 0) {
            continue;
        }
        var sql = q + ', title = "' + item.title + '"';
        sql += ', url = "' + item.url + '"';
        sql += ', created_at = now()';
        console.log(sql);
        conn.query(sql, cbInsert);
    }
}

exports.dupSnapshot = function(userId, snapshot) {
    var q = 'SELECT 1 FROM tab WHERE user_id = ' + userId + ' and snapshot_name = "' + snapshot + '" limit 1';
    var res = conn.querySync(q);
    var rows = res.fetchAllSync();
    var ret = false;
    if (rows.length > 0) {
        ret = true;
    }
    return ret;
}

exports.delSnapshot = function(userId, snapshot) {
    var q = 'DELETE FROM tab WHERE user_id = ' + userId + ' and snapshot_name = "' + snapshot + '"';
    console.log(q);
    return conn.querySync(q);
}

var cbInsert = function (err, res) {
    if (err) {
        if (err.message.indexOf('#1062') > 0) {
            console.warn('duplicate tab');
        } else {
            console.error(err);
            throw err;
        }
    }
}
