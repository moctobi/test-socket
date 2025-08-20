"use client";
import React, {useRef, useState} from "react";
import {io, Socket} from "socket.io-client";

type EventLog = { type: string; text: string; time: string };

const SocketIOClient: React.FC = () => {
    const [serverUrl, setServerUrl] = useState("http://localhost:3000");
    const [token, setToken] = useState("");
    const [eventName, setEventName] = useState("message");
    const [messageData, setMessageData] = useState("");
    const [events, setEvents] = useState<EventLog[]>([]);
    const socketRef = useRef<Socket | null>(null);

    const addEvent = (type: string, text: string) => {
        setEvents((prev) => [
            ...prev,
            {type, text, time: new Date().toLocaleTimeString()},
        ]);
    };

    const connect = () => {
        if (socketRef.current) socketRef.current.disconnect();

        const socket = io(serverUrl, {
            auth: {token},
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => addEvent("connect", `Connected: ${socket.id}`));
        socket.on("disconnect", (reason) => addEvent("disconnect", `Disconnected: ${reason}`));
        socket.on("connect_error", (error) => addEvent("error", `Connect error: ${error.message}`));
        socket.on("message", (data) => addEvent("message", `Received 'message': ${JSON.stringify(data)}`));

        // Listen to all events except 'message'
        const originalOnevent = socket.onevent;
        socket.onevent = function (packet: any) {
            const event = packet.data[0];
            if (event !== "message") {
                const data = packet.data[1];
                addEvent("message", `Received '${event}': ${JSON.stringify(data)}`);
            }
            originalOnevent.call(this, packet);
        };
    };

    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            addEvent("disconnect", "Disconnected by user");
        }
    };

    const sendMessage = () => {
        if (!socketRef.current || !socketRef.current.connected) {
            addEvent("error", "Cannot send: Not connected");
            return;
        }
        try {
            const data = messageData.trim().startsWith("{")
                ? JSON.parse(messageData)
                : messageData;
            socketRef.current.emit(eventName || "message", data);
            addEvent("message", `Sent '${eventName}': ${JSON.stringify(data)}`);
        } catch (e: any) {
            addEvent("error", `JSON format error: ${e.message}`);
        }
    };

    return (
        <div style={{maxWidth: 800, margin: "0 auto", padding: 20}}>
            <h1>Socket.IO Test Client</h1>
            <div style={{border: "1px solid #ddd", borderRadius: 5, padding: 20, marginBottom: 20}}>
                <h2>Connect</h2>
                <div style={{display: "flex", marginBottom: 10}}>
                    <input
                        type="text"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder="Server URL"
                        style={{flexGrow: 1, marginRight: 10, padding: 8, borderRadius: 5, border: "1px solid #ddd"}}
                    />
                </div>
                <div style={{display: "flex", marginBottom: 10}}>
                    <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="JWT Token"
                        style={{flexGrow: 1, marginRight: 10, padding: 8, borderRadius: 5, border: "1px solid #ddd"}}
                    />
                    <button onClick={connect} style={{
                        padding: 8,
                        borderRadius: 5,
                        background: "#4caf50",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        marginRight: 5
                    }}>
                        Connect
                    </button>
                    <button onClick={disconnect} style={{
                        padding: 8,
                        borderRadius: 5,
                        background: "#f44336",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer"
                    }}>
                        Disconnect
                    </button>
                </div>
            </div>
            <div style={{border: "1px solid #ddd", borderRadius: 5, padding: 20, marginBottom: 20}}>
                <h2>Event Log</h2>
                <div style={{height: 300, overflowY: "auto", border: "1px solid #ddd", padding: 10, borderRadius: 5}}>
                    {events.map((ev, idx) => (
                        <div key={idx} style={{
                            padding: 5,
                            marginBottom: 5,
                            borderRadius: 3,
                            background: ev.type === "connect" ? "#d4edda"
                                : ev.type === "disconnect" ? "#f8d7da"
                                    : ev.type === "error" ? "#f8d7da"
                                        : "#e2e3e5",
                            color: ev.type === "connect" ? "#155724"
                                : ev.type === "disconnect" ? "#721c24"
                                    : ev.type === "error" ? "#721c24"
                                        : "#383d41"
                        }}>
                            {ev.time}: {ev.text}
                        </div>
                    ))}
                </div>
            </div>
            <div style={{border: "1px solid #ddd", borderRadius: 5, padding: 20}}>
                <h2>Send Message</h2>
                <div style={{display: "flex", marginBottom: 10}}>
                    <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Event name (e.g. message)"
                        style={{flexGrow: 1, marginRight: 10, padding: 8, borderRadius: 5, border: "1px solid #ddd"}}
                    />
                </div>
                <div style={{display: "flex", marginBottom: 10}}>
                    <input
                        type="text"
                        value={messageData}
                        onChange={(e) => setMessageData(e.target.value)}
                        placeholder="Message data (JSON)"
                        style={{flexGrow: 1, marginRight: 10, padding: 8, borderRadius: 5, border: "1px solid #ddd"}}
                    />
                    <button onClick={sendMessage} style={{
                        padding: 8,
                        borderRadius: 5,
                        background: "#4caf50",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer"
                    }}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocketIOClient;