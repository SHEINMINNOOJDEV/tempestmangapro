const { default: mongoose } = require("mongoose");
const Manga = require("../models/Manga");
const User = require("../models/User");
const emailQueue = require('../Queues/emailQueue')

exports.getAllManga = async (req, res) => {
  try {
    const manga = await Manga.find().populate('chapters');
    res.json(manga);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createManga = async (req, res) => {
  const manga = new Manga({
    title: req.body.title,
    author: req.body.author,
    genres: req.body.genres,
    description: req.body.description,
    coverImage: req.body.coverImage,
    ongoing: req.body.ongoing,
    popularity: req.body.popularity
  });

  try {
    const newManga = await manga.save();
    let users = await User.find(null,['email']);
    let emails = users.map(user=>user.email);
    emails = emails.filter(email=>email !== req.user.email)
    emailQueue.add({
      view : 'email',
      data : {
          name : req.user.username,
          manga
      },
      from : req.user.email,
      to : emails,
      subject : "New Manga is created recendly."
  })
    return res.status(201).json(newManga);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editManga = async(req,res)=>{
  try{
    let user = req.user;
    console.log(user)
    if(req.user.role==="CEO" || req.user.role==="admin"){
      let id = req.params.id;
      if(!mongoose.Types.ObjectId.isValid(id)){
        return res.json({Msg:"not a valid id"}).status(400);
      };
      let manga = await Manga.findByIdAndUpdate(id ,{
        ...req.body
      });
      if(!manga){
        return res.json({msg : "Not found Manga"})
      };
      return res.json(manga)
    }
    return res.json({msg : "You are not accessed to edit manga"}).status(400);
  }catch(err){
    return res.status(400).json({ message: err.message });
  }
},

exports.destroy = async (req,res) =>{
  try {
    let user = req.user;
    if(user.role==="CEO" || user.role==="admin"){
      let id = req.params.id;
      if(!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ msg : 'not a valid id'});
      }
      let manga = await Manga.findByIdAndDelete(id);
      if(!manga) {
          return res.status(404).json({ msg : 'recipe not found'});
      }
      return res.json(manga);
    }
    return res.json({msg:"Not allowed to delete!"}).status(400)
}catch(e) {
    return res.status(500).json({ msg : 'internet server error'});
}
}

exports.getMangaById = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id).populate('chapters');
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    res.json(manga);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRelatedManga = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ message: 'Manga not found' });

    const relatedManga = await Manga.find({
      $or: [{ author: manga.author }, { genres: { $in: manga.genres } }],
      _id: { $ne: manga._id }
    });

    res.json(relatedManga);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOngoingManga = async (req, res) => {
  try {
    const ongoingManga = await Manga.find({ ongoing: true });
    res.json(ongoingManga);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCompletedManga = async (req, res) => {
  try {
    const completedManga = await Manga.find({ ongoing: false });
    res.json(completedManga);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPopularManga = async (req, res) => {
    try {
      const popularManga = await Manga.find({ popularity: { $gte: 90 } });
      res.json(popularManga);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
