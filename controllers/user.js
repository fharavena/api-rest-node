"user strict";

const fs = require("fs");
var path = require("path");
//Cargar validador
var validator = require("validator");

// Cargar modelo
var User = require("../models/user");

// Cargar encriptador de contraseña
var bcrypt = require("bcrypt");
var jwt = require("../services/jwt");

var controller = {
  probando: function(req, res) {
    return res.status(200).send({
      message: "Soy el metodo probando"
    });
  },
  testeando: function(req, res) {
    return res.status(200).send({
      message: "Soy el metodo testeando"
    });
  },
  save: function(req, res) {
    // Recoger los parametros de la petición
    var params = req.body;

    // Validar los datos

    try {
      var validate_name = !validator.isEmpty(params.name);
      var validate_surname = !validator.isEmpty(params.surname);
      var validate_email =
        !validator.isEmpty(params.email) && validator.isEmail(params.email);
      var validate_password = !validator.isEmpty(params.password);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar",
        params
      });
    }

    //console.log(validate_name, validate_surname, validate_email, validate_password);
    if (
      validate_name &&
      validate_surname &&
      validate_email &&
      validate_password
    ) {
      // Crear objeto de usuario
      var user = new User();

      // Asignar valores al objeto
      user.name = params.name;
      user.surname = params.surname;
      user.email = params.email.toLowerCase();
      user.password = params.password;
      user.role = "ROLE_USER";
      user.image = null;

      // Comprobar si el usuario ya existe
      User.findOne({ email: user.email }, (err, issetUser) => {
        if (err) {
          return res.status(500).send({
            message: "Error al comprobar duplicidad de usuario"
          });
        } else if (!issetUser) {
          // Si no existe

          // cifrar la contraseña
          bcrypt.hash(params.password, 10, (err, hash) => {
            user.password = hash;

            // guardar usuario
            user.save((err, userStored) => {
              if (err) {
                return res.status(500).send({
                  message: "Error al guardar el usuario"
                });
              } else if (!userStored) {
                return res.status(500).send({
                  message: "El usuario no se ha guardado"
                });
              } else {
                // Devolver resupuesta
                return res.status(200).send({
                  status: "success",
                  user: userStored
                });
              }
            }); // close save
          }); //close bcrypt
        } else {
          return res.status(500).send({
            status: "error",
            message: "El usuario ya esta registrado"
          });
        }
      });
    } else {
      return res.status(400).send({
        message:
          "La validación de los datos de usuario incorrecta, revisa los datos"
      });
    }
  },
  login: function(req, res) {
    // recoger los parametros de la peticion
    var params = req.body;

    // validar los datos
    try {
      var validate_email =
        !validator.isEmpty(params.email) && validator.isEmail(params.email);
      var validate_password = !validator.isEmpty(params.password);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar",
        params
      });
    }

    if (!validate_email || !validate_password) {
      return res.status(200).send({
        message: "Datos enviados incorrectamente"
      });
    }
    // buscar usuarios que coincidan con el email
    User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
      if (err) {
        return res.status(500).send({
          message: "Usuario al intentar identificarse"
        });
      }
      if (!user) {
        return res.status(404).send({
          message: "Usuario no encontrado"
        });
      }
      // si lo encuentra
      // comprobar la contraseña (coincidencia de email y password / bcript)
      bcrypt.compare(params.password, user.password, (err, check) => {
        // si es correcto
        if (check) {
          // generar token de jwt y devolvelo
          if (params.gettoken) {
            // devolver los datos
            return res.status(200).send({
              token: jwt.createToken(user)
            });
          } else {
            // limpiar objeto
            user.password = undefined;
            // devolver los datos
            return res.status(200).send({
              status: "success",
              user
            });
          }
        } else {
          return res.status(200).send({
            message: "Las credenciales no son correctas"
          });
        }
      });
    });
  },
  update: function(req, res) {
    // Recoger los datos del usuario
    var params = req.body;
    // Validar los datos
    try {
      var validate_name = !validator.isEmpty(params.name);
      var validate_surname = !validator.isEmpty(params.surname);
      var validate_email =
        !validator.isEmpty(params.email) && validator.isEmail(params.email);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar"
      });
    }

    if (!validate_name || !validate_surname || !validate_email) {
      return res.status(200).send({
        message: "Error en la validación de datos"
      });
    }

    // Eliminar propiedades innecesarias
    delete params.password;

    var userId = req.user.sub;

    // Comprobar si el email es unico

    if (req.user.email != params.email) {
      User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
        if (err) {
          return res.status(500).send({
            message: "Error usuario al intentar identificarse"
          });
        } else if (user && user.email == params.email) {
          return res.status(404).send({
            message: "El email pertenece a otro usuario"
          });
        } else {
          // Buscar y actualizar documento
          User.findOneAndUpdate(
            { _id: userId },
            params,
            { new: true },
            (err, userUpdate) => {
              if (err) {
                return res.status(500).send({
                  status: "error",
                  message: "Error al actualizar usuario"
                });
              } else if (!userUpdate) {
                return res.status(500).send({
                  status: "error",
                  message: "No se ha actualizado el usuario"
                });
              } else {
                // Devolver respuesta
                return res.status(200).send({
                  status: "success",
                  user: userUpdate
                });
              }
            }
          );
        }
      });
    } else {
      // Buscar y actualizar documento
      User.findOneAndUpdate(
        { _id: userId },
        params,
        { new: true },
        (err, userUpdate) => {
          if (err) {
            return res.status(500).send({
              status: "error",
              message: "Error al actualizar usuario"
            });
          } else if (!userUpdate) {
            return res.status(500).send({
              status: "error",
              message: "No se ha actualizado el usuario"
            });
          } else {
            // Devolver respuesta
            return res.status(200).send({
              status: "success",
              user: userUpdate
            });
          }
        }
      );
    }
  },

  uploadAvatar: function(req, res) {
    // Configurar el modulo multiparty (md), hecho en routers/user.js

    // Recoger el fichero de la peticion

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No hay archivos para subir.");
    }

    // The name of the input field (i.e. "file0") is used to retrieve the uploaded file
    let file0 = req.files.file0;

    var re = /(?:\.([^.]+))?$/;
    var extension = re.exec(req.files.file0.name)[1];
    //  console.log(req.files.file0);
    if (
      extension != "png" &&
      extension != "jpg" &&
      extension != "jpeg" &&
      extension != "gif"
    ) {
      return res.status(500).send({
        status: "error",
        message: "Extension de archivo no permitido"
      });
    }

    // Sacar el id del usuario identificado
    var timestamp = new Date().getTime().toString();
    var userId = req.user.sub;
    var nombreArchivo = userId + "_" + timestamp + "." + extension;

    return file0.mv("./uploads/users/" + nombreArchivo, function(err) {
      if (err) {
        return res.status(500).send(err);
      } else {
        // Buscar y actualizar documento bd
        User.findOneAndUpdate(
          { _id: userId },
          { image: nombreArchivo },
          { new: true },
          (err, userUpdate) => {
            if (err || !userUpdate) {
              return res.status(200).send({
                status: "error",
                message: "Error al guardar usuario"
              });
            } else {
              // Devolver respuesta
              return res.status(200).send({
                status: "success",
                user: userUpdate
              });
            }
          }
        );
      }
    });
  },
  avatar: function(req, res) {
    var fileName = req.params.fileName;

    var pathFile = "./uploads/users/" + fileName;
    // console.log(pathFile);

    fs.exists(pathFile, exists => {
      if (exists) {
        return res.sendFile(path.resolve(pathFile));
      } else {
        return res.status(404).send({
          message: "La imagen no existe"
        });
      }
    });
  },

  getUsers: function(req, res) {
    User.find().exec((err, users) => {
      if (err || !users) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios que mostrar"
        });
      } else {
        return res.status(200).send({
          status: "success",
          users
        });
      }
    });
  },

  getUser: function(req, res) {
    var userId = req.params.userId;

    User.findById(userId).exec((err, user) => {
      if (err || !user) {
        return res.status(404).send({
          status: "error",
          message: "No existe el usuario"
        });
      } else {
        return res.status(200).send({
          status: "success",
          user
        });
      }
    });
  }
};

module.exports = controller;
