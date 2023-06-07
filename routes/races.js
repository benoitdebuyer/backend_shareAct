var express = require('express');
var router = express.Router();
require("../models/connection");
const User = require('../models/users');
const Race = require("../models/races");
const { checkBody } = require("../modules/checkBody");
const geolib = require('geolib');

router.get('/all/:token', (req, res) => {
  const currentDate = new Date();
  User.findOne({ token: req.params.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }
    Race.find({ date: { $gte: currentDate } }) // Populate and select specific fields to return (for security purposes)
      .populate('author', ['username', 'firstname', 'image'])
      .populate('admin', ['username', 'firstname'])
      .populate('participants', ['username', 'firstname', 'image'])
      .sort({ dateCreation: 'desc' })
      .then(races => {
        res.json({ result: true, races });
      });
  });
});

router.get('/:idRace/:token', (req, res) => {
  if (!checkBody(req.params, ['idRace', 'token'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ token: req.params.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }
    Race.findById(req.params.idRace)
      .populate('author', ['_id', 'username', 'image'])
      .populate('admin', ['_id', 'username', 'firstname', 'image'])
      .populate('participants', ['_id', 'username', 'firstname', 'image'])
      .then(race => {
        if (!race) {
          res.json({ result: false, error: 'Race not found' });
          return;
        }
        res.json({ result: true, race });
      });
  });
});

router.post('/', (req, res) => {
  if (!checkBody(req.body, ["token", "description", "date", "address", "latitude", "longitude",
    "duration", "distance", "level", "maxParticipants"])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }
    const newRace = new Race({
      author: user._id,
      admin: user._id,
      participants: user._id,
      maxParticipants: req.body.maxParticipants,
      description: req.body.description,
      type: "running",
      date: req.body.date,
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      duration: req.body.duration,
      distance: req.body.distance,
      level: req.body.level,
      dateCreation: new Date(),
    });
    newRace.save().then(newR => {
      res.json({ result: true, race: newR });
    });
  });
});


router.delete('/', (req, res) => {
  if (!checkBody(req.body, ['token', 'raceId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }
    Race.findById(req.body.raceId)
      .populate('author')
      .then(race => {
        if (!race) {
          res.json({ result: false, error: 'Race not found' });
          return;
        } else if (String(race.author._id) !== String(user._id)) { 
          res.json({ result: false, error: 'Race can only be deleted by its author' });
          return;
        }
        Race.deleteOne({ _id: race._id }).then(() => {
          res.json({ result: true });
        });
      });
  });
});

router.put('/participants', (req, res) => {
  if (!checkBody(req.body, ['token', 'raceId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }
    Race.findById(req.body.raceId).then(race => {
      if (!race) {
        res.json({ result: false, error: 'Race not found' });
        return;
      }
      if (race.participants.includes(user._id)) { // User already participate the race
        Race.updateOne({ _id: race._id }, { $pull: { participants: user._id } }) // Remove user ID from likes
          .then(() => {
            res.json({ result: true });
          });
      } else { // User has not participate the race
        Race.updateOne({ _id: race._id }, { $push: { participants: user._id } }) // Add user ID to likes
          .then(() => {
            res.json({ result: true });
          });
      }
    });
  });
});

router.post('/filter', async (req, res) => {

  const { start_date, end_date, lat, lon, distance } = req.body; 

  if (!checkBody(req.body, [])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  const currentDate = new Date();
    Race.find({ date: { $gte: currentDate } }) 
    // Populate and select specific fields to return (for security purposes)
      .populate('author', ['username', 'firstname'])
      .populate('admin', ['username', 'firstname'])
      .populate('participants', ['username', 'firstname'])
      .sort({ dateCreation: 'desc' })
      .then(data => {
            console.log(data)
            const filteredData = data.filter((item) => {
              return item.date >= new Date(start_date) && item.date <= new Date(end_date);
            });
            const filteredDataByDistance = filteredData.filter((item) => {
              const distanceFromLocation = geolib.getDistance(
                { latitude: lat, longitude: lon },
                { latitude: item.latitude, longitude: item.longitude }
              );
              return distanceFromLocation <= distance;
            });

            res.json({ data: filteredDataByDistance });
      });
   // });

  



 
});



module.exports = router;
