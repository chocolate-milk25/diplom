export const handleExport = (soundTrack, bpm, totalSteps) => {
    const data = {  bpm, totalSteps, soundTrack }
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "sequencer-track.json";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
};
export const handleImport = (setTotalSteps, setBpm, setSoundTrack) => (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = JSON.parse(e.target.result);
            
            if (content.soundTrack && Array.isArray(content.soundTrack)) {
                setSoundTrack(content.soundTrack);
                if (content.bpm) setBpm(content.bpm);
                if (content.totalSteps) setTotalSteps(content.totalSteps);
            } else {
                alert("Invalid file format.");
            }
        } catch (error) {
            console.error("Error parsing the file:", error);
            alert("Error reading the file.");
        }
    };
    
    reader.readAsText(file);
};


