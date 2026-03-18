const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');


dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function connect(){
    try{
        if (!process.env.DB_URL) {
            throw new Error('DB_URL is missing. Please set DB_URL in my-server/.env');
        }

        await mongoose.connect(process.env.DB_URL,{});
        console.log("Success!");
    } catch (error){
        console.log(error.message);
    }   
}

module.exports = {connect};
