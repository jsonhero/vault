import ReactDOM from "react-dom/client";

import "./styles/index.scss";

import React from "react";
import Root from "./Root.tsx";

// Launch our app.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
