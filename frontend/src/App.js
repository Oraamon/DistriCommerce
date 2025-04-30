import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import ProductForm from './pages/ProductForm';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutDemo from './pages/CheckoutDemo';
import OrderSuccess from './pages/OrderSuccess';
import OrderList from './pages/OrderList';
import OrderDetails from './pages/OrderDetails';
import UserProfile from './pages/UserProfile';
import PrivateRoute from './components/PrivateRoute';
import { Container } from 'react-bootstrap';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <Container className="flex-grow-1 py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout-demo" element={<CheckoutDemo />} />

            <Route 
              path="/products/:id" 
              element={
                <PrivateRoute>
                  <ProductDetails />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/products/add" 
              element={
                <PrivateRoute>
                  <ProductForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/products/edit/:id" 
              element={
                <PrivateRoute>
                  <ProductForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/cart" 
              element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/checkout" 
              element={
                <PrivateRoute>
                  <Checkout />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/orders" 
              element={
                <PrivateRoute>
                  <OrderList />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/orders/:orderId" 
              element={
                <PrivateRoute>
                  <OrderDetails />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/orders/:orderId/success" 
              element={
                <PrivateRoute>
                  <OrderSuccess />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 