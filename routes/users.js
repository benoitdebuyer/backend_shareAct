var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Race = require("../models/races");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

// 3 const pour la sauvegarde de la photo
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const uniqid = require('uniqid');


// Inscription
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstname", "username", "email", "password", "age", "gender",])) {
    console.log(req.body)
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // Check if the user has not already been registered
  User.findOne({
    email: { $regex: new RegExp(req.body.email, "i") }, // force l'email en minuscule.
  }).then((data) => {
    console.log(data)
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10); // Hash réalisé sur le mot de passe avec un nombre de tours (coût) 
      const newUser = new User({
        firstname: req.body.firstname,
        username: req.body.username,
        email: req.body.email,
        image:req.body.image,
        password: hash,
        age: new Date(req.body.age),
        gender: req.body.gender,
        dateCreation: Date.now(),
        token: uid2(32),
      });
      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: "User already exists" });
    }
  });
});

// Connexion
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
    (data) => {
      if (data !== null && bcrypt.compareSync(req.body.password, data.password)) {
        res.json({
          result: true,
          token: data.token,
          firstname: data.firstname,
          username: data.username,
          // email: data.email,
          image: data.image,
          age: data.age,
          gender: data.gender,
        });
      } else {
        res.json({ result: false, error: "User not found or wrong password" });
      }
    }
  );
});


//  route pour envoyer l'image à cloudinary et récupérer l'url de l image en front
router.post('/upload', async (req, res) => {

  let id = uniqid() // generation d'un nom unique avec le module uniqid + argument possible ex : uniqid('user')
  // ce qui ajoute un prefixe devant la chaine de caratere 
  
  const photoPath = `/tmp/${id}.jpg`; // accès au fichier temporaire de vercel /tmp/ et un id aléatoire en .jpg
  const resultMove = await req.files.photoFromFront.mv(photoPath); // move the photo sent in the request to the temporary file
  if (!resultMove) { // if the photo was successfully moved

    const resultCloudinary = await cloudinary.uploader.upload(photoPath); // upload the photo to Cloudinary

    fs.unlinkSync(photoPath); // delete the temporary file
    console.log('response from Cloudinary', resultCloudinary);
    res.json({ result: true, image: resultCloudinary.secure_url }); // send a response with the Cloudinary secure url of the uploaded image
  } else { 
    res.json({ result: false, error: resultMove }); 
  }
});







// PUT pour modifier le profil
router.put('/changesprofil', (req, res) => {
  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }
    const updatedFields = {
      firstname: req.body.firstname,
      username: req.body.username,
      email: req.body.email,
      image: req.body.image,
    };
    const filter = { token: req.body.token };
    User.updateOne(filter, updatedFields)
      .then(() => {

        res.json({ result: true, msg: 'Mise à jour réussie' });
      })
  });
});

// PUT pour modifier le profil
router.put('/changesimageprofil', (req, res) => {
  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }
    const updatedFields = {
      image: req.body.image,
    };
    const filter = { token: req.body.token };
    User.updateOne(filter, updatedFields)
      .then(() => {

        res.json({ result: true, msg: 'Mise à jour réussie' });
      })
  });
});

// GET  pour renvoyer la liste des participants à une course
router.get('/add/:token', (req, res) => {
  console.log('req.paramas.token', req.params.token);
  if (!req.params.token) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ token: req.params.token }).then((user) => {
    //console.log('userdata', user);
    let idUser = '';
    if (user === null) {
      res.json({ result: false, error: 'User not found2' });
      return;
    } else {
      idUser = user._id;
      //console.log(user._id);
    }
    // on utilise l'opérateur $elemMatch pour rechercher dans le tableau des participants de la collection "Race" l'élément qui est égal à la valeur de "idUser"
    Race.find({
      $or: [
        { author: idUser },
        { participants: { $elemMatch: { $eq: idUser } } },
      ],
      
      
    })
      .populate('author', ['username', 'image'])
      .populate('participants', ['username'])
      .sort({ date: 'asc' }) // Classe les résultats par ordre croissant de date
      .then((races) => {
        console.log('races où participe l user', races);
        if (!races) {
          res.json({ result: false, error: 'Races not found' });
          return;
        }
        const formattedRaces = races.map((race) => {
          // Formate les participants sous la forme "@username1, @username2" via le map
          const formattedParticipants = race.participants
            .map((participant) => `@${participant.username}`)
            .join(', ');
          return { ...race.toObject(), participants: formattedParticipants };
        });
        res.json({ result: true, races: formattedRaces });
      });
  });
});

module.exports = router;
