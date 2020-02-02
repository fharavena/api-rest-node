"use strict";

var globalenv = require("./services/globalenv");
var mongoose = require("mongoose");
var app = require("./app");
var port = process.env.PORT || 3999;


mongoose.set("useFindAndModify", false);
mongoose.Promise = global.Promise;
mongoose
  .connect(globalenv.url, {
//.connect("mongodb://fharavena:conejo123@ds213705.mlab.com:13705/cafe", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log(
      "la conexion a la base de datos de mongo se ha realizado correctamente!!!"
    );
    // Crear el servidor
    app.listen(port, () => {
      console.log(`El servidor http://localhost:${port} esta funcionado !!!`);
    });
  })
  .catch(error => console.log(error));
