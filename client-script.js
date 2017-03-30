/**
 * Created by moyu on 2017/3/28.
 */

!function (DATA) {
    var dataHrsLocalScript = document.querySelector('script[hrs-local]');
    if (dataHrsLocalScript) {
        DATA = DATA || {};
        var src = dataHrsLocalScript.getAttribute('src');
        var mather = src.match(/[^\?]+:(\d+)/);
        if (mather.length>=2) {
            DATA.port = mather[1];
        } else {
            DATA.port = 80;
        }
    }
    function getRegisterData() {
        if (dataHrsLocalScript) {
            var root = dataHrsLocalScript.getAttribute('hrs-root');
            return {
                type: 'cors',
                value: dataHrsLocalScript.getAttribute('hrs-local'),
                root: root && root.trim()
            }
        } else {
            return {
                type: 'same-origin',
                value: location.pathname
            }
        }
    }

    var PREFIX = '[HRS] ';
    var methods = {
        error: function error(message) {
            console.error(new Error(PREFIX + message))
        },
        log: function error(message) {
            console.log(PREFIX + message);
        },
        reload: function () {
            location.reload();
        }
    };


    if (!DATA) {
        methods.error('The global data has not existed!');
    }

    var connect_timer = null;
    var connect_socket = null;

    function connect() {
        if (connect_socket != null) {
            connect_socket.close();
            connect_socket = null;
        }

        connect_socket = new WebSocket("ws://localhost:"+DATA.port);

        var socket = connect_socket;

        // Connection opened
        socket.addEventListener('open', function (event) {
            if (connect_timer != null) {
                clearInterval(connect_timer);
            }
            socket.send(JSON.stringify({
                type: 'register', data: getRegisterData()//location.pathname
            }));
        });

        socket.addEventListener('close', function (event) {
            if (connect_timer != null) {
                return;
            }
            connect_timer = setInterval(function () {
                connect();
            }, 2000);
        });

        socket.addEventListener('error', function (error) {
            socket.close();
        });

        // Listen for messages
        socket.addEventListener('message', function (event) {
            var data = JSON.parse(event.data);
            if (!Array.isArray(data.type)) {
                data.type = [data.type];
                data.data = [data.data];
            }
            data.type.forEach(function (name, index) {
                methods[name](data.data[index]);
            });
        });
    }

    connect();

}(window.__HRS_DATA__);
