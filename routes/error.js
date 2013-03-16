exports.ERR_LOGIN_FAILED = -1001;
exports.ERR_BAD_ACTION = -1002;
exports.ERR_DUP_SNAP_NAME = -1003;
exports.ERR_INTERNAL = -1004;

exports.errMsg = function(code) {
    switch(code) {
        case this.ERR_LOGIN_FAILED:
            return "Bad username or password";
        case this.ERR_BAD_ACTION:
            return "Bad action";
        case this.ERR_DUP_SNAP_NAME:
            return "Duplicate snapshot name";
        case this.ERR_INTERNAL:
            return "Server Internal Error";
        default:
            return "Bad error code: " + code;
    }
}


