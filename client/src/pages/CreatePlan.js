import "./CreatePlan.css";
import { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/Button";
import { useNavigate, useParams } from 'react-router-dom';





function CreatePlan() {
    const navigate = useNavigate();
    const { clientId } = useParams();

    const [newPlan, setNewPlan] = useState({ title: "", description: "" });
    const [selectedDay, setSelectedDay] = useState("Monday");
    const [planId, setPlanId] = useState(null);
    const [splitIds, setSplitIds] = useState([]);
    const [splitDrafts, setSplitDrafts] = useState({});

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
            setPlanId(planId);
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
                <ExerciseSection
                    selectedDay={selectedDay}
                    splitIds={splitIds}
                    splitDrafts={splitDrafts}
                    setSplitDrafts={setSplitDrafts}
                    planId={planId}
                    clientId={clientId}
                />
            }

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

export function ExerciseSection({ selectedDay, splitIds, splitDrafts, setSplitDrafts, planId, clientId, mode = "create", onFinish }) {
    const navigate = useNavigate();
    const [targetMuscle, setTargetMuscle] = useState("");
    const [savingDay, setSavingDay] = useState(null); // which day is currently POSTing
    const [savedDays, setSavedDays] = useState({});   // { [splitId]: true } once persisted
    const [finishError, setFinishError] = useState("");
    const [isFinishing, setIsFinishing] = useState(false);
    const currentSplitId = splitIds.find(s => s.day === selectedDay)?.id;
    const currentSplit = currentSplitId ? splitDrafts[currentSplitId] : null;

    const muscleGroups = currentSplit?.muscleGroups
        ? currentSplit.muscleGroups.split(', ').filter(Boolean)
        : [];

    // Seed one blank exercise per muscle group that doesn't have any yet.
    // Runs whenever a split is first fetched — keeps the coach from staring
    // at an empty "Target Muscle" screen with nothing to fill in.
    const seedDefaultExercises = (data) => {
        if (data.isRestDay) return data;
        const groups = (data.muscleGroups || '').split(', ').filter(Boolean);
        const existingGroups = new Set((data.exercises || []).map(e => e.muscleGroup));
        const defaults = groups
            .filter(g => !existingGroups.has(g))
            .map(g => ({
                id: crypto.randomUUID(),
                name: '',
                muscleGroup: g,
                order: 0,
                sets: [{ id: crypto.randomUUID(), setNumber: 1, reps: '', weight: '' }],
            }));
        return { ...data, exercises: [...(data.exercises || []), ...defaults] };
    };

    // Fetch every day's split up front (not just the one currently shown).
    // Needed so "Finish Plan" can validate ALL days, not only the one
    // the coach has actually clicked into.
    useEffect(() => {
        const toFetch = splitIds.filter(({ id }) => !splitDrafts[id]);
        if (!toFetch.length) return;

        toFetch.forEach(async ({ id }) => {
            try {
                const res = await api.get(`/workout/split/one/${id}`);
                const raw = { ...res.data, exercises: res.data.exercises || [] };
                const seeded = seedDefaultExercises(raw);
                setSplitDrafts(prev => (prev[id] ? prev : { ...prev, [id]: seeded }));
            } catch (err) {
                console.error(err);
            }
        });
    }, [splitIds.map(s => s.id).join(',')]);

    useEffect(() => {
        if (muscleGroups.length && !muscleGroups.includes(targetMuscle)) {
            setTargetMuscle(muscleGroups[0]);
        }
    }, [muscleGroups.join(','), currentSplitId]); // reset selection sanity when day changes too

    // generic helper: update this split's draft. Any edit invalidates the
    // "Saved" checkmark for this day, since the server no longer matches
    // what's on screen until the coach saves again.
    const updateSplit = (updater) => {
        setSplitDrafts(prev => ({
            ...prev,
            [currentSplitId]: updater(prev[currentSplitId]),
        }));
        setSavedDays(prev => {
            if (!prev[currentSplitId]) return prev;
            const next = { ...prev };
            delete next[currentSplitId];
            return next;
        });
    };

    const exercisesForTarget = (currentSplit?.exercises || [])
        .filter(e => e.muscleGroup === targetMuscle);

    const addExercise = () => {
        if (!targetMuscle) return;
        const newExercise = {
            id: crypto.randomUUID(),
            name: '',
            muscleGroup: targetMuscle,
            order: exercisesForTarget.length,
            sets: [{ id: crypto.randomUUID(), setNumber: 1, reps: '', weight: '' }],
        };
        updateSplit(split => ({
            ...split,
            exercises: [...(split.exercises || []), newExercise],
        }));
    };

    const removeExercise = (exerciseId) => {
        updateSplit(split => ({
            ...split,
            exercises: split.exercises.filter(e => e.id !== exerciseId),
        }));
    };

    const updateExercise = (exerciseId, exerciseUpdater) => {
        updateSplit(split => ({
            ...split,
            exercises: split.exercises.map(e =>
                e.id === exerciseId ? exerciseUpdater(e) : e
            ),
        }));
    };

    // Push this day's exercises (with sets) to the server. Called per-day
    // (so a coach can bounce between days without losing saved work) and
    // again for every day when "Finish Plan" is pressed, to make sure the
    // draft actually matches what's on the server before leaving the page.
    const saveSplitExercises = async (splitId, exercises) => {
        const payload = (exercises || []).map((ex, i) => ({
            id: ex.id, // locally-generated ids for new exercises just won't match anything server-side — backend treats those as creates
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            order: i,
            sets: (ex.sets || []).map((s, j) => ({
                setNumber: j + 1,
                reps: s.reps,
                weight: s.weight
            }))
        }));

        const res = await api.post(`/workout/split/${splitId}/exercises`, { exercises: payload });
        return res.data;
    };

    const handleSaveDay = async () => {
        if (!currentSplitId) return;
        setSavingDay(currentSplitId);
        setFinishError("");
        try {
            await saveSplitExercises(currentSplitId, currentSplit.exercises);
            setSavedDays(prev => ({ ...prev, [currentSplitId]: true }));
        } catch (err) {
            console.error("Server said:", err.response?.data);
            setFinishError(err.response?.data?.error || "Couldn't save this day. Please try again.");
        } finally {
            setSavingDay(null);
        }
    };

    const handleFinishPlan = async () => {
        setIsFinishing(true);
        setFinishError("");
        try {
            // save every day that has a loaded draft, not just the one on screen
            for (const { id } of splitIds) {
                const draft = splitDrafts[id];
                if (!draft) continue; // day was never opened, nothing to save
                await saveSplitExercises(id, draft.exercises);
            }

            if (mode === "edit") {
                if (onFinish) await onFinish();
            } else {
                if (planId && clientId) {
                    await api.post(`/workout/plan/${planId}/assign`, { clientId });
                }
                navigate(clientId ? `/client/${clientId}` : '/coach');
            }
        } catch (err) {
            console.error("Server said:", err.response?.data);
            setFinishError(err.response?.data?.error || "Couldn't save the plan. Please try again.");
        } finally {
            setIsFinishing(false);
        }
    };

    // A muscle group only "counts" once it has an exercise with a real name —
    // the auto-seeded blank one doesn't satisfy this, so the button can't be
    // gamed by just leaving the default exercise untouched.
    const hasNamedExercise = (draft, group) =>
        (draft?.exercises || []).some(e => e.muscleGroup === group && e.name?.trim());

    const currentDayIncomplete = muscleGroups.some(g => !hasNamedExercise(currentSplit, g));

    const allDraftsLoaded = splitIds.every(({ id }) => splitDrafts[id]);
    const planIncomplete = !allDraftsLoaded || splitIds.some(({ id }) => {
        const draft = splitDrafts[id];
        if (!draft || draft.isRestDay) return false; // rest days are exempt
        const groups = (draft.muscleGroups || '').split(', ').filter(Boolean);
        return groups.some(g => !hasNamedExercise(draft, g));
    });

    if (!currentSplit) return <p className="loading-text">Loading day...</p>;

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

            {exercisesForTarget.map((exercise) => (
                <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onRemove={() => removeExercise(exercise.id)}
                    onUpdate={(updater) => updateExercise(exercise.id, updater)}
                />
            ))}

            <Button variant="utility" text="+ Add Exercise" onClick={addExercise} />

            {finishError && <p className="error-text">*{finishError}</p>}
            {currentDayIncomplete && (
                <p className="hint-text">Add at least one named exercise per muscle group to save this day.</p>
            )}
            {!currentDayIncomplete && planIncomplete && (
                <p className="hint-text">Finish every non-rest day before finishing the plan.</p>
            )}

            <div className="exercise-section-actions">
                <Button
                    variant="secondary"
                    size="md"
                    text={
                        savingDay === currentSplitId
                            ? "Saving..."
                            : savedDays[currentSplitId]
                                ? "Saved ✓"
                                : "Save this day"
                    }
                    disabled={savingDay === currentSplitId || currentDayIncomplete}
                    onClick={handleSaveDay}
                />
                <Button
                    variant="primary"
                    size="md"
                    text={isFinishing ? "Saving..." : mode === "edit" ? "Save Plan" : "Finish Plan"}
                    disabled={isFinishing || planIncomplete}
                    onClick={handleFinishPlan}
                />
            </div>
        </div>
    );
}


