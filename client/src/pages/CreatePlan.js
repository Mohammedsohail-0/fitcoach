import "./CreatePlan.css";
import { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/Button";
import { useNavigate } from 'react-router-dom';

function CreatePlan() {
    const navigate = useNavigate();

    const [newPlan, setNewPlan] = useState({ title: "", description: "" });

    const [splits, setSplits] = useState([
        { day: "Sunday", isRestDay: false, name: "", muscleGroups: [] },
        { day: "Monday", isRestDay: false, name: "", muscleGroups: [] },
        { day: "Tuesday", isRestDay: false, name: "", muscleGroups: [] },
        { day: "Wednesday", isRestDay: false, name: "", muscleGroups: [] },
        { day: "Thursday", isRestDay: false, name: "", muscleGroups: [] },
        { day: "Friday", isRestDay: false, name: "", muscleGroups: [] },
        { day: "Saturday", isRestDay: false, name: "", muscleGroups: [] },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleNext = async () => {
        if (!newPlan.title.trim()) {
            setError("Plan title is required");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const planRes = await api.post('/workout/plan', {
                title: newPlan.title,
                description: newPlan.description,
                isTemplate: true
            });
            const planId = planRes.data.id;

            for (const split of splits) {
                await api.post('/workout/split', {
                    planId: planId,
                    day: split.day,
                    isRestDay: split.isRestDay,
                    name: split.name,
                    muscleGroups: split.muscleGroups.join(', ')
                });
            }

        } catch (err) {
            console.error("Server said:", err.response?.data);
            setError("Something went wrong creating the plan. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-plan">
            <div className="header">
                <button className="back-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="60px" fill="#ffffff"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" /></svg>
                </button>
                <h1>Create Plan</h1>
            </div>

            <WorkoutPlan newPlan={newPlan} setNewPlan={setNewPlan} />
            <WorkoutSplit splits={splits} setSplits={setSplits} />

            {error && <p className="error-text">{error}</p>}

            <Button
                variant="primary"
                size="md"
                text={isSubmitting ? "Creating..." : "Next"}
                disabled={isSubmitting}
                onClick={handleNext}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="60px" fill="#000000">
                        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                    </svg>
                }
            />
        </div>
    );
}
export default CreatePlan;

export function WorkoutPlan({ newPlan, setNewPlan }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewPlan(prev => ({ ...prev, [name]: value }));
    };
    return (
        <div className="workout-plan">
            <div className="title-container">
                <label htmlFor="title"><span>* </span>Plan Title:</label>
                <input type="text" name="title" value={newPlan.title} onChange={handleChange} placeholder="Untitled Plan..." />
            </div>
            <textarea
                name="description"
                value={newPlan.description}
                onChange={handleChange}
                placeholder="description...">
            </textarea>
        </div>
    );
}

export function WorkoutSplit({ splits, setSplits }) {
    const [selectedDay, setSelectedDay] = useState("Monday");
    const [name, setName] = useState("");
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [isRestDay, setIsRestDay] = useState(false);
    const [muscleInput, setMuscleInput] = useState("");

    const days = [
        { full: "Sunday", short: "S" },
        { full: "Monday", short: "M" },
        { full: "Tuesday", short: "Tu" },
        { full: "Wednesday", short: "W" },
        { full: "Thursday", short: "Th" },
        { full: "Friday", short: "F" },
        { full: "Saturday", short: "Sa" },
    ];
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
            <div className="header">
                <h2><span>*</span>Plan muscles to train each day</h2>
            </div>

            <div className="days-container">
                {days.map(({ full, short }) => (
                    <span key={full} onClick={() => setSelectedDay(full)}>
                        <span className={`day-full ${selectedDay === full ? "active" : ""}`}>{full}</span>
                        <span className={`day-short ${selectedDay === full ? "active" : ""}`}>{short}</span>
                    </span>
                ))}
            </div>
            <div className="split-wraper">

                <div className="split-header">
                    <p>{selectedDay}</p>
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
                                placeholder="e.g. Push Day, Chest Day, Leg Day..."
                            />
                        </div>

                        <div className="muscle-groups-input-container">
                            <div className="muscle-groups">
                                <ul>
                                    {muscleGroups.map((group, index) => (
                                        <li key={index}>
                                            <span className="list-items">
                                                <span className="muscle-name">{group}</span>
                                                <button
                                                    type="button"
                                                    className="remove-group"
                                                    onClick={() => handleRemoveMuscleGroup(index)}
                                                    aria-label={`Remove ${group}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="#FF4444">
                                                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                    </svg>
                                                </button>
                                            </span>
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
                                    className="add-btn"
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
        </div>
    );
}