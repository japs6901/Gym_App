export const PROGRAM = {
  name: '26-Week Gym Programme',
  warmup: [
    { id: 'shoulders', label: 'Shoulders: Arm Circles, Wall Slides' },
    { id: 'hips', label: 'Hips: Hip Circles, Squat to Bench, 90/90 Switches, Hip Hinges' }
  ],
  cooldown: [
    { id: 'chest', label: 'Doorway chest stretch — 30 secs × 2' },
    { id: 'hipFlexor', label: 'Half-kneeling hip-flexor stretch — 30 secs each side × 2' },
    { id: 'balance', label: 'Single-leg balance — 20–30 secs each leg × 2' }
  ],
  routines: {
    A: {
      name: 'Routine A', regularDay: 'Mon',
      exercises: [
        {
          id: 'goblet_squat', name: 'Dumbbell Goblet Squat', shortName: 'Goblet Squat', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 12, startWeight: 8, restMin: 90, restMax: 120,
          image: 'assets/exercises/goblet_squat.png', muscles: 'Quads, glutes, core', availableFromWeek: 1,
          weightNote: 'Starting load is a trial load; reduce it if form breaks.',
          instructions: [
            'Hold one dumbbell vertically at chest height with both hands.',
            'Stand about shoulder-width apart and brace your trunk.',
            'Sit down and slightly back, keeping your knees tracking over your toes.',
            'Descend only as far as you can control, then drive through the whole foot to stand.'
          ],
          cues: ['Chest tall', 'Knees follow toes', 'Controlled lowering', 'No forced depth']
        },
        {
          id: 'neutral_db_press', name: 'Seated Neutral-Grip Dumbbell Overhead Press', shortName: 'DB Overhead Press', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 12, startWeight: 4, restMin: 90, restMax: 120,
          image: 'assets/exercises/neutral_db_press.png', muscles: 'Shoulders, triceps', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Sit with your back supported and a dumbbell in each hand.',
            'Keep palms facing each other and elbows slightly in front of your body.',
            'Press upward without shrugging or excessively arching your lower back.',
            'Lower under control until the dumbbells return beside your shoulders.'
          ],
          cues: ['Ribs down', 'Neutral grip', 'Do not shrug', 'Smooth range']
        },
        {
          id: 'db_bench_press', name: 'Dumbbell Bench Press', shortName: 'DB Bench Press', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 12, startWeight: 6, restMin: 90, restMax: 120,
          image: 'assets/exercises/db_bench_press.png', muscles: 'Chest, triceps, front delts', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Lie on a flat bench with feet planted firmly.',
            'Hold the dumbbells over your chest with wrists stacked over elbows.',
            'Lower the dumbbells under control until your upper arms are comfortably below the torso line.',
            'Press back up without bouncing or letting your shoulders roll forward.'
          ],
          cues: ['Feet planted', 'Shoulder blades stable', 'Wrists straight', 'Control the lowering']
        },
        {
          id: 'hammer_curl', name: 'Dumbbell Bicep Hammer Curls', shortName: 'Hammer Curls', category: 'isolation', metric: 'reps',
          minTarget: 10, maxTarget: 15, startWeight: 4, restMin: 60, restMax: 90,
          image: 'assets/exercises/hammer_curl.png', muscles: 'Biceps, brachialis', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Stand tall with dumbbells at your sides and palms facing inward.',
            'Keep elbows close to your ribs while curling the dumbbells upward.',
            'Pause briefly near the top without swinging your torso.',
            'Lower slowly until the arms are straight again.'
          ],
          cues: ['Elbows stay close', 'No swinging', 'Neutral wrists', 'Slow lowering']
        },
        {
          id: 'forearm_plank', name: 'Forearm Plank Hold', shortName: 'Forearm Plank', category: 'core', metric: 'seconds',
          minTarget: 15, maxTarget: 30, startWeight: null, restMin: 60, restMax: 60,
          image: 'assets/exercises/forearm_plank.png', muscles: 'Core, shoulders, glutes', availableFromWeek: 1,
          weightNote: null,
          instructions: [
            'Place forearms on the floor with elbows under shoulders.',
            'Extend both legs and make a straight line from head to heels.',
            'Brace your abdomen and lightly squeeze your glutes.',
            'Stop the set when you can no longer hold a neutral position.'
          ],
          cues: ['Do not let hips sag', 'Breathe normally', "Brace, don't hold your breath"]
        }
      ]
    },
    B: {
      name: 'Routine B', regularDay: 'Wed',
      exercises: [
        {
          id: 'db_rdl', name: 'Dumbbell Romanian Deadlift', shortName: 'DB Romanian Deadlift', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 12, startWeight: 6, restMin: 90, restMax: 120,
          image: 'assets/exercises/db_rdl.png', muscles: 'Hamstrings, glutes, back/core', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Stand tall with dumbbells in front of your thighs.',
            'Soften the knees, brace your trunk, then push your hips backward.',
            'Keep the dumbbells close to your legs while your torso tips forward.',
            'Stop when you feel a strong hamstring stretch without rounding, then drive the hips forward to stand.'
          ],
          cues: ['Hips back', 'Long spine', 'Weights stay close', 'Do not chase floor depth']
        },
        {
          id: 'chest_supported_row', name: 'Chest-Supported Dumbbell Row', shortName: 'Chest-Supported Row', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 12, startWeight: 6, restMin: 90, restMax: 120,
          image: 'assets/exercises/chest_supported_row.png', muscles: 'Upper back, lats, biceps', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Set an incline bench and lie chest-down with a dumbbell in each hand.',
            'Let the arms hang naturally, then pull the elbows back toward your hips.',
            'Pause briefly without lifting your chest from the bench.',
            'Lower the dumbbells slowly to a full comfortable reach.'
          ],
          cues: ['Chest stays supported', 'Pull elbows back', 'No shrugging', 'Slow return']
        },
        {
          id: 'light_goblet_squat', name: 'Light Goblet Squat', shortName: 'Light Goblet Squat', category: 'main', metric: 'reps',
          minTarget: 10, maxTarget: 12, startWeight: null, restMin: 90, restMax: 120,
          image: 'assets/exercises/goblet_squat.png', muscles: 'Quads, glutes, core', availableFromWeek: 9,
          weightNote: 'From Week 9. Aim for about 60–70% of Routine A load.',
          instructions: [
            'Use the same controlled goblet squat technique as Routine A.',
            "Keep this deliberately lighter than Routine A's main squat.",
            "Use roughly 60–70% of the main goblet squat working load."
          ],
          cues: ['Technique practice', 'Deliberately light', 'Smooth reps']
        },
        {
          id: 'lateral_raise', name: 'Dumbbell Lateral Raise', shortName: 'Lateral Raise', category: 'isolation', metric: 'reps',
          minTarget: 10, maxTarget: 15, startWeight: 2, restMin: 60, restMax: 90,
          image: 'assets/exercises/lateral_raise.png', muscles: 'Side deltoids', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Stand tall with light dumbbells at your sides.',
            'With elbows softly bent, raise the arms out to the sides.',
            'Stop around shoulder height or earlier if the shoulders feel pinched.',
            'Lower slowly without swinging.'
          ],
          cues: ['Use light weight', 'Lead with elbows', 'No shrugging', 'No swinging']
        },
        {
          id: 'incline_curl', name: 'Incline Dumbbell Curl', shortName: 'Incline DB Curl', category: 'isolation', metric: 'reps',
          minTarget: 10, maxTarget: 15, startWeight: 3, restMin: 60, restMax: 90,
          image: 'assets/exercises/incline_curl.png', muscles: 'Biceps', availableFromWeek: 1,
          weightNote: 'Start around 3–4 kg per dumbbell if comfortable.',
          instructions: [
            'Sit back on an incline bench with arms hanging naturally.',
            'Keep the upper arms still while curling the dumbbells upward.',
            'Stop before the shoulders roll forward.',
            'Lower fully and slowly.'
          ],
          cues: ['Upper arm stays still', 'No shoulder swing', 'Full controlled lowering']
        },
        {
          id: 'pallof_press', name: 'Pallof Press', shortName: 'Pallof Press', category: 'core', metric: 'reps',
          minTarget: 10, maxTarget: 12, startWeight: 5, restMin: 60, restMax: 90,
          image: 'assets/exercises/pallof_press.png', muscles: 'Core — anti-rotation', availableFromWeek: 1,
          weightNote: 'Machine stacks vary; use a repeatable light load.',
          instructions: [
            'Stand side-on to a cable or band anchor and hold the handle at your chest.',
            'Brace your trunk and press the handle straight forward.',
            'Resist being pulled or rotated toward the anchor.',
            'Return the handle to your chest under control. Complete both sides.'
          ],
          cues: ['Stay square', 'Brace first', 'Do not rotate', 'Slow return']
        }
      ]
    },
    C: {
      name: 'Routine C', regularDay: 'Fri',
      exercises: [
        {
          id: 'step_ups', name: 'Step-Ups', shortName: 'Step-Ups', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 10, startWeight: null, restMin: 90, restMax: 120,
          image: 'assets/exercises/step_ups.png', muscles: 'Quads, glutes, balance', availableFromWeek: 1,
          weightNote: 'Begin with bodyweight.',
          instructions: [
            'Place one whole foot on a stable step or box.',
            'Lean slightly forward and drive through the working foot to stand tall.',
            'Avoid pushing strongly from the trailing leg.',
            'Step down under control and complete the prescribed reps per leg.'
          ],
          cues: ['Whole foot on step', 'Knee follows toes', 'Control the descent', 'Use support if needed']
        },
        {
          id: 'neutral_db_press', name: 'Seated Neutral-Grip Dumbbell Overhead Press', shortName: 'DB Overhead Press', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 12, startWeight: 4, restMin: 90, restMax: 120,
          image: 'assets/exercises/neutral_db_press.png', muscles: 'Shoulders, triceps', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Sit with your back supported and a dumbbell in each hand.',
            'Keep palms facing each other and elbows slightly in front of your body.',
            'Press upward without shrugging or excessively arching your lower back.',
            'Lower under control until the dumbbells return beside your shoulders.'
          ],
          cues: ['Ribs down', 'Neutral grip', 'Do not shrug', 'Smooth range']
        },
        {
          id: 'lat_pulldown', name: 'Neutral-Grip Lat Pulldown', shortName: 'Lat Pulldown', category: 'main', metric: 'reps',
          minTarget: 8, maxTarget: 12, startWeight: 20, restMin: 90, restMax: 120,
          image: 'assets/exercises/lat_pulldown.png', muscles: 'Lats, upper back, biceps', availableFromWeek: 9,
          weightNote: 'From Week 9. First trial: 15 kg × 8, then test 20 kg if comfortable.',
          instructions: [
            'Sit securely with thighs held under the pad and take a neutral grip.',
            'Start tall, then pull the handles down toward the upper chest.',
            'Drive elbows down without leaning far backward.',
            'Return slowly until the arms are long again.'
          ],
          cues: ['Chest tall', 'Elbows down', 'No jerking', 'Controlled stretch']
        },
        {
          id: 'face_pull', name: 'Face Pull', shortName: 'Face Pull', category: 'isolation', metric: 'reps',
          minTarget: 12, maxTarget: 15, startWeight: 5, restMin: 60, restMax: 90,
          image: 'assets/exercises/face_pull.png', muscles: 'Rear delts, upper back', availableFromWeek: 1,
          weightNote: 'Machine stacks vary; use a repeatable light load.',
          instructions: [
            'Set a rope around face height and step back with light tension.',
            'Pull the rope toward your face while letting the hands separate.',
            'Finish with elbows out and shoulder blades gently squeezed.',
            'Return slowly without letting the stack slam.'
          ],
          cues: ['Light load', 'Pull toward face', 'No shrugging', 'Smooth return']
        },
        {
          id: 'supinated_curl', name: 'Supinated Dumbbell Curl', shortName: 'Supinated DB Curl', category: 'isolation', metric: 'reps',
          minTarget: 10, maxTarget: 15, startWeight: 4, restMin: 60, restMax: 90,
          image: 'assets/exercises/supinated_curl.png', muscles: 'Biceps', availableFromWeek: 1,
          weightNote: 'Weight is per dumbbell.',
          instructions: [
            'Stand tall with dumbbells by your sides.',
            'Turn palms forward and curl while keeping elbows close to the body.',
            'Pause briefly at the top without swinging.',
            'Lower slowly to full comfortable extension.'
          ],
          cues: ['Palms forward', 'Elbows stay close', 'No swinging', 'Slow lowering']
        },
        {
          id: 'suitcase_carry', name: 'Suitcase Carry', shortName: 'Suitcase Carry', category: 'core', metric: 'meters',
          minTarget: 20, maxTarget: 30, startWeight: 6, restMin: 60, restMax: 90,
          image: 'assets/exercises/suitcase_carry.png', muscles: 'Core, grip, shoulders', availableFromWeek: 1,
          weightNote: 'Begin around 6–8 kg if comfortable.',
          instructions: [
            'Hold one dumbbell or kettlebell at your side as if carrying a suitcase.',
            'Stand tall and walk slowly without leaning toward or away from the weight.',
            'Keep ribs stacked over the pelvis and take controlled steps.',
            'Complete the distance, switch hands, and repeat.'
          ],
          cues: ['Stay tall', 'Do not lean', 'Slow steps', 'Equal distance each side']
        }
      ]
    }
  }
};

