const Loader = ({
  size = "w-24 h-24",
  className = "",
  fullscreen = false,
}) => {
  const video = (
    <video
      src="/loading.webm"
      autoPlay
      loop
      muted
      playsInline
      className={`${size} object-contain ${className}`}
      aria-label="Loading"
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {video}
      </div>
    );
  }

  return video;
};

export default Loader;