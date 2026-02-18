import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB Connection
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Food Schema
const FoodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Food = mongoose.models.Food || mongoose.model('Food', FoodSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['placed', 'preparing', 'delivered', 'cancelled'], 
    default: 'placed' 
  },
  deliveryAddress: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// Initialize default admin
async function initializeAdmin() {
  try {
    const adminExists = await User.findOne({ email: 'admin@cloudkitchen.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@cloudkitchen.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

// Middleware to verify JWT
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Helper to get user from token
async function getUserFromToken(request) {
  const authHeader = request.headers.get('authorization');
  const decoded = verifyToken(authHeader);
  const user = await User.findById(decoded.userId).select('-password');
  if (!user) throw new Error('User not found');
  return user;
}

// Main handler
export async function POST(request) {
  await connectDB();
  await initializeAdmin();
  
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    // AUTH ROUTES
    if (path === 'auth/register') {
      const body = await request.json();
      const { name, email, password, role } = body;
      
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        );
      }
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
      });
      
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return NextResponse.json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
    
    if (path === 'auth/login') {
      const body = await request.json();
      const { email, password } = body;
      
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }
      
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
      
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return NextResponse.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
    
    if (path === 'auth/me') {
      const user = await getUserFromToken(request);
      return NextResponse.json({ user });
    }
    
    // ADMIN FOOD ROUTES
    if (path === 'admin/food') {
      const user = await getUserFromToken(request);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        );
      }
      
      const body = await request.json();
      const { name, description, price, category, imageBase64 } = body;
      
      if (!name || !description || !price || !category || !imageBase64) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        );
      }
      
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageBase64, {
        folder: 'cloud-kitchen',
      });
      
      const food = await Food.create({
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl: uploadResult.secure_url,
      });
      
      return NextResponse.json({
        message: 'Food item created successfully',
        food,
      });
    }
    
    // CREATE ORDER
    if (path === 'orders') {
      const user = await getUserFromToken(request);
      const body = await request.json();
      const { items, deliveryAddress, phone } = body;
      
      if (!items || items.length === 0 || !deliveryAddress || !phone) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        );
      }
      
      // Calculate total
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of items) {
        const food = await Food.findById(item.foodId);
        if (!food || !food.isAvailable) {
          return NextResponse.json(
            { error: `Food item ${item.foodId} not available` },
            { status: 400 }
          );
        }
        
        orderItems.push({
          food: food._id,
          quantity: item.quantity,
          price: food.price,
        });
        
        totalAmount += food.price * item.quantity;
      }
      
      const order = await Order.create({
        user: user._id,
        items: orderItems,
        totalAmount,
        deliveryAddress,
        phone,
      });
      
      const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate('items.food');
      
      return NextResponse.json({
        message: 'Order placed successfully',
        order: populatedOrder,
      });
    }
    
    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  await connectDB();
  await initializeAdmin();
  
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    // GET ALL FOOD
    if (path === 'food') {
      const category = url.searchParams.get('category');
      const query = category ? { category, isAvailable: true } : { isAvailable: true };
      const foods = await Food.find(query).sort({ createdAt: -1 });
      return NextResponse.json({ foods });
    }
    
    // GET SINGLE FOOD
    if (path.startsWith('food/') && path.split('/').length === 2) {
      const id = path.split('/')[1];
      const food = await Food.findById(id);
      if (!food) {
        return NextResponse.json(
          { error: 'Food not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ food });
    }
    
    // GET MY ORDERS
    if (path === 'orders/my-orders') {
      const user = await getUserFromToken(request);
      const orders = await Order.find({ user: user._id })
        .populate('items.food')
        .sort({ createdAt: -1 });
      return NextResponse.json({ orders });
    }
    
    // GET ALL ORDERS (Admin)
    if (path === 'admin/orders') {
      const user = await getUserFromToken(request);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        );
      }
      
      const orders = await Order.find()
        .populate('user', 'name email phone')
        .populate('items.food')
        .sort({ createdAt: -1 });
      return NextResponse.json({ orders });
    }
    
    // GET ALL FOOD (Admin)
    if (path === 'admin/food') {
      const user = await getUserFromToken(request);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        );
      }
      
      const foods = await Food.find().sort({ createdAt: -1 });
      return NextResponse.json({ foods });
    }
    
    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  await connectDB();
  
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    // UPDATE FOOD (Admin)
    if (path.startsWith('admin/food/') && !path.includes('availability')) {
      const user = await getUserFromToken(request);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        );
      }
      
      const id = path.split('/')[2];
      const body = await request.json();
      const { name, description, price, category, imageBase64 } = body;
      
      const updateData = { name, description, price, category };
      
      if (imageBase64) {
        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
          folder: 'cloud-kitchen',
        });
        updateData.imageUrl = uploadResult.secure_url;
      }
      
      const food = await Food.findByIdAndUpdate(id, updateData, { new: true });
      if (!food) {
        return NextResponse.json(
          { error: 'Food not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        message: 'Food updated successfully',
        food,
      });
    }
    
    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  await connectDB();
  
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    // TOGGLE FOOD AVAILABILITY (Admin)
    if (path.includes('admin/food') && path.includes('availability')) {
      const user = await getUserFromToken(request);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        );
      }
      
      const id = path.split('/')[2];
      const food = await Food.findById(id);
      if (!food) {
        return NextResponse.json(
          { error: 'Food not found' },
          { status: 404 }
        );
      }
      
      food.isAvailable = !food.isAvailable;
      await food.save();
      
      return NextResponse.json({
        message: 'Availability updated',
        food,
      });
    }
    
    // UPDATE ORDER STATUS (Admin)
    if (path.startsWith('admin/orders/')) {
      const user = await getUserFromToken(request);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        );
      }
      
      const id = path.split('/')[2];
      const body = await request.json();
      const { status } = body;
      
      if (!['placed', 'preparing', 'delivered', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      
      const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('items.food').populate('user', 'name email');
      
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        message: 'Order status updated',
        order,
      });
    }
    
    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  await connectDB();
  
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    // DELETE FOOD (Admin)
    if (path.startsWith('admin/food/')) {
      const user = await getUserFromToken(request);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied. Admin only.' },
          { status: 403 }
        );
      }
      
      const id = path.split('/')[2];
      const food = await Food.findByIdAndDelete(id);
      if (!food) {
        return NextResponse.json(
          { error: 'Food not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        message: 'Food deleted successfully',
      });
    }
    
    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}