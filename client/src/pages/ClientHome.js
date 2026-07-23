import './ClientHome.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_SHORT = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Returns Sunday..Saturday Date objects for the week containing `today`
const getWeekDates = (today) => {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

function ClientHome() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState('');
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [weightInput, setWeightInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const todayName = WEEKDAY_NAMES[today.getDay()];

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, weightRes] = await Promise.all([
          api.get('/client/profile'),
          api.get('/client/bodyweight')
        ]);
        setProfile(profileRes.data);
        setWeightLogs(weightRes.data);

        try {
          const planRes = await api.get('/client/plan');
          setPlan(planRes.data);
        } catch (err) {
          if (err.response?.status === 404) {
            setPlanError('No active plan yet — check back once your coach sets one up.');
          } else {
            setPlanError("Couldn't load your plan.");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogWeight = async () => {
    const weightNum = Number(weightInput);
    if (!weightInput || isNaN(weightNum) || weightNum <= 0) return;

    setSubmitting(true);
    try {
      const res = await api.post('/client/bodyweight', { weight: weightNum });
      setWeightLogs((prev) => [res.data, ...prev]);
      setWeightInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const hasLoggedToday = weightLogs.some((log) => isSameDay(new Date(log.loggedAt), today));

  const todaySplit = plan?.workoutSplits?.find((s) => s.day?.toLowerCase() === todayName);

  const muscleGroupList = (split) => {
    if (!split) return [];
    if (split.exercises?.length) {
      return [...new Set(split.exercises.map((e) => e.muscleGroup))];
    }
    if (split.muscleGroups) return split.muscleGroups.split(',').map((m) => m.trim());
    return [];
  };

  const weekDates = getWeekDates(today);

  if (loading) {
    return <p className="loading-text">Loading...</p>;
  }

  return (
    <div className="client-home">
      <h1 className="client-greeting">Hey, {profile?.name || 'there'}</h1>

      {!hasLoggedToday ? (
        <div className="bodyweight-input-section">
          <p className="bodyweight-label">Enter Today's Body Weight</p>
          <input
            type="number"
            className="bodyweight-input"
            placeholder="kg"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <Button
            variant="primary"
            size="md"
            text={submitting ? 'Saving...' : 'Enter'}
            onClick={handleLogWeight}
            disabled={submitting || !weightInput}
          />
        </div>
      ) : (
        <div className="week-strip">
          {weekDates.map((d, i) => {
            const isToday = isSameDay(d, today);
            const logged = weightLogs.some((log) => isSameDay(new Date(log.loggedAt), d));
            return (
              <div key={i} className={`week-strip-day ${isToday ? 'active' : ''}`}>
                <span className="day-label">{WEEKDAY_SHORT[i]}</span>
                <span className="day-date">{d.getDate()}</span>
                <span className={`day-dot ${logged ? 'logged' : ''}`}></span>
              </div>
            );
          })}
        </div>
      )}

      <section className="today-workout-section">
        <h2>Today's workout</h2>

        {planError && <p className="empty-state">{planError}</p>}

        {!planError && todaySplit && (
          <div className="today-workout-card">
            <div className="today-workout-card-header">
              <span className="split-name">{todaySplit.name || 'Workout'}</span>
              <span className="split-day">
                {todayName.charAt(0).toUpperCase() + todayName.slice(1)}
              </span>
            </div>

            {todaySplit.isRestDay ? (
              <p className="rest-day-text">Rest day — recover well.</p>
            ) : (
              <div className="today-workout-card-body">
                <ul className="muscle-group-list">
                  {muscleGroupList(todaySplit).map((mg, i) => (
                    <li key={i}>{mg}</li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  text="View exercise"
                  className="view-exercise-btn"
                  onClick={() => navigate('/client/plan')}
                />
              </div>
            )}
          </div>
        )}

        {!planError && !todaySplit && (
          <p className="empty-state">Nothing scheduled for today.</p>
        )}
      </section>

      {!planError && todaySplit && !todaySplit.isRestDay && (
        <Button
          variant="primary"
          size="lg"
          text="Start Workout"
          className="start-workout-btn"
          onClick={() => navigate(`/client/log/${todaySplit.id}`)}
        />
      )}
    </div>
  );
}

export default ClientHome;