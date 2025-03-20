export const playSound = (file) => {
  const audio = new Audio(file);
  audio.play();
};

export const fetchNotes = async (setNotes) => {
  try {
    const response = await fetch("/notes.json");
    const data = await response.json();
    setNotes(data);
  } catch (error) {
    console.error("Error loading notes:", error);
  }
};
export const stopAllSounds = () => {
  document.querySelectorAll("audio").forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
  });
};
export const handleReset = (setIsPlaying, setCurrentStep, setSoundTrack, setTotalSteps) => {
  setIsPlaying(false);
  setCurrentStep(0);
  setSoundTrack([]);
  setTotalSteps(64);
  stopAllSounds();
};