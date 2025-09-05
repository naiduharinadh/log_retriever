import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://13.218.54.57:3001';

function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseLogMessage = (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      return parsedMessage;
    } catch (e) {
      return { raw: message };
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        console.log('Attempting to fetch logs from:', `${API_URL}/api/logs`);
        const response = await fetch(`${API_URL}/api/logs`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Logs fetched successfully:', data);
        setLogs(data.events);
        setError(null);
      } catch (error) {
        console.error("Error fetching logs:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const intervalId = setInterval(fetchLogs, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="App">
      <h1>CloudWatch Logs Viewer</h1>
      <div className="status-bar">
        <span>Status: {loading ? 'Loading...' : 'Live'}</span>
        {error && <span className="error-message">Error: {error}</span>}
      </div>
      
      <div className="logs-container">
        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : logs && logs.length > 0 ? (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Firewall Name</th>
                  <th>Event Type</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const parsedMessage = parseLogMessage(log.message);
                  return (
                    <tr key={log.eventId} className="log-entry">
                      <td className="timestamp">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td>{parsedMessage.firewall_name || 'N/A'}</td>
                      <td>{parsedMessage.event?.event_type || 'N/A'}</td>
                      <td>{parsedMessage.event?.src_ip || 'N/A'}</td>
                      <td>{parsedMessage.event?.dest_ip || 'N/A'}</td>
                      <td>{parsedMessage.event?.alert?.action || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-logs">No logs found</div>
        )}
      </div>
    </div>
  );
}

export default App;

