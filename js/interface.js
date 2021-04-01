M.AutoInit();

notes = document.getElementById('notes');

document.addEventListener('keydown', aff_note);

var notes_ang = ['Ab','A','A#','Bb','B','B#','Cb','C','C#','Db','D','D#','Eb','E','E#','Fb','F','F#','Gb','G','G#'];

function aff_note(e) {
  if (e.keyCode == 32) {
  	note = notes_ang[Math.floor(Math.random() * notes_ang.length)];
  	console.log(note);
  	notes.innerHTML = note;
  };
};