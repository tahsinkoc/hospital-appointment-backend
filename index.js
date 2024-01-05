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
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası', err));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())



const KEY = 'a1b9c961-b14a-4ed7-8724-70a36d3146bb';


// Appointment Proccessssddsd

app.post('/create-appointment', (req, res, next) => {
    AuthenticateToken(req, res, next, ['client'])
}, async (req, res) => {
    const AvailableAppointments = await Appointment.countDocuments({ 'Doctor._id': req.body.Doctor['_id'], Date: req.body.Date })
    if (AvailableAppointments < 1) {
        const NewAppointment = new Appointment(req.body);
        NewAppointment.save()
        res.status(200).send({ message: 'Randevunuz başarılı bir şekilde kaydedildi.', status: 200 })
    } else {
        res.status(403).send({ message: 'Üzgünüz seçmiş olduğunuz tarih için doktorumuz müsait değil.', status: 403 })
    }
})

app.get('/get-appointment/:userid?', async (req, res, next) => {
    const { userid } = req.params;
    if (userid) {
        const appos = await Appointment.find({ 'Client.id': userid })
        res.send({ status: 200, message: appos })
    } else {
        const appos = await Appointment.find();
        res.send({ status: 200, message: appos })
    }
})

app.get('/get-appointment/:doctorid/:date?', async (req, res, next) => {
    const { doctorid, date } = req.params;
    if (date) {
        const appos = await Appointment.find({ 'Doctor._id': doctorid, Date: date })
        res.send({ status: 200, message: appos })
    } else {
        const appos = await Appointment.find({ 'Doctor._id': doctorid })
        res.send({ status: 200, message: appos })
    }
})
app.get('/get-appointments/:doctorid', async (req, res, next) => {
    const { doctorid } = req.params;
    const appos = await Appointment.find({ 'Doctor._id': doctorid })
    res.send({ status: 200, message: appos })
})
//Clinic Procces

app.get('/clinics/:name?', async (req, res) => {
    const { name } = req.params;

    try {
        let clinics;

        if (name) {
            clinics = await Clinic.find({ name: { $regex: new RegExp(name, 'i') } });
        } else {
            clinics = await Clinic.find();
        }

        if (clinics.length > 0) {
            res.status(200).json({ status: 200, message: clinics });
        } else {
            res.status(404).json({ status: 404, message: 'No clinics found.' });
        }
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Server error.' });
    }
});

app.post('/create-clinic', async (req, res, next) => {
    AuthenticateToken(req, res, next, ['superuser1-*0'])
}, async (req, res) => {
    const Clinics = await Clinic.findOne({ name: req.body.name })
    if (Clinics) {
        res.status(403).send({ message: 'Already there is a clinic with this name.', status: 403 })
    } else {
        const clinic = new Clinic(req.body);
        clinic.save();
        res.status(200).send({ message: 'Succesfully created', status: 200 })
    }
})

app.post('/delete-clinic', async (req, res, next) => {
    AuthenticateToken(req, res, next, ['superuser1-*0'])
}, async (req, res) => {
    const body = req.body;
    const ClinicForDelete = await Clinic.deleteOne({ _id: body.id });
    if (ClinicForDelete) {
        res.send({ status: 200, message: 'Succesfully Deleted' });
    } else {
        res.send({ status: 404, message: 'User couldn`t find.' })
    }
})


// User Procces

app.post('/delete-user', (req, res, next) => {
    AuthenticateToken(req, res, next, ['superuser1-*0']);
}, async (req, res) => {
    const body = req.body;
    const UserForDelete = await User.deleteOne({ _id: body.id });
    if (UserForDelete) {
        res.send({ status: 200, message: 'Succesfully Deleted' });
    } else {
        res.send({ status: 404, message: 'User couldn`t find.' })
    }
})


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
    res.status(200).send({ message: 'Succesfully created.', status: 200 });
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

app.post('/update-user', async (req, res, next) => {
    AuthenticateToken(req, res, next, ['superuser1-*0'])
}, async (req, res, next) => {
    const userForUpdate = await User.findOne({ _id: req.body.id })
    if (userForUpdate) {
        userForUpdate.name = req.body.name;
        userForUpdate.surname = req.body.surname;
        userForUpdate.username = req.body.username;
        userForUpdate.phoneNumber = req.body.phoneNumber;
        userForUpdate.save()
        res.send({ status: 200, message: 'Başarıyla güncellendi.' })
    } else {
        res.send({ status: 404, message: 'Kullanıcı bulunamad.' })
    }
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


app.post('/register', (req, res, next) => {
    Unicity(User, req.body.username, res, next);

}, (req, res) => {
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
        role: 'superuser1-*0',
        username: body.username,
        password: Encrypt(body.password)
    })
    if (check) {
        const token = jwt.sign({ id: check['_id'], name: check.name, username: check.username, role: check.role, department: check.department, phoneNumber: check.phoneNumber },
            KEY, { expiresIn: '1h' });
        res.status(200).send({ message: token });
    } else {
        res.status(401).send({ message: 'Wrong Username or Password', status: 401 });
    }
})

app.post('/login-doctor', async (req, res) => {
    const body = req.body;
    const check = await User.findOne({
        role: {
            $nin: ['client', 'superuser1-*0']
        },
        username: body.username,
        password: Encrypt(body.password)
    });
    console.log(check)
    if (check) {
        const token = jwt.sign({ id: check['_id'], name: check.name, username: check.username, role: check.role, department: check.department, phoneNumber: check.phoneNumber },
            KEY,
            { expiresIn: '1h' });
        res.status(200).send({ message: token, status: 200 })
    } else {
        res.status(401).send({ message: 'Wrong Username or Password', status: 401 })
    }
})

app.post('/login', async (req, res) => {
    const body = req.body;
    const check = await User.findOne({
        role: {
            $nin: ['doctor', 'superuser1-*0']
        },
        username: body.username,
        password: Encrypt(body.password)
    });
    console.log(check)
    if (check) {
        const token = jwt.sign({ id: check['_id'], name: check.name, username: check.username, role: check.role, department: check.department, phoneNumber: check.phoneNumber },
            KEY,
            { expiresIn: '1h' });
        res.status(200).send({ message: token, status: 200 })
    } else {
        res.status(401).send({ message: 'Wrong Username or Password', status: 401 })
    }
})


app.listen(4575, () => {
    console.log('Server Deployed at ::4575::');
})
