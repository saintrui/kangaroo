const widgets = require("widget");
const tabs = require("tabs");
const windows = require("windows").browserWindows;
//var remoteHost = "http://localhost:3000"
var remoteHost = "http://ec2-175-41-136-138.ap-southeast-1.compute.amazonaws.com:80"
var snapshots;
var panelInit = false;
//var panelInit = true;
var userInfo = require('simple-storage').storage.userInfo;
//userInfo = {'user':"wsrzju@gmail.com", 'pass': "260ca9dd8a4577fc00b7bd5810298076"};

function showNotifications(title, text) {
    var notifications = require('notifications');
    notifications.notify({
        title: title,
        text: text
    });
}

function parseResp(response) {
    if (response.status != "200") {
        showNotifications("Kangaroo", "Server response error code: " + response.status);
        return;
    }

    var respStr = decodeURIComponent(response.text);
    console.log("server resp: " + respStr);
    var respJson = JSON.parse(respStr);

    var action = respJson.action;
    var returnCode = respJson.return_code;
    var returnMsg = respJson.return_msg;

    if (returnCode != 0) {
        showNotifications("Kangaroo", returnMsg);
        return;
    }

    if ("list" == action) {
        snapshots = respJson.tabs;
        startPanel.port.emit("list ready", snapshots);
        panelInit = true;

        var items = [];
        for (var g in snapshots) {
            items.push(cm.Item({label: 'save to ' + g, data: g}));
        }
        menu.items = items;
    } else if ("save" == action) {
        showNotifications("Kangaroo", "Tabs are saved successfully");
        listReq();
    } else if ("delete" == action) {
        showNotifications("Kangaroo", "Tabs are deleted successfully");
        listReq();
    } else if ("login" == action) {
        showNotifications("Kangaroo", "login successfully");
        var ss = require('simple-storage');
        ss.storage.userInfo = userInfo;
        listReq();
    } else if ("append" == action) {
        showNotifications("Kangaroo", "Tab is saved successfully");
        listReq();
    } else {
        console.error("unsupported action: " + action);
    }
}
// post to server
const Request = require("request").Request;
function RqPostTabs(postData) {
    Request({
        url: remoteHost,
        content: postData,
        contentType: "application/x-www-form-urlencoded",
        onComplete: function (response) {
            parseResp(response);
        }
    }).post();
};

function listReq() {
    var objJson = {"action" : "list", "email" : userInfo['user'], "password" : userInfo['pass']};
    var objStr = JSON.stringify(objJson);
    console.log("post to server: " + objStr);
    RqPostTabs(objJson);
}

// panel
data = require("self").data
var startPanel = require("panel").Panel({
    width:800,
    height:600,
    contentScriptWhen: 'end',
    contentURL: data.url("start.html"),
    contentScriptFile: [data.url("content_script_list.js")],
    onShow: function() {
        if (false == panelInit) {
            this.port.emit('init', '');
        } else {
            //listReq();
        }
    }
});

startPanel.port.on('apply', function(msg) {
    tabs.open(remoteHost);
});

startPanel.port.on('logout', function(msg) {
    panelInit = false;
    userInfo = {};
    showNotifications('Kangaroo', 'logout successfully');
    startPanel.hide();
});

startPanel.port.on('login', function(msg) {
    userInfo = JSON.parse(msg);
    var md5 = require('md5.js').md5;
    userInfo['pass'] = md5(userInfo.pass);
    var objJson = {"action" : "login", "email" : userInfo['user'], "password" : userInfo['pass']};
    var objStr = JSON.stringify(objJson);
    console.log("post to server: " + objStr);
    RqPostTabs(objJson);
    startPanel.hide();
});