function SetCard({ set, onRemove, onChange }) {
    return (
        <div className="set-card">
            <div className="label-wraper">
                <label htmlFor="set-number">SET</label>
                <label htmlFor="weight">KG</label>
                <label htmlFor="reps">REPS</label>
            </div>
            <div className="set-card-wraper">
                <div className="set-card-input-wraper">
                    <input type="number" name="set-number" value={set.setNumber} readOnly />
                </div>
                <div className="set-card-input-wraper">
                    <input
                        name="weight"
                        type="number"
                        value={set.weight}
                        onChange={(e) => onChange('weight', e.target.value)}
                    />
                </div>
                <div className="set-card-input-wraper">
                    <input
                        name="reps"
                        type="number"
                        value={set.reps}
                        onChange={(e) => onChange('reps', e.target.value)}
                    />
                </div>
                <button className="remove-set-btn" onClick={onRemove}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="red">
                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export function ExerciseCard({ exercise, onRemove, onUpdate }) {
    const addSet = () => {
        onUpdate(prev => ({
            ...prev,
            sets: [
                ...prev.sets,
                { id: crypto.randomUUID(), setNumber: prev.sets.length + 1, reps: '', weight: '' }
            ],
        }));
    };

    const removeSet = (setId) => {
        onUpdate(prev => {
            const filtered = prev.sets.filter(s => s.id !== setId);
            return { ...prev, sets: filtered.map((s, i) => ({ ...s, setNumber: i + 1 })) };
        });
    };

    const updateSet = (setId, field, value) => {
        onUpdate(prev => ({
            ...prev,
            sets: prev.sets.map(s => s.id === setId ? { ...s, [field]: value } : s),
        }));
    };

    const updateName = (value) => {
        onUpdate(prev => ({ ...prev, name: value }));
    };

    return (
        <div className="exercise-card">
            <div className="exercise-card-header">
                <div className="exercise-name-input-wraper">
                    <label htmlFor="exercise-name">Exercise Name :</label>
                    <input
                        required
                        name="exercise-name"
                        placeholder="eg. Bench press"
                        value={exercise.name}
                        onChange={(e) => updateName(e.target.value)}
                        
                    />
                </div>
                <div>
                    <button className="remove-exercise-btn" onClick={onRemove}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#FF4444">
                            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="set-card-container">
                {exercise.sets.map((s) => (
                    <SetCard
                        key={s.id}
                        set={s}
                        onRemove={() => removeSet(s.id)}
                        onChange={(field, value) => updateSet(s.id, field, value)}
                    />
                ))}
            </div>
            <Button variant="utility-secondary" className="add-set-btn" text="+ Add Set" size="sm" onClick={addSet} />
        </div>
    );
}