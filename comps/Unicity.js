export default async function Unicity(User, username, res, next) {
    const Users = await User.findOne({ username: username })
    if (Users) {
        return res.status(422).send({ message: 'Username already exist.' })
    } else {
        next()
    }
}