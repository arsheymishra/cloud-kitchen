'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Minus, Trash2, LogOut, UtensilsCrossed, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // Auth state
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [authError, setAuthError] = useState('');
  
  // Food state
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Admin food form
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageBase64: '',
  });
  const [editingFood, setEditingFood] = useState(null);
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [orderForm, setOrderForm] = useState({ deliveryAddress: '', phone: '' });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setCurrentView(JSON.parse(savedUser).role === 'admin' ? 'admin-dashboard' : 'menu');
    }
  }, []);
  
  useEffect(() => {
    if (user && currentView === 'menu') {
      fetchFoods();
    }
  }, [user, currentView]);
  
  useEffect(() => {
    if (user && currentView === 'my-orders') {
      fetchMyOrders();
    }
  }, [user, currentView]);
  
  useEffect(() => {
    if (user?.role === 'admin' && currentView === 'admin-dashboard') {
      fetchAdminData();
    }
  }, [user, currentView]);
  
  const fetchFoods = async () => {
    try {
      const response = await fetch('/api/food');
      const data = await response.json();
      setFoods(data.foods || []);
    } catch (error) {
      console.error('Error fetching foods:', error);
    }
  };
  
  const fetchMyOrders = async () => {
    try {
      const response = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  const fetchAdminData = async () => {
    try {
      const [foodsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/food', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const foodsData = await foodsRes.json();
      const ordersData = await ordersRes.json();
      setFoods(foodsData.foods || []);
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };
  
  const handleAuth = async (isLogin) => {
    setAuthError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: authForm.email, password: authForm.password }
        : authForm;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed');
        return;
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setCurrentView(data.user.role === 'admin' ? 'admin-dashboard' : 'menu');
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCart([]);
    setCurrentView('login');
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoodForm({ ...foodForm, imageBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddFood = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingFood ? `/api/admin/food/${editingFood._id}` : '/api/admin/food';
      const method = editingFood ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(foodForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setFoodForm({ name: '', description: '', price: '', category: '', imageBase64: '' });
        setEditingFood(null);
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error saving food:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteFood = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await fetch(`/api/admin/food/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };
  
  const handleToggleAvailability = async (id) => {
    try {
      await fetch(`/api/admin/food/${id}/availability`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdminData();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };
  
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchAdminData();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  
  const addToCart = (food) => {
    const existing = cart.find(item => item._id === food._id);
    if (existing) {
      setCart(cart.map(item => 
        item._id === food._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };
  
  const updateCartQuantity = (foodId, change) => {
    setCart(cart.map(item => {
      if (item._id === foodId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };
  
  const removeFromCart = (foodId) => {
    setCart(cart.filter(item => item._id !== foodId));
  };
  
  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };
  
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map(item => ({ foodId: item._id, quantity: item.quantity })),
          deliveryAddress: orderForm.deliveryAddress,
          phone: orderForm.phone,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCart([]);
        setOrderForm({ deliveryAddress: '', phone: '' });
        setCurrentView('my-orders');
      }
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-blue-500',
      preparing: 'bg-yellow-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };
  
  const getStatusIcon = (status) => {
    const icons = {
      placed: <Package className="w-4 h-4" />,
      preparing: <Clock className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || null;
  };
  
  const filteredFoods = selectedCategory === 'all' 
    ? foods 
    : foods.filter(food => food.category === selectedCategory);
  
  const categories = ['all', ...new Set(foods.map(food => food.category))];
  
  // LOGIN/REGISTER VIEW
  if (currentView === 'login' || currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-orange-500 p-3 rounded-full">
                <UtensilsCrossed className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Cloud Kitchen</CardTitle>
            <CardDescription>
              {currentView === 'login' ? 'Welcome back!' : 'Create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentView} onValueChange={setCurrentView}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
                {authError && <p className="text-sm text-red-500">{authError}</p>}
                <Button 
                  className="w-full" 
                  onClick={() => handleAuth(true)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Login'}
                </Button>
                <div className="text-xs text-center text-muted-foreground mt-4">
                  <p>Default Admin Credentials:</p>
                  <p>Email: admin@cloudkitchen.com</p>
                  <p>Password: Admin@123</p>
                </div>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    placeholder="John Doe"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-role">Register as</Label>
                  <Select
                    value={authForm.role}
                    onValueChange={(value) => setAuthForm({ ...authForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {authError && <p className="text-sm text-red-500">{authError}</p>}
                <Button 
                  className="w-full" 
                  onClick={() => handleAuth(false)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Register'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // ADMIN DASHBOARD
  if (user?.role === 'admin' && currentView === 'admin-dashboard') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="foods" className="space-y-6">
            <TabsList>
              <TabsTrigger value="foods">Manage Foods</TabsTrigger>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="foods" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddFood} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={foodForm.name}
                          onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input
                          value={foodForm.category}
                          onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                          placeholder="e.g., Pizza, Burger, Dessert"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={foodForm.description}
                        onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={foodForm.price}
                        onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        required={!editingFood}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : editingFood ? 'Update Food' : 'Add Food'}
                      </Button>
                      {editingFood && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingFood(null);
                            setFoodForm({ name: '', description: '', price: '', category: '', imageBase64: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {foods.map(food => (
                  <Card key={food._id}>
                    <CardHeader>
                      <img
                        src={food.imageUrl}
                        alt={food.name}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{food.name}</h3>
                          <Badge variant="outline">{food.category}</Badge>
                        </div>
                        <p className="font-bold text-lg">${food.price}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{food.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={food.isAvailable ? 'bg-green-500' : 'bg-red-500'}>
                          {food.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingFood(food);
                          setFoodForm({
                            name: food.name,
                            description: food.description,
                            price: food.price,
                            category: food.category,
                            imageBase64: '',
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAvailability(food._id)}
                      >
                        Toggle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFood(food._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              {orders.map(order => (
                <Card key={order._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order._id.slice(-6)}</CardTitle>
                        <CardDescription>
                          Customer: {order.user?.name} ({order.user?.email})
                        </CardDescription>
                        <CardDescription>
                          Phone: {order.phone}
                        </CardDescription>
                        <CardDescription>
                          Address: {order.deliveryAddress}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">${order.totalAmount}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-semibold">Items:</p>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.food?.name} x {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {order.status === 'placed' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                      >
                        Mark Delivered
                      </Button>
                    )}
                    {(order.status === 'placed' || order.status === 'preparing') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }
  
  // USER VIEWS
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold">Cloud Kitchen</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'menu' ? 'default' : 'outline'}
                onClick={() => setCurrentView('menu')}
              >
                Menu
              </Button>
              <Button
                variant={currentView === 'cart' ? 'default' : 'outline'}
                onClick={() => setCurrentView('cart')}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
              </Button>
              <Button
                variant={currentView === 'my-orders' ? 'default' : 'outline'}
                onClick={() => setCurrentView('my-orders')}
              >
                My Orders
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {currentView === 'menu' && (
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Our Menu</h2>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFoods.map(food => (
              <Card key={food._id} className="overflow-hidden">
                <img
                  src={food.imageUrl}
                  alt={food.name}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{food.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{food.category}</Badge>
                    </div>
                    <p className="font-bold text-xl text-orange-500">${food.price}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{food.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => addToCart(food)}
                    disabled={!food.isAvailable}
                  >
                    {food.isAvailable ? 'Add to Cart' : 'Not Available'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {currentView === 'cart' && (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
          
          {cart.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <Button className="mt-4" onClick={() => setCurrentView('menu')}>
                  Browse Menu
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="divide-y">
                  {cart.map(item => (
                    <div key={item._id} className="py-4 first:pt-6 last:pb-6">
                      <div className="flex gap-4">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">${item.price} each</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item._id, -1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item._id, 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Delivery Address</Label>
                      <Textarea
                        value={orderForm.deliveryAddress}
                        onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
                        placeholder="Enter your complete address"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        type="tel"
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                        placeholder="Your contact number"
                        required
                      />
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold mb-4">
                        <span>Total Amount:</span>
                        <span className="text-orange-500">${getTotalAmount()}</span>
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? 'Placing Order...' : 'Place Order (Cash on Delivery)'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      
      {currentView === 'my-orders' && (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">My Orders</h2>
          
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No orders yet</p>
                <Button className="mt-4" onClick={() => setCurrentView('menu')}>
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order._id.slice(-6)}</CardTitle>
                        <CardDescription>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">${order.totalAmount}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-semibold">Items:</p>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.food?.name} x {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <p className="text-sm"><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
                        <p className="text-sm"><strong>Phone:</strong> {order.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}