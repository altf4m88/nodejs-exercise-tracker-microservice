const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const db = mongoose.connection;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("DB Connected")
});

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username : {type: String, required: true, unique: true},
  exercise : [{
    description: String, 
      duration: Number,
      date: Date
  }] 
});

const User = mongoose.model('User', userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  const name = req.body.username;

  User.find({username : name}, (err, data) => {
    if(err) console.error(err);
    if(!data.length){
      User.create({username : name}, (err, data) => {
        if(err) console.error(err);
        else res.json(data);
      })
    } else {
      res.json({error : "username already taken"});
    }
  });

});

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, data) => {
    if(err) return console.error(err);
    console.log(data);
    let responseArray = [];
    for(let item in data){
      responseArray.push({
        username : data[item].username, _id : data[item]._id
      });
    };
    res.json(responseArray);
  });
})

app.post('/api/exercise/add', (req, res) => {
  let dataInput = req.body;
  console.log(dataInput);
  if (!dataInput.userId) {
    res.send("please input userId");
  } else if(!dataInput.description){
    res.send("please input description");
  } else if(!dataInput.duration){
    res.send("please input duration");
  } else if (!dataInput.date) {
    input.date = new Date();
  }
  let date = new Date(dataInput.date).toDateString();
  let duration = parseInt(dataInput.duration)

  User.findByIdAndUpdate( dataInput.userId, 
  { $push : { exercise : {
    description : dataInput.description, 
    duration : duration,
    date : date
  }}},
  (err, data) => {
    if(err) console.error(err);
    res.json({
      _id : data._id,
      username: data.username,
      description: dataInput.description,
      duration: duration,
      date: date
    });
  });
});

app.get('/api/exercise/log', (req, res) => {
  let userId = req.query.userId;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  let limit = req.query.limit;

  let userLogInfo = {};

  if(!fromDate && !toDate){
    User.findById(userId, (err, data) => {
      if(err) return console.error(err);
      if(data === null) res.send('no data found');

      let exercise = data.exercise;
      let userLog = [];

      for(let x = 0; x < limitCheck(limit, exercise.length); x ++){
        userLog.push({
          description : exercise[x].description,
          duration : exercise[x].duration,
          date : exercise[x].date
        });
      };

      userLogInfo = {
        _id : userId,
        username : data.username,
        count : userLog.length,
        log : userLog
      };
      res.json(userLogInfo);
    });
  } else{
    User.find().where("_id").equals(userId).where("exercise.date").gt(fromDate).lt(toDate).exec( (err, data) =>{
      if(err) return console.error(err);
      if(data.length === 0) res.send('no data found');

      let exercise = data[0].exercise;
      let userLog = [];

      for(let x = 0; x < limitCheck(limit, exercise.length); x ++){
        userLog.push({
          description : exercise[x].description,
          duration : exercise[x].duration,
          date : exercise[x].date
        });
      };

      userLogInfo = {
        _id : userId,
        username : data[0].username,
        count : userLog.length,
        log : userLog
      };

      res.json(userLogInfo);
    })
  }
});

const limitCheck = (x, y) => {
  if(x <= y){
    return x;
  } else {
    return y;
  }
};

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
