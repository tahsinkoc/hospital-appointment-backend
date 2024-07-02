import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String },
    surname: { type: String },
    mail: { type: String },
    password: { type: String },
    phoneNumber: { type: String },
    role: { type: String },
    department: { type: String }
})

const User = mongoose.model('User', UserSchema);

export default User