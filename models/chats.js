const mongoose = require('mongoose'); 

const messageSchema = mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, 
    content: String, 
    dateCreation: Date 
});

const chatSchema = mongoose.Schema({
    author:[{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }], 
    admin:[{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }], 
    participant:[{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }], 
    race: [{ type: mongoose.Schema.Types.ObjectId, ref: 'races' }], 
    type: String, 
    dateCreation: Date, 
    messages : [messageSchema] 
});

const Chat = mongoose.model('chats', chatSchema); 

module.exports = Chat; 
