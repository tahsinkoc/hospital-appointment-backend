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

const mongoURI = 'mongodb://localhost:27017/kichai';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası', err));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())



const KEY = 'a1b9c961-b14a-4ed7-8724-70a36d3146bb';

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
