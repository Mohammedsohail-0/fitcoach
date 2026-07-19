import "./CreatePlan.css";
import { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/Button";
import { useNavigate, useParams } from 'react-router-dom';
import { WorkoutPlan, WorkoutSplit, ExerciseSection } from "./CreatePlan";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function EditPlan() {
    const navigate = useNavigate();
    const { planId } = useParams();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [newPlan, setNewPlan] = useState({ title: "", description: "" });
    const [selectedDay, setSelectedDay] = useState("Monday");
    const [splitIds, setSplitIds] = useState([]);
    const [splitDrafts, setSplitDrafts] = useState({});
    const [splits, setSplits] = useState(
        DAYS.map(day => ({ day, isRestDay: false, name: "", muscleGroups: [] }))
    );
    const [isTemplate, setIsTemplate] = useState(false);
    const [clientId, setClientId] = useState(null);

    const [showPushDialog, setShowPushDialog] = useState(false);
    const [activeClientCount, setActiveClientCount] = useState(0);
    const [isPushing, setIsPushing] = useState(false);
    const [pushResult, setPushResult] = useState(null);
    const [saveError, setSaveError] = useState("");

    // Load the existing plan once on mount and hydrate all the local state
    // CreatePlan's components expect (splits, splitIds, splitDrafts).
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`/workout/plan/${planId}`);
                const plan = res.data;

                setNewPlan({ title: plan.title || "", description: plan.description || "" });
                setIsTemplate(!!plan.isTemplate);
                setClientId(plan.clientId || null);

                const loadedSplits = DAYS.map(day => {
                    const s = plan.workoutSplits.find(sp => sp.day === day);
                    return s
                        ? {
                            day,
                            isRestDay: s.isRestDay,
                            name: s.name || "",
                            muscleGroups: (s.muscleGroups || "").split(', ').filter(Boolean)
                        }
                        : { day, isRestDay: false, name: "", muscleGroups: [] };
                });
                setSplits(loadedSplits);
                setSplitIds(plan.workoutSplits.map(s => ({ day: s.day, id: s.id })));

                const drafts = {};
                plan.workoutSplits.forEach(s => {
                    drafts[s.id] = {
                        isRestDay: s.isRestDay,
                        muscleGroups: s.muscleGroups || "",
                        exercises: s.exercises || []
                    };
                });
                setSplitDrafts(drafts);

                const firstUsableDay = loadedSplits.find(s => !s.isRestDay)?.day || loadedSplits[0].day;
                setSelectedDay(firstUsableDay);
            } catch (err) {
                console.error(err);
                setLoadError("Couldn't load this plan.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [planId]);

    // Push local day metadata (rest-day toggle, name, muscle groups) for every
    // day back to the server. Exercises themselves are saved separately by
    // ExerciseSection before this runs.
    const persistSplitMeta = async () => {
        for (const { id, day } of splitIds) {
            const local = splits.find(s => s.day === day);
            if (!local) continue;
            await api.put(`/workout/split/${id}`, {
                day: local.day,
                isRestDay: local.isRestDay,
                name: local.name,
                muscleGroups: local.muscleGroups.join(', ')
            });
        }
    };

    // Called by ExerciseSection (mode="edit") after it has already saved
    // every day's exercises.
    const handleFinish = async () => {
        setSaveError("");
        try {
            await persistSplitMeta();
            await api.put(`/workout/plan/${planId}`, {
                title: newPlan.title,
                description: newPlan.description
            });

            if (isTemplate) {
                const countRes = await api.get(`/workout/plan/${planId}/active-clones-count`);
                const count = countRes.data.count || 0;
                if (count > 0) {
                    setActiveClientCount(count);
                    setShowPushDialog(true);
                    return; // wait for the coach's choice in the dialog
                }
            }

            navigate(clientId ? `/client/${clientId}` : '/coach');
        } catch (err) {
            console.error(err);
            setSaveError("Couldn't save changes. Please try again.");
            throw err; // ExerciseSection surfaces this as its own error too
        }
    };

    const handleJustSave = () => {
        navigate('/coach');
    };

    const handlePush = async () => {
        setIsPushing(true);
        try {
            const res = await api.post(`/workout/plan/${planId}/push`);
            setPushResult(res.data);
        } catch (err) {
            console.error(err);
            setSaveError("Push failed. Please try again.");
        } finally {
            setIsPushing(false);
        }
    };

    if (loading) return <p className="loading-text">Loading plan...</p>;
    if (loadError) return <p className="error-text">*{loadError}</p>;

    return (
        <div className="create-plan">
            <div className="header">
                <button className="back-btn" onClick={() => navigate(clientId ? `/client/${clientId}` : '/coach')}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="60px" fill="#ffffff">
                        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                    </svg>
                </button>
                <h1>Edit Plan</h1>
            </div>

            <WorkoutPlan newPlan={newPlan} setNewPlan={setNewPlan} />

            <WorkoutSplit
                splits={splits}
                setSplits={setSplits}
                submitted={false}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
            />

            {saveError && <p className="error-text">*{saveError}</p>}

            <ExerciseSection
                selectedDay={selectedDay}
                splitIds={splitIds}
                splitDrafts={splitDrafts}
                setSplitDrafts={setSplitDrafts}
                planId={planId}
                clientId={clientId}
                mode="edit"
                onFinish={handleFinish}
            />

            {showPushDialog && (
                <div className="push-dialog-backdrop">
                    <div className="push-dialog">
                        {!pushResult ? (
                            <>
                                <p className="main">
                                    {activeClientCount} client{activeClientCount === 1 ? '' : 's'}{' '}
                                    {activeClientCount === 1 ? 'is' : 'are'} currently on this plan.
                                </p>
                                <p className="hint-text">
                                    Pushing will overwrite any client-specific edits made after cloning.
                                </p>
                                {isPushing ? (
                                    <p className="loading-text">Loading...</p>
                                ) : (
                                    <div className="exercise-section-actions">
                                        <Button variant="secondary" size="md" text="Just Save" onClick={handleJustSave} />
                                        <Button
                                            variant="primary"
                                            size="md"
                                            text={`Save & Push to ${activeClientCount} Clients`}
                                            onClick={handlePush}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="main">
                                    Updated {pushResult.updated} of {pushResult.total} clients.
                                </p>
                                {pushResult.failed?.length > 0 && (
                                    <ul className="push-failed-list">
                                        {pushResult.failed.map(f => (
                                            <li key={f.clientId}>{f.clientName}: {f.reason}</li>
                                        ))}
                                    </ul>
                                )}
                                <Button variant="primary" size="md" text="Done" onClick={() => navigate('/coach')} />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default EditPlan;