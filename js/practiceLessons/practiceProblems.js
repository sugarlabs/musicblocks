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
        description: `
      <section class="story-card">
        <p>
          After the bridge rises, Lyra and Beat cross into a quiet grove filled
          with pale pink blossoms. The trees should be singing, but the Silence
          Storm has hidden their echo.
        </p>
        <p>
          Beat finds another page from Captain Cadence's journal. It says:
          "When the Sakura song returns, the grove will point toward the next
          treasure clue."
        </p>
        <p>
          Beat hums the first few notes. "This melody comes from a traditional
          song from Japan called <b>Sakura Sakura</b>. The grove remembers it in
          four small music chunks."
        </p>
      </section>

      <section class="mission-card">
        <h4>Your Mission</h4>
        <p>Four music chunks are waiting on the screen:</p>
        <ul>
          <li><b>Sakura</b></li>
          <li><b>yayoi</b></li>
          <li><b>miwatasu</b></li>
          <li><b>miniyukan</b></li>
        </ul>

        <ol>
          <li>Drag the chunks under the <b>Start</b> block.</li>
          <li>
            Build this melody path:
            <b>Sakura yayoi miwatasu yayoi miwatasu Sakura miniyukan</b>.
          </li>
          <li>Repeat the whole path <b>4 times</b>.</li>
          <li>Press <b>Play</b> to wake the grove.</li>
          <li>Press <b>Check My Work</b> when the Sakura echo is ready.</li>
        </ol>
      </section>

      <section class="story-card">
        <h4>After the Grove Sings</h4>
        <p>
          Lyra sees blossoms drifting in patterns Captain Cadence never drew.
          Try changing the music to discover what the grove is hiding.
        </p>
      <ul>
          <li>Rename the chunks to make your own explorer map.</li>
          <li>Change an octave to lift petals into the air.</li>
          <li>Try a transpose block to make the grove shine differently.</li>
          <li>Create a longer Sakura path of your own.</li>
      </ul>
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
            chunkNames: ["Sakura", "yayoi", "miwatasu", "miniyukan"]
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
