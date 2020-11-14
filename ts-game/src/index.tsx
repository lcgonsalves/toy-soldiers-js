import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import MapEditor from "./ts/game/MapEditor";

// setup websocket before mounting

ReactDOM.render(
  <React.StrictMode>
    <MapEditor/>
  </React.StrictMode>,
  document.getElementById('root')
);

