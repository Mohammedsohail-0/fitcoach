import "./CreatePlan.css";

function CreatePlan() {
    return (
        <>
        <CreatePlan>
                <div className="header">
                    <button className="back-btn">
                        <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="miter">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 6 5 12 12 18"></polyline>
                        </svg>
                    </button>
                    <h1>Create Plan</h1>
                </div>
                <div>
                    <label htmlFor="plan-title">Plan Title</label>
                    <div className="plan-title-container">
                        <input type="text" className="plan-title" name="plan-title"></input>
                    </div>
                </div>
        </CreatePlan>
            
        </>
    )
}
export default CreatePlan;