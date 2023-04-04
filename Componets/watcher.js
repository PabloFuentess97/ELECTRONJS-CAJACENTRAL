require('dotenv').config();
const chokidar = require('chokidar');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const http = require('http');

const getTodayFolder = () => {
  return moment().format('YYMMDD');
};

const getHour = () => {
  return moment().format('HH:mm:ss');
};

const readBlacklist = async (blacklistFile) => {
  try {
    const data = await fs.promises.readFile(blacklistFile, 'utf-8');
    const lines = data.split('\n');
    const blacklist = {};

    lines.forEach((line) => {
      const [matricula, motivo] = line.split(', ');
      blacklist[matricula] = motivo;
    });

    return blacklist;
  } catch (err) {
    console.error(`Error al leer la lista negra: ${err.message}`);
    return {};
  }
};

const postRegistro = async (registro) => {
  const jsonData = JSON.stringify(registro);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': jsonData.length
    }
  };

  const req = http.request(process.env.APP_RUTE_APIURL, options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req.on('error', (error) => {
    console.error(`Error al enviar registro: ${error.message}`);
  });

  req.write(jsonData);
  req.end();
};

const readImageAsBase64 = async (filePath) => {
  try {
    const data = await fs.promises.readFile(filePath);
    return Buffer.from(data).toString('base64');
  } catch (err) {
    console.error(`Error al leer la imagen: ${err.message}`);
    return null;
  }
};

const watchFolder = async (folder, blacklist) => {
  const watcher = chokidar.watch(folder, {
    ignored: /^\./,
    persistent: true,
  });

  const startTime = new Date();

  watcher.on('add', async (filePath) => {
    fs.stat(filePath, async (err, stats) => {
      if (err) {
        console.error(`Error al leer el archivo: ${filePath}`);
        return;
      }

      if (stats.birthtime > startTime) {
        const fileName = path.basename(filePath);
        const parsedPath = path.parse(fileName);
        const [entrada, camara, producto, matricula, calidad] = parsedPath.name.split(',');

        const base64Image = await readImageAsBase64(filePath);

        console.log(`Nuevo archivo agregado: ${filePath}`);
        console.log(`  Entrada: ${entrada}`);
        console.log(`  Camara: ${camara}`);
        console.log(`  Producto: ${producto}`);
        console.log(`  Matricula: ${matricula}`);
        console.log(`  Calidad: ${calidad}`);
        console.log(`  Extensión: ${parsedPath.ext}`);

        if (blacklist[matricula]) {
          console.log(`La ${matricula} tiene ${blacklist[matricula]}`);
        }

        const registro = {
            Entrada: entrada || 'Null',
            Camara: camara || 'Null',
            Producto: producto || 'Null',
            Matricula: matricula || 'Null',
            Calidad: calidad || 'Null',
            Url_image: base64Image || 'Null',
            Blocked: blacklist[matricula] ? 'True' : 'False',
            Warned: blacklist[matricula] ? 'False' : 'Null',
            Reason: blacklist[matricula] || 'Null',
            Date: getHour(),
          };
          
  
          try {
            await postRegistro(registro);
          } catch (error) {
            console.error(`Error al enviar registro: ${error.message}`);
          }
        }
      });
    });
  
    return watcher;
  };
  
  module.exports = {
    getTodayFolder,
    getHour,
    readBlacklist,
    watchFolder,
    readImageAsBase64,
  };
  