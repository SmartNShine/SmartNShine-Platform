import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import App from "./App";
import {AuthProvider} from "./context/AuthContext";
import {TPOProvider} from "./context/TPOContext";
import {ErrorBoundary} from "./components/common";
import "./index.css";

// Import token debug utilities (only in development)
import "./utils/tokenDebug.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <TPOProvider>
              <App />
            </TPOProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
