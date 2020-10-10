var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MemoSchema = new Schema({
    topic : {
        type : String,
        required : true
    },
    description : {
        type : String,
        default : ''
    },
    important : {
        type : Boolean,
        default : false
    },
    validity : {
        type : Date,
    }
},{
    timestamps : true,
});

var UserSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    admin : {
        type : Boolean,
        default : false
    },
    memos : [MemoSchema]
});

module.exports = mongoose.model('User',UserSchema);