/* exported PracticeProblems, PracticeTheme */

const PracticeTheme = {
    title: "The Lost Melody Islands",
    subtitle: "Quest for the Hidden Treasure",
    intro: `
      <section class="story-card">
      <h4>The Story Begins</h4>

      <div class="character-row" aria-label="Meet Lyra and Beat">
      <span class="character-token lyra-token">
        <span class="character-name">
            Lyra
        </span>

        <span class="character-role">
            Explorer
        </span>
      </span>

      <span class="character-token beat-token">
        <span class="character-name">
            Beat
        </span>
        <span class="character-role">
            Music Robot
        </span>
      </span>
    </div>

      <p>
        Every adventure needs a team! <b>Lyra</b> is a fearless explorer, and
        <b>Beat</b> is her cheerful music robot who can hear melodies hidden
        everywhere.
      </p>

      <p>
        The magical <b>Grand Melody</b> that once connected all the islands has
        disappeared. Its pieces are scattered across the sea. Solve musical puzzles,
        discover hidden melodies, and help your new friends restore the song before
        the islands fall silent forever.
      </p>
    </section>
    `,
    bigBadges: {
        echo_island: {
            id: "echo_island_guardian",
            label: "Echo Island Guardian",
            shortLabel: "Guardian",
            iconKey: "island",
            message: "Big Badge unlocked: Echo Island Guardian. The island can hear music again!"
        }
    }
};

