const express = require('express');
const bodyParser = require('body-parser');
const noblox = require('noblox.js')
const app = express();
const fs = require('fs')
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const axios = require('axios');

const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("removed for security purposes");
const loghook = new Webhook("removed for security purposes");

// trello information
const apiKey = 'removed for security purposes';
const token = 'removed for security purposes';
const listId = 'removed for security purposes';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'removed for security purposes@gmail.com',
    pass: 'removed for security purposes'
  }
});

const emailMessage = fs.readFileSync('/home/pi/Documents/CRC/csis-protection-requests/email.ejs', 'utf8');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.send('hi');
});

var cooldown_path = "/home/pi/Documents/CRC/csis-protection-requests/cooldowns.json"

app.get('/status', async (req, res) => {
  res.sendStatus(200)
})

app.post('/s', async (req, res) => {
  console.log(req.body)

  var usrnm = 'John Doe'
  var id = 0
  try {
    id = await noblox.getIdFromUsername(req.body.username)
    usrnm = await noblox.getUsernameFromId(id)
  } catch (e) {
    loghook.send(`Voided protection request (invalid user): unable to locate user with username "${req.body.username}"`)
    return;
  }

  const stored_keys = fs.readFileSync('keys.json')
  var keys = JSON.parse(stored_keys);


  var ownerOfKey = Object.keys(keys).find(key => keys[key] === req.body.special_key);
  if (ownerOfKey != undefined) {
    if (Number(ownerOfKey) != Number(id)) {
      delete keys[ownerOfKey]
      loghook.send(`Detected violation of the protection agreements (sharing your special key with other people): user ${await noblox.getUsernameFromId(ownerOfKey)}'s key has ben revoked`)
      if (String(id) in keys) {
        delete keys[id]
        loghook.send(`Detected violation of the protection agreements (using a key assigned to a different person): user ${usrnm}'s key has been revoked`)
      }

      var newData = JSON.stringify(keys);
      fs.writeFile('keys.json', newData, err => { if(err) throw err });   
      return;
    }
  }
  var atv = fs.readFileSync(cooldown_path)
  var active_cooldowns = JSON.parse(atv)
  if (String(id) in active_cooldowns) {
    loghook.send(`${usrnm}:${id} has attempted to send a protection request while on cooldown.`)
    return;
  }

  if (String(id) in keys) {
    if (req.body.special_key == keys[id]) {

      const embed = new MessageBuilder()
      .setTitle('New Protection Request')
      .setAuthor('CSIS | Command Protection Service', 'https://assets.stickpng.com/images/586a4d7a45f8680c051c1c95.png')
      .addField('Username', `${usrnm}`, true)
      .addField('Server', `${req.body.server}`, true)
      .addField('Protection Level', `${req.body.lvl}`, true)
      .addField('Additional Information', `${req.body.info == "" ? 'N/A' : req.body.info}`)
      .setColor('#89CFF0')
      .setThumbnail('https://assets.stickpng.com/images/586a4d7a45f8680c051c1c95.png')
      .setTimestamp();
  
    // hook.send('<@&722213858126856193>');
    hook.send('@ping')
    hook.send(embed)

    active_cooldowns[id] = "a"

      setTimeout(() => {
        var actcol = JSON.parse(fs.readFileSync(cooldown_path))
        delete actcol[id]
        fs.writeFile('/home/pi/Documents/CRC/csis-protection-requests/cooldowns.json', JSON.stringify(actcol), err => { if(err) throw err });  
      }, 60000);

    var newData = JSON.stringify(active_cooldowns);
    fs.writeFile('/home/pi/Documents/CRC/csis-protection-requests/cooldowns.json', newData, err => { if(err) throw err });   

    } else {
      loghook.send(`Voided protection request (invalid key): supplied special key isn't assigned to the supplied user (${usrnm})`)
    }
  } else {
    loghook.send(`Voided protection request (invalid key #2): supplied user does not have a special key assigned to them`)
  }

  res.sendStatus(200)
})

app.post('/add_key', async (req, res) => {
  res.sendStatus(204)

  try {
    
      var userId = null;
      var sentUsername = req.body.username
      var usrnm = "John Doe"

      try { 
        userId = await noblox.getIdFromUsername(sentUsername)
        usrnm = await noblox.getUsernameFromId(userId)
       } catch (e) { return; } 

      if (userId == null) return;

      var blurb = (await noblox.getPlayerInfo(userId)).blurb
      if (!blurb.includes("csis key csis protection key request")) return;
      console.log(blurb)
      console.log(req.body.ema)

      var blacklisted = false;
      
      await axios.get(`https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${token}`)
      .then(response => {
        const cards = response.data;
        const matchingCard = cards.find(card => card.name.includes(userId));
        if (matchingCard) blacklisted = true;
      })

      

      if (blacklisted) {
        loghook.send(`The verification system has denied ${usrnm}:${userId}'s key request due to an active blacklist`)
        return;
      }

      
        // check if user is a hr in any of the departments
        var departments = {
          "RCMP": 4576461,
          "PPS": 4974083,
          "OFS": 4574079,
          "CA": 5643877,
          "CSIS": 4864344
        }

        var minimumRanks = {
          "RCMP": 110,
          "PPS": 60,
          "OFS": 70,
          "CA": 180,
          "CSIS": 70
        }

        var departmentToCheck = departments[req.body.dept]
        var rank = await noblox.getRankInGroup(departmentToCheck, userId)

        if (rank >= minimumRanks[req.body.dept]) {

          const stored_keys = fs.readFileSync('/home/pi/Documents/CRC/csis-protection-requests/keys.json')
          var keysObject = JSON.parse(stored_keys);

          if (keysObject[userId] == undefined) {
            var keyss = makeid(7)
            keysObject[userId] = keyss
    
            var newData = JSON.stringify(keysObject);
            fs.writeFile('/home/pi/Documents/CRC/csis-protection-requests/keys.json', newData, err => { if(err) throw err });   
            
            loghook.send(`The verification system has assigned a special key to ${usrnm}:${userId}`)

            const emailData = { key: keyss }

            const html = ejs.render(emailMessage, emailData);

            const mailOptions = {
              from: '(CRC) CSIS Directorate <removed for security purposes@gmail.com>',
              to: `${req.body.ema}`,
              subject: 'Protection Request',
              html: html
            };

            transporter.sendMail(mailOptions, function(error, info){
              if(error){
                console.log(error);
              }else{
                console.log('Email sent: ' + info.response);
              }
            });
          }


        }

  } catch (e){}



})

app.listen(3500, () => console.log('server started'));



function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}