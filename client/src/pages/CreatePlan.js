import "./CreatePlan.css";
import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Button from "../components/Button"
import { useNavigate } from 'react-router-dom';


function CreatePlan() {

    return (
        <div className="create-plan">
            <div className="header">
                <button className="back-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="60px" fill="#ffffff"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" /></svg>
                </button>
                <h1>Create Plan</h1>
            </div>
            <WorkoutPlan></WorkoutPlan>
        </div>
    )
}
export default CreatePlan;

export function WorkoutPlan() {
    const [newPlan, setNewPlan] = useState({
        title: "",
        description: ""
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewPlan(prev => ({ ...prev, [name]: value }));
    };
    return (
        <div className="workout-plan">
            <div className="title-container">
                <label htmlFor="title"><span>* </span>Plan Title:</label>
                <input type="text" name="title" onChange={handleChange} placeholder="Untitled Plan..."></input>
            </div>
            <textarea
                name="description"
                onChange={handleChange}
                placeholder="description...">
            </textarea>
        </div>
    )

}