const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql2/promise"); //DB연동1
const createError = require("http-errors");
const bodyParser = require('body-parser');
const QRcode = require("qrcode-svg");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const DB = mysql.createPool({ //DB연동2
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "doublefloat",
  database: "equipment",
  dateStrings: "date",
  multipleStatements: true
});
app.use(cors());
app.use(express.json());
const multer = require('multer');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/user/projects/web/public/imgs/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});//사진 업로드1
const upload = multer({ storage: storage }); //사진 업로드2
/* 여기서 부터 SERVER API LIST */
app.get("check_List", async (req,res) => {
  try {
    const connection = await DB.getConnection();
    const select = await connection.query(
      "SELECT * FROM check_List");
    await connection.release()
    let i = 0;
    let data = [];
    while (1) {
      if (select[0][i] == null) {
        break;
      }
      const id = select[0][i]['id'];
      const type = select[0][i]['type'];
      const message = select[0][i]['message'];
      const remarks = select[0][i]['remarks'];
      let results = { 'id:': id, 'type': type, 'message': message, 'remarks': remarks };
      data.push(results);
      i = i + 1;
    }
    res.json(data);
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//check_List 조회
app.get("/equip/list", async (req, res) => {
  try {
    const connection = await DB.getConnection();
    const select = await connection.query(
      "SELECT * FROM Equip_info;");
    //await connection.release.end();
    let i = 0;
    let data = [];
    let maxprs = "-1";
    maxprs = parseInt(maxprs);
    while (1) {
      if (select[0][i] == null) {
        break;
      }
      const id = select[0][i]['id'];
      const serial = select[0][i]['serial'];
      const branch_check = select[0][i]['branch_check'];
      const location_x = select[0][i]['location_x'];
      const location_y = select[0][i]['location_y'];
      const boarding_location = select[0][i]['boarding_location'];
      const map = select[0][i]['map'];
      const QR = select[0][i]['QR'];
      const location = { x: location_x, y: location_y };
      let results = { 'id:': id, 'serial': serial, 'branch_check': branch_check, 'location': location, 'boarding_location': boarding_location, 'map': map, 'QR': QR, 'maxprs': maxprs };
      data.push(results);
      i = i + 1;
    }
    await connection.release();
    res.json(data);
    res.status(201).send();

  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//소화기 리스트 조회
app.get("/equip/list_sax", async (req, res) => {
  try {
    const connection = await DB.getConnection();
    const where = await connection.query(
      //select equip_id, MAX(id) from Check_Log group by equip_id
      "select equip_id, prs from Check_Log where (equip_id, id) in (select equip_id, MAX(id) from Check_Log group by equip_id);");
    const where1 = where[0];
    res.json(where1);
    console.log(where1);
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err);
  }
});//소화기 리스트 조회
app.get("/equip/list_m", async (req, res) => {
  const connection = await DB.getConnection();
  const select = await connection.query(
    "SELECT * FROM Equip_info;");
  const where = await connection.query(
    "SELECT id FROM Equip_info WHERE = ?;", [serial]);
  const where1 = where[0][0]['id'];
  const search = await connection.query(
    "SELECT prs FROM Check_Log WHERE equip_id =? ORDER by id;", [where1]);

  //await connection.release.end();
  try {
    let i = 0;
    let data = [];
    while (1) {
      if (select[0][i] == null) {
        break;
      }
      const id = select[0][i]['id'];
      const serial = select[0][i]['serial'];
      const branch_check = select[0][i]['branch_check'];
      const image = select[0][i]['image'];
      const location_x = select[0][i]['location_x'];
      const location_y = select[0][i]['location_y'];
      const boarding_location = select[0][i]['boarding_location'];
      const map = select[0][i]['map'];
      const QR = select[0][i]['QR'];
      const prs = search[0][0]['prs']
      let results = { 'id:': id, 'serial': serial, 'branch_check': branch_check, 'image': image, 'location_x': location_x, 'location_y': location_y, 'boarding_location': boarding_location, 'map': map, 'QR': QR, 'prs': prs };
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
app.post("/check/insert", async (req, res) => {
  const serial = req.body['serial'];
  const prs = req.body['prs'];
  const user = req.body['user'];
  try {
    const connection = await DB.getConnection();
    const insert = await connection.query(
      "SELECT id FROM Equip_info WHERE serial= ?;", [serial]);
    const where = insert[0][0]['id'];
    const insert1 = await connection.query(
      "INSERT INTO Check_Log(equip_id,date,user,prs) VALUES(?,now(),?,?);", [where, user, prs]
    );
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});
app.post("/equip/pressure", async (req, res) => {
  const serial = req.body["serial"];
  const pressure = req.body["prs"];
  console.log(serial);
  try {
    const connection = await DB.getConnection();
    const select = await connection.query(
      'SELECT * FROM Equip_info WHERE serial = ?;', [serial]);
    const result = await connection.query(
      'UPDATE Equip_info SET prs = ? WHERE serial = ?;', [pressure, serial]);
    const eid = select[0][0]['id'];
    const serialno = select[0][0]['serial'];
    const location_x = select[0][0]['location_x'];
    const location_y = select[0][0]['location_y'];
    const pressure1 = select[0][0]['prs'];
    const boarding_location = select[0][0]['boarding_location'];
    const map = select[0][0]['map'];
    let results = { 'id:': eid, 'serial': serialno, 'location_x': location_x, 'location_y': location_y, 'prs': pressure1, 'boarding_location': boarding_location, 'map': map };
    const string = encodeURIComponent(results.toString());
    console.log(results);
    res.contentType('application/json');
    const data = JSON.stringify(results);
    res.header('Content-Length', data.length);
    res.end(data);
    res.redirect(JSON.stringify(results));
    res.status(201).send();

  } catch (err) {
    res.status(400).json({
      message: "Error"
    });
    console.log(err);
  }
});//소화기 점검 여부 초기화 및 특정소화기 리스트 조회 
app.post("/equip/insert", async (req, res) => {
  const serial = req.body['serial'];
  const boarding_location = req.body['boarding_location'];
  const prs = req.body['pressure'];
  const location_x = req.body['location_x'];
  const location_y = req.body['location_y'];
  /*console.log(id,serial,location);*/
  try {
    const connection = await DB.getConnection();
    const insert = await connection.query(
      "INSERT INTO Equip_info(serial,prs,location_x,location_y,boarding_location) VALUES (?,?,?,?,?);",
      [serial, prs, location_x, location_y, boarding_location]
    );
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//소화기 정보 입력 api
app.get("/equip/check", async (req, res) => {
  const Eq_id = req.query.Eq_id;
  console.log(Eq_id);
  try {
    const connection = await DB.getConnection();
    const select = await connection.query(
      'SELECT * FROM Check_Log WHERE equip_id =?;', [Eq_id]);
    const eid = select[0][0]['id'];
    const Eq_id1 = select[0][0]['equip_id'];
    const date = select[0][0]['date'];
    const check_res = select[0][0]['check_res'];
    const user = select[0][0]['user'];
    const pressure = select[0][0]['prs'];
    let results = { 'id': eid, 'equip_id': Eq_id1, 'date': date, 'check_res': check_res, 'user': user, 'prs': pressure };
    const string = encodeURIComponent(results.toString());
    console.log(results);
    res.contentType('application/json');
    const data = JSON.stringify(results);
    res.header('Content-Length', data.length);
    res.end(data);
    res.redirect(JSON.stringify(results));
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: "Error"
    });
    console.log(err);
  }
});// 소화기 점검기록 조회
app.post("/equip/check/insert", async (req, res) => {
  const serial = req.body['serial'];
  // const Eq_id = req.body['equip_id'];
  const user = req.body['user'];
  const pressure = req.body['prs'];
  console.log(serial, user, pressure);
  try {
    const connection = await DB.getConnection();
    const search = await connection.query(
      'SELECT * FROM Equip_info WHERE serial = ?;', [serial]);
    const result = search[0][0]['id'];
    console.log(result);
    const select = await connection.query(
      'INSERT INTO Check_Log(equip_id,date,user,prs) VALUES(?,now(),?,?);', [result, user, pressure]);
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: "Error"
    });
    console.log(err);
  }
});//점검기록 입력
app.post("/login", async (req, res) => {
  const uid = req.body["user"];
  const password = req.body["passwd"];
  console.log(uid, password);
  try {
    const connection = await DB.getConnection();
    const search = await connection.query('SELECT * FROM member WHERE user = ?;', [uid]);
    if (password != search[0][0]['passwd']) {
      res.status(401).json({
        message: '1'//비밀번호 나 아이디가 일치 하지 않음
      });
    } else {
      res.status(201).json({
        message: "0"//로그인 성공
      });
    }
    console.log(search[0][0]);
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
}); //로그인api
app.get("/equip/checklist", async (req, res) => {
  try {
    const connection = await DB.getConnection();
    const select = await connection.query(
      "SELECT * FROM Check_List;");
    //await connection.release.end();
    let i = 0;
    let data = [];
    while (1) {
      if (select[0][i] == null) {
        break;
      }
      const id = select[0][i]['id'];
      const type = select[0][i]['type'];
      const message = select[0][i]['message'];
      const remarks = select[0][i]['remarks'];
      let results = { 'id:': id, 'type': type, 'message': message, 'remarks': remarks };
      data.push(results);
      i = i + 1;
    }
    res.json(data);
    console.log(data);
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//checklist 조회
app.get("/map/list", async (req, res) => {
  try {
    const connection = await DB.getConnection();
    const select = await connection.query(
      "SELECT * FROM Map;");

    let i = 0;
    let data = [];
    while (1) {
      if (select[0][i] == null) {
        break;
      }
      const id = select[0][i]['id'];
      const name = select[0][i]['name'];
      const image = select[0][i]['image'];
      let results = { 'id': id, 'name': name, 'image': image };
      data.push(results);
      i = i + 1;
    }
    await connection.release();
    res.json(data);
    console.log(results);
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//Map 조회
app.post('/upload/fet', upload.single('img'), async (req, res) => {
  const img = req.file.filename;
  const serial = req.body['serial'];
  console.log(serial, img, serial);
  console.log(req);
  try {
    const connection = await DB.getConnection();
    const update = await connection.query('UPDATE Equip_info SET serial = ? , image = ? WHERE serial = ?', [serial, img, serial]);
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//소화기 사진 업로드 및 DB입력
app.post('/upload/map', upload.single('img'), async (req, res) => {
  const img = req.file.originalname;
  const map = req.body['name'];
  console.log(map, img);
  try {
    const connection = await DB.getConnection();
    const update = await connection.query('INSERT INTO Map(name, image) VALUES(?,?)', [map, img]);
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//맵 사진 업로드 및 DB입력
app.post('/update/map', upload.single('img'), async (req, res) => {
  const img = req.file.originalname;
  const map = req.body['name'];
  console.log(map, img);
  try {
    const connection = await DB.getConnection();
    const update = await connection.query('UPDATE Map SET image = ? WHERE name =?', [img, map]);
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//맵 사진 수정
app.post('/delete/map', upload.single('img'), async (req, res) => {
  const img = req.file.originalname;
  const map = req.body['name'];
  console.log(map, img);
  try {
    const connection = await DB.getConnection();
    const update = await connection.query('UPDATE Map SET image = ? WHERE name =?', [img, map]);
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//맵 사진 및 db에서 삭제
app.get('/download/map', async (req, res) => {
  const FN = req.query.filename
  try {
    const connection = await DB.getConnection();
    const search = await connection.query('SELECT * FROM Map WHERE name = ?;', [FN]);
    let path = search[0][0]['image'];
    res.sendFile("/home/user/projects/web/public/imgs/" + path, function (err) {
      if (err) {
        console(err);
      } else
        res.status(201);
    });
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});// 맵 이미지 다운로드
app.get('/download/fet', async (req, res) => {
  const FN = req.query.filename
  try {
    const connection = await DB.getConnection();
    const search = await connection.query('SELECT * FROM Equip_info WHERE serial = ?;', [FN]);
    let path = search[0][0]['image'];
    res.sendFile("/home/user/projects/web/public/imgs/" + path, function (err) {
      if (err) {
        console(err);
      } else
        res.status(201);
    });
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//소화기 이미지 다운로드



const server = app.listen(3001, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log("Running http://%s:%s", host, port);
}); //외부와 통신

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
module.exports = app;

