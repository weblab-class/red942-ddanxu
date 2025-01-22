import React, { useEffect, useState } from 'react';

function PlayLoopPersistent({ blobUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => new Audio(blobUrl));

  useEffect(() => {
    const savedIsPlaying = localStorage.getItem('isPlaying') === 'true';
    if (savedIsPlaying) {
      audio.loop = true;
      audio.play();
      setIsPlaying(true);
    }
    
    return () => {
      audio.pause(); // Clean up on unmount
    };
  }, [audio]);

  const togglePlayback = () => {
    if (isPlaying) {
      audio.pause();
      localStorage.setItem('isPlaying', 'false');
    } else {
      audio.loop = true;
      audio.play();
      localStorage.setItem('isPlaying', 'true');
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button onClick={togglePlayback}>
      {isPlaying ? 'Pause' : 'Play'} Audio in Loop
    </button>
  );
}

export default PlayLoopPersistent;