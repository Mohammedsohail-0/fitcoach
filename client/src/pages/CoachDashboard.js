import React from "react";
import './CoachDashboard.css';
import { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/Button"




function CoachDashboard() {
  const [coachName, setCoachName] = useState('');
  const [clients, setClients] = useState([]);


  // fetch coach's own profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const coachProfile = await api.get('/coach/profile');
        setCoachName(coachProfile.data.name);
      } catch {
        console.log("error")
      }
    }
    fetchProfile();
  }, [])

  //fetch client profiles
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsObj = await api.get('/coach/clients');
        setClients(clientsObj.data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchClients();
  }, [])

  return (
    <div className="coachDashboard">
      <div className="header">
        <h1>Hi, {coachName}</h1>
      </div>
      <div className="hero">
        <div className="c-wrapper">
          <div className="c-container">
            <p className="count" id="c-count">{clients.length}</p>
            <p className="c-label">Total clients</p>
          </div>
          <div className="c-container">
            <p className="count" id="l-count">{clients.filter(client => hasLoggedOnDate(client.workoutLogs, new Date())).length}</p>
            <p className="c-label">Logged today</p>
          </div>
        </div>
      </div>
      {/* Clients table header */}
      <div className="clients-table-header">
        <h1>
          Clients
        </h1>
        <div className="search-bar-add-client-wrapper">
          <div className="search-bar">
           <input
              type="text"
              placeholder="Search clients"
              className="search-input"
            />
          </div>
          <div>
            <Button variant="secondary" size="sm" className="add-client-btn" text="Add Client"></Button>
          </div>
        </div>
      </div>

      {/* Clients table  */}

      <div className="table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>PROGRAM</th>
              <th>ACTIVITY LAST 7 DAYS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {
              clients.map((client) => (

                <tr key={client.id}>
                  <td  data-label="Client">
                    <div className="client-profile-dashboard">
                      <img className="client-avatar" src="https://i.ibb.co/twxKnHfb/profileavatar.png" alt="client profile"></img>
                      <p>{client.name}</p>
                   
                    </div>
                  </td>
                  <td data-label="Program">{client.goal}</td>
                  <td  data-label="Activity">
                    <ActivityDots workoutLogs={client.workoutLogs} />
                  </td>
                  <td data-label="Status"  className={client.workoutLogs.length > 0 ? "status-active" : "status-inactive"}>
                    {client.workoutLogs.length > 0 ? "Active" : "Inactive"}

                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default CoachDashboard;


//check logs
function hasLoggedOnDate(logs, targetDate) {
  const targetDateString = targetDate.toDateString();
  return logs.some(log => new Date(log.loggedAt).toDateString() === targetDateString);
}


function ActivityDots({ workoutLogs }) {
  const dayLabels = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

  return (
    <div className="activity-dots">
      {dayLabels.map((label, index) => {
        const targetDate = new Date();
        const currentDay = targetDate.getDay();
        const diff = index - currentDay;
        targetDate.setDate(targetDate.getDate() + diff);

        const logged = hasLoggedOnDate(workoutLogs, targetDate);

        return (
          <div key={index} className="day-column">
            <div className={logged ? "dot-active" : "dot-empty"}></div>
            <span className="day-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}