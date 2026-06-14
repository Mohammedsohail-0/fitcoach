import React from "react";
import { useState, useEffect } from "react";
import api from "../services/api";
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
  return (
    <div>
      <h1>Hi,{coachName}</h1>
      <div>
        <h1>Total clients</h1>
        <p>{clients.length}</p>
      </div>
    </div>
  );
}

export default CoachDashboard;