"use strict";

var validator = require("validator");
var Topic = require("../models/topic");

var controller = {
  test: function(req, res) {
    return res.status(200).send({
      message: "Hola que tal"
    });
  },
  save: function(req, res) {
    // recoger datos por post
    var params = req.body;

    // validar los datos
    try {
      var validate_title = !validator.isEmpty(params.title);
      var validate_content = !validator.isEmpty(params.content);
      var validate_lang = !validator.isEmpty(params.lang);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar"
      });
    }

    if (validate_content && validate_title && validate_lang) {
      // crear objeto a guardar
      var topic = new Topic();
      // asignar valores
      topic.title = params.title;
      topic.content = params.content;
      topic.code = params.code;
      topic.lang = params.lang;
      topic.user = req.user.sub;

      // guardar el topic
      topic.save((err, topicStore) => {
        if (err || !topicStore) {
          res.status(404).send({
            status: "error",
            message: "El tema no se ha guardado"
          });
        }
        // devolver una respuesta
        return res.status(200).send({
          status: "success",
          topic: topicStore
        });
      });
    } else {
      return res.status(200).send({
        message: "Los datos no son validos"
      });
    }
  },

  getTopics: function(req, res) {
    // Cargar la libreria de paginacion en la clase

    // recoger la pagina actual
    if (
      !req.params.page ||
      req.params.page == null ||
      req.params.page == undefined ||
      req.params.page == "0" ||
      req.params.page == 0
    ) {
      var page = 1;
    } else {
      var page = parseInt(req.params.page);
    }
    // indicar las opciones de paginacion
    var options = {
      sort: { date: -1 },
      populate: "user",
      limit: 5,
      page: page
    };

    // Find paginado
    Topic.paginate({}, options, (err, topics) => {
      if (err) {
        // devolver resultado (topics, total de topic, total de paginas)
        return res.status(500).send({
          status: "error",
          message: "Error al hacer la consulta"
        });
      }

      if (!topics) {
        // devolver resultado (topics, total de topic, total de paginas)
        return res.status(404).send({
          status: "error",
          message: "No hay topics"
        });
      }

      // devolver resultado (topics, total de topic, total de paginas)
      return res.status(200).send({
        status: "success",
        topics: topics.docs,
        totalDocs: topics.totalDocs,
        totalPages: topics.totalPages
      });
    });
  },

  getTopicsByUser: function(req, res) {
    // Conseguir el id del usuario
    var userId = req.params.user;

    // Find con una condicion de usuario
    Topic.find({
      user: userId
    })
      .sort([["date", "descending"]])
      .exec((err, topics) => {
        if (err) {
          return res.status(500).send({
            status: "error",
            message: "Error en la peticion"
          });
        }
        if (!topics) {
          return res.status(404).send({
            status: "error",
            message: "No hay temas para mostrar"
          });
        }
        // Devolver resultados
        return res.status(200).send({
          status: "success",
          topics
        });
      });
  },
  getTopic: function(req, res) {
    // Conseguir el id del topic
    var topicId = req.params.id;

    // Find con una condicion de usuario
    Topic.findById(topicId)
      .populate("user")
      .populate("comments.user")
      .exec((err, topic) => {
        if (err) {
          return res.status(500).send({
            status: "error",
            message: "Error en la peticion"
          });
        }
        if (!topic) {
          return res.status(404).send({
            status: "error",
            message: "No hay tema para mostrar"
          });
        }
        // Devolver resultados
        return res.status(200).send({
          status: "success",
          topic
        });
      });
  },
  update: function(req, res) {
    // recoger el id del topic de la URL
    var topicId = req.params.id;

    // recoger los datos que llegan desde el post
    var params = req.body;

    // validar los datos
    try {
      var validate_title = !validator.isEmpty(params.title);
      var validate_content = !validator.isEmpty(params.content);
      var validate_lang = !validator.isEmpty(params.lang);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar"
      });
    }

    if (validate_title && validate_content && validate_lang) {
      // montar un JSON con los datos modificables
      var update = {
        title: params.title,
        content: params.content,
        code: params.code,
        lang: params.lang
      };

      // find and update del topic por id y por id de usuario
      Topic.findOneAndUpdate(
        { _id: topicId, user: req.user.sub },
        update,
        {
          new: true
        },
        (err, topicUpdated) => {
          if (err) {
            return res.status(500).send({
              status: "error",
              message: "error en la peticion"
            });
          }
          if (!topicUpdated) {
            return res.status(404).send({
              status: "error",
              message: "No se ha actualizado el tema"
            });
          }
          // devolver respuesta
          return res.status(200).send({
            status: "success",
            topic: topicUpdated
          });
        }
      );
    } else {
      return res.status(200).send({
        message: "La validacion de datos no es correcta"
      });
    }
  },
  delete: function(req, res) {
    // Sacar el id del topic de la url
    var topicId = req.params.id;

    // Find and delete por topicID y por userID
    Topic.findOneAndDelete(
      { _id: topicId, user: req.user.sub },
      (err, topicRemoved) => {
        if (err) {
          return res.status(500).send({
            status: "error",
            message: "Error en la peticion"
          });
        }
        if (!topicRemoved) {
          return res.status(404).send({
            status: "error",
            message: "Topic no encontrado"
          });
        }

        //  devolver respuesta
        return res.status(200).send({
          status: "success",
          topic: topicRemoved
        });
      }
    );
  },
  search: function(req, res) {
    // Sacar string a buscar de la url
    var searchString = req.params.search;

    // Find or
     

    Topic.find({
      "$or": [
        { "title": { "$regex": searchString, "$options": "i" } },
        { "content": { "$regex": searchString, "$options": "i" } },
        { "code": { "$regex": searchString, "$options": "i" } },
        { "lang": { "$regex": searchString, "$options": "i" } }
      ]
    })
    .populate('user')
    .sort([["date", "descending"]])
    .exec((err, topics) => {
      console.log();
      if(err){
        return res.status(500).send({
        status: 'error',
        message: 'Error en la peticion'
        });        
      }
      if(Object.keys(topics).length==0 || !topics ){
        return res.status(404).send({
        status: 'error',
        message: 'No hay temas disponibles'
        });        
      }
      return res.status(200).send({
      status: 'success',
      topics
      });
      
    });    
  }
};

module.exports = controller;
