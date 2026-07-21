import './TemplateList.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function TemplateList() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/workout/plan/templates');
                setTemplates(res.data);
            } catch (err) {
                console.error(err);
                setError("Couldn't load your templates.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const dayCount = (template) =>
        template.workoutSplits.filter(s => !s.isRestDay && s.exercises.length > 0).length;

    return (
        <div className="template-list">
            <div className="template-list-header">
                <h1>Templates</h1>
                <Button
                    variant="primary"
                    size="sm"
                    text="+ New Template"
                    onClick={() => navigate('/coach/templates/create')}
                />
            </div>

            {loading && <p className="loading-text">Loading templates...</p>}
            {error && <p className="error-text">*{error}</p>}

            {!loading && !error && templates.length === 0 && (
                <p className="empty-state">
                    No templates yet — create one to reuse across clients.
                </p>
            )}

            <div className="template-grid">
                {templates.map((t) => (
                    <div
                        key={t.id}
                        className="template-card"
                        onClick={() => navigate(`/coach/templates/${t.id}/edit`)}
                    >
                        <h3>{t.title || "Untitled Plan"}</h3>
                        {t.description && <p className="template-description">{t.description}</p>}
                        <p className="template-meta">{dayCount(t)} training day{dayCount(t) === 1 ? '' : 's'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TemplateList;