import { useParams } from 'react-router-dom';
import { useState, useEffect } from "react";
import api from "../services/api";
import './ClientDetail.css';


function ClientDetail() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [workoutPlan, setWorkoutPlan] = useState(null);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const clientObj = await api.get(`/coach/clients/${id}`);
                setClient(clientObj.data);
              
            } catch {
                console.log("error");
            }
        }
        fetchClient();
    }, [])

    useEffect(()=>{
        const fetchWorkoutPlan = async ()=>{
            try{
                const workoutPlanObj = await api.get(`/workout/activePlan/${id}`)
                setWorkoutPlan(workoutPlanObj.data);
                console.log(workoutPlanObj.data.id)
            }catch{
                console.log("error")
            }
        }
        fetchWorkoutPlan();
    },[])

    if (!client) return <p>Loading...</p>;

    return (
        <>
            <ClientCard client={client} />
            <div className='notes-container'>
                <div className='notes-wraper'>
                    <p className='notes-lable'>Notes: </p>
                    <p className='notes'>{client.notes}</p>
                </div>
            </div>

            <div className='workoutPlan-container'>
                <h1>Workout Plan:</h1>
                <p></p>
            </div>
        </>
    );
}

export default ClientDetail;

export function ClientCard({ client }) {
    return (
        <div className='client-card'>

            <div className='profile-container'>
                <img src="https://i.ibb.co/twxKnHfb/profileavatar.png" alt="client profile"></img>
            </div>

            <div className='details-container' >

                <h2>{client.name}</h2>

                <div className='client-email-container'>
                    <p>{client.user.email}</p>
                </div>

                <div className='client-age-gender-wraper'>
                    <p>age: {client.age},</p>
                    <p>gender: {client.gender}</p>
                </div>


                <div className='client-bodyweight-goal-wraper'>

                    <div className='client-bodyweight-phill'>
                        <p>Body weight: {client.bodyWeight}</p>
                    </div>
                    <div className='client-goal-container'>
                        <p><span>Goal</span>: {client.goal}</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

