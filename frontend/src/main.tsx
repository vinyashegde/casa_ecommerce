import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { UserProvider } from "./contexts/UserContext.tsx";
import { CartProvider } from "./contexts/CartContext.tsx";
import { CuratedListProvider } from "./contexts/CuratedListContext.tsx";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserProvider>
      <CartProvider>
        <CuratedListProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 2000,
            }}
          />
        </CuratedListProvider>
      </CartProvider>
    </UserProvider>
  </React.StrictMode>
);
