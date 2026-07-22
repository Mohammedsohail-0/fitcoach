import { useParams } from 'react-router-dom';
import { useState, useEffect } from "react";
import api from "../services/api";
import './ClientDetail.css';
import Button from "../components/Button"
import {  useNavigate } from 'react-router-dom';

function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [workoutSplit, setWorkoutSplit] = useState([]);
    const [showPlanSelection, setShowPlanSelection] = useState(false);

    const [showEditClient, setShowEditClient] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', goal: '', notes: '' });
    const [isSavingClient, setIsSavingClient] = useState(false);
    const [clientError, setClientError] = useState('');

    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);


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
    }, [id])

    useEffect(() => {
        const fetchWorkoutPlan = async () => {
            try {
                const workoutPlanObj = await api.get(`/workout/activePlan/${id}`)
                setWorkoutPlan(workoutPlanObj.data);
            } catch {
                console.log("error")
            }
        }
        fetchWorkoutPlan();
    }, [id])

    useEffect(() => {
        if (!workoutPlan) return;
        const fetchWorkoutSplit = async () => {
            try {
                const workoutSplitObj = await api.get(`/workout/split/${workoutPlan?.id}`)
                setWorkoutSplit(workoutSplitObj.data);

            } catch {
                console.log("workout split not found")
            }
        }
        fetchWorkoutSplit();
    }, [workoutPlan])


    if (!client) return <p>Loading...</p>;
    function checkData(data) {
        if (!data) {
            return "Nothing Found"
        } else {
            return data
        }
    }

    const openEditClient = () => {
        setEditForm({ name: client.name || '', goal: client.goal || '', notes: client.notes || '' });
        setClientError('');
        setShowEditClient(true);
    };

    const handleSaveClient = async () => {
        setIsSavingClient(true);
        setClientError('');
        try {
            const res = await api.put(`/coach/clients/${id}`, editForm);
            setClient(prev => ({ ...prev, ...res.data }));
            setShowEditClient(false);
        } catch (err) {
            console.error(err);
            setClientError("Couldn't save changes. Please try again.");
        } finally {
            setIsSavingClient(false);
        }
    };

    const handleDeactivateClient = async () => {
        setIsDeactivating(true);
        try {
            await api.delete(`/coach/clients/${id}`);
            navigate('/coach');
        } catch (err) {
            console.error(err);
            setIsDeactivating(false);
        }
    };
    

    return (
        <>
            <ClientCard
                client={client}
                onEdit={openEditClient}
                onDeactivate={() => setShowDeactivateConfirm(true)}
            />
            <div className='notes-container'>
                <div className='notes-wraper'>
                    <p className='notes-lable'>Notes: </p>
                    <p className='notes'>{client.notes}</p>
                </div>
            </div>
            <div className='btns-container1'>
               <Button variant='utility-primary-primary' onClick={() => setShowPlanSelection(true)} size='sm' text={"Assign Plan"} className='assign-plan-btn'></Button>
                <Button
                    variant='utility-primary'
                    size='sm'
                    text={"Edit Plan"}
                    className='edit-plan-btn'
                    disabled={!workoutPlan}
                    onClick={() => workoutPlan && navigate(`/client/${id}/plan/${workoutPlan.id}/edit`)}
                ></Button>
            </div>

            <div className='workoutPlan-container'>
                <div className='workoutPlan-header'>
                    <p className='workoutPlan-lable'>Workout Plan:</p>
                    <p className='workoutPlan'>{checkData(workoutPlan?.title)}</p>
                </div>
                <div className='btns-container2'>
                    <Button variant='utility-primary-primary' onClick={() => setShowPlanSelection(true)} size='sm' text={"Assign Plan"} className='assign-plan-btn'></Button>
                    <Button
                        variant='utility-primary-primary'
                        size='sm'
                        text={"Edit Plan"}
                        className='edit-plan-btn'
                        disabled={!workoutPlan}
                        onClick={() => workoutPlan && navigate(`/client/${id}/plan/${workoutPlan.id}/edit`)}
                    ></Button>
                </div>
            </div>

            <WorkoutSplitTable workoutSplit={workoutSplit} workoutPlan={workoutPlan}></WorkoutSplitTable>
            {showPlanSelection && (
                <PlanSelection clientId={id} onClose={() => setShowPlanSelection(false)} />
            )}
            {showEditClient && (
                <div className="client-dialog-backdrop" onClick={() => setShowEditClient(false)}>
                    <div className="client-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Client</h3>
                        <label>Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <label>Goal</label>
                        <input
                            type="text"
                            value={editForm.goal}
                            onChange={(e) => setEditForm(prev => ({ ...prev, goal: e.target.value }))}
                        />
                        <label>Notes</label>
                        <textarea
                            rows={3}
                            value={editForm.notes}
                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                        {clientError && <p className="error-text">*{clientError}</p>}
                        <div className="client-dialog-actions">
                            <Button variant="secondary" size="sm" text="Cancel" onClick={() => setShowEditClient(false)} />
                            <Button
                                variant="primary"
                                size="sm"
                                text={isSavingClient ? "Saving..." : "Save"}
                                disabled={isSavingClient}
                                onClick={handleSaveClient}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showDeactivateConfirm && (
                <div className="client-dialog-backdrop" onClick={() => !isDeactivating && setShowDeactivateConfirm(false)}>
                    <div className="client-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>Deactivate {client.name}?</h3>
                        <p className="hint-text">
                            This hides them from your client list. Their plans and logged history are kept, not deleted.
                        </p>
                        <div className="client-dialog-actions">
                            <Button
                                variant="secondary"
                                size="sm"
                                text="Cancel"
                                disabled={isDeactivating}
                                onClick={() => setShowDeactivateConfirm(false)}
                            />
                            <Button
                                variant="primary"
                                size="sm"
                                text={isDeactivating ? "Deactivating..." : "Deactivate"}
                                disabled={isDeactivating}
                                onClick={handleDeactivateClient}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ClientDetail;

export function ClientCard({ client, onEdit, onDeactivate }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className='client-card'>

            <div className='profile-container'>
                <img src="https://i.ibb.co/twxKnHfb/profileavatar.png" alt="client profile"></img>
            </div>

            <div className='details-container' >

                <div className="client-name-row">
                    <h2>{client.name}</h2>

                    <div className="client-card-menu">
                        <button
                            className="client-card-menu-trigger"
                            aria-label="Client options"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen(prev => !prev)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <>
                                <div className="client-card-menu-backdrop" onClick={() => setMenuOpen(false)} />
                                <div className="client-card-menu-dropdown">
                                    <button onClick={() => { setMenuOpen(false); onEdit(); }}>Edit Client</button>
                                    <button className="danger" onClick={() => { setMenuOpen(false); onDeactivate(); }}>Deactivate Client</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

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

export function WorkoutSplitTable({ workoutPlan, workoutSplit }) {
    const [viewingSplit, setViewingSplit] = useState(null);

    return (
        <div className='workoutSplit-container'>



            <table className='workoutSplit-table'>
                <thead>
                    <tr>
                        <th>DAY</th>
                        <th>MUSCLE GROUP</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        workoutSplit.map((split) => (
                            <tr key={split.id}>
                                <td className="day-cell">
                                    {split.day}
                                </td>
                                <td>
                                    {split.isRestDay ? (
                                        <span className="rest-text">rest</span>
                                    ) : (
                                        <span className="muscle-group-cell">{split.muscleGroups}</span>
                                    )}
                                </td>
                                <td className="view-exercise-btn-cell">
                                    {split.isRestDay ? (
                                        <span className="rest-dash">--</span>
                                    ) : (
                                        <Button
                                            text={"View exercise"}
                                            variant='secondary'
                                            size='sm'
                                            className="view-exercise-btn"
                                            onClick={() => setViewingSplit(split)}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))
                    }

                </tbody>
            </table>

            {viewingSplit && (
                <div className="view-exercise-backdrop" onClick={() => setViewingSplit(null)}>
                    <div className="view-exercise-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>{viewingSplit.day} — {viewingSplit.muscleGroups}</h3>

                        {(!viewingSplit.exercises || viewingSplit.exercises.length === 0) ? (
                            <p className="empty-state">No exercises added for this day yet.</p>
                        ) : (
                            <div className="view-exercise-list">
                                {viewingSplit.exercises.map((ex) => (
                                    <div key={ex.id} className="view-exercise-item">
                                        <p className="view-exercise-name">{ex.name}</p>
                                        <div className="view-exercise-sets">
                                            {(ex.sets || []).map((s, i) => (
                                                <span key={s.id || i} className="view-set-pill">
                                                    {s.weight ? `${s.weight}kg` : "BW"} × {s.reps}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button variant="primary" size="sm" text="Close" onClick={() => setViewingSplit(null)} />
                    </div>
                </div>
            )}
        </div>
    );
}
function PlanSelection({clientId, onClose }) {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const templatesObj = await api.get('/workout/plan/templates');
                setTemplates(templatesObj.data);
            } catch {
                console.log("failed to fetch workout templates");
            }
        };
        fetchTemplates();
    }, []);
    if(!templates){
        return<div>loading...</div>
    }
    async function assignPlan(templateId){
         try {
        await api.post(`/workout/plan/${templateId}/assign`, { clientId });
        onClose();
        window.location.reload()
    } catch (error) {
        console.error('Failed to assign plan', error);
    }
    }
    return (
        <div className='selection-overlay' onClick={onClose}>
            <div className='selection-container' onClick={(e) => e.stopPropagation()}>
                <div className='selection-header'>
                    <h2>Select a Plan to assign</h2>
                    <button className='close-btn' onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className='templates-container'>
                    {templates.map((template) => (
                        <div key={template.id} className={`template-row ${selectedTemplate === template.id ? 'selected' : ''}`}>
                            <input
                                type='radio'
                                id={template.id}
                                name='template-selection'
                                value={template.id}
                                checked={selectedTemplate === template.id}
                                onChange={() => setSelectedTemplate(template.id)}
                            />
                            <label htmlFor={template.id}>{template.title}</label>

                            {selectedTemplate === template.id && (
                                <button className='confirmation-btn' onClick={() => assignPlan(template.id)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="or-divider">
                    <hr />
                    <h2>OR</h2>
                    <hr />
                </div>
                <Button className='create-plan-btn' variant='utility-secondary' size='sm' text={"Create new plan"} onClick={()=>navigate(`/client/${clientId}/plan/create`)} />
            </div>
        </div>
    );
}