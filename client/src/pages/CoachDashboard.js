import React from "react";
import { useState, useEffect } from "react";
import api from "../services/api";
function CoachDashboard() {
  const [coachName, setCoachName] = useState('');
  const [clients, setClients] = useState([]);
  const workoutLogs = clients.workoutLogs;



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
  useEffect(()=>{
    const fetchClients = async () =>{
      try{
        const clientsObj = await api.get('/coach/clients');
        setClients(clientsObj.data);
      }catch(error){
        console.log(error);
      }
    }
    fetchClients();
  },[])

  //check total logs today
  function checkLogs(logs){
    const today = new Date().toDateString();
    let hasLoggedToday = logs.some(log => new Date(log.loggedAt).toDateString() === today );
    return hasLoggedToday
  }
  return (
    <div className="header">
      <h1>Hi,{coachName}</h1>
      <div className="container">
        <p>Total clients</p>
        <p className="c-count">{clients.length}</p>
      </div>
      <div className="container">
        <p>Logged today</p>
        <p className="l-count">{clients.filter(client => checkLogs(client.workoutLogs)).length}</p>
      </div>
    </div>
  );
}

export default CoachDashboard;