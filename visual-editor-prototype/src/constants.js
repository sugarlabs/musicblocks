export const BLOCK_TYPES = {
  NOTE: 'note',
  RHYTHM: 'rhythm',
  REPEAT: 'repeat',
  TEMPO: 'tempo'
};

export const BLOCK_TEMPLATES = [
  { type: BLOCK_TYPES.NOTE, label: 'Note (Pitch)', defaultData: { pitch: 'C4' } },
  { type: BLOCK_TYPES.RHYTHM, label: 'Rhythm / Duration', defaultData: { duration: '1/4' } },
  { type: BLOCK_TYPES.REPEAT, label: 'Repeat Loop', defaultData: { times: 4, children: [] }, isContainer: true },
  { type: BLOCK_TYPES.TEMPO, label: 'Set Tempo', defaultData: { bpm: 120 } }
];
