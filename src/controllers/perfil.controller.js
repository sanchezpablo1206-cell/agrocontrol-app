import { randomUUID } from 'crypto';
import { Perfil } from '../models/index.js';

export const listar = async (req, res) => {
  try {
    const perfiles = await Perfil.findAll();
    res.json(perfiles);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar perfiles', error: error.message });
  }
};

export const obtener = async (req, res) => {
  try {
    const perfil = await Perfil.findByPk(req.params.id);
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el perfil', error: error.message });
  }
};

export const crear = async (req, res) => {
  try {
    const { descripc } = req.body;
    if (!descripc) return res.status(400).json({ mensaje: 'descripc es obligatorio' });

    const perfil = await Perfil.create({ idperfil: randomUUID(), descripc });
    res.status(201).json(perfil);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el perfil', error: error.message });
  }
};

export const actualizar = async (req, res) => {
  try {
    const perfil = await Perfil.findByPk(req.params.id);
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });

    const { descripc, estado } = req.body;
    await perfil.update({ descripc, estado });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el perfil', error: error.message });
  }
};

// Eliminación lógica: no se borra, se inhabilita
export const eliminar = async (req, res) => {
  try {
    const perfil = await Perfil.findByPk(req.params.id);
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });

    await perfil.update({ estado: false });
    res.json({ mensaje: 'Perfil inhabilitado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el perfil', error: error.message });
  }
};