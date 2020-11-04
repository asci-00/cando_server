const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql2/promise"); //DB연동1
const createError = require("http-errors");
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
const DB = mysql.createPool({ //DB연동2
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "1234",
  database: "cando",
  dateStrings: "date",
  multipleStatements: true
});
app.use(cors());
app.use(express.json());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

//소화기 리스트 조회
app.get("/equip/list", async (req, res) => {
  try {
    const connection = await DB.getConnection();
     const select = await connection.query(
        "SELECT * FROM Equip_info;");
     //await connection.release.end();
    let i = 0;
    let data = [];
    while(1) {
      if (select[0][i] == null) {
        break;
      }
      const id = select[0][i]['id'];
      const serial = select[0][i]['serial'];
      const location = select[0][i]['location'];
      const branch_check = select[0][i]['branch_check'];
      let results = {'id:' : id, 'serial' : serial, 'location' : location, 'branch_check' : branch_check};
      data.push(results);
      i = i + 1;
      console.log(results);
    }
    res.json(data);
    console.log(data);
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});
app.post("/equip/branch_check", async (req, res) => {
  const id = req.body['id'];
  console.log(id);
  try {
    const connection = await DB.getConnection();
    const select = await connection.query(
        "UPDATE Equip_info SET branch_check = 1 WHERE id = " +id+';');
    const result = await connection.query(
       "SELECT * FROM Equip_info WHERE id = " +id+';');
    const eid = result[0][0]['id'];
    const serial = result[0][0]['serial'];
    const location = result[0][0]['location'];
    const branch_check = result[0][0]['branch_check'];
    let results = {'id:' : eid, 'serial' : serial, 'location' : location, 'branch_check' : branch_check};
    // const string = encodeURIComponent(results.toString());
    console.log(results);
    res.contentType('application/json');
    const data = JSON.stringify(results);
    res.header('Content-Length', data.length);
    res.end(data);
    // res.redirect(JSON.stringify(results));
    res.status(201).send();

  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});

app.post("/equip/insert", async (req, res) => {
  const id = req.body['id'];
  const serial = req.body['serial'];
  const location = req.body['location'];
  console.log(id,serial,location);
  try {
    const connection = await DB.getConnection();
    const insert = await connection.query(
        "INSERT INTO Equip_info(id,serial,location,branch_check) VALUES (?,?,?,0);",
        [id, serial, location]
    );
    res.status(201).json({
      message: "Success"
    });
    let sex = insert[0];
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});





// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });
// error handler

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 502);
  res.json("error code 502!!!");
});

app.listen((port = 3001), () => {
  console.log(`listing at http://localhost:${port}`);
});
module.exports = app;
