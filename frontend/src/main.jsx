import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import CartProvider from "./context/CartContext.jsx";

import AuthProvider from "./context/AuthContext.jsx";
import App from "./App.jsx";          // <-- single import only
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
     <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </AuthProvider>
);