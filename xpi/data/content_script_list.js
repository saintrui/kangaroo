function evLogout(ev) {
    var nd = document.getElementById('divLogin');
    nd.style.visibility = 'visible';
    nd.style.display = 'block';
    self.port.emit('logout', "");
}

function evLogin(ev) {
    loginJson = {};
    loginJson['user'] = document.getElementById('user').value;
    loginJson['pass'] = document.getElementById('pass').value;

    nd = document.getElementById('infoUser');
    nd.setAttribute('alt', loginJson.user);

    if (loginJson.user.length < 1) {
        alert('please input username');
        return;
    } else if (loginJson.pass.length < 1) {
        alert('please input password');
        return;
    } else {
        self.port.emit('login', JSON.stringify(loginJson));
    }
}

function evApply(ev) {
    self.port.emit('apply', '');
}

function evDeleteTabs(ev) {
    var ret = window.confirm('Are you sure to delete ' + ev.target.value + '?'); 
    if (false == ret) {
        console.log("cancel delete " + ev.target.value);
    } else {
        self.port.emit('delete', ev.target.value);
    }
}

function evSaveTabs(ev) {
    var emit = true;
    var name = document.getElementById('saveName').value;
    if (name.length < 1) {
        var now = new Date();
        var m = now.getMonth() + 1;
        var d = now.getDate();
        name = "" + now.getFullYear() + m + d + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        var ret = window.confirm('Save as: ' + name + "?");
        if (false == ret) {
            emit = false;
            console.log("cancel save");
        }
    }
    if (true == emit) {
        var save_all = document.getElementById('all_tabs').checked;
        var saveJson = {'name' : name, 'save_all' : save_all};
        self.port.emit('save', saveJson);
    }
}

self.port.on('init', function(msgJson) {
    console.log('init login');
    document.getElementById('divMain').style.visibility = 'hidden';

    document.getElementById('login').removeEventListener('click', evLogin, false); 
    document.getElementById('login').addEventListener('click', evLogin, false);

    document.getElementById('apply').removeEventListener('click', evApply, false); 
    document.getElementById('apply').addEventListener('click', evApply, false);
});

self.port.on('list ready', function(msgJson) {
    console.log("get msg list ready: " + JSON.stringify(msgJson));

    // hide login div
    var nd = document.getElementById('divLogin');
    if (null != nd) {
        console.log("remove: " + nd.getAttribute('id'));
        nd.removeEventListener('click', evLogin, false);
        document.getElementById('apply').removeEventListener('click', evApply, false); 

        nd.style.visibility = 'hidden';
        nd.style.display = 'none';
        //document.body.removeChild(nd);
        document.getElementById('divMain').style.visibility = 'visible';
    }

    var rootNode = document.getElementById('divTabs');
    var nodes = rootNode.childNodes;
    for (var i = 0; i < nodes.length; ++i) {
        rootNode.removeChild(nodes[i]); 
    }

    var ul = document.createElement('ul');
    rootNode.appendChild(ul);

    var listStr = '';
    for (var s in msgJson) {
        console.log("snapshot: " + s);
        var btRecoverId = 'bt_rec_' + s;
        if (document.getElementById(btRecoverId)) {
            console.log("element exists: " + btRecoverId);
            continue;
        }
        // first layer li
        var e1 = document.createElement('li');
        e1.setAttribute('class', "jstree-last jstree-closed");
        var e11 = document.createElement('ins');
        e11.setAttribute('class', "jstree-icon");
        e1.appendChild(e11);
        var e12 = document.createElement('a');
        e12.innerHTML = s;
        e1.appendChild(e12);

        var e2 = document.createElement('input');
        e2.setAttribute('style', 'margin-left:10px');
        e2.setAttribute('type', 'image');
        e2.setAttribute('src', "open.jpg");
        e2.setAttribute('id', btRecoverId);
        e2.setAttribute('value', s);
        e1.appendChild(e2);
        var e5 = document.createElement('input');
        e5.setAttribute('style', 'margin-left:10px');
        e5.setAttribute('type', 'image');
        e5.setAttribute('src', "delete.png");
        var btDelId = 'bt_del_' + s;
        e5.setAttribute('id', btDelId);
        e5.setAttribute('value', s);
        e1.appendChild(e5);

        // second layer li
        var e3 = document.createElement('ul');
        var items = msgJson[s];
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            console.log("    title: " + item.title);
            console.log("    url: " + item.url);

            var e4 = document.createElement('li');
            e4.setAttribute('class', "jstree-last jstree-leaf");
            var e41 = document.createElement('ins');
            e41.setAttribute('class', "jstree-icon");
            e4.appendChild(e41);
            var e42 = document.createElement('a');
            e42.setAttribute('href', item.url);
            var e421 = document.createElement('ins');
            e421.setAttribute('class', 'jstree-icon');
            e42.appendChild(e421);
            e42.innerHTML = item.title;
            e4.appendChild(e42);
            e3.appendChild(e4);
        }
        e1.appendChild(e3);
        ul.appendChild(e1);

        document.getElementById(btRecoverId).addEventListener('click', function(ev) {
            self.port.emit('recover', ev.target.value);
        }, false);

        document.getElementById(btDelId).addEventListener('click', evDeleteTabs, false);
    }

    //console.log(document.body.innerHTML);

    document.getElementById('saveTabs').removeEventListener('click', evSaveTabs, false);
    document.getElementById('saveTabs').addEventListener('click', evSaveTabs, false);

    document.getElementById('logout').removeEventListener('click', evLogout, false);
    document.getElementById('logout').addEventListener('click', evLogout, false);
});