startPanel.port.on("delete", function(snapshot) {
    console.log("start to delete snapshot: " + snapshot);
    var objJson = {"action" : "delete", "email" : userInfo['user'], "password" : userInfo['pass'], "snapshot" : snapshot};
    var objStr = JSON.stringify(objJson);
    console.log("post to server: " + objStr);
    RqPostTabs(objJson);
    //startPanel.hide();
});
startPanel.port.on("recover", function(snapshot) {
    console.log("start to recover snapshot: " + snapshot);
    console.log(JSON.stringify(snapshots));
    var items = snapshots[snapshot];
    for (var i = 0; i < items.length; ++i) {
        var item = items[i];
        tabs.open(item.url);
    }
    startPanel.hide();
});
startPanel.port.on("save", function(msg) {
    console.log("start to save tabs as : " + JSON.stringify(msg));
    var i = 0;
    var objJson = {"action" : "save", "email" : userInfo['user'], "password" : userInfo['pass'], "snapshot" : msg.name};
    objJson["tabs"] = new Array();
    pending_tabs = msg.save_all ? windows.activeWindow.tabs : new Array(tabs.activeTab);
    for each (var tab in pending_tabs) {
        if (tab.url.length < 1 || tab.url.indexOf("about") == 0) {
            console.log("don't save tab of invalid url: " + tab.url);
            continue;
        }
        var tabItem = {
            "title" : tab.title.length < 1? 'Unknown title' : tab.title,
            "url" : tab.url
        };
        console.log("tab: " + tab.title + " " + tab.url);
        objJson.tabs[i] = tabItem;
        i++;
    }
    if (objJson.tabs.length < 1) {
        var errMsg = "No valid tabs to save";
        console.warn(errMsg);
        showNotifications("Kangaroo", errMsg);
        return;
    }
    var objStr = JSON.stringify(objJson);
    console.log("post to server: " + objStr);
    RqPostTabs(objJson);
});

startPanel.port.on("cm_click", function(msg) {
    console.log("panel get: " + msg);
});
/*var pageMod = require("page-mod");
  pageMod.PageMod({
  include: '*',
  contentScriptWhen: 'end',
    contentScriptFile: data.url("save_tab.js")
    //contentScript: 'document.body.innerHTML = ' +
    //' "<h1>Page matches ruleset</h1>";'
});
var buttonScript = [
'var butt = document.createElement("button");', //define button element
    'var btext = document.createTextNode("Click me");', //define the text
    'butt.appendChild(btext);', //attach text to the button
    'butt.addEventListener("click", function(){document.bgColor="red"} , false)', //handle onclick event
    'document.getElementById("test").appendChild(butt);', //put the button on the page
    ];

var pageButton = require("page-mod").PageMod({
    include: 'http://talkweb.eu/labs/jetpack/button.html', // this script will works only on this website
    contentScriptWhen: 'ready',
    contentScript: buttonScript
});
*/

var widget = widgets.Widget({
    id: "wwww.kangaroo.net.cn",
    label: "Kangaroo",
    panel: startPanel,
    contentURL: data.url("kangaroo.ico"),
});

var cm = require("context-menu");
menu = cm.Menu({
      label: "Kangaroo",
      contentScript: 'self.on("click", function (node, data) {' +
                           'console.log("You clicked " + data);' +
                           'self.postMessage(data);' +
                           '}); ',
      onMessage: function (data) {
          var url = tabs.activeTab.url;
          var title = tabs.activeTab.title;
          if (url.length < 1 || url.indexOf("about") == 0) {
              var errMsg = "Can't save empty tab";
              console.warn(errMsg);
              showNotifications("Kangaroo", errMsg);
              return;
          }
          console.log('save tab ' + url + ' to group ' + data);
          var objJson = {"action" : "append", "email" : userInfo['user'],
              "password" : userInfo['pass'], "snapshot" : data,
              "tabs" : [
                   {"title" : title.length<1?"Unknown title":title, "url" : url}
              ]};
          var objStr = JSON.stringify(objJson);
          console.log("post to server: " + objStr);
          RqPostTabs(objJson);
      },
      items: []
});
