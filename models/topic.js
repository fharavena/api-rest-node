"user strict";

var mongoose = require("mongoose");
var moongoosePaginate = require("mongoose-paginate-v2");
var Schema = mongoose.Schema;

//Modelo de COMMENT
var CommentSchema = Schema({
  content: String,
  date: { type: Date, default: Date.now },
  user: { type: Schema.ObjectId, ref: "User" }
});

var Comment = mongoose.model("Comment", CommentSchema);

// Modelo de TOPIC
var TopicSchema = Schema({
  title: String,
  content: String,
  code: String,
  lang: String,
  date: { type: Date, default: Date.now },
  user: { type: Schema.ObjectId, ref: "User" },
  comments: [CommentSchema]
});

// Cargar paginacion
TopicSchema.plugin(moongoosePaginate);

module.exports = mongoose.model("Topic", TopicSchema);
