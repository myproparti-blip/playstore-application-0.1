// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "antd-mobile/es/global";
import "./index.css"; // Optional: your custom styles
import { BrowserRouter } from 'react-router-dom';


const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
   <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);