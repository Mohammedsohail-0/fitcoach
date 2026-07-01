import { useParams } from 'react-router-dom';
import { useState, useEffect } from "react";
import api from "../services/api";
import './ClientDetail.css';


function ClientDetail() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
   
    useEffect(()=>{
        const fetchClient = async ()=>{
            try{
                const clientObj = await api.get(`/coach/clients/${id}`);
                setClient(clientObj.data);
            }catch{
                console.log("error");
            }
        }
        fetchClient();
    }, [])


    if (!client) return <p>Loading...</p>;
     console.log(client.name, client.age, client.gender, client.bodyweight, client.goal);
    return(
        <>
        <ClientCard client = {client}/>
        </>
    );
}

export default ClientDetail;

function ClientCard({client}){
    return(
        <div className='client-card'>
            <div>
                <img src="https://i.ibb.co/twxKnHfb/profileavatar.png" alt="client profile"></img>
            </div>
            <div>
                <h2>{client.name}</h2>
                <p>{client.user.email}</p>
                <p>{client.age}</p>
                <p>{client.gender}</p>
                <p>{client.bodyweight}</p>
                <p>{client.goal}</p>
            </div>
        </div>
    );
}