const PracticeProblems = [
    {
        level: 1,
        island: "echo_island",
        title: "The Bridge of Echo Island",
        journal: {
            title: "Echo Island",
            island: "Echo Island",
            learned: ["Patterns", "Repeat Blocks"]
        },
        description: `
      <section class="story-card">
        <p>
          Lyra and Beat step onto Echo Island. The bridge is gone, but the sea
          is still humming. Beat points to an old song-map carved in stone.
        </p>
        <div class="bridge-map" aria-label="Bridge song pattern A A B A">
          <div class="bridge-gate"></div>
          <div class="bridge-letters">
            <span>A</span>
            <span>A</span>
            <span>B</span>
            <span>A</span>
          </div>
          <div class="bridge-waves"></div>
        </div>
        <p>
          "These marks are sounds," Beat whispers. "If we hear them first, we
          can wake the bridge."
        </p>
      </section>

      <section class="mission-card">
        <h4>Bridge Song</h4>
        <p>
          Try playing the loose <b>A</b> and <b>B</b> chunks. When their sounds
          feel familiar, place them under <b>Start</b> to match the song-map
          above.
        </p>
        <p>
          Press <b>Play</b>. If the bridge starts to glow, press
          <b>Check My Work</b>.
        </p>
      </section>

      <section class="story-card">
        <h4>Secret Paths</h4>
        <p>
          After the bridge rises, try one small change. The island may answer.
        </p>
        <div class="explore-grid">
          <span>Change octave</span>
          <span>Use transpose</span>
          <span>Make it longer</span>
          <span>Rename chunks</span>
        </div>
      </section>
    `,
        expected: {
            pattern: ["A", "A", "B", "A"],
            chunkNames: ["A", "B"],
            octaves: [4, 4, 4, 4, 4]
        },
        rewards: [
            "Melody Fragment #1",
            "Captain's Journal Page #1",
            "Treasure Clue: The first path begins where echoes answer twice."
        ],
        badges: [
            {
                id: "bridge_builder",
                label: "Bridge Builder",
                shortLabel: "Bridge",
                iconKey: "bridge",
                criterion: "completePattern",
                message:
                    "The stone tablet begins to glow. Music echoes across the island, and a shining bridge slowly rises from the ocean."
            },
            {
                id: "name_keeper",
                label: "Name Keeper",
                shortLabel: "Names",
                iconKey: "name",
                criterion: "renamedChunks",
                message:
                    "Hidden Discovery: Name Keeper. Lyra labels the music map in her own explorer style."
            },
            {
                id: "sky_builder",
                label: "Sky Builder",
                shortLabel: "Sky",
                iconKey: "sky",
                criterion: "changedOctave",
                message:
                    "Hidden Discovery: Sky Builder. The bridge stretches higher into the clouds."
            },
            {
                id: "melody_shifter",
                label: "Melody Shifter",
                shortLabel: "Shift",
                iconKey: "shift",
                criterion: "usedTranspose",
                message: "Hidden Discovery: Melody Shifter. The bridge glows with a new color."
            },
            {
                id: "secret_treasure_coin",
                label: "Secret Treasure Coin",
                shortLabel: "Coin",
                iconKey: "coin",
                criterion: "createdVariation",
                message:
                    "Secret Treasure Coin found. You discovered a path Captain Cadence never recorded."
            }
        ],
        bigBadge: PracticeTheme.bigBadges.echo_island
    },

    {
        level: 2,
        island: "echo_island",
        title: "The Sakura Grove Echo",
        journal: {
            title: "Sakura Grove",
            island: "Echo Island",
            learned: ["Longer melodies", "Melody chunks"]
        },
        description: `
      <section class="story-card">
        <p>
          Across the new bridge, Lyra and Beat find a silent Sakura grove. A
          journal page flutters from one branch: "Sing the old blossom melody,
          and the petals will show the next clue."
        </p>
        <div class="sakura-grove" aria-label="Silent Sakura grove">
          <div class="sakura-sky-note"></div>
          <div class="sakura-tree sakura-tree-left">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="sakura-tree sakura-tree-right">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="journal-page">#2</div>
          <div class="petal petal-one"></div>
          <div class="petal petal-two"></div>
          <div class="petal petal-three"></div>
        </div>
        <p>
          Beat hears four sleepy chunks from <b>Sakura Sakura</b>. Play them
          once, then guide them along the petal trail.
        </p>
      </section>

      <section class="mission-card">
        <h4>Petal Song</h4>
        <div class="petal-song-map" aria-label="Sakura melody path">
          <span>Sakura</span>
          <span>yayoi</span>
          <span>miwatasu</span>
          <span>yayoi</span>
          <span>miwatasu</span>
          <span>Sakura</span>
          <span>miniyukan</span>
        </div>
        <p>
          Place the chunks under <b>Start</b> in the trail shown above. Let the
          trail bloom <b>4 times</b>, press <b>Play</b>, then check the grove.
        </p>
      </section>

      <section class="story-card">
        <h4>Hidden Petals</h4>
        <p>
          When the trees answer, try one new twist. Some petals hide secret
          badges.
        </p>
        <div class="explore-grid">
          <span>Rename chunks</span>
          <span>Lift petals</span>
          <span>Use transpose</span>
          <span>Make a longer path</span>
        </div>
      </section>
    `,
        expected: {
            pattern: [
                "Sakura",
                "yayoi",
                "miwatasu",
                "yayoi",
                "miwatasu",
                "Sakura",
                "miniyukan",
                "Sakura",
                "yayoi",
                "miwatasu",
                "yayoi",
                "miwatasu",
                "Sakura",
                "miniyukan",
                "Sakura",
                "yayoi",
                "miwatasu",
                "yayoi",
                "miwatasu",
                "Sakura",
                "miniyukan",
                "Sakura",
                "yayoi",
                "miwatasu",
                "yayoi",
                "miwatasu",
                "Sakura",
                "miniyukan"
            ],
            chunkNames: ["Sakura", "yayoi", "miwatasu", "miniyukan"],
            octaves: [3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5]
        },
        rewards: [
            "Melody Fragment #2",
            "Captain's Journal Page #2",
            "Treasure Clue: Follow the petals when the old grove sings four times."
        ],
        badges: [
            {
                id: "sakura_echo",
                label: "Sakura Echo",
                shortLabel: "Sakura",
                iconKey: "blossom",
                criterion: "completePattern",
                message:
                    "The Sakura trees begin to sing. Petals swirl into the air and reveal Captain Cadence's next journal page."
            },
            {
                id: "grove_name_keeper",
                label: "Grove Name Keeper",
                shortLabel: "Names",
                iconKey: "name",
                criterion: "renamedChunks",
                message:
                    "Hidden Discovery: Grove Name Keeper. Lyra adds her own names to the Sakura map."
            },
            {
                id: "petal_lifter",
                label: "Petal Lifter",
                shortLabel: "Petals",
                iconKey: "sky",
                criterion: "changedOctave",
                message:
                    "Hidden Discovery: Petal Lifter. The blossoms float higher as the melody climbs."
            },
            {
                id: "grove_shifter",
                label: "Grove Shifter",
                shortLabel: "Shift",
                iconKey: "shift",
                criterion: "usedTranspose",
                message: "Hidden Discovery: Grove Shifter. The Sakura grove glows with a new color."
            },
            {
                id: "petal_trail_coin",
                label: "Petal Trail Coin",
                shortLabel: "Coin",
                iconKey: "coin",
                criterion: "createdVariation",
                message:
                    "Secret Treasure Coin found. Your longer Sakura path reveals petals Captain Cadence never followed."
            }
        ],
        bigBadge: PracticeTheme.bigBadges.echo_island
    }
];
