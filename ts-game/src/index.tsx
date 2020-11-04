import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './ts/App';

// setup websocket before mounting

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

