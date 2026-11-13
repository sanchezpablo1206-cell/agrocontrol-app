import { DataTypes } from 'sequelize';

// Se ejecuta ANTES de sequelize.sync({ alter: true }).
// alter:true no puede volver obligatoria (NOT NULL / UNIQUE) una columna si ya hay filas
// sin valor, así que aquí se dejan los datos existentes listos para las reglas nuevas
// en lugar de borrar las tablas.
export const prepararDatosExistentes = async (sequelize) => {
  const qi = sequelize.getQueryInterface();
  const tablas = (await qi.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName));

  await quitarDuplicadosDeSync(sequelize);
  if (tablas.includes('persona')) await prepararPersonas(sequelize, qi);
  if (tablas.includes('gasto')) await prepararGastos(sequelize, qi);
};

// En MySQL, sync({ alter: true }) vuelve a crear las llaves foráneas en cada arranque
// (y los índices de columnas con unique: true), hasta llegar al límite de 64 por tabla.
// Se quitan antes de sincronizar y sync las crea de nuevo una sola vez.
const quitarDuplicadosDeSync = async (sequelize) => {
  const [llaves] = await sequelize.query(`
    SELECT TABLE_NAME AS tabla, CONSTRAINT_NAME AS nombre
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY'`);
  for (const { tabla, nombre } of llaves) {
    await sequelize.query(`ALTER TABLE \`${tabla}\` DROP FOREIGN KEY \`${nombre}\``);
  }

  // Índices repetidos: correo_2, correo_3, nombreu_2... (se conserva el original)
  const [indices] = await sequelize.query(`
    SELECT DISTINCT TABLE_NAME AS tabla, INDEX_NAME AS nombre
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME REGEXP '_[0-9]+$'`);
  const existentes = new Set((await sequelize.query(`
    SELECT DISTINCT CONCAT(TABLE_NAME, '.', INDEX_NAME) AS id
    FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()`))[0].map((i) => i.id));

  for (const { tabla, nombre } of indices) {
    const original = nombre.replace(/_\d+$/, '');
    if (existentes.has(`${tabla}.${original}`)) {
      await sequelize.query(`ALTER TABLE \`${tabla}\` DROP INDEX \`${nombre}\``);
    }
  }
};

const prepararPersonas = async (sequelize, qi) => {
  const columnas = await qi.describeTable('persona');

  // documento: nueva columna obligatoria y única → valor temporal único que el admin debe corregir
  if (!columnas.documento) {
    await qi.addColumn('persona', 'documento', { type: DataTypes.STRING(20), allowNull: true });
  }
  const [sinDocumento] = await sequelize.query("SELECT idpersona FROM persona WHERE documento IS NULL OR documento = ''");
  for (const [i, { idpersona }] of sinDocumento.entries()) {
    await sequelize.query('UPDATE persona SET documento = ? WHERE idpersona = ?', {
      replacements: [`PEND-${Date.now()}-${i}`.slice(0, 20), idpersona]
    });
  }
  if (sinDocumento.length) {
    console.warn(`⚠️  ${sinDocumento.length} persona(s) quedaron con documento temporal "PEND-...": actualízalo desde Personas`);
  }

  // Campos que pasaron a ser obligatorios
  await sequelize.query('UPDATE persona SET movil = COALESCE(tele, \'0000000000\') WHERE movil IS NULL');
  await sequelize.query('UPDATE persona SET direccion = \'Por actualizar\' WHERE direccion IS NULL');
  await sequelize.query('UPDATE persona SET fecha_nac = \'1900-01-01\' WHERE fecha_nac IS NULL');
};

const prepararGastos = async (sequelize, qi) => {
  const columnas = await qi.describeTable('gasto');

  // Los gastos ahora pertenecen obligatoriamente a un cultivo. Los registrados antes
  // no tienen cultivo y no se pueden asociar automáticamente: se eliminan (datos de prueba).
  const [resultado] = await sequelize.query(
    columnas.idcultivo ? 'DELETE FROM gasto WHERE idcultivo IS NULL' : 'DELETE FROM gasto'
  );
  if (resultado.affectedRows) {
    console.warn(`⚠️  Se eliminaron ${resultado.affectedRows} gasto(s) sin cultivo asociado`);
  }
};
