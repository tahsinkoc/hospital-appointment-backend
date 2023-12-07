import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import User from './schemas/UserScheme.js';
import Encrypt from './comps/Cryptor.js';
import Unicity from './comps/Unicity.js';
import AuthenticateToken from './comps/Authenticate.js'
import Clinic from './schemas/ClinicScheme.js';
import Appointment from './schemas/AppointmentScheme.js';

const app = express();

const mongoURI = 'mongodb://localhost:27017/Learning';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası', err));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())



const KEY = 'a1b9c961-b14a-4ed7-8724-70a36d3146bb';


// Appointment Procces

app.post('/create-appointment', (req, res, next) => {
    AuthenticateToken(req, res, next, ['client'])
}, async (req, res) => {
    const AvailableAppointments = await Appointment.countDocuments({ 'Doctor._id': req.body.Doctor['_id'], Date: req.body.Date })
    if (AvailableAppointments < 1) {
        const NewAppointment = new Appointment(req.body);
        NewAppointment.save()
        res.status(200).send({ message: 'Appointment succesfully saved.' })
    } else {
        res.status(403).send({ message: 'We are sorry, we are out of capacity.' })
    }
})



//Clinic Procces

app.post('/create-clinic', async (req, res, next) => {
    AuthenticateToken(req, res, next, ['superuser1-*0'])
}, async (req, res) => {
    const Clinics = await Clinic.findOne({ name: req.body.name })
    if (Clinics) {
        res.status(403).send({ message: 'Already there is a clinic with this name.' })
    } else {
        const clinic = new Clinic(req.body);
        clinic.save();
        res.status(200).send({ message: 'Succesfully created' })
    }
})




// User Procces


app.post('/create-doctor', (req, res, next) => {
    AuthenticateToken(req, res, next, ['superuser1-*0']);
}, (req, res, next) => {
    const body = req.body;
    body.role = 'doctor';
    Unicity(User, body.username, res, next);
}, (req, res) => {
    const body = req.body
    body.password = Encrypt(body.password);
    const Doctor = new User(body);
    Doctor.save();
    res.status(200).send({ message: 'Succesfully created.' });
})


app.get('/doctors/:department/', async (req, res) => {
    const department = req.params.department;
    const doctors = await User.find({
        role: 'doctor',
        department: department
    }, { password: 0 })
    res.status(200).send({ message: doctors })
})

app.get('/users/:role', async (req, res) => {
    const role = req.params.role
    const usr = await User.find({
        role: {
            $ne: 'superuser1-*0',
            $eq: role
        }
    }, { password: 0 })
    res.json(usr)
})


app.get('/users', async (req, res) => {
    const usr = await User.find({ role: { $ne: 'superuser1-*0' } }, { password: 0 })
    res.json(usr)
})


app.get('/secured', (req, res, next) => {
    AuthenticateToken(req, res, next, ['doctor', 'superuser1-*0']);
}, async (req, res) => {
    const usr = await User.find({ role: { $ne: 'superuser1-*0' } })
    res.json(usr)
})


app.post('/register', (req, res) => {
    const body = req.body;
    body.password = Encrypt(body.password)
    body.role = 'client';
    body.department = 'client';
    const newUser = new User(body);
    newUser.save();
    res.status(200).send(newUser);
})

app.post('/login-owner', async (req, res) => {
    const body = req.body;
    const check = await User.findOne({
        username: body.username,
        password: Encrypt(body.password)
    })
    if (check) {
        const token = jwt.sign({ id: check['_id'], name: check.name, username: check.username, role: check.role, department: check.department, phoneNumber: check.phoneNumber },
            KEY, { expiresIn: '1h' });
        res.status(200).send({ message: token });
    } else {
        res.status(402).send({ message: 'Wrong Username or Password' });
    }
})

app.post('/login', async (req, res) => {
    const body = req.body;
    const check = await User.findOne({
        role: {
            $ne: 'superuser1-*0',
            $ne: 'doctor'
        },
        username: body.username,
        password: Encrypt(body.password)
    });
    if (check) {
        const token = jwt.sign({ id: check['_id'], name: check.name, username: check.username, role: check.role, department: check.department, phoneNumber: check.phoneNumber },
            KEY,
            { expiresIn: '1h' });
        res.status(200).send({ message: token })
    } else {
        res.status(402).send({ message: 'Wrong Username or Password' })
    }
})


app.listen(4575, () => {
    console.log('Server Deployed at ::4575::');
})
