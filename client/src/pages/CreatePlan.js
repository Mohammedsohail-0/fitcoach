import "./CreatePlan.css";
import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Button from "../components/Button"
import { useNavigate } from 'react-router-dom';



function CreatePlan() {
    const [workoutPlanId, setWorkoutPlanId] = useState(null);

    return (
        <div className="create-plan">
            <div className="header">
                <button className="back-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="60px" fill="#ffffff"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" /></svg>
                </button>
                <h1>Create Plan</h1>
            </div>
            <WorkoutPlan workoutPlanId={workoutPlanId} setWorkoutPlanId={setWorkoutPlanId}></WorkoutPlan>
            <WorkoutSplit workoutPlanId={workoutPlanId}></WorkoutSplit>
        </div>
    )
}
export default CreatePlan;

export function WorkoutPlan({ workoutPlanId, setWorkoutPlanId }) {
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

export function WorkoutSplit({ workoutPlanId }) {
    const [splits, setSplits] = useState([
        { planId: workoutPlanId, day: "Sunday", isRestDay: false, name: "", muscleGroups: [] },
        { planId: workoutPlanId, day: "Monday", isRestDay: false, name: "", muscleGroups: [] },
        { planId: workoutPlanId, day: "Tuesday", isRestDay: false, name: "", muscleGroups: [] },
        { planId: workoutPlanId, day: "Wednesday", isRestDay: false, name: "", muscleGroups: [] },
        { planId: workoutPlanId, day: "Thursday", isRestDay: false, name: "", muscleGroups: [] },
        { planId: workoutPlanId, day: "Friday", isRestDay: false, name: "", muscleGroups: [] },
        { planId: workoutPlanId, day: "Saturday", isRestDay: false, name: "", muscleGroups: [] },
    ]);
    console.log(splits)

    const [selectedDay, setSelectedDay] = useState("Monday");
    const [name, setName] = useState("");
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [isRestDay, setIsRestDay] = useState(false);
    const [muscleInput, setMuscleInput] = useState("");

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const updateSplit = (day, updates) => {
        setSplits(prev =>
            prev.map(split =>
                split.day === day ? { ...split, ...updates } : split
            )
        );
    };

    useEffect(() => {
        const split = splits.find(s => s.day === selectedDay);
        setName(split?.name || "");
        setMuscleGroups(split?.muscleGroups || []);
        setIsRestDay(split?.isRestDay || false);
        setMuscleInput("");
    }, [selectedDay]);

    const handleNameChange = (e) => {
        setName(e.target.value);
        updateSplit(selectedDay, { name: e.target.value });
    };

    const handleToggleRestDay = () => {
        const updated = !isRestDay;
        setIsRestDay(updated);
        updateSplit(selectedDay, { isRestDay: updated });
    };

    const handleAddMuscleGroup = () => {
        if (!muscleInput.trim()) return;
        const updatedGroups = [...muscleGroups, muscleInput.trim()];
        setMuscleGroups(updatedGroups);
        updateSplit(selectedDay, { muscleGroups: updatedGroups });
        setMuscleInput("");
    };

    const handleRemoveMuscleGroup = (index) => {
        const updatedGroups = muscleGroups.filter((_, i) => i !== index);
        setMuscleGroups(updatedGroups);
        updateSplit(selectedDay, { muscleGroups: updatedGroups });
    };

    return (
        <div className="workout-split">
            <h2>
                <span>*</span>Plan muscles to train each day
            </h2>

            <div className="days-container">
                {days.map((day) => (
                    <span
                        key={day}
                        className={selectedDay === day ? "active" : ""}
                        onClick={() => setSelectedDay(day)}
                    >
                        {day}
                    </span>
                ))}
            </div>

            <div className="split-header">
                <h3>{selectedDay}</h3>
                <div className="rest-toggle">
                    <span className={isRestDay ? "rest-label active" : "rest-label"}>rest</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isRestDay}
                        className={isRestDay ? "toggle-switch on" : "toggle-switch"}
                        onClick={handleToggleRestDay}
                    >
                        <span className="toggle-knob" />
                    </button>
                </div>
            </div>

            {!isRestDay && (
                <>
                    <div className="name-container">
                        <label htmlFor="name">Name: </label>
                        <input
                            id="name"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="e.g. Push Day"
                        />
                    </div>

                    <div className="muscle-groups-input-container">
                        <div className="muscle-groups">
                            <ul>
                                {muscleGroups.map((group, index) => (
                                    <li key={index}>
                                        {group}
                                        <button
                                            type="button"
                                            className="remove-group"
                                            onClick={() => handleRemoveMuscleGroup(index)}
                                            aria-label={`Remove ${group}`}
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="input-container">
                            <input
                                type="text"
                                name="mgroup"
                                id="mgroup"
                                value={muscleInput}
                                onChange={(e) => setMuscleInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMuscleGroup()}
                                placeholder="enter muscle group..."
                            />
                            <Button
                                variant="utility"
                                size="sm"
                                text="Add"
                                onClick={handleAddMuscleGroup}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}