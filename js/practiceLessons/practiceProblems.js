/* exported PracticeProblems, PracticeTheme */

const PracticeTheme = {
    title: "The Lost Melody Islands",
    subtitle: "Quest for the Hidden Treasure",
    intro: `
      <section class="story-card">
        <h4>The Story Begins</h4>
        <p>
          Long ago, magical islands were joined by one great song: the
          <b>Grand Melody</b>. When the Grand Melody played, flowers bloomed,
          bridges appeared, rivers danced, and animals sang.
        </p>
        <p>
          Then the Silence Storm swept across the ocean. The song broke into
          tiny Melody Fragments, and the Heart of Harmony vanished.
        </p>
        <p>
          Join <b>Lyra</b>, a brave young explorer, and <b>Beat</b>, a floating
          music robot, as they follow Captain Cadence's old journal to find the
          hidden treasure.
        </p>
      </section>
    `,
    bigBadges: {
        echo_island: {
            id: "echo_island_guardian",
            label: "Echo Island Guardian",
            shortLabel: "Guardian",
            message: "Big Badge unlocked: Echo Island Guardian. The island can hear music again!"
        }
    }
};

const PracticeProblems = [
    {
        level: 1,
        island: "echo_island",
        title: "The Bridge of Echo Island",
        description: `
      <section class="story-card">
        <p>
          Lyra and Beat land on Echo Island. A giant glowing bridge once joined
          this island to the rest of the world, but after the Silence Storm, the
          bridge disappeared into the sea.
        </p>
        <p>
          Beat scans an old stone tablet. It shows four symbols:
          <b class="tablet-code">A A B A</b>
        </p>
        <p>
          "These are not just letters," Beat says. "They are musical pieces!"
        </p>
      </section>

      <section class="mission-card">
        <h4>Your Mission</h4>
        <p>Two music chunks are waiting on the screen:</p>
        <ul>
          <li><b>A</b> is the Hot Cross Buns piece.</li>
          <li><b>B</b> is the Penny piece.</li>
        </ul>
        <ol>
          <li>Drag the music chunks under the <b>Start</b> block.</li>
          <li>Build the bridge song in this order: <b>A A B A</b>.</li>
          <li>You may use a <b>repeat</b> block if it helps.</li>
          <li>Press <b>Play</b> to hear the song.</li>
          <li>Press <b>Check My Work</b> when the bridge song is ready.</li>
        </ol>
      </section>

      <section class="story-card">
        <h4>After the Bridge Appears</h4>
        <p>
          Lyra notices that Captain Cadence's journal shows a slightly different
          bridge. Try changing the music to discover paths he never wrote down.
        </p>
        <ul>
          <li>Change an octave to make the bridge climb higher.</li>
          <li>Try a transpose block to change the bridge color.</li>
          <li>Make your own longer bridge song.</li>
          <li>Rename the music chunks if you want to mark your discovery.</li>
        </ul>
      </section>
    `,
        expected: {
            pattern: ["A", "A", "B", "A"],
            chunkNames: ["A", "B"]
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
                criterion: "completePattern",
                message:
                    "The stone tablet begins to glow. Music echoes across the island, and a shining bridge slowly rises from the ocean."
            },
            {
                id: "name_keeper",
                label: "Name Keeper",
                shortLabel: "Names",
                criterion: "renamedChunks",
                message:
                    "Hidden Discovery: Name Keeper. Lyra labels the music map in her own explorer style."
            },
            {
                id: "sky_builder",
                label: "Sky Builder",
                shortLabel: "Sky",
                criterion: "changedOctave",
                message:
                    "Hidden Discovery: Sky Builder. The bridge stretches higher into the clouds."
            },
            {
                id: "melody_shifter",
                label: "Melody Shifter",
                shortLabel: "Shift",
                criterion: "usedTranspose",
                message: "Hidden Discovery: Melody Shifter. The bridge glows with a new color."
            },
            {
                id: "secret_treasure_coin",
                label: "Secret Treasure Coin",
                shortLabel: "Coin",
                criterion: "createdVariation",
                message:
                    "Secret Treasure Coin found. You discovered a path Captain Cadence never recorded."
            }
        ],
        bigBadge: PracticeTheme.bigBadges.echo_island
    },

    {
        level: 2,
        title: "Sakura Sakura",
        description: `
      <p><b>Sakura Sakura - Discover the Melody</b></p>

      <p>
      "Sakura Sakura" is a famous traditional song from <b>Japan</b>.
      In this activity, you will recreate the melody using musical blocks.
      </p>

      <p><b>Following musical chunks are already on the screen:</b></p>

      <ul>
        <li><b>Sakura</b></li>
        <li><b>yayoi</b></li>
        <li><b>miwatasu</b></li>
        <li><b>miniyukan</b></li>
      </ul>

      <p><b>Your task:</b></p>

      <ol>
        <li>Arrange the blocks under the <b>Start</b> block.</li>
        <li>The melody structure is <b>Sakura yayoi miwatasu yayoi miwatasu Sakura miniyukan</b>, and repeat this melody 4 times.</li>
        <li>You may use the <b>repeat block</b> to help build the pattern.</li>
        <li>Press <b>Play</b> to hear your melody.</li>
      </ol>

      <p><b>After you complete the pattern, explore further:</b></p>

      <ul>
        <li>Change pitches</li>
        <li>Try different octaves</li>
        <li>Create your own variation of the melody</li>
      </ul>
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
            ]
        }
    }
];
