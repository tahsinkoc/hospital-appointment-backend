import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
    Client: { type: Object },
    Doctor: { type: Object },
    Date: { type: String }
})

const Appointment = mongoose.model('appointment', AppointmentSchema);

export default Appointment