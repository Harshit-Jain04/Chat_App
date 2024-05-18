const { Server } = require('socket.io');
const express = require('express'); 
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);

app.get("/", function (req, res) {
    console.log(req.url);
    res.sendFile('C:/Users/ACER/Documents/codes/chat.html');
});
users = new Object();
console.log(users);

io.on('connection', (socket) => {
    //socket.emit('connected');
    socket.on('new', (data) => {
        console.log(data);
        if (typeof(data)!=null){
            
            users[data.toString()] = socket.id;
        }
        console.log(users);
    });

    socket.on('join', (data,join) => {
        console.log('joined');
        socket.join(join);
        socket.in(join).emit('newmessage',data, 'new user joined',);
    });
    socket.on('message', (name, data, id) => {
        //console.log(data);
        //console.log(name);
        //console.log(typeof (name));
        //let id = users[name.toString()];
        //console.log(users);
        //console.log(id);
        socket.in(id).emit('newmessage', data, name);
    });
   
});


server.listen(8000, () => {
    console.log('server is running');
});