/*
 * GET home page.
 */
var ERR = require('./error.js');
var db = require('./db.js');
db.init();

var act = require('./action.js');

exports.index = function(req, res){
  res.render('index', { title: 'Kangaroo' })
};

var xpiResp = function(res, respJson) {
    res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    var clientRespStr = JSON.stringify(respJson);
    clientRespStr = encodeURIComponent(clientRespStr);
    res.write(clientRespStr);
    res.end();
};

exports.parseAction = function(req, res){
    console.log(req.body);
    var action = req.body.action;
    var email = req.body.email;
    var password = req.body.password;
    var clientResp = {"action" : req.body.action, "return_code" : 0, "return_msg" : ""};

    // check db conn
    if (db.testDB() != 0) {
        console.log("reconnect db...");
        db.init();
    }

    var userId = db.login(email, password);
    if (0 == userId) {
        clientResp["return_code"] = ERR.ERR_LOGIN_FAILED;
        clientResp["return_msg"] = ERR.errMsg(ERR.ERR_LOGIN_FAILED);
        xpiResp(res, clientResp);
        return;
    }

    switch(action) {
        case "login":
            break;
        case "list":
            act.list(db, userId, clientResp);
            break;
        case "save":
            act.save(db, userId, req.body.snapshot, req.body.tabs, clientResp);
            break;
        case "delete":
            act.delSnapshot(db, userId, req.body.snapshot, clientResp);
            break;
        default:
            clientResp["return_code"] = ERR.ERR_BAD_ACTION;
            clientResp["return_msg"] = ERR.errMsg(ERR.ERR_BAD_ACTION);
            break;
    }

    xpiResp(res, clientResp);
};

exports.apply = function(req, res){
    console.log(req.body);
    var email = req.body.email;
    var password = req.body.password;
    if (password.length < 6) {
        res.render('notice', {notice: 'Password length should larger than 6'});
        return;
    }
    if (password.length > 48) {
        res.render('notice', {notice: 'Password length should shorter than 48'});
        return;
    }
    // check db conn
    if (db.testDB() != 0) {
        console.log("reconnect db...");
        db.init();
    }

    var userId = db.getUserId(email);
    if (userId != 0) {
        res.render('notice', {notice: email + ' already exists!'});
        return;
    }

    var ret = db.addUser(email, password);
    if (false == ret) {
        res.render('notice', {notice: 'Internal Error!'});
    } else {
        res.render('notice', {notice: 'Congratulations, welcome aboard, enjoy yourself!'});
    }
};

function isValidPassword(s)  
{  
    var patrn = "/^[a-zA-Z]{1}([a-zA-Z0-9]|[._]){4,19}$/";
    if (!patrn.exec(s)) {
        return false;
    }
    return true;
}  
