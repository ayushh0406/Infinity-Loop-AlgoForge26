const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'trustpool-super-secret-key-2024';

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role = 'borrower' } = req.body;
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const fabricId = 'USER_' + crypto.randomUUID().split('-')[0].toUpperCase();
        
        // Lenders start with ₹10,000, borrowers start with ₹0
        const initialWallet = role === 'lender' ? 10000 : 0;

        try {
            const { invokeFabric } = require('../fabric-invoke');
            await invokeFabric(fabricId, name, initialWallet);
        } catch (fabricErr) {
            console.error('Fabric invocation note:', fabricErr.message);
        }

        user = new User({
            name, email, password: passwordHash, fabricId, role,
            walletBalance: initialWallet
        });

        await user.save();
        res.status(201).json({ msg: 'User registered successfully', fabricId, role });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = {
            userId: user.id,
            fabricId: user.fabricId,
            email: user.email,
            name: user.name,
            role: user.role,
            isPanVerified: user.isPanVerified,
            isAadhaarVerified: user.isAadhaarVerified
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: payload });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get profile
router.get('/profile', async (req, res) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        res.json(user);
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

module.exports = router;
