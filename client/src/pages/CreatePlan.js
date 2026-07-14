import "./CreatePlan.css";
import { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/Button";
import { useNavigate } from 'react-router-dom';





function CreatePlan() {
    const navigate = useNavigate();

    const [newPlan, setNewPlan] = useState({ title: "", description: "" });
    const [selectedDay, setSelectedDay] = useState("Monday");
    const [splitIds, setSplitIds] = useState([]);

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
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    // Derived validation — recalculated on every render, no extra state needed
    const missingDays = splits
        .filter(split => !split.isRestDay && (!split.muscleGroups || split.muscleGroups.length === 0))
        .map(split => split.day);

    const isFormValid = newPlan.title.trim().length > 0 && missingDays.length === 0;


    const handleNext = async () => {
        setIsSubmitting(true);
        setError("");

        try {
            const planRes = await api.post('/workout/plan', {
                title: newPlan.title,
                description: newPlan.description,
                isTemplate: true
            });
            const planId = planRes.data.id;
            const createdSplitIds = [];

            for (const split of splits) {
                const splitRes = await api.post('/workout/split', {
                    planId: planId,
                    day: split.day,
                    isRestDay: split.isRestDay,
                    name: split.name,
                    muscleGroups: split.muscleGroups.join(', ')
                });

                createdSplitIds.push({ day: split.day, id: splitRes.data.id });
            }

            setSplitIds(createdSplitIds);
            setSubmitted(true);


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
                    <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="60px" fill="#ffffff">
                        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                    </svg>
                </button>
                <h1>Create Plan</h1>
            </div>

            {!submitted &&
                <WorkoutPlan newPlan={newPlan} setNewPlan={setNewPlan} />
            }

            <WorkoutSplit splits={splits} submitted={submitted} setSplits={setSplits} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />

            {!isFormValid && !submitted && (
                <p className="error-text">
                    {!newPlan.title.trim() && "Add a plan title. "}
                </p>
            )}
            {error && <p className="error-text">*{error}</p>}

            {isFormValid && !submitted && (
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
            )}

            {submitted &&
                <ExerciseSection selectedDay={selectedDay} splitIds={splitIds}></ExerciseSection>
            }
            <ExerciseCard></ExerciseCard>
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

export function WorkoutSplit({ splits, setSplits, submitted, selectedDay, setSelectedDay }) {

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
    }, [selectedDay, splits]);

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
            {!submitted &&
                <div className="header">
                    <h2><span>*</span>Plan muscles to train each day</h2>
                </div>
            }

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
                    {submitted &&
                        <div className="after-sbumission-header">

                            {splits.find((split) => split.day === selectedDay)?.name ? (
                                <>
                                    <p className="main">{splits.find((split) => split.day === selectedDay)?.name}</p>
                                    <p className="sub">({selectedDay})</p>
                                </>
                            ) : (
                                <p className="main">{selectedDay}</p>
                            )}

                        </div>
                    }
                    {!submitted &&
                        <p>{selectedDay}</p>
                    }
                    {!submitted &&
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
                    }
                </div>

                {!isRestDay && (
                    <>
                        {!submitted &&
                            <div className="name-container">
                                <label htmlFor="name">Name: </label>
                                <input
                                    id="name"
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder="e.g. Push Day, Chest Day, Leg Day..."
                                />
                            </div>
                        }

                        <div className="muscle-groups-input-container">
                            <div className="muscle-groups">
                                <ul>
                                    {muscleGroups.map((group, index) => (
                                        <li key={index}>
                                            <span className="list-items">
                                                <span className="muscle-name">{group}</span>
                                                {!submitted &&
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
                                                }
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {!submitted &&
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
                            }
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
export function ExerciseSection({ selectedDay, splitIds }) {
    const [currentSplit, setCurrentSplit] = useState(null);
    const [targetMuscle, setTargetMuscle] = useState("");


    const currentSplitId = splitIds.find(s => s.day === selectedDay)?.id;
    const muscleGroups = currentSplit?.muscleGroups
        ? currentSplit.muscleGroups.split(', ').filter(Boolean)
        : [];

    useEffect(() => {
        if (!currentSplitId) return;
        const fetchSplit = async () => {
            try {
                const splitObj = await api.get(`/workout/split/one/${currentSplitId}`);
                setCurrentSplit(splitObj.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSplit();
    }, [currentSplitId]);

    return (
        <div className="exercise-section">
            <div className="target-muscle-wraper">
                <label htmlFor="target-muscle">Target Muscle:</label>
                <select
                    name="target-muscle"
                    value={targetMuscle}
                    onChange={(e) => setTargetMuscle(e.target.value)}
                >
                    {muscleGroups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>
            <div>
                
                <Button variant="utility" text="Add Exercise" />
            </div>
        </div>
    );
}

export function ExerciseCard() {


    function SetCard({ set, onRemove, onChange }) {
        return (
            <div className="set-card">
                <input type="number" value={set.setNumber} readOnly />
                <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => onChange('weight', e.target.value)}
                />
                <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => onChange('reps', e.target.value)}
                />
                <button className="remove-set-btn" onClick={onRemove}>
                    {<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="red"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>}
                </button>
            </div>
        );
    }
    const [sets, setSets] = useState([
        { id: crypto.randomUUID(), setNumber: 1, reps: '', weight: '' }
    ]);

    const addSet = () => {
        setSets(prev => [
            ...prev,
            { id: crypto.randomUUID(), setNumber: prev.length + 1, reps: '', weight: '' }
        ]);
    };

    const removeSet = (id) => {
        setSets(prev => {
            const filtered = prev.filter(s => s.id !== id);
            // re-number remaining sets so setNumber stays sequential
            return filtered.map((s, i) => ({ ...s, setNumber: i + 1 }));
        });
    };

    const updateSet = (id, field, value) => {
        setSets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };
    return (
        <div className="exercise-card">
            <div className="exercise-card-header">
                <div className="input-wraper">
                    <label htmlFor="exercise-name">Exercise Name: </label>
                    <input name="exercise-name" placeholder="eg. Bench press"></input>
                </div>
                <div>
                    <Button className="remove-btn" variant="remove" text={"remove"} size="sm" ></Button>
                </div>
                <div>
                    {sets.map((s) => (
                        <SetCard
                            key={s.id}
                            set={s}
                            onRemove={() => removeSet(s.id)}
                            onChange={(field, value) => updateSet(s.id, field, value)}
                        />
                    ))}
                </div>
                <Button variant="utility-secondary" text={"+ Add Set"} size="sm" onClick={addSet} ></Button>

            </div>
        </div>
    )
}
