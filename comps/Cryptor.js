import crypto from 'crypto'

export default function Encrypt(text) {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return hash;
}