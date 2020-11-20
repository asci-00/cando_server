const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql2/promise"); //DB연동1
const createError = require("http-errors");
const bodyParser = require('body-parser');
const formiddable = require('formidable');
const QRcode = require("qrcode-svg");
// const fileupload = require('express-fileupload')
// app.use(fileupload())

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
const { json } = require("body-parser");
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/user/project/cando/public/imgs/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});//사진 업로드1
const upload = multer({ storage: storage }); //사진 업로드2

/* 여기서 부터 SERVER API LIST */
app.get("/equip/check/all", async (req, res) => {
  try {
    console.log("/equip/check/all")
    const connection = await DB.getConnection();
    const select = await connection.query(
      "SELECT * FROM Check_Log");
    await connection.release()
    let i = 0;
    let data = [];
    while (1) {
      if (select[0][i] == null) {
        break;
      }
      const id = select[0][i]['id'];
      const equip_id = select[0][i]['equip_id'];
      const date = select[0][i]['date'];
      const check_res = select[0][i]['check_res'].split(',');
      const user = select[0][i]['user'];
      const prs = select[0][i]['prs'];
      let results = { 'id:': id, 'equip_id': equip_id, 'date': date, 'check_res': check_res, 'user': user, 'prs': prs };
      data.push(results);
      i = i + 1;
    }
    res.json(data);
    res.status(201).send();
    res.end();
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//check_List 조회
app.get("/equip/list", async (req, res) => {
  try {
    console.log("/equip/list")
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
      const image = select[0][i]['image'];
      const boarding_location = select[0][i]['boarding_location'];
      const map = select[0][i]['map'];
      const QR = select[0][i]['QR'];
      const location = { x: location_x, y: location_y };
      let results = { 'id': id, 'serial': serial, 'branch_check': branch_check, 'location': location, 'image': image, 'boarding_location': boarding_location, 'map': map, 'QR': QR, 'maxprs': maxprs };
      data.push(results);
      i = i + 1;
    }
    await connection.release();
    res.json(data);
    res.status(201).send();
    res.end();
    return;
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
    res.end();
    return;
  }
});//소화기 리스트 조회
app.get("/equip/list_sax", async (req, res) => {
  try {
    console.log("/equip/list_sax")
    const connection = await DB.getConnection();
    const where = await connection.query(
      //select equip_id, MAX(id) from Check_Log group by equip_id
      "select equip_id, prs from Check_Log where (equip_id, id) in (select equip_id, MAX(id) from Check_Log group by equip_id);");
    const where1 = where[0];
    res.json(where1);
    res.status(201).send();
    return;
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err);
    return;
  }
});//소화기 리스트 조회
app.get("/equip/list_m", async (req, res) => {
  console.log("/equip/list_m")
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
    }
    res.json(data);
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});
// app.post("/check/insert", async (req, res) => {
//   const serial = req.body['serial'];
//   const prs = req.body['prs'];
//   const user = req.body['user'];
//   const res_ = req.body['check_res'];
//   console.log("/check/insert")
//   console.log(res_)
//   console.log("\n\n\n\n");
//   try {
//     const connection = await DB.getConnection();
//     const insert = await connection.query(
//       "SELECT id FROM Equip_info WHERE serial= ?;", [serial]);
//     const where = insert[0][0]['id'];
//     const insert1 = await connection.query(
//       "INSERT INTO Check_Log(equip_id,date,check_res,user,prs) VALUES(?,now(),?,?,?);", [where, res_, user, prs]
//     );
//     res.status(201).json({
//       message: "Success"
//     });
//   } catch (err) {
//     res.status(400).json({
//       message: err,
//     });
//   }
// });
app.post("/equip/pressure", async (req, res) => {
  const serial = req.body["serial"];
  const pressure = req.body["prs"];
  console.log("/equip/pressure");
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
app.post("/equip/regist", async (req, res) => {
  const serial = req.body['serial'];
  const branch_check = req.body['branch_check'];
  const boarding_location = req.body['boarding_location'];
  // const prs = req.body['pressure'];
  const locationx = req.body.location['x'];
  const locationy = req.body.location['y'];
  const map = req.body['map'];
  console.log("/equip/regist");
  try {
    console.log("/equip/regist");
    const connection = await DB.getConnection();
    const insert = await connection.query(

      "INSERT INTO Equip_info(serial,branch_check,location_x,location_y,boarding_location,map,QR) VALUES (?,?,?,?,?,?,?);",
      [serial, branch_check, locationx, locationy, boarding_location, map, 'https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=' + serial]
    );
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//소화기 정보 입력 api
app.post("/equip/update", async (req, res) => {
  const id = req.body['id'];
  const serial = req.body['serial'];
  const boarding_location = req.body['boarding_location'];
  const branch_check = req.body['branch_check'];
  const locationx = req.body.location['x'];
  const locationy = req.body.location['y'];
  const map = req.body['map'];
  console.log("/equip/update");
  try {
    const connection = await DB.getConnection();
    const search = await connection.query(
      "SELECT * FROM Equip_info WHERE serial =?;", [serial]);
    // const id1 = search[0][0]['id'];
    const ser = search[0][0]['serial'];
    // const br_ch = search[0][0]['branch_check'];
    // const lox = search[0][0]['location_x'];
    // const loy = search[0][0]['location_y'];
    // const br_loc = search[0][0]['boarding_location'];
    // const map1 = search[0][0]['map'];

    const update = await connection.query(
      "UPDATE Equip_info SET  serial=? ,branch_check=? ,location_x=?, location_y=? ,boarding_location=? , map=? WHERE id = ?;",
      [serial, branch_check, locationx, locationy, boarding_location, map, id]
    );
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//소화기 정보 수정 api
app.post("/equip/delete", async (req, res) => {
  const id = req.body['id'];
  console.log("/equip/delete");
  try {
    const connection = await DB.getConnection();
    const result = await connection.query(
      "DELETE FROM Equip_info WHERE id = ?;",
      [id]
    );
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//소화기 정보 삭제 api
app.get("/equip/check", async (req, res) => {
  const Eq_id = req.query.Eq_id;
  const connection = await DB.getConnection();
  const select = await connection.query(
    'SELECT * FROM Check_Log WHERE equip_id =?;', [Eq_id]);
  console.log("/equip/check");

  try {
    let i = 0;
    let data = [];
    while (1) {
      if (select[0][i] == null) {
        break;
      }
      const eid = select[0][0]['id'];
      const Eq_id1 = select[0][0]['equip_id'];
      const date = select[0][0]['date'];
      const check_res = select[0][0]['check_res'].split(',');
      const user = select[0][0]['user'];
      const pressure = select[0][0]['prs'];
      let results = { 'id': eid, 'equip_id': Eq_id1, 'date': date, 'check_res': check_res, 'user': user, 'prs': pressure };
      data.push(results);
      i = i + 1;
    }
    res.status(201).json(data);
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
  const res_ = req.body['check_res'];
  console.log("/equip/check/insert");
  try {
    const connection = await DB.getConnection();
    const search = await connection.query(
      'SELECT * FROM Equip_info WHERE serial = ?;', [serial]);
    const result = search[0][0]['id'];
    const select = await connection.query(
      'INSERT INTO Check_Log(equip_id,date,check_res,user,prs) VALUES(?,now(),?,?,?);', [result, res_, user, pressure]);
    const update = await connection.query(
      'UPDATE Equip_info SET branch_check = 1 WHERE id =? ;', [result]);
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
  console.log("/login");
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
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
}); //로그인api
app.get("/equip/checklist", async (req, res) => {
  try {
    console.log("/equip/checklist")
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
    res.status(201).send();
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});//checklist 조회
app.post("equip/checklist/insert", async (req, res) => {

});
app.get("/map/list", async (req, res) => {
  try {
    console.log("/map/list")
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
    res.status(201).send();
    res.end();
  } catch (err) {
    res.status(400).json({
      message: err,
    });
    res.end();
  }
});//Map 조회
app.post('/upload/fet', upload.single('img'), async (req, res) => {
  const img = req.file.filename;
  const imgname = img.split('.')[0];//img 에서 이미지 파일 이름만 가져옴
  console.log("/upload/fet")
  try {
    const connection = await DB.getConnection();
    const update = await connection.query('UPDATE Equip_info SET image = ? WHERE serial = ?', [img, imgname]);
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//소화기 사진 업로드 및 DB입력
// app.post(['/upload2', '/upload3'], upload.any(), (req, res) => {
//   console.log(req.body);
//   console.log(req.files);
// });
app.post('/upload/map', upload.single('img'), async (req, res) => {
  console.log("/upload/map")
  const img = req.body['file_name'] ? req.body['file_name'] : req.file.originalname
  const map = req.body['name']
  try {
    const connection = await DB.getConnection();
    const update = await connection.query('INSERT INTO Map(name, image) VALUES(?,?)', [map, img]);
    res.status(201).json({
      message: "Success"
    });
  } catch (err) {
    res.status(400).json({
      message: "error"
    });
    console.log(err)
  }
});//맵 사진 업로드 및 DB입력
app.post('/update/map', upload.single('img'), async (req, res) => {
  console.log("/update/map")
  const img = req.body['file_name'] ? req.body['file_name'] : req.file.originalname
  const map = req.body['name']
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
// app.post('/delete/map', async (req, res) => {
//   const map_id = req.body['map_id'];
//   console.log("/delete/map");
//   try {
//     const connection = await DB.getConnection();
//     const seatch = await connection.query('DELETE Map WHERE image = ?', [map_id]);
//     res.status(201).json({
//       message: "Success"
//     });
//   } catch (err) {
//     res.status(400).json({
//       message: err,
//     });
//   }
// });//맵 사진 및 db에서 삭제
app.get('/download/map', async (req, res) => {
  const FN = req.query.filename
  console.log("/download/map")
  try {
    const connection = await DB.getConnection();
    const search = await connection.query('SELECT * FROM Map WHERE name = ?;', [FN]);
    let path = search[0][0]['image'];
    res.sendFile("/home/user/project/cando/public/imgs/" + path, function (err) {
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
  console.log("/download/fet")
  try {
    const connection = await DB.getConnection();
    const search = await connection.query('SELECT * FROM Equip_info WHERE serial = ?;', [FN]);
    let path = search[0][0]['image'];
    res.sendFile("/home/user/project/cando/public/imgs/" + path, function (err) {
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

app.post(['/upload2', '/upload3'], upload.any(), (req, res) => {
  console.log(req.body);
  console.log(req.files);
  res.send("hello world");
});

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

