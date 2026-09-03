import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { fetchMySubscriptions } from "../services/userService";

const Subscriptions = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchMySubscriptions();
      setChannels(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AppShell>
      <h1>Your Subscriptions</h1>

      {loading && <div className="page-loading-inline">Loading...</div>}

      {!loading && channels.length === 0 && (
        <div className="empty-state">
          You haven't subscribed to any channels yet. Visit a channel's profile page to
          subscribe.
        </div>
      )}

      <div className="channel-list">
        {channels.map((c) => (
          <Link key={c._id} to={`/profile/${c._id}`} className="channel-row">
            <span className="avatar-circle">{c.fullName?.[0]?.toUpperCase()}</span>
            <div>
              <div className="watch-channel-name">{c.fullName}</div>
              <div className="watch-channel-subs">{c.subscriberCount} subscribers</div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
};

export default Subscriptions;
