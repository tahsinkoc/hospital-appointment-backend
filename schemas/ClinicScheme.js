import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ClinicSchema = new Schema({
    name: { type: String },
})

const Clinic = mongoose.model('clinic', ClinicSchema);

export default Clinic;