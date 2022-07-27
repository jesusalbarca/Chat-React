'use strict';
const express = require('express');
const app = express();
const server = require("http").Server(app);
//libreria generacion nombres aleatorios
var Chance = require('chance');


const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

//app.use(express.static('www'));

const users = {};
let listaUsuarios = [];
// Nombre de usuario aleadorio
var chance = new Chance();
let random;


//Enviar pregunta Open Trivial
setInterval( async()=>{
   let aleuser = Math.floor(Math.random()*(listaUsuarios.length + 1));
    for(let i = 0 ; i <listaUsuarios.length;i++){
      if(i==aleuser){
        io.to(listaUsuarios[aleuser].id).emit("randomQuestion");
        console.log("enviada pregunta");
      }
    } 
},30000);


io.on("connection", function(socket){
  random = chance.name();

  const usuario = {
      name: random,
      id: socket.id
  };
  users[socket.id] = usuario;
  listaUsuarios.push(usuario);
  //broadcast lo envia a todos los usuarios menos a el mismo
  socket.broadcast.emit("message_evt_e", {
    text: "ha entrado en la sala",
    usuario: users[socket.id]
  });

  socket.emit("conectado", usuario);
  //io.emit envia a todos los clientes
  io.emit("usuario_evt", Object.values(users));
  console.log("nuevo cliente: " + random);
  console.log("total usuarios " + listaUsuarios.length);
// socket.emit("usuario_evt", {usuario});

  socket.on("enviar_mensaje", function(message){
    console.log("id: "+ socket.id + "recibido msg: " +  message);
    socket.broadcast.emit("message_evt", {
      text: message,
      usuario: users[socket.id]
    });
    socket.emit("message_evt_mio", {
      text: message,
      usuario: users[socket.id]
      });
  });
  socket.on("enviar_mensajep", function(data){
   // console.log(data);
   // console.log(users);
    for (const property in users) {
      let name = users[property].name;
      let id = users[property].id;
      if(name==data.privado){
        io.to(id).emit("message_evt_p" , {
          text: data.message,
          privado: data.actual,
          actual: data.actual,
        });
      };
      if(name==data.actual){
        socket.emit("message_evt_p_mio", {
        text: data.message,
        privado: data.privado,
        actual: data.actual
        });
      };
    };
  });
  socket.on("disconnect", () => {
    socket.broadcast.emit("message_evt_a", {
      text: "ha abandonado la sala",
      usuario: users[socket.id]
      }); 
    delete users[socket.id];
    listaUsuarios = listaUsuarios.filter(usuario => usuario.id != socket.id);

    io.emit("disconnected", socket.id);
  });
  
});



server.listen(3198, () => console.log('server started'));
