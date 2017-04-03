/**
 * Created by moyu on 2017/3/28.
 */
const WebSocket = require('ws');
const url = require('url');
const path = require('path');
const readFilePromise = require('../helpers/readfile-promise');
const ft = require('../helpers/file-type');
const KVStorage = require('../helpers/KVStorage');
const FileWatcher = require('./FileWatcher');
const HTMLEditor = require('./HtmlEditor');

const watcherDB = new KVStorage();

const obj = (type, data) => {
    if (Array.isArray(type)) {
        if (!Array.isArray(data)) {
            data = [data];
        }
    }
    return JSON.stringify({type, data})
};

module.exports = function run (dirPath, app, options) {
    const wss = new WebSocket.Server(options);

    function broadcast(type="log", data, filter=()=>true) {
        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN && filter(client)) {
                client.send(obj(type, data));
            }
        });
    }

    function initSocket (ws) {
        const PREFIX = "";//"[HRS] "
        ws.log = function (data) {
            ws.send(obj('log', PREFIX+data))
        }
        ws.error = function (data) {
            ws.send(obj('error', PREFIX+data))
        }
    }


    wss.on('connection', function connection (ws) {
        initSocket(ws);
        ws.log('connected!');
        ws.on('close', () => {
            if(ws.watcher) {
                ws.watcher.close();
                watcherDB.rm(ws.watcher.filename);
                delete ws.watcher;
            }
        });
        ws.on('message', function (data) {
            data = JSON.parse(data);
            let json = data.data;
            json.value = json.value && json.value.trim() || '';
            if (data.type == 'register') {
                switch (json.type) {
                    case 'cors':
                        if (json.value.startsWith(dirPath)) {
                            let relativePath = json.value.substr(dirPath.length);
                            relativePath = relativePath.startsWith('/')?relativePath.substr(1):relativePath;
                            app.setPathMap(json.value);
                            json.value = relativePath;
                        } else if (!path.isAbsolute(json.value)){
                            let relativePath = json.value;
                            app.setPathMap(path.join(dirPath, relativePath));
                        } else {
                            let absolutePath = json.value;
                            // if (ft.isHTML(absolutePath)) {
                                // not in workspace
                            let myRoot = json.root ? (!path.isAbsolute(json.root) ? path.join(absolutePath, json.root) : json.root) : path.dirname(absolutePath);

                            !app.pathMap.exists(absolutePath)
                                && console.log('[CORS] root: %s, file: %s', myRoot, absolutePath);
                            const {registerFileWatcher} = require('../');
                            app.setPathMap(absolutePath).then(() => {
                                if (!watcherDB.exists(myRoot)) {
                                    watcherDB.set(myRoot, true);
                                    ws.watcher = registerFileWatcher(myRoot, {recursive: true});
                                }
                            });
                            // }
                        }
                        break;
                    case 'same-origin':
                    default:
                        json.type = 'same-origin';
                        let pathname = url.parse(json.value).pathname;
                        if (!/\.(html|htm)$/.test(pathname)) {
                            pathname += (pathname.endsWith('/')?'':'/') + 'index.html';
                        }
                        json.value = pathname = pathname.substr(1);
                        app.setPathMap(path.join(dirPath, pathname));
                }


                ws.registerData = json;
            } else {
                if (console[data.type]) {
                    const tag = data.type[0].toUpperCase() + data.type.substr(1)
                    process.stdout.write(tag+': ');
                    console[data.type].apply(null, json);
                } else {
                    console.log('received data from client: %s', JSON.stringify(json));
                }
            }
        });
    });

    wss.broadcast = broadcast;
    return wss;
};


