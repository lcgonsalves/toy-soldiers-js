import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import GameMapEditor from "./ts/game/map/GameMapEditor";

// setup websocket before mounting

ReactDOM.render(
  <React.StrictMode>
    <GameMapEditor/>
  </React.StrictMode>,
  document.getElementById('root')
);

