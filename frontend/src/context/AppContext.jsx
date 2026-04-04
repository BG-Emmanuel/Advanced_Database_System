import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI, cartAPI, setAuthToken, clearAuthToken } from '../utils/api';

const AppContext = createContext();

const initialState = {
  user: null,
  token: null,
  cart: { items: [], subtotal: 0, item_count: 0 },
  isLoading: true,
  language: localStorage.getItem('buy237_lang') || 'en',
  notification: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':       return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'LOGOUT':         return { ...state, user: null, token: null, cart: { items: [], subtotal: 0, item_count: 0 }, isLoading: false };
    case 'SET_CART':       return { ...state, cart: action.payload };
    case 'SET_LOADING':    return { ...state, isLoading: action.payload };
    case 'SET_LANGUAGE':   return { ...state, language: action.payload };
    case 'SHOW_NOTIF':     return { ...state, notification: action.payload };
    case 'HIDE_NOTIF':     return { ...state, notification: null };
    default:               return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartAPI.get();
      if (data.success) dispatch({ type: 'SET_CART', payload: data.cart });
    } catch (_) {}
  }, []);

  useEffect(() => {
    authAPI.getMe()
      .then((data) => {
        dispatch({ type: 'SET_USER', payload: { user: data.user, token: null } });
        fetchCart();
      })
      .catch(() => {
        clearAuthToken();
        dispatch({ type: 'SET_LOADING', payload: false });
      });
  }, [fetchCart]);

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    setAuthToken(data.token);
    dispatch({ type: 'SET_USER', payload: { user: data.user, token: data.token } });
    await fetchCart();
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const data = await authAPI.google({ credential, preferred_language: state.language });
    setAuthToken(data.token);
    dispatch({ type: 'SET_USER', payload: { user: data.user, token: data.token } });
    await fetchCart();
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (_) {
      // Client should still clear auth state if server logout fails.
    } finally {
      clearAuthToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    const data = await cartAPI.addItem({ product_id: productId, quantity });
    await fetchCart();
    showNotification({ type: 'success', message: 'Added to cart!' });
    return data;
  };

  const updateCartItem = async (itemId, quantity) => {
    await cartAPI.updateItem(itemId, { quantity });
    await fetchCart();
  };

  const removeCartItem = async (itemId) => {
    await cartAPI.removeItem(itemId);
    await fetchCart();
  };

  const setLanguage = (lang) => {
    localStorage.setItem('buy237_lang', lang);
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  };

  const showNotification = (notif) => {
    dispatch({ type: 'SHOW_NOTIF', payload: notif });
    setTimeout(() => dispatch({ type: 'HIDE_NOTIF' }), 3500);
  };

  return (
    <AppContext.Provider value={{
      ...state, login, loginWithGoogle, logout, addToCart, updateCartItem,
      removeCartItem, fetchCart, setLanguage, showNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export default AppContext;
