const { default: mongoose } = require("mongoose");


function DbConnect(){
        
    const mongoDB = process.env.DB_URL;
    mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

    //Get the default connection
    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
}

module.exports=DbConnect;