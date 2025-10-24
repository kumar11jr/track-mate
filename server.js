const {createServer} = require("http");
const {parse} = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({dev,hostname,port});
const handle = app.getRequestHandler();

app.prepare().then(()=>{
    const server = createServer(async(req,res)=>{
        try{
            const parsedUrl = parse(req.url,true);
            await handle(req,res,parsedUrl);
        }catch(err){
            console.log("Error occured handling",req.url,err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    })

    
    const {initializeSocket} = require("./lib/socket");
    initializeSocket(server);

    server.listen(port,(err)=>{
        if(err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`)
    })
})