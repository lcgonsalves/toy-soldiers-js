import React from 'react';
import io from "socket.io-client";
import '../css/App.css';
import MapEditor from "./game/MapEditor";
// const socket: SocketIOClient.Socket = io("http://localhost:80");

function App() {
    // function sendMsg() {
    //     socket.emit("message", "HELLO WORLD");
    // }

    // socket.on("message", console.log);

    return (
        <div className="App">
            Hello
            <MapEditor/>
        </div>

    );
}

export default App;