export function clampWeek(week) {
  return Math.min(26, Math.max(1, Number(week) || 1));
}

export function setCountFor(exercise, week) {
  const w = clampWeek(week);
  if (w === 25) return 2;
  if (w <= 2) return 2;
  if (w <= 4) return exercise.category === 'main' ? 3 : 2;
  return 3;
}

export function effortForWeek(week) {
  const w = clampWeek(week);
  if (w <= 2) return '3–4 RIR';
  if (w <= 4) return '~3 RIR';
  if (w <= 8) return '2–3 RIR';
  if (w <= 12) return '~2 RIR';
  if (w <= 16) return '1–3 RIR';
  if (w <= 20) return '~2 RIR';
  if (w <= 24) return '1–2 RIR';
  if (w === 25) return 'DELOAD · ~4 RIR';
  return '~2 RIR · benchmark';
}

export function targetsFor(exercise, week) {
  const w = clampWeek(week);
  // Keep timed/distance prescriptions exercise-specific. The phase table changes
  // the main-lift and isolation rep ranges only.
  if (exercise.metric !== 'reps') {
    return { min: exercise.minTarget, max: exercise.maxTarget };
  }
  if (w >= 17 && w <= 20 && exercise.category === 'main') return { min: 6, max: 10 };
  if (w === 25 && exercise.category === 'main') return { min: 8, max: 10 };
  if (w === 25 && exercise.category === 'isolation') return { min: 10, max: 12 };
  return { min: exercise.minTarget, max: exercise.maxTarget };
}

export function targetText(exercise, week) {
  const { min, max } = targetsFor(exercise, week);
  if (exercise.metric === 'seconds') return `${min}–${max} sec`;
  if (exercise.metric === 'meters') return `${min}–${max} m/side`;
  return `${min}–${max} reps`;
}

export function restText(exercise) {
  return exercise.restMin === exercise.restMax ? `${exercise.restMin} sec` : `${exercise.restMin}–${exercise.restMax} sec`;
}
