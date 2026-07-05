import { useParams } from 'react-router-dom';
import { useState, useEffect } from "react";
import api from "../services/api";
import './ClientDetail.css';
import Button from "../components/Button"


function ClientDetail() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [workoutSplit, setWorkoutSplit] = useState([]);
    const [showPlanSelection, setShowPlanSelection] = useState(false);


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


    return (
        <>
            <ClientCard client={client} />
            <div className='notes-container'>
                <div className='notes-wraper'>
                    <p className='notes-lable'>Notes: </p>
                    <p className='notes'>{client.notes}</p>
                </div>
            </div>
            <div className='btns-container1'>
                <Button variant='utility' size='sm' text={"Assign Plan"} className='assign-plan-btn'></Button>
                <Button variant='utility' size='sm' text={"Edit Plan"} className='edit-plan-btn'></Button>
            </div>

            <div className='workoutPlan-container'>
                <div className='workoutPlan-header'>
                    <p className='workoutPlan-lable'>Workout Plan:</p>
                    <p className='workoutPlan'>{checkData(workoutPlan?.title)}</p>
                </div>
                <div className='btns-container2'>
                    <Button variant='utility' onClick={() => setShowPlanSelection(true)} size='sm' text={"Assign Plan"} className='assign-plan-btn'></Button>
                    <Button variant='utility' size='sm' text={"Edit Plan"} className='edit-plan-btn'></Button>
                </div>
            </div>

            <WorkoutSplitTable workoutSplit={workoutSplit} workoutPlan={workoutPlan}></WorkoutSplitTable>
            {showPlanSelection && (
                <PlanSelection clientId={id} onClose={() => setShowPlanSelection(false)} />
            )}
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

export function WorkoutSplitTable({ workoutPlan, workoutSplit }) {

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
                                        <Button text={"View exercise"} variant='secondary' size='sm' className="view-exercise-btn">View exercise</Button>
                                    )}
                                </td>
                            </tr>
                        ))
                    }

                </tbody>
            </table>
        </div>
    );
}
function PlanSelection({clientId, onClose }) {
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
                <Button className='create-plan-btn' variant='utility-secondary' size='sm' text={"Create new plan"} />
            </div>
        </div>
    );
}