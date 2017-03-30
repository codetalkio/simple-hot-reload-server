# Simple Hot Reload Server

Set up a server for frontend files(html/css/js/image/...) & Watch frontend files.

connected server and client by WebSocket.


```bash
npm install -g simple-hot-reload-server
```

```text
Usage: hrs [-p port] path

Options:

  -v --version                get current version.
  -p --port                   set port of server.(default: 8082)
  -h --help                   how to use it.
```

## Feature

**Support Local Server**
1. set up an node server
    ```bash
    hrs path/to/front/root    
    ```
2. open html in address
    ```
    http://localhost:8082/where
    ```

**Support CORS**
1. set up an node server
    ```bash
    hrs
    ```
2. insert script in HTML manually.
    ```html
    <script
        src="http://localhost:8082/__hrs__/client-script.js"
        hrs-local="/Users/moyu/fe-code/a/b/jsonp.html"
        hrs-root="/Users/moyu/fe-code"
    >
    </script>
    ```
    `hrs-local`: map to local html file
    `hrs-root`: node server detect the directory for hot reload.