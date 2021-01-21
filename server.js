var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

var dbUrl = 'mongodb+srv://rkomati:rhs149@cluster0.zv7zk.mongodb.net/Cluster0?retryWrites=true&w=majority';


var Message = mongoose.model('message', {
    name: String,
    message: String
})

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        if (err)
            res.sendStatus(500);
        res.send(messages);
        console.log('messages sent');
    });
});

app.post('/message', async (req, res) => {
    try {
        console.log(req.body);
        var message = new Message(req.body);
        var saveMessage = await message.save();
        var censored = await Message.findOne({message : 'badword'});
        if (censored) {
            console.log('censored word found');
            await Message.deleteOne({ _id : censored.id});
        } else
            io.emit('message', req.body);
        res.sendStatus(200);
    } catch(err) {
        res.sendStatus(500);
    } finally {
        console.log('message post executed');
    }
});

app.delete('/messages', async (req, res) => {
    try {
        await Message.remove({});
        console.log('all messages removed');
        io.emit('clear');
        res.sendStatus(200);
    } catch (err) {
        console.log('error in remove all messages', err);
        res.sendStatus(500);
    } finally {
        console.log('remove all messages executed');
    }
});

io.on('connection', () => {
    console.log('a user connected');
});

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    console.log('mongo db connected', err);
});

var server = http.listen("3000", () => {
    console.log("express server started", server.address().port);
});

