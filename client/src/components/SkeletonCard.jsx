const SkeletonCard = () => {
  return (
    <div className="video-card-container">
      <div className="video-thumb-wrap skeleton" style={{ height: "180px" }} />
      <div className="video-card-body" style={{ marginTop: "12px" }}>
        <div className="skeleton" style={{ width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="skeleton" style={{ width: "90%", height: "16px" }} />
          <div className="skeleton" style={{ width: "60%", height: "12px" }} />
          <div className="skeleton" style={{ width: "40%", height: "12px" }} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
