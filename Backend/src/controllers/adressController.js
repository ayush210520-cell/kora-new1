const { validationResult } = require('express-validator');
const prisma = require('../config/db');

// Get all addresses for the authenticated user
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const addresses = await prisma.address.findMany({
      where: { userId }
    });

    res.status(200).json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new address
const createAddress = async (req, res) => {
  try {
    console.log('🏠 Address creation request received:', {
      userId: req.userId,
      role: req.role,
      body: req.body,
      headers: req.headers.authorization ? 'Authorization header present' : 'No authorization header'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address, city, state, pincode, landmark } = req.body;
    const userId = req.userId;

    if (!userId) {
      console.log('❌ No userId found in request');
      return res.status(401).json({ error: 'User ID not found in request' });
    }

    console.log('📝 Creating address with data:', {
      name, phone, address, city, state, pincode, landmark, userId
    });

    const newAddress = await prisma.address.create({
      data: {
        name,
        phone,
        address,
        city,
        state,
        pincode,
        landmark,
        userId
      }
    });

    console.log('✅ Address created successfully:', newAddress.id);

    res.status(201).json({
      message: 'Address created successfully',
      address: newAddress
    });
  } catch (error) {
    console.error('❌ Create address error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, phone, address, city, state, pincode, landmark } = req.body;
    const userId = req.userId;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId }
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        city,
        state,
        pincode,
        landmark
      }
    });

    res.status(200).json({
      message: 'Address updated successfully',
      address: updatedAddress
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const address = await prisma.address.findFirst({
      where: { id, userId }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};
