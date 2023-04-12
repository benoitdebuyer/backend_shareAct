var express = require('express');
var router = express.Router();

require("../models/connection");
const User = require('../models/users');

const Race = require("../models/races");
const { checkBody } = require("../modules/checkBody");

// GET
router.get('/all/:token', (req, res) => {

    User.findOne({ token: req.params.token }).then(user => {
router.get('/allRaces', function(req, res) {
    Race.find().then(user => {
      if (user === null) {
        res.json({ result: false, error: 'User not found' });
        return;
      }
      Race.find() // Populate and select specific fields to return (for security purposes)
      .populate('author', ['username', 'firstname'])
      .populate('admin', ['username', 'firstname'])
      .populate('participants',['username','firstname'] )
      .sort({ dateCreation: 'desc' })
        .then(races => {
          res.json({ result: true, races });
        });
    });
  });

// POST
router.post('/', (req, res) => {
  if (!checkBody(req.body, ["author", "participants", "description", "date","address","latitude", "longitude",
  "duration", "distance", "level"])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ token: req.body.token }).then(user => {  
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    const newRace = new Race({  
      author:user._id,
      admin:user._id,
      participants:user._id,
      description: req.body.description,
      type: "running",
      date: req.body.date,
      address: req.body.address,
      latitude:req.body.latitude,
      longitude:req.body.longitude,
      duration:req.body.duration,
      distance:req.body.distance,
      level:req.body.distance,
      dateCreation: Date.now(),
      token: req.body.token,
    });
    newRace.save().then(newR => {
      res.json({ result: true, race: newR });
    });
  });
});



// DELETE
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
        } else if (String(race.author._id) !== String(user._id)) { // ObjectId needs to be converted to string (JavaScript cannot compare two objects)
          res.json({ result: false, error: 'Race can only be deleted by its author' });
          return;
        }

        Race.deleteOne({ _id: race._id }).then(() => {
          res.json({ result: true });
        });
      });
  });
});



// PUT pour ajouter un participant
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

module.exports = router;
