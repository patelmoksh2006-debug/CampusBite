import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [billing, setBilling] = useState({
    subtotalAmount: 0,
    discountAmount: 0,
    appliedDiscountCode: null,
    subsidyAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    packagingFee: 5.0,
    finalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('HACK50');

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/cart?discount=${discountCode || ''}`);
      if (res.data.success) {
        setItems(res.data.items || []);
        if (res.data.billing) {
          setBilling(res.data.billing);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, discountCode]);

  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setItems([]);
      setBilling({
        subtotalAmount: 0,
        discountAmount: 0,
        appliedDiscountCode: null,
        subsidyAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        packagingFee: 5.0,
        finalAmount: 0
      });
    }
  }, [token, fetchCart]);

  const addToCart = async (foodItemId, quantity = 1, specialNotes = '') => {
    if (!token) return;
    try {
      await axios.post('/api/cart/items', {
        food_item_id: foodItemId,
        quantity,
        special_notes: specialNotes
      });
      await fetchCart();
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item to cart');
      return false;
    }
  };

  const updateQuantity = async (foodItemId, delta) => {
    return await addToCart(foodItemId, delta);
  };

  const removeItem = async (cartItemId) => {
    try {
      await axios.delete(`/api/cart/items/${cartItemId}`);
      await fetchCart();
    } catch (err) {
      console.warn('Failed to remove item:', err.message);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete('/api/cart');
      await fetchCart();
    } catch (err) {
      console.warn('Failed to clear cart:', err.message);
    }
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        billing,
        loading,
        discountCode,
        setDiscountCode,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
