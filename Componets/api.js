require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const port = process.env.APP_RUTE_APIPORT

const externalFolderPath = process.env.APP_RUTE_JSONFOLDER;

app.use(express.json({ limit: '50mb' }));

function getFileName() {
    const date = new Date();
    const year = date
      .getFullYear()
      .toString()
      .slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date
      .getDate()
      .toString()
      .padStart(2, '0');
    const fileName = `${year}${month}${day}.json`;
    
    // Comprueba si la carpeta externa existe, de lo contrario, crea la carpeta
    if (!fs.existsSync(externalFolderPath)) {
      fs.mkdirSync(externalFolderPath);
    }
    
    return path.join(externalFolderPath, fileName);
  }

function readData() {
  const fileName = getFileName();
  if (fs.existsSync(fileName)) {
    const rawData = fs.readFileSync(fileName, 'utf-8');
    return JSON.parse(rawData);
  } else {
    return [];
  }
}

function writeData(data) {
  const fileName = getFileName();
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(fileName, jsonData, 'utf-8');
}

let registros = readData();
let id = registros.length > 0 ? registros[registros.length - 1].id + 1 : 1;

app.get('/registros', (req, res) => {
  res.json(readData());
});

app.get('/registros/ultimo', (req, res) => {
  registros = readData();
  if (registros.length > 0) {
    res.json(registros[registros.length - 1]);
  } else {
    res.status(404).json({ message: 'No hay registros' });
  }
});

app.post('/registros', (req, res) => {
    registros = readData();
    const nuevoRegistro = {
      id: id++,
      Entrada: req.body.Entrada,
      Camara: req.body.Camara,
      Matricula: req.body.Matricula,
      Calidad: req.body.Calidad,
      Url_image: req.body.Url_image,
      Blocked: req.body.Blocked,
      Warned: req.body.Warned,
      Reason: req.body.Reason,
      Date: req.body.Date
    };
  
    registros.push(nuevoRegistro);
    writeData(registros);
    res.status(201).json(nuevoRegistro);
  });
  
app.put('/registros/:id', (req, res) => {
  registros = readData();
  const registroId = parseInt(req.params.id);
  const registroIndex = registros.findIndex((r) => r.id === registroId);

  if (registroIndex >= 0) {
    registros[registroIndex].data = req.body.data;
    writeData(registros);
    res.json(registros[registroIndex]);
  } else {
    res.status(404).json({ message: 'Registro no encontrado' });
  }
});

function checkMidnight() {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    registros = readData();
  }
  setTimeout(checkMidnight, 60000);
}

checkMidnight();

app.listen(port, () => {
  console.log(`API REST escuchando en http://127.0.0.1:${port}`);
});
