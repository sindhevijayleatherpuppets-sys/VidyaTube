import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import {
  fetchAdminStats,
  fetchAllUsers,
  deleteUser,
  fetchAllVideosAdmin,
  removeVideoAdmin,
  fetchAllReports,
  resolveReport,
} from "../services/adminService";
import { formatDate } from "../utils/format";

const TABS = ["Overview", "Users", "Videos", "Reports"];

const AdminDashboard = () => {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [statsData, usersData, videosData, reportsData] = await Promise.all([
      fetchAdminStats(),
      fetchAllUsers(),
      fetchAllVideosAdmin(),
      fetchAllReports(),
    ]);
    setStats(statsData);
    setUsers(usersData);
    setVideos(videosData);
    setReports(reportsData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user and all their videos?")) return;
    await deleteUser(id);
    setUsers(users.filter((u) => u._id !== id));
  };

  const handleRemoveVideo = async (id) => {
    if (!window.confirm("Remove this video?")) return;
    await removeVideoAdmin(id);
    setVideos(videos.filter((v) => v._id !== id));
  };

  const handleResolveReport = async (id) => {
    const updated = await resolveReport(id);
    setReports(reports.map((r) => (r._id === id ? updated : r)));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="page-loading-inline">Loading admin dashboard...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1>Admin Dashboard</h1>

      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab-btn${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalVideos}</div>
            <div className="stat-label">Total Videos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalViews}</div>
            <div className="stat-label">Total Views</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalReports}</div>
            <div className="stat-label">Open Reports</div>
          </div>
        </div>
      )}

      {tab === "Users" && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  {u.role !== "admin" && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDeleteUser(u._id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "Videos" && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Channel</th>
              <th>Views</th>
              <th>Reports</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v._id}>
                <td>{v.title}</td>
                <td>{v.channel?.fullName}</td>
                <td>{v.views}</td>
                <td>{v.reportCount}</td>
                <td>{formatDate(v.createdAt)}</td>
                <td>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleRemoveVideo(v._id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "Reports" && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Reported by</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id}>
                <td>{r.video?.title || "(deleted)"}</td>
                <td>{r.user?.fullName}</td>
                <td>{r.reason}</td>
                <td>{r.status}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td>
                  {r.status === "open" && (
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleResolveReport(r._id)}
                    >
                      Mark resolved
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
};

export default AdminDashboard;
