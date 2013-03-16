var ERR = require('./error.js');

exports.list = function(db, userId, clientResp) {
    var rows = db.getTabs(userId);
    clientResp["tabs"] = {};
    console.log("user " + userId + ", tabs count " + rows.length);
    for (var i = 0; i < rows.length; ++i) {
        var row = rows[i];
        console.log("tab: " + row.snapshot_name, row.title, row.url);
        if (null == clientResp.tabs[row.snapshot_name]) {
            clientResp.tabs[row.snapshot_name] = new Array();
        }
        var item = {
            "title": row.title,
            "url" : row.url
        };
        clientResp.tabs[row.snapshot_name].push(item);
    }
}

exports.save = function(db, userId, snapshot, tabs, clientResp) {
    if (db.dupSnapshot(userId, snapshot) == true) {
        clientResp["return_code"] = ERR.ERR_DUP_SNAP_NAME;
        clientResp["return_msg"] = ERR.errMsg(ERR.ERR_DUP_SNAP_NAME);
        console.log("dup snapshot " + snapshot + " of user " + userId);
    } else {
        try {
            db.saveSnapshot(userId, snapshot, tabs);
        } catch (e) {
            clientResp["return_code"] = ERR.ERR_INTERNAL;
            clientResp["return_msg"] = ERR.errMsg(ERR.ERR_INTERNAL);
        }
    }
}

exports.delSnapshot = function(db, userId, snapshot, clientResp) {
    var ret = db.delSnapshot(userId, snapshot);
    if (false == ret) {
        clientResp["return_code"] = ERR.ERR_INTERNAL;
        clientResp["return_msg"] = ERR.errMsg(ERR.ERR_INTERNAL);
    }
}

