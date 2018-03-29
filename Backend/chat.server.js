/* 
    Initializes a web socket server to handle the chat box on the react side
    
    Workflow for chat-box (react) side:
        [React Chatbox] ----Sends via WS----> [WSS] --> [App\ConvoService] --> [MongoDB]
                                                |
                                                V 
                                                --> [Sends Data to Other Clients]
                                                  
    Workflow for admin/conversation/edit (angular) side:
        [Convo Edit] --api/add-message--> [Route] --> [Component] --> [Service] --> [MongoDB]
        
        In parallel, every 5 seconds
        [Convo Edit] --api/get-by-id--> [Route] --> [Component] --> [Service] --> [MongoDB]
                                                                                      |
                                                                                      V
            [Convo Edit] <------------------------------------------------------------
*/

const conversationService = require('./services/conversations.service');
const userService = require('./services/user.service');
const crypto = require('crypto');
const express = require('express');
const app = express();
const WebSocket = require('ws');
const http = require('http');

/* === ***HARDCODED ANONYMOUS USER*** === */
const anon = "5a721707fb216af1d39d300d";
/* ====================================== */

/** ======= GLOBAL VARIABLES =========
 * _conversations associates each active conversations
 * (using its mongo ObjectId) with a list of websocket connections
 */
const _conversations = {};
/*
 * _clients associates each client (by setting a cookie) with a
 * particular live-support conversation
 */
const _clients = {};
/*
 * ====================================== 
 */
let _superAdmins;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Load _clients with pre-existing conversations

wss.on('connection', function connection(ws, request) {
    console.log('| WebSocket | New client connected.');

    userService.getAll({ role: 'Super Admin' })
        .then(data => _superAdmins = data)
        .catch(err => console.log(err));;

    let currentConversation = null;

    const getConversation = id => {
        conversationService.readById(id)
            .then(readByIdSuccess.bind(null, currentConversation))
            .then((data) => {
                currentConversation = data;
                let id = currentConversation._id
                _conversations[id] ?
                    _conversations[id].push(ws) :
                    _conversations[id] = [ws];
                ws.send(createMsg('chatHistory', currentConversation.messages))
                _clients[cookie] = currentConversation._id
            })
            .catch(onError)
    };

    const getUserConversation = id => {
        conversationService.readById(id)
            .then(readByIdSuccess.bind(null, currentConversation))
            .then((data) => {
                currentConversation = data;
                let id = currentConversation._id
                _conversations[id] ?
                    _conversations[id].push(ws) :
                    _conversations[id] = [ws];
                ws.send(createMsg('getUserChatHistory', currentConversation.messages))
                _clients[cookie] = currentConversation._id
            })
            .catch(onError)
    };

    /* GETS or SETS COOKIE 'ls' (live-support) */
    let cookie = request.headers.cookie ? _getCookie('ls', request.headers.cookie) : null;

    if (cookie) {
        if (_clients[cookie]) {
            getConversation(_clients[cookie])
        };
    } 
    else {
        cookie = crypto.randomBytes(32).toString("base64");
        ws.send(createMsg('set-cookie', createData(cookie)));
    }

    /**
     * HANDELING NEW MESSAGES FROM WEBSOCKET
     */
    ws.on('message', function incoming(msgString) {
        try {
            msg = JSON.parse(msgString)
        } catch (e) {
            alert(e)
        }
        if (msg.type) {
            switch (msg.type) {
                case 'liveSupport':
                    conversationService
                        .create(createLiveSupportConversation(msg.data))
                        .then(result => getConversation(result.insertedId))
                    break;
                case 'chatHistory':
                    (!msg.data.text)
                        ? ws.send(createMsg('error', createData('Could not locate chat history')))
                        : getConversation(msg.data.text)
                    break;
                case 'getUserChatHistory': 
                    (!msg.data.text)
                        ? ws.send(createMsg('error', createData('Could not locate chat history')))
                        : getUserConversation(msg.data.text) 
                    break;
                case 'message':
                    if (msg.data.text) {
                        ws.send(createMsg('message', msg.data));

                        (currentConversation._id)
                            ? conversationService
                                .addMessage(currentConversation._id, msg.data)
                                .then(Promise.resolve())
                                .catch(err => console.log(err))
                            : console.log('| WebSocket | ERROR invalid conversation ID or sender ID');
                    }
                    break;
                case 'editMessage':
                    conversationService.editMessage(currentConversation._id, msg.data.messageItem, msg.data.index)
                        .then(result => {
                            let conversationClients = _conversations[currentConversation._id]

                            conversationClients.forEach(client => {
                                if (client !== ws && client.readyState === WebSocket.OPEN) {
                                    client.send(createMsg('edit', msg.data));
                                }
                            })
                        })
                        .catch(err => console.log(err));
                    break;
                case 'pinnedMessage':
                    conversationService
                        .pinnedMessage(currentConversation._id, msg.data.index, msg.data.pinned)
                    break;
                case 'deleteMessage':
                    conversationService
                        .deleteMessage(currentConversation._id, msg.data.index)
                        .then(result => {
                            let conversationClients = _conversations[currentConversation._id]
                            conversationClients.forEach(client => {
                                if (client !== ws && client.readyState === WebSocket.OPEN) {

                                    client.send(createMsg('delete', msg.data));
                                };
                            });
                        })
                        .catch(err => console.log(err));
                default:
                    break;
            }
        }
    });

    ws.on('close', () => console.log('| WebSocket | Client disconnected'));
    ws.on('error', (error) => console.log(error, 'Error on websocket'));
})

wss.on('error', (error) => { console.log(error, 'Error on websocket server') });

/* == Helper methods / Constructors == */
function createMsg(type, data) {
    let message = {
        type: type,
        data: data
    }
    return JSON.stringify(message)
}

function createData(text, senderId) {
    return {
        text: text,
        senderId: senderId || '| Live-Support |',
        createDate: (() => new Date())()
    }
}

function createLiveSupportConversation(data) {
    let participants = _superAdmins
        .map(admin => {
            delete admin.firstName;
            return admin._id;
        })
        .concat(!_superAdmins.includes(data.senderId) ? data.senderId || anon : '');
    let messages = Array.of(data)
    let createDate = updateDate = data.createDate

    return {
        participants,
        messages,
        createDate,
        updateDate
    }
}

function _getCookie(name, cookie) {
    function escape(s) { return s.replace(/([.*+?\^${}()|\[\]\/\\])/g, '\\$1'); };
    var match = cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
    return match ? match[1] : null;
}

function readByIdSuccess(currentConversation, data) {
    currentConversation = data;
    return currentConversation
}

function onError(err) {
    console.log(err)
}


/* Start listening */
server.listen(1337, function listening() {
    console.log(`Websocket magic happens on port: ${server.address().port}`);
})

module.exports = {
    connections: { ws: () => _conversations, createMsg: createMsg }
}
