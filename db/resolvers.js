const Usuario = require("../models/Usuario");
const Proyecto = require("../models/Proyecto");
const Tarea = require("../models/Tarea");

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config({path: 'variables.env'})

// Crea y firma un JWT
const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre } = usuario;

  return jwt.sign({id, email, nombre}, secreta, {expiresIn});
}

// Crear los resolvers
const resolvers = {
  Query: {
    obtenerProyectos: async (_, {}, ctx) => {
      const proyectos = await Proyecto.find({creador: ctx.usuario.id})

      return proyectos
    },
    obtenerTareas: async (_, {input}, ctx) => {
      const tareas = await Tarea.find({creador: ctx.usuario.id}).where('proyecto').equals(input.proyecto)

      return tareas
    }
  },
  Mutation: {
    crearUsuario: async (_, { input }) => {
      const { email, password } = input;

      const existeUsuario = await Usuario.findOne({ email });

      // si el usuario existe
      if (existeUsuario) {
        throw new Error("El usuario ya esta registrado");
      }

      try {

        // Hashear password
        const salt = await bcryptjs.genSalt(10);
        input.password = await bcryptjs.hash(password, salt);

        // Registrar nuevo usuario
        const nuevoUsuario = Usuario(input);
        nuevoUsuario.save();
        return "Usuario creado correctamente"
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, {input}) => {
      const { email, password } = input;

      // Si el usuario existe
      const existeUsuario = await Usuario.findOne({ email });

      if (!existeUsuario) {
        throw new Error("El Usuario no existe");
      }

      // Si el password es correcto
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );

      if (!passwordCorrecto) {
        throw new Error("Password incorrecto");
      }

      // Dar acceso a la app
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '6hr')
      }
    },
    nuevoProyecto: async (_, {input}, ctx) => {
      
      try {
        const proyecto = new Proyecto(input);

        // asociar el creador
        proyecto.creador = ctx.usuario.id;

        // almacebarlo en la base de datos
        const resultado = await proyecto.save()

        return resultado
      } catch (error) {
        console.log(error)
      }
    },
    actualizarProyecto: async (_, {id, input}, ctx) => {
      // revisar si el proyecto existe 
      let proyecto = await Proyecto.findById(id)

      if(!proyecto) {
        throw new Error('Proyecto no encontrado')
      }

      // revisar si es el creador
      if(proyecto.creador.toString() !== ctx.usuario.id){
        throw new Error('No tienes las credenciales para editar')
      }

      // guardar el proyecto
      proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true})

      return proyecto

    },
    eliminarProyecto: async (_, {id}, ctx) => {
      // revisar si el proyecto existe 
      let proyecto = await Proyecto.findById(id)

      if(!proyecto) {
        throw new Error('Proyecto no encontrado')
      }

      // revisar si es el creador
      if(proyecto.creador.toString() !== ctx.usuario.id){
        throw new Error('No tienes las credenciales para editar')
      }

      // eliminar el proyecto
      await Proyecto.findOneAndDelete({_id: id});

      return 'Proyecto eliminado'
    },
    nuevaTarea: async (_, {input}, ctx) => {
      try {
        const tarea = new Tarea(input)
        tarea.creador = ctx.usuario.id
        const resultado = await tarea.save()
        return resultado

      } catch (error) {
        console.log(error);
      }
    },
    actualizarTarea: async (_, {id, input, estado}, ctx) => {
      // revisar si la tarea existe
      let tarea = await Tarea.findById(id)
      if(!tarea){
        throw new Error('No existe la tarea')
      }

      // revisar si es el creador
      if(tarea.creador.toString() !== ctx.usuario.id){
        throw new Error('No tienes los permisos para modificar esta tarea')
      } 

      // asignar el estado
      input.estado = estado

      // actualizar la tarea
      tarea = await Tarea.findByIdAndUpdate({_id: id}, input, {new: true})

      return tarea

    },
    eliminarTarea: async (_, {id}, ctx) => {
      //revisar si la tarea existe 
      let tarea = await Tarea.findById(id)
      if(!tarea){
        throw new Error("No existe esa tarea")
      }

      // ver si es el autor
      if(tarea.creador.toString() !== ctx.usuario.id){
        throw new Error('No tienes los permisos para eliminar esta tarea')
      }

      // eliminar
      await Tarea.findOneAndDelete({_id: id})

      return "Tarea eliminada correctamente"

    }
  },
};

module.exports = resolvers;
