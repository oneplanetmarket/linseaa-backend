import jwt from 'jsonwebtoken';
import Producer from '../models/Producer.js';

const authProducer = async (req, res, next) => {
    const { producerToken } = req.cookies;

    if (!producerToken) {
        return res.json({ success: false, message: 'Not Authorized - Login Required' });
    }

    try {
        const tokenDecode = jwt.verify(producerToken, process.env.JWT_SECRET);
        const producer = await Producer.findById(tokenDecode.id);
        
        if (!producer) {
            return res.json({ success: false, message: 'Producer not found' });
        }

        if (!producer.isActive) {
            return res.json({ success: false, message: 'Account is deactivated' });
        }

        req.body.producerId = producer._id;
        req.producer = producer;
        next();
        
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: 'Not Authorized - Invalid Token' });
    }
};

export default authProducer;