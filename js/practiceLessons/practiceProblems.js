/* exported PracticeProblems */

const PracticeProblems = [
    {
        level: 1,
        title: "Hot Cross Buns - Discover the Form",
        description: `
      <p><b>Hot Cross Buns</b> has a simple musical form.</p>

      <p>Two musical chunks are already on the screen:</p>

      <ul>
        <li><b>A = HCB</b></li>
        <li><b>B = Penny</b></li>
      </ul>

      <p><b>Your task:</b></p>

      <ol>
        <li>Arrange the blocks under the <b>Start</b> block to recreate the melody.</li>
        <li>The melody structure is <b>A A B A</b>.</li>
        <li>You can use the <b>repeat block</b> to help build the pattern.</li>
        <li>Press <b>Play</b> to hear your melody.</li>
      </ol>

      <p><b>Once you recreate the correct pattern, explore further:</b></p>

      <ul>
        <li>Change octaves</li>
        <li>Change pitches</li>
        <li>Try <b>invert</b> or <b>transpose</b> blocks</li>
        <li>Make your own variations</li>
      </ul>
    `,
        expected: {
            pattern: ["A", "A", "B", "A"]
        }
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
