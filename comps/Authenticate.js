import jwt from 'jsonwebtoken';


const KEY = 'a1b9c961-b14a-4ed7-8724-70a36d3146bb';

const AuthenticateToken = (req, res, next, acceptableRoles) => {

    const token = req.header("Auth");

    if (!token) {
        // console.log(token)
        return res.status(401).send({ message: 'Acces denied. Token is required' });
    }
    // console.log(token)
    jwt.verify(token, KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Invalid Token.' });
        } else {
            const RoleCheck = acceptableRoles.find((item) => item == decoded.role);
            if (!RoleCheck) {
                return res.status(403).send({ message: 'You don`t have a permision to acces here.' });
            }
            req.user = decoded;
            next();
        }
    })

}
export default AuthenticateToken