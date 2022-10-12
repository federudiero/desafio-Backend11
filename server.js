import express from 'express';
import exphbs from 'express-handlebars';
import session from 'express-session';
import bCrypt from 'bcrypt';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { Server as HttpServer } from "http";
import { Server as Socket } from "socket.io";
import ContenedorSQL from "./src/contenedores/ContenedorSQL.js";
import config from "./src/config.js";
import * as fakeProdApi from "./src/api/fakeProds.js";
import MongoDbContainer from "./src/contenedores/ContenedorMongoDB.js";
import * as msgsConfig from "./src/config/msgs.js";
import * as msgNormalizer from "./src/utils/normalizer.js";
import MongoStore from "connect-mongo";
//Passport
import passport from 'passport';
import { Strategy as LocalStrategy } from'passport-local';

//Import módulos proyecto
import routes from './routes.js';
import User from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TIEMPO_EXPIRACION = 20000;
const URL_BASE_DE_DATOS = 'mongodb://localhost:27017/coderhouse';

const app = express();
const httpServer = new HttpServer(app);
const io = new Socket(httpServer);

const productosApi = new ContenedorSQL(config.mariaDb, "productos");
const mensajesApi = new ContenedorSQL(config.mariaDb, "mensajes");

//--------------------------------------------
// configuro el socket

const processMsgData = (msgData) => {
    const plainMsgs = msgData.map((msg) => {
      const dateTime = new Date(parseInt(msg.id.substring(0, 8), 16) * 1000);
      delete msg.author["_id"];
      delete msg["__v"];
      msg = { ...msg, dateTime };
      return msg;
    });
    const originalData = { id: "mensajes", mensajes: plainMsgs };
    return msgNormalizer.getNormalized(originalData);
  };

  io.on("connection", async (socket) => {
    // apenas se genera la conexión tengo que cargar mensajes y productos
    const productos = await productosApi.listarAll();
    io.sockets.emit("productos", productos);
    const msgData = await mensajesApi.getAll();
    const mensajes = processMsgData(msgData);
    io.sockets.emit("mensajes", mensajes);
  
    console.log("Nueva conexion");
    // cuando llega un producto nuevo grabo, obtengo data, hago emit
    socket.on("newProduct", async (data) => {
      await productosApi.guardar(data);
      const productos = await productosApi.listarAll();
      io.sockets.emit("productos", productos);
    });
  
    // cuando llega un producto nuevo grabo, obtengo data, hago emit
    socket.on("newMessage", async (data) => {
      await mensajesApi.createNew(data);
      const msgData = await mensajesApi.getAll();
      const mensajes = processMsgData(msgData);
      io.sockets.emit("mensajes", mensajes);
    });
  });
  


let baseDeDatosConectada = false;

function conectarDB(url, cb) {
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
      if(!err) {
        baseDeDatosConectada = true;
      }
      if(cb != null) {
        cb(err);
      }
  });
}

passport.use('signup', new LocalStrategy({
    passReqToCallback: true
},
    (req, username, password, done) => {
        User.findOne({ 'username': username }, (err, user) => {
            if (err) {
                return done(err);
            };

            if (user) {
                return done(null, false);
            }

            const newUser = {
                username: username,
                password: createHash(password),
                email: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName
            };

            User.create(newUser, (err, userWithId) => {
                if (err) {
                    return done(err);
                }
                return done(null, userWithId);
            })
        });
    }
));

passport.use('login', new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username }, (err, user) => {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            if (!isValidPassword(user, password)) {
                return done(null, false);
            }

            return done(null, user);
        })
    }
));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, done);
});

function createHash(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

function isValidPassword(user, password) {
    return bCrypt.compareSync(password, user.password);
}


app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main.hbs' }));
app.set('view engine', '.hbs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname + '/views')));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: TIEMPO_EXPIRACION
    }
}));

app.use(passport.initialize());
app.use(passport.session());

//LOGIN
app.get('/login', routes.getLogin);
app.post('/login', passport.authenticate('login', {
    failureRedirect: '/faillogin'
}), routes.postLogin);
app.get('/faillogin', routes.getFailLogin);

//SIGNUP
app.get('/signup', routes.getSignUp);
app.post('/signup', passport.authenticate('signup', {
    failureRedirect: '/failsignup'
}), routes.postSignup);
app.get('/failsignup', routes.getFailsignup);

//Last part
function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/login");
    }
}

app.get('/ruta-protegida', checkAuthentication, (req, res) => {
    const { user } = req;
    console.log(user);
    res.send('<h1>Ruta OK!</h1>');
});

//LOGOUT
app.get('/logout', routes.getLogout);



// ------------------------------------------------------------------------------
//  LISTEN SERVER
// ------------------------------------------------------------------------------


// conectarDB(URL_BASE_DE_DATOS, err => {

//     if (err) return console.log('error en conexión de base de datos', err);
//     console.log('BASE DE DATOS CONECTADA');

//     app.listen(8080, (err) => {
//         if (err) return console.log('error en listen server', err);
//         console.log(`Server running on port 8080`);
//     });
// });

app.listen(8080);