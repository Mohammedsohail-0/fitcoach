import React from "react";
import './CoachDashboard.css';
import { useState, useEffect } from "react";
import api from "../services/api";
import { formToJSON } from "axios";




function CoachDashboard() {
  const [coachName, setCoachName] = useState('');
  const [clients, setClients] = useState([]);
  
  clients.map((client)=>{
    console.log(client.goal);
  })



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

  //check total logs today
  function checkLogs(logs) {
    const today = new Date().toDateString();
    let hasLoggedToday = logs.some(log => new Date(log.loggedAt).toDateString() === today);
    return hasLoggedToday
  }
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
            <p className="count" id="l-count">{clients.filter(client => checkLogs(client.workoutLogs)).length}</p>
            <p className="c-label">Logged today</p>
          </div>
        </div>
      </div>
      {/* Clients table  */}

    <div>
      <table>
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
            clients.map((client)=>(
              <tr>
                <td>
                  <div className="client-profile-dashboard">
                    <img className="client-avatar" src="https://i.ibb.co/twxKnHfb/profileavatar.png" alt="client profile"></img>
                    {client.name}
                  </div>
                </td>
                <td>{client.goal}</td>
                <td></td>
                <td></td>
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


function ActivityDots(){
  const[isLogged, setLogged] = useState(false);
  
  return(
    <div className="activity-dots">


    </div>
  );
}