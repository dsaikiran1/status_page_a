// src/components/RedirectToDefaultStatus.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';

const RedirectToDefaultStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDefaultOrg = async () => {
      try {
        const res = await axios.get('/organizations/default');
        const orgId = res.data._id;
        navigate(`/status/${orgId}`, { replace: true });
      } catch (err) {
        console.error(err);
        navigate('/404', { replace: true }); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultOrg();
  }, [navigate]);

  return loading ? <div>Loading...</div> : null;
};

export default RedirectToDefaultStatus;